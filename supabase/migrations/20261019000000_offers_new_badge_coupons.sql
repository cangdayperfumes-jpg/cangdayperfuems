-- ── Countdown offer (reuses the site pop-up) ───────────────────────────────
-- popup_ends_at: when set, the pop-up shows a live countdown and the
-- storefront hides the offer automatically once the time has passed.
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS popup_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS popup_show_bar boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS popup_title_tr text DEFAULT '',
  ADD COLUMN IF NOT EXISTS popup_message_tr text DEFAULT '',
  ADD COLUMN IF NOT EXISTS popup_button_text_tr text DEFAULT '',
  -- "New" badge: products added within this many days get it automatically
  -- (0 turns the automatic badge off; the per-product flag still works).
  ADD COLUMN IF NOT EXISTS new_badge_days integer NOT NULL DEFAULT 30 CHECK (new_badge_days >= 0);

-- ── "New" badge manual override ───────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false;

-- ── Coupons ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order numeric NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0), -- NULL = unlimited
  used_count integer NOT NULL DEFAULT 0,
  once_per_customer boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  batch_id uuid,          -- codes generated together share a batch
  note text,              -- e.g. "Instagram giveaway"
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT coupons_percent_max CHECK (discount_type <> 'percent' OR discount_value <= 100)
);
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_key ON public.coupons (upper(code));

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_email text,
  customer_phone text,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx ON public.coupon_redemptions (coupon_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);

-- Coupons are never readable by the public (no code enumeration); the
-- storefront only reaches them through the SECURITY DEFINER functions below.
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admins read redemptions" ON public.coupon_redemptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Normalized customer identity used for "once per customer".
CREATE OR REPLACE FUNCTION public.coupon_norm_email(p text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$ SELECT nullif(lower(trim(coalesce(p, ''))), '') $$;
CREATE OR REPLACE FUNCTION public.coupon_norm_phone(p text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$ SELECT nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '') $$;

-- Shared rule check. Returns NULL when the coupon can be used, otherwise a
-- reason code the storefront translates.
CREATE OR REPLACE FUNCTION public.coupon_problem(c public.coupons, p_subtotal numeric, p_email text, p_phone text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF c.id IS NULL OR NOT c.is_active THEN RETURN 'invalid'; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at <= now() THEN RETURN 'expired'; END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN RETURN 'used_up'; END IF;
  IF coalesce(p_subtotal, 0) < c.min_order THEN RETURN 'min_order'; END IF;
  IF c.once_per_customer AND EXISTS (
    SELECT 1 FROM coupon_redemptions r
    WHERE r.coupon_id = c.id
      AND ((coupon_norm_email(p_email) IS NOT NULL AND coupon_norm_email(r.customer_email) = coupon_norm_email(p_email))
        OR (coupon_norm_phone(p_phone) IS NOT NULL AND coupon_norm_phone(r.customer_phone) = coupon_norm_phone(p_phone)))
  ) THEN RETURN 'already_used'; END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.coupon_discount(c public.coupons, p_subtotal numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT round(least(
    coalesce(p_subtotal, 0),
    CASE WHEN c.discount_type = 'percent' THEN coalesce(p_subtotal, 0) * c.discount_value / 100 ELSE c.discount_value END
  ), 2)
$$;

-- Storefront preview: "does this code work for my bag?" (no side effects).
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric, p_email text DEFAULT NULL, p_phone text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c coupons;
  problem text;
BEGIN
  SELECT * INTO c FROM coupons WHERE upper(code) = upper(trim(p_code));
  problem := coupon_problem(c, p_subtotal, p_email, p_phone);
  IF problem IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', problem, 'min_order', c.min_order);
  END IF;
  RETURN jsonb_build_object(
    'valid', true,
    'code', upper(c.code),
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'discount_amount', coupon_discount(c, p_subtotal)
  );
END $$;

-- Orders are inserted by the guest checkout. When one carries a coupon_code
-- this trigger re-checks it under a row lock (so two shoppers can't both take
-- the last use), recomputes the discount itself instead of trusting the
-- client, and rejects the order with COUPON_<reason> when it no longer applies.
CREATE OR REPLACE FUNCTION public.apply_order_coupon()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c coupons;
  problem text;
  subtotal numeric;
BEGIN
  IF NEW.coupon_code IS NULL OR trim(NEW.coupon_code) = '' THEN
    NEW.coupon_code := NULL;
    NEW.discount_amount := 0;
    RETURN NEW;
  END IF;

  SELECT * INTO c FROM coupons WHERE upper(code) = upper(trim(NEW.coupon_code)) FOR UPDATE;
  -- Item subtotal the client priced the bag at (before the coupon).
  subtotal := NEW.total_amount - coalesce(NEW.shipping_cost, 0) + coalesce(NEW.discount_amount, 0);
  problem := coupon_problem(c, subtotal, NEW.customer_email, NEW.customer_phone);
  IF problem IS NOT NULL THEN
    RAISE EXCEPTION 'COUPON_%', upper(problem) USING ERRCODE = 'P0001';
  END IF;

  NEW.coupon_code := upper(c.code);
  NEW.discount_amount := coupon_discount(c, subtotal);
  NEW.total_amount := greatest(subtotal - NEW.discount_amount, 0) + coalesce(NEW.shipping_cost, 0);
  UPDATE coupons SET used_count = used_count + 1 WHERE id = c.id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.record_order_coupon()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL THEN
    INSERT INTO coupon_redemptions (coupon_id, order_id, customer_email, customer_phone, discount_amount)
    SELECT id, NEW.id, NEW.customer_email, NEW.customer_phone, NEW.discount_amount
    FROM coupons WHERE upper(code) = NEW.coupon_code;
  END IF;
  RETURN NULL;
END $$;

-- A cancelled order gives its coupon use back.
CREATE OR REPLACE FUNCTION public.release_order_coupon()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' AND NEW.coupon_code IS NOT NULL THEN
    WITH gone AS (DELETE FROM coupon_redemptions WHERE order_id = NEW.id RETURNING coupon_id)
    UPDATE coupons SET used_count = greatest(used_count - 1, 0) WHERE id IN (SELECT coupon_id FROM gone);
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS orders_apply_coupon ON public.orders;
CREATE TRIGGER orders_apply_coupon BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.apply_order_coupon();
DROP TRIGGER IF EXISTS orders_record_coupon ON public.orders;
CREATE TRIGGER orders_record_coupon AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.record_order_coupon();
DROP TRIGGER IF EXISTS orders_release_coupon ON public.orders;
CREATE TRIGGER orders_release_coupon AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.release_order_coupon();

REVOKE ALL ON FUNCTION public.coupon_problem(public.coupons, numeric, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, text, text) TO anon, authenticated;

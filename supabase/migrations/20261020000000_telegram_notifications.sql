-- Telegram order notifications.
--
-- The site server has only the anon key, so everything the bot's server code
-- needs goes through SECURITY DEFINER functions that require a shared secret.
-- The secret lives in app_secrets (RLS on, no policies → unreadable through
-- the API) and in the TELEGRAM_SERVER_SECRET env var. It is inserted out of
-- band, never in a migration.

CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.telegram_recipients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id bigint NOT NULL UNIQUE,
  name text,
  lang text NOT NULL DEFAULT 'tr' CHECK (lang IN ('tr', 'en')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.telegram_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage telegram recipients" ON public.telegram_recipients;
CREATE POLICY "Admins manage telegram recipients" ON public.telegram_recipients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- One-time codes behind the "Connect Telegram" deep link (t.me/<bot>?start=<code>).
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  code text PRIMARY KEY,
  lang text NOT NULL DEFAULT 'tr' CHECK (lang IN ('tr', 'en')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage telegram link codes" ON public.telegram_link_codes;
CREATE POLICY "Admins manage telegram link codes" ON public.telegram_link_codes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_notified_at timestamptz;

CREATE OR REPLACE FUNCTION public.tg_secret_ok(p_secret text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_secret IS NOT NULL AND EXISTS (
    SELECT 1 FROM app_secrets WHERE key = 'telegram_server_secret' AND value = p_secret
  )
$$;

-- /start <code> from the bot webhook → link that chat. Returns its language, or NULL.
CREATE OR REPLACE FUNCTION public.tg_link_chat(p_secret text, p_code text, p_chat_id bigint, p_name text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lang text;
BEGIN
  IF NOT tg_secret_ok(p_secret) THEN RETURN NULL; END IF;
  DELETE FROM telegram_link_codes WHERE code = p_code AND expires_at > now() RETURNING lang INTO v_lang;
  IF v_lang IS NULL THEN RETURN NULL; END IF;
  INSERT INTO telegram_recipients (chat_id, name, lang) VALUES (p_chat_id, left(p_name, 120), v_lang)
  ON CONFLICT (chat_id) DO UPDATE SET name = excluded.name, lang = excluded.lang;
  DELETE FROM telegram_link_codes WHERE expires_at <= now();
  RETURN v_lang;
END $$;

-- Bot blocked / chat deleted → stop sending there.
CREATE OR REPLACE FUNCTION public.tg_unlink_chat(p_secret text, p_chat_id bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF tg_secret_ok(p_secret) THEN DELETE FROM telegram_recipients WHERE chat_id = p_chat_id; END IF;
END $$;

-- Marks a fresh order as notified (once) and returns what the message needs.
-- NULL when the secret is wrong, the order is unknown/old, or already sent.
CREATE OR REPLACE FUNCTION public.tg_claim_order(p_secret text, p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o orders;
BEGIN
  IF NOT tg_secret_ok(p_secret) THEN RETURN NULL; END IF;
  UPDATE orders SET telegram_notified_at = now()
  WHERE id = p_order_id AND telegram_notified_at IS NULL AND created_at > now() - interval '2 hours'
  RETURNING * INTO o;
  IF o.id IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'order', to_jsonb(o),
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object('name', coalesce(p.name_en, '—'), 'quantity', i.quantity, 'unit_price', i.unit_price) ORDER BY i.created_at)
      FROM order_items i LEFT JOIN products p ON p.id = i.product_id
      WHERE i.order_id = o.id
    ), '[]'::jsonb),
    'chats', coalesce((SELECT jsonb_agg(jsonb_build_object('chat_id', chat_id, 'lang', lang)) FROM telegram_recipients), '[]'::jsonb)
  );
END $$;

-- Figures for one Turkey-time day (UTC+3) for the evening summary.
CREATE OR REPLACE FUNCTION public.tg_daily_summary(p_secret text, p_day date)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_from timestamptz := (p_day::timestamp - interval '3 hours') AT TIME ZONE 'UTC';
  v_to timestamptz := v_from + interval '1 day';
BEGIN
  IF NOT tg_secret_ok(p_secret) THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'orders', (SELECT count(*) FROM orders WHERE created_at >= v_from AND created_at < v_to),
    'cancelled', (SELECT count(*) FROM orders WHERE created_at >= v_from AND created_at < v_to AND status = 'cancelled'),
    'revenue', (SELECT coalesce(sum(total_amount), 0) FROM orders WHERE created_at >= v_from AND created_at < v_to AND status <> 'cancelled'),
    'discounts', (SELECT coalesce(sum(discount_amount), 0) FROM orders WHERE created_at >= v_from AND created_at < v_to AND status <> 'cancelled'),
    'items', (SELECT coalesce(sum(i.quantity), 0) FROM order_items i JOIN orders o ON o.id = i.order_id
              WHERE o.created_at >= v_from AND o.created_at < v_to AND o.status <> 'cancelled'),
    'pending_total', (SELECT count(*) FROM orders WHERE status = 'pending'),
    'top', coalesce((
      SELECT jsonb_agg(t) FROM (
        SELECT coalesce(p.name_en, '—') AS name, sum(i.quantity) AS quantity
        FROM order_items i JOIN orders o ON o.id = i.order_id LEFT JOIN products p ON p.id = i.product_id
        WHERE o.created_at >= v_from AND o.created_at < v_to AND o.status <> 'cancelled'
        GROUP BY 1 ORDER BY 2 DESC LIMIT 3
      ) t
    ), '[]'::jsonb),
    'chats', coalesce((SELECT jsonb_agg(jsonb_build_object('chat_id', chat_id, 'lang', lang)) FROM telegram_recipients), '[]'::jsonb)
  );
END $$;

REVOKE ALL ON FUNCTION public.tg_secret_ok(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_link_chat(text, text, bigint, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_unlink_chat(text, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_claim_order(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_daily_summary(text, date) TO anon, authenticated;

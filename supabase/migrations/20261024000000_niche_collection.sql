-- Niche collection: every perfume priced at or above an admin-set minimum
-- (Settings → General, default 3000 ₺), shown at /shop?niche=true and on the
-- homepage "Find your category" tile that used to be "Popular".

-- 1. The minimum price, editable from the dashboard.
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS niche_min_price numeric NOT NULL DEFAULT 3000;

-- 2. Highest selling price per product. Products with sizes keep their
--    prices on product_variants (the product row's own price is 0), so the
--    shop can't filter on products.price alone — this column folds both in
--    and is kept current by the triggers below.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS max_price numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.compute_product_max_price(p_id uuid, p_price numeric, p_discount numeric)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT GREATEST(
    COALESCE(p_price, 0) - COALESCE(p_discount, 0),
    COALESCE((
      SELECT MAX(v.price - COALESCE(v.discount, 0))
      FROM public.product_variants v
      WHERE v.product_id = p_id AND COALESCE(v.is_active, true)
    ), 0)
  );
$$;

CREATE OR REPLACE FUNCTION public.products_set_max_price()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.max_price := public.compute_product_max_price(NEW.id, NEW.price, NEW.discount);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_max_price ON public.products;
CREATE TRIGGER trg_products_max_price
  BEFORE INSERT OR UPDATE OF price, discount ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_set_max_price();

CREATE OR REPLACE FUNCTION public.variants_refresh_product_max_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE public.products p
      SET max_price = public.compute_product_max_price(p.id, p.price, p.discount)
      WHERE p.id = NEW.product_id;
  END IF;
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id) THEN
    UPDATE public.products p
      SET max_price = public.compute_product_max_price(p.id, p.price, p.discount)
      WHERE p.id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_variants_max_price ON public.product_variants;
CREATE TRIGGER trg_variants_max_price
  AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.variants_refresh_product_max_price();

-- Backfill existing products.
UPDATE public.products p
  SET max_price = public.compute_product_max_price(p.id, p.price, p.discount);

CREATE INDEX IF NOT EXISTS products_active_max_price_idx
  ON public.products (max_price) WHERE is_active;

-- 3. Point the homepage "Popular" tile (and the old dead "niche-perfumes"
--    link) at the new niche collection. Photo, size and order are untouched.
UPDATE public.category_tiles
  SET label = 'Niche', link_href = '/shop?niche=true', updated_at = now()
  WHERE link_href IN ('/shop?popular=true', '/shop?category=niche-perfumes');

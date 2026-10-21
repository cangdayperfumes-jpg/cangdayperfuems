-- Turkish product descriptions (description_en already exists). The
-- storefront shows the visitor's language and falls back to a generated,
-- factual description (brand/name/category) when a product has none.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_tr text;

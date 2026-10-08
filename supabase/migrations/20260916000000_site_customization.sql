-- Extends the admin-managed-content pattern (hero_slides, seasonal_collections)
-- to the homepage category grid, the promo banner row, and site-wide theme
-- colors, so the client can restyle/rearrange these without a code change.

-- 1. Category grid tiles ("Find Your Category" bento grid on the homepage)
CREATE TABLE IF NOT EXISTS public.category_tiles (
  id uuid primary key default uuid_generate_v4(),

  label text not null,
  image_url text not null,
  link_href text not null default '/shop',

  -- Bento sizing: how many grid columns/rows this tile spans on desktop.
  col_span smallint not null default 1 check (col_span between 1 and 4),
  row_span smallint not null default 1 check (row_span between 1 and 2),

  display_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_category_tiles_active_order
  ON public.category_tiles(display_order) WHERE is_active = true;

ALTER TABLE public.category_tiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active category tiles" ON public.category_tiles
  FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage category tiles" ON public.category_tiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.category_tiles (label, image_url, link_href, col_span, row_span, display_order) VALUES
  ('Women''s', 'https://images.unsplash.com/photo-1774682060959-efe13b7a12b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', '/shop?audience=Women', 2, 2, 0),
  ('Men''s', 'https://images.unsplash.com/photo-1780943004155-1b2c5424fb2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', '/shop?audience=Men', 2, 1, 1),
  ('Unisex', 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700', '/shop?audience=Unisex', 1, 1, 2),
  ('Niche', 'https://images.unsplash.com/photo-1780811070739-faa3b575b669?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700', '/shop?category=niche-perfumes', 1, 1, 3);

-- 2. Promo banner row (the "10% Off / Buy 2 Get 1 / Free Mini Gift" strip)
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id uuid primary key default uuid_generate_v4(),

  eyebrow text not null,
  title text not null,
  body text,
  button_text text not null default 'Shop Now',
  link_href text not null default '/shop',

  display_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_promo_banners_active_order
  ON public.promo_banners(display_order) WHERE is_active = true;

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active promo banners" ON public.promo_banners
  FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage promo banners" ON public.promo_banners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.promo_banners (eyebrow, title, body, button_text, link_href, display_order) VALUES
  ('First Order', '10% Off', 'New here? Use code CANGDAY10 at checkout.', 'Shop Now', '/shop', 0),
  ('Bundle & Save', 'Buy 2, Get 1', 'Mix and match any three 50ml bottles.', 'See Eligible Scents', '/shop', 1),
  ('On Us', 'Free Mini Gift', 'Automatically added to orders over $75.', 'Start Shopping', '/shop', 2);

-- 3. Site theme colors — admin-adjustable brand palette, stored as hex (what
-- the admin color picker reads/writes) and converted to the "R G B" CSS
-- variable format Tailwind needs by src/lib/theme-data.ts at render time.
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS theme_gold text NOT NULL DEFAULT '#C9A24B',
  ADD COLUMN IF NOT EXISTS theme_gold_deep text NOT NULL DEFAULT '#8A6A2F',
  ADD COLUMN IF NOT EXISTS theme_ink text NOT NULL DEFAULT '#120D0A',
  ADD COLUMN IF NOT EXISTS theme_ivory text NOT NULL DEFAULT '#F5EFE6';

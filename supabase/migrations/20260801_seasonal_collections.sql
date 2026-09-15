-- Seasonal Collection marketing system: unlimited admin-managed campaigns
-- (Summer/Winter/Ramadan/Black Friday/etc.) with a banner + curated product
-- list, surfaced on the homepage and filterable via /shop?season=<slug>.

CREATE TABLE IF NOT EXISTS public.seasonal_collections (
  id uuid primary key default uuid_generate_v4(),

  title text not null,
  subtitle text,
  description text,
  season_type text,                 -- freeform; UI offers a dropdown + "Custom" entry, no CHECK constraint
  slug text not null,
  seo_title text,
  seo_description text,

  banner_image_desktop text,
  banner_image_mobile text,
  background_pattern_image text,
  decorative_image text,
  background_color text not null default '#000000',
  text_color text not null default '#FFFFFF',
  overlay_opacity smallint not null default 30 check (overlay_opacity between 0 and 100),
  image_position text not null default 'center' check (image_position in ('center','top','bottom','left','right')),
  section_height text not null default 'md' check (section_height in ('sm','md','lg','full')),
  text_alignment text not null default 'center' check (text_alignment in ('left','center','right')),
  animation_style text not null default 'fade-up' check (animation_style in ('fade-up','fade-in','slide-left','slide-right','zoom-in','none')),

  button_text text not null default 'Shop Now',
  button_color text default '#FFFFFF',
  button_style text not null default 'solid' check (button_style in ('solid','outline','ghost')),

  display_order integer not null default 0,
  is_active boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,

  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seasonal_collections_slug ON public.seasonal_collections(slug);

CREATE TABLE IF NOT EXISTS public.seasonal_collection_products (
  collection_id uuid not null references public.seasonal_collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  display_order integer not null default 0,
  primary key (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_collection_products_product_id ON public.seasonal_collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_collection_products_collection_id ON public.seasonal_collection_products(collection_id);

-- "Currently active" query: WHERE is_active AND (start/end window). Table stays
-- small (a handful of campaigns at a time), so a partial index on display_order
-- filtered to is_active=true covers the hot path without indexing the date range.
CREATE INDEX IF NOT EXISTS idx_seasonal_collections_active_order
  ON public.seasonal_collections(display_order) WHERE is_active = true;

-- Global settings: single-vs-multi active on homepage, and where the section
-- sits among the (currently hardcoded, non-CMS) homepage sections. Both are
-- store-wide layout config, so they belong on the existing system_settings
-- singleton, not on seasonal_collections itself.
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS seasonal_collections_multi_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS seasonal_section_position text NOT NULL DEFAULT 'after_gender_collection'
  CHECK (seasonal_section_position IN (
    'after_hero','after_brand_ticker','after_gender_collection',
    'after_category_carousel','after_best_sellers','after_new_arrivals','before_footer'
  ));

ALTER TABLE public.seasonal_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_collection_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view seasonal collections" ON public.seasonal_collections FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage seasonal collections" ON public.seasonal_collections FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can view seasonal collection products" ON public.seasonal_collection_products FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage seasonal collection products" ON public.seasonal_collection_products FOR ALL TO authenticated USING (true);

-- Admin-managed homepage hero carousel: unlimited slides, each with its own
-- image, headline, and CTA, ordered and toggled from /admin/marketing/hero-slides.
-- Mirrors the seasonal_collections pattern (public read of active rows,
-- authenticated full access) already established in this project.

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid primary key default uuid_generate_v4(),

  eyebrow text not null default 'Modern Perfumery',
  headline text not null,
  headline_accent text,              -- optional italic accent word/phrase on its own line
  subheading text,

  image_url text not null,
  image_position text not null default 'center' check (image_position in ('center','top','bottom','left','right')),

  button_text text not null default 'Shop the Collection',
  button_link text not null default '/shop',
  secondary_button_text text,
  secondary_button_link text,

  display_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_active_order
  ON public.hero_slides(display_order) WHERE is_active = true;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides" ON public.hero_slides
  FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage hero slides" ON public.hero_slides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed a default slide so the homepage isn't empty before the admin configures one.
INSERT INTO public.hero_slides (eyebrow, headline, headline_accent, subheading, image_url, display_order, is_active)
VALUES (
  'Modern Perfumery',
  'Wear what',
  'lingers.',
  'An edited collection of designer and niche fragrances — chosen for how they feel hours after you stop noticing them.',
  'https://images.unsplash.com/photo-1774682060997-f8959850a7d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
  0,
  true
);

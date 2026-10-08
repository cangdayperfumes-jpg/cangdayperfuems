-- Customer feedback/testimonial photos shown on the homepage, right before
-- the footer (replacing the static quote "brand breaker" section). Each row
-- is just an image (a review screenshot) — no structured name/rating/text
-- fields, since the source material is photos of real customer messages,
-- not freeform review submissions.
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid primary key default uuid_generate_v4(),

  image_url text not null,

  display_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_testimonials_active_order
  ON public.testimonials(display_order) WHERE is_active = true;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active testimonials" ON public.testimonials
  FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

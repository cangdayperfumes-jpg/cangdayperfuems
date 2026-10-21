-- Dashboard-managed blog, bilingual. A language version counts as available
-- when its title and content are filled in; the other language simply 404s
-- (and is left out of hreflang/sitemap) until it's written.
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  -- Publishing with a future date schedules the post.
  published_at timestamptz,
  featured boolean NOT NULL DEFAULT false,

  title_en text NOT NULL DEFAULT '',
  title_tr text NOT NULL DEFAULT '',
  -- Meta description and listing teaser (~150 characters).
  excerpt_en text NOT NULL DEFAULT '',
  excerpt_tr text NOT NULL DEFAULT '',
  -- "In short" answer shown first on the page — the passage AI answers quote.
  summary_en text NOT NULL DEFAULT '',
  summary_tr text NOT NULL DEFAULT '',
  -- Markdown.
  content_en text NOT NULL DEFAULT '',
  content_tr text NOT NULL DEFAULT '',
  -- Optional overrides for the <title> tag.
  seo_title_en text NOT NULL DEFAULT '',
  seo_title_tr text NOT NULL DEFAULT '',

  cover_image_url text,
  cover_alt_en text NOT NULL DEFAULT '',
  cover_alt_tr text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  author_name text NOT NULL DEFAULT 'Cangday',
  author_bio_en text NOT NULL DEFAULT '',
  author_bio_tr text NOT NULL DEFAULT '',
  -- [{ "q_en": "", "a_en": "", "q_tr": "", "a_tr": "" }]
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_product_ids uuid[] NOT NULL DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (status, published_at DESC);

CREATE OR REPLACE FUNCTION public.blog_posts_touch() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := NEW.updated_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS blog_posts_touch ON public.blog_posts;
CREATE TRIGGER blog_posts_touch BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_posts_touch();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads published posts" ON public.blog_posts;
CREATE POLICY "Public reads published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND published_at <= now());

DROP POLICY IF EXISTS "Admins manage posts" ON public.blog_posts;
CREATE POLICY "Admins manage posts" ON public.blog_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Google Analytics 4 measurement ID (public by nature — it's in every page's
-- HTML) and optional Search Console verification token, set from Settings.
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS ga_measurement_id text DEFAULT '' CHECK (ga_measurement_id = '' OR ga_measurement_id ~ '^G-[A-Z0-9]{4,16}$'),
  ADD COLUMN IF NOT EXISTS gsc_verification text DEFAULT '' CHECK (gsc_verification ~ '^[A-Za-z0-9_-]{0,100}$');

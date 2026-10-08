-- Footer newsletter signup capture. Public can insert their own email
-- (anon INSERT only, no SELECT) so the list itself is never readable from
-- the client — only via the admin dashboard's service-role access.
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now())
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can view subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (true);

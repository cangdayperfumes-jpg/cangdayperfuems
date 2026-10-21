-- Newsletter: let the footer form work for signed-in browsers too (the
-- storefront shares the admin's Supabase session cookie, so an admin testing
-- the form was sent as `authenticated` and got 403), let the dashboard
-- remove subscribers, and remember which language each person signed up in.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Authenticated can delete subscribers" ON public.newsletter_subscribers
  FOR DELETE TO authenticated USING (true);

ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS locale text;

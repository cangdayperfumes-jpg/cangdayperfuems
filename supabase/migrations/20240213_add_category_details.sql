-- Add image_url and description to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS description text;

-- Policy to allow generic read access to these new columns is already covered by "Public can view categories" (select using true)

-- Ensure Admin (or authenticated users with appropriate role) can update these. 
-- Since we are currently using basic policies, let's ensure we have an update policy for categories if not already present.
-- For now, relying on the fact that we might be using service_role for admin actions or need to add a policy.

-- Example policy for Full Access if not exists (adjust based on your auth setup)
-- CREATE POLICY "Allow full access to authenticated users" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- 1. Create Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view brands" ON public.brands FOR SELECT USING (true);

-- 2. Add brand_id to Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

-- 3. Data Migration: Move Categories (which are currently Brands) to Brands Table
-- We preserve the IDs so we can easily map them
INSERT INTO public.brands (id, name, slug, image_url, created_at)
SELECT id, name, slug, image_url, created_at FROM public.categories
ON CONFLICT (id) DO NOTHING; -- Safety check

-- 4. Link Products to new Brands
-- Since we copied IDs, update brand_id to match the old category_id
UPDATE public.products SET brand_id = category_id WHERE brand_id IS NULL;

-- 5. Reset Categories Table
-- Delete all existing categories (they are now safe in brands table)
-- We need to temporarily remove FK constraint or cascade delete, but 'products.category_id' is ON DELETE SET NULL, 
-- so products will just lose their category momentarily (becoming null), which is fine as we will update them next.
DELETE FROM public.categories;

-- 6. Insert New "Real" Categories (Product Types)
INSERT INTO public.categories (name, slug, description) VALUES
('Perfumes', 'perfumes', 'Luxury fragrances for every occasion.'),
('Body Lotions', 'body-lotions', 'Hydrating lotions with your favorite scents.'),
('Body Mists', 'body-mists', 'Light and refreshing body sprays.'),
('Hair Mists', 'hair-mists', 'Scented mists specifically for hair.'),
('Gift Sets', 'gift-sets', 'Perfect gifts for your loved ones.');

-- 7. Update Products to default to "Perfumes"
-- (Assuming most existing products are perfumes. User can change later in Admin)
DO $$
DECLARE
    perfume_id uuid;
BEGIN
    SELECT id INTO perfume_id FROM public.categories WHERE slug = 'perfumes' LIMIT 1;
    
    IF perfume_id IS NOT NULL THEN
        UPDATE public.products SET category_id = perfume_id WHERE category_id IS NULL;
    END IF;
END $$;

-- 1. Ensure 'is_featured' column exists on 'brands'
ALTER TABLE IF EXISTS public.brands 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. Ensure 'is_featured' column exists on 'categories'
ALTER TABLE IF EXISTS public.categories 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 3. Enable RLS on categories (just in case)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Brands (Full Access for Authenticated Users)
-- We use a DO block to avoid error if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON public.brands
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- 5. Create RLS Policies for Categories (Full Access for Authenticated Users)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON public.categories
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- 6. Ensure Storage Bucket 'products' exists and has policies
-- (Optional but helpful check)
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload images'
    ) THEN
        CREATE POLICY "Authenticated users can upload images" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'products');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can update images'
    ) THEN
        CREATE POLICY "Authenticated users can update images" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'products');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can delete images'
    ) THEN
        CREATE POLICY "Authenticated users can delete images" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'products');
    END IF;
    
    -- Ensure public read access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Everyone can view images'
    ) THEN
        CREATE POLICY "Everyone can view images" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'products');
    END IF;
END
$$;

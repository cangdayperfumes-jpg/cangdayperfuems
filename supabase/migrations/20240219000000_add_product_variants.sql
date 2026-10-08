-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null, -- e.g. "100ml", "150ml"
  price numeric not null check (price >= 0),
  discount numeric default 0 check (discount >= 0),
  stock boolean default true,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add has_variants flag to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants boolean default false;

-- 3. Update order_items to support variants
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id uuid references public.product_variants(id) on delete set null;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_name text;

-- 4. Enable RLS for product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 5. Public RLS Policy for variants
CREATE POLICY "Public can view active variants" ON public.product_variants
  FOR SELECT USING (is_active = true);

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

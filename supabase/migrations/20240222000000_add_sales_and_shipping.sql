-- Stage 1: Add sales_count to products table
ALTER TABLE public.products
ADD COLUMN sales_count INTEGER DEFAULT 0;

-- Create an RPC to safely increment sales_count
CREATE OR REPLACE FUNCTION increment_sales_count(p_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET sales_count = COALESCE(sales_count, 0) + p_qty
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stage 2: Add shipping enrichment columns to shipping_zones table
ALTER TABLE public.shipping_zones
ADD COLUMN continent TEXT,
ADD COLUMN country_code TEXT,
ADD COLUMN shipping_details TEXT;

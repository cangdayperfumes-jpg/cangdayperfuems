-- Add target_audience column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'Unisex';

-- Update existing rows if necessary (optional, defaults to Unisex)
-- UPDATE products SET target_audience = 'Unisex' WHERE target_audience IS NULL;

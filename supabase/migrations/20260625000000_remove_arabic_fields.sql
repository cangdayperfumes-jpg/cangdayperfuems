-- Remove Arabic fields from products table to enforce an English-only dashboard
ALTER TABLE products 
DROP COLUMN IF EXISTS name_ar,
DROP COLUMN IF EXISTS description_ar;

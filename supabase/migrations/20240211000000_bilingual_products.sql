-- Rename existing columns to English variants
ALTER TABLE products 
RENAME COLUMN name TO name_en;

ALTER TABLE products 
RENAME COLUMN description TO description_en;

-- Add Arabic columns
ALTER TABLE products 
ADD COLUMN name_ar text,
ADD COLUMN description_ar text;

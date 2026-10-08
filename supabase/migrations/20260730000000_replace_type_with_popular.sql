-- Remove the Designer/Niche perfume-type concept entirely, replace with a simple Popular Item flag
ALTER TABLE products DROP COLUMN IF EXISTS type;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;

-- Add slug column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a unique index on slug to enforce no duplicates at DB level
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON products (slug) WHERE slug IS NOT NULL;

-- Helper function to generate base slug from a name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        trim(name),
        '[^a-zA-Z0-9\s\-]', '', 'g'  -- remove non-alphanumeric except spaces/hyphens
      ),
      '\s+', '-', 'g'                  -- replace spaces with hyphens
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a unique slug, appending -2, -3... if needed
CREATE OR REPLACE FUNCTION generate_unique_product_slug(name TEXT, exclude_id UUID DEFAULT NULL) RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter INT := 1;
  exists BOOLEAN;
BEGIN
  base_slug := generate_slug(name);
  candidate := base_slug;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM products 
      WHERE slug = candidate 
      AND (exclude_id IS NULL OR id != exclude_id)
    ) INTO exists;

    EXIT WHEN NOT exists;
    counter := counter + 1;
    candidate := base_slug || '-' || counter;
  END LOOP;

  RETURN candidate;
END;
$$ LANGUAGE plpgsql;

-- Backfill slugs for all existing products
DO $$
DECLARE
  prod RECORD;
  new_slug TEXT;
BEGIN
  FOR prod IN SELECT id, name_en FROM products WHERE slug IS NULL ORDER BY created_at ASC
  LOOP
    new_slug := generate_unique_product_slug(prod.name_en);
    UPDATE products SET slug = new_slug WHERE id = prod.id;
  END LOOP;
END $$;

-- Backfills brands.image_url (added back in 20240213000200, never populated)
-- from each brand's own oldest active product photo — real inventory
-- Cangday already sells and has already approved/uploaded, rather than a
-- licensed brand logo or a generic stock photo that wouldn't actually be
-- that brand's product. Powers the homepage brand ticker's thumbnails.
--
-- Only fills rows that are still NULL, so re-running this (or re-applying
-- the migration set to a fresh environment) never clobbers an image an
-- admin has since set manually via /admin/brands.
UPDATE public.brands b
SET image_url = p.first_image
FROM (
  SELECT DISTINCT ON (brand_id) brand_id, images[1] AS first_image
  FROM public.products
  WHERE is_active = true
    AND brand_id IS NOT NULL
    AND images IS NOT NULL
    AND array_length(images, 1) > 0
  ORDER BY brand_id, created_at ASC
) p
WHERE b.id = p.brand_id
  AND b.image_url IS NULL;

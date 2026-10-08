-- Backfills categories.image_url (shown by the homepage "Browse by Type"
-- carousel, currently a "No Image" placeholder for every category) from
-- each category's own oldest active product photo — real inventory
-- Cangday already sells and has already approved/uploaded, so every tile
-- genuinely depicts that category's own products rather than a generic
-- stock photo. Same approach as the 20261008010000 brand-ticker backfill.
--
-- Only fills rows that are still NULL, so re-running this (or re-applying
-- the migration set to a fresh environment) never clobbers an image an
-- admin has since set manually via /admin/categories.
UPDATE public.categories c
SET image_url = p.first_image
FROM (
  SELECT DISTINCT ON (category_id) category_id, images[1] AS first_image
  FROM public.products
  WHERE is_active = true
    AND category_id IS NOT NULL
    AND images IS NOT NULL
    AND array_length(images, 1) > 0
  ORDER BY category_id, created_at ASC
) p
WHERE c.id = p.category_id
  AND c.image_url IS NULL;

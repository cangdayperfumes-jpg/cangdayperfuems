-- Clean brand slugs that contain spaces or symbols (e.g. "dolce-&-gabbana",
-- "    sol de Janeiro Cheirosa"), which made messy /shop?brands=… URLs in
-- Google. Same rule as src/lib/brand-slug.ts. Only slugs change — brand
-- names are untouched. A slug that would clash with another brand's is
-- left as it is (listed in the result).

WITH proposed AS (
  SELECT
    id,
    name,
    slug AS old_slug,
    trim(BOTH '-' FROM regexp_replace(
      regexp_replace(
        translate(lower(slug), 'çğıöşüâîûéèáàíóú', 'cgiosuaiueeaaiou'),
        '[''’`]', '', 'g'),
      '[^a-z0-9]+', '-', 'g')) AS new_slug
  FROM public.brands
),
todo AS (
  SELECT p.*
  FROM proposed p
  WHERE p.new_slug <> p.old_slug
    AND p.new_slug <> ''
    AND NOT EXISTS (SELECT 1 FROM public.brands b WHERE b.slug = p.new_slug AND b.id <> p.id)
),
changed AS (
  UPDATE public.brands b
  SET slug = t.new_slug
  FROM todo t
  WHERE b.id = t.id
  RETURNING b.name, t.old_slug, b.slug AS new_slug
)
SELECT 'changed' AS result, name, old_slug, new_slug FROM changed
UNION ALL
SELECT 'skipped (clash)', p.name, p.old_slug, p.new_slug
FROM proposed p
WHERE p.new_slug <> p.old_slug AND p.id NOT IN (SELECT id FROM todo)
ORDER BY 1, 2;

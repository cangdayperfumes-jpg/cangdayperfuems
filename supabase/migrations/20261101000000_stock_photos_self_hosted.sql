-- Point the remaining Unsplash photo URLs at the copies now stored with the
-- site (public/images/stock/<photo-id>.jpg), so the storefront no longer
-- loads anything from images.unsplash.com.
-- Only IDs that have a local copy are rewritten; anything else is left as is.

DO $$
DECLARE
  ids text := '(photo-1545844568-98bb15133ec0|photo-1557170334-a9632e77c6e4|photo-1588405748880-12d1d2a59f75|photo-1592903297149-37fb25202dfa|photo-1613521140785-e85e427f8002|photo-1615160460366-2c9a41771b51|photo-1632243575963-3143700087ed|photo-1643797517590-c44cb552ddcc|photo-1706198230915-19cfc3774a93|photo-1725172045097-2f1eefb84637|photo-1770193349323-efd1c5492a83|photo-1770301410072-f6ef6dad65b2|photo-1772191399367-91ed8d95664b|photo-1774682060959-efe13b7a12b9|photo-1774682060997-f8959850a7d4|photo-1778530207640-a5fc0bdf8ba5|photo-1780811070739-faa3b575b669|photo-1780943004155-1b2c5424fb2e|photo-1784215118418-1c1ff08edac1)';
  pattern text := '^https://images\.unsplash\.com/' || ids || '([?#].*)?$';
BEGIN
  UPDATE public.hero_slides SET image_url = regexp_replace(image_url, pattern, '/images/stock/\1.jpg') WHERE image_url ~ pattern;
  UPDATE public.category_tiles SET image_url = regexp_replace(image_url, pattern, '/images/stock/\1.jpg') WHERE image_url ~ pattern;
  UPDATE public.categories SET image_url = regexp_replace(image_url, pattern, '/images/stock/\1.jpg') WHERE image_url ~ pattern;
END $$;

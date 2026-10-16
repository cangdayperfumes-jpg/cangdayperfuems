-- Adds non-destructive per-breakpoint crop/focal-point metadata to every
-- admin image field we support independent desktop/mobile composition for,
-- plus an optional separate mobile image override for products.
--
-- All columns are nullable with no default: NULL means "use today's
-- behavior" (centered object-position, no zoom, desktop image on mobile
-- too), so every existing record renders identically until an admin
-- explicitly opens the new crop editor. No backfill needed.
--
-- Shape of image_crop_desktop / image_crop_mobile: { x: number, y: number, zoom: number }
-- x/y are 0-100 focal-point percentages (-> CSS object-position),
-- zoom is a scale factor (-> CSS transform: scale()).

ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS image_crop_desktop jsonb,
  ADD COLUMN IF NOT EXISTS image_crop_mobile jsonb;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_crop_desktop jsonb,
  ADD COLUMN IF NOT EXISTS image_crop_mobile jsonb;

ALTER TABLE public.category_tiles
  ADD COLUMN IF NOT EXISTS image_crop_desktop jsonb,
  ADD COLUMN IF NOT EXISTS image_crop_mobile jsonb;

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS image_crop_desktop jsonb,
  ADD COLUMN IF NOT EXISTS image_crop_mobile jsonb;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS mobile_image_url text,
  ADD COLUMN IF NOT EXISTS image_crop_desktop jsonb,
  ADD COLUMN IF NOT EXISTS image_crop_mobile jsonb;

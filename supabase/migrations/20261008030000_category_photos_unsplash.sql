-- Replaces categories.image_url with curated Unsplash photography (gentle,
-- warm/dark editorial product shots matching the storefront's grading)
-- instead of pulling from the site's own product photos — supersedes the
-- 20261008020000 product-photo backfill per direct request. Each photo was
-- hand-picked to avoid any visible third-party brand name/logo, since these
-- are generic category illustrations, not listings for a specific product.
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1772191399367-91ed8d95664b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'perfumes';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1643797517590-c44cb552ddcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = '50Ml-perfume-bottles';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1725172045097-2f1eefb84637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'body-lotions';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1613521140785-e85e427f8002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'body-mists';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1706198230915-19cfc3774a93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'deodorants';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1545844568-98bb15133ec0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'gift-sets';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1632243575963-3143700087ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'hair-mists';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1615160460366-2c9a41771b51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'original-nishapur-perfumes';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1592903297149-37fb25202dfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'perfume-gift-boxes';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1778530207640-a5fc0bdf8ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900' WHERE slug = 'room-sprays';

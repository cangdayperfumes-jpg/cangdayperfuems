-- Turkish category descriptions (shop intro + meta description on /tr).
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description_tr text;

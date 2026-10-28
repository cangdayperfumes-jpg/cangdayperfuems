-- 1. CANGDAY10 is retired (the homepage "10% off" card was removed in favour
--    of the automatic offers). Switch the code off if it exists.
UPDATE public.coupons SET is_active = false WHERE upper(code) = 'CANGDAY10';

-- 2. Switch for the shipping message in the announcement bar / homepage
--    badges (Settings → General). The text itself follows the Turkey rate.
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS shipping_banner_enabled boolean NOT NULL DEFAULT true;

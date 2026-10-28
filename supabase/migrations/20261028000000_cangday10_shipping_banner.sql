-- 1. CANGDAY10 — the first-order code advertised on the homepage. 10% off,
--    once per customer, no minimum, no expiry. Editable in Admin → Coupons.
INSERT INTO public.coupons (code, discount_type, discount_value, min_order, max_uses, once_per_customer, expires_at, is_active, note)
SELECT 'CANGDAY10', 'percent', 10, 0, NULL, true, NULL, true, 'First-order code shown on the homepage'
WHERE NOT EXISTS (SELECT 1 FROM public.coupons WHERE upper(code) = 'CANGDAY10');

-- Re-enable it if it already existed but was switched off.
UPDATE public.coupons SET is_active = true WHERE upper(code) = 'CANGDAY10';

-- 2. Switch for the shipping message in the announcement bar / homepage
--    badges (Settings → General). The text itself follows the Turkey rate.
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS shipping_banner_enabled boolean NOT NULL DEFAULT true;

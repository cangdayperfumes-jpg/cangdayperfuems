-- "+90 555 111 2233", "0555 111 22 33" and "5551112233" are the same phone:
-- compare only the last 10 digits (the national number) so a country code or
-- trunk 0 doesn't let one customer reuse a once-per-customer coupon.
CREATE OR REPLACE FUNCTION public.coupon_norm_phone(p text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT nullif(right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10), '')
$$;

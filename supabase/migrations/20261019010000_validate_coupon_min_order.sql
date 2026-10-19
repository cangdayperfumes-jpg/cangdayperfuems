-- Also return min_order for valid coupons, so checkout can react when the
-- bag later drops below it.
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric, p_email text DEFAULT NULL, p_phone text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c coupons;
  problem text;
BEGIN
  SELECT * INTO c FROM coupons WHERE upper(code) = upper(trim(p_code));
  problem := coupon_problem(c, p_subtotal, p_email, p_phone);
  IF problem IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', problem, 'min_order', c.min_order);
  END IF;
  RETURN jsonb_build_object(
    'valid', true,
    'code', upper(c.code),
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'min_order', c.min_order,
    'discount_amount', coupon_discount(c, p_subtotal)
  );
END $$;

-- Lets the order-confirmation page read one order without public read
-- access to the orders table (removed in 20261021020000_private_orders.sql).
-- The order-confirmation page still needs to show the shopper their own
-- order and invoice. Knowing the order's random UUID (only the buyer's
-- browser has it) is the key, and only for a week after ordering, so a leaked
-- link stops working.
CREATE OR REPLACE FUNCTION public.get_order_receipt(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'order', jsonb_build_object(
      'id', o.id,
      'created_at', o.created_at,
      'status', o.status,
      'customer_name', o.customer_name,
      'customer_email', o.customer_email,
      'customer_phone', o.customer_phone,
      'customer_address', o.customer_address,
      'total_amount', o.total_amount,
      'shipping_cost', o.shipping_cost,
      'discount_amount', o.discount_amount,
      'coupon_code', o.coupon_code
    ),
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'order_id', i.order_id,
        'product_id', i.product_id,
        'quantity', i.quantity,
        'unit_price', i.unit_price,
        'products', jsonb_build_object('name_en', p.name_en)
      ) ORDER BY i.created_at)
      FROM order_items i LEFT JOIN products p ON p.id = i.product_id
      WHERE i.order_id = o.id
    ), '[]'::jsonb)
  )
  FROM orders o
  WHERE o.id = p_order_id
    AND o.created_at > now() - interval '7 days'
$$;

REVOKE ALL ON FUNCTION public.get_order_receipt(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_receipt(uuid) TO anon, authenticated;

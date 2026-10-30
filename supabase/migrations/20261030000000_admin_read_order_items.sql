-- 20261021020000_private_orders.sql dropped "Public can read order items",
-- which was also how signed-in admins read them — orders kept their own
-- "Enable read for authenticated users only" policy, order_items got none.
-- Since then the dashboard loaded every order with zero items, so invoices,
-- the CSV/PDF report and product stats showed totals but no products.
-- Guests still can't read items (they get their own via get_order_receipt).
DROP POLICY IF EXISTS "Admins can read order items" ON public.order_items;
CREATE POLICY "Admins can read order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);

-- Order-confirmation page: also return each item's chosen option (variant).
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
      'coupon_code', o.coupon_code,
      'offer_discount', o.offer_discount,
      'offer_lines', o.offer_lines
    ),
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'order_id', i.order_id,
        'product_id', i.product_id,
        'quantity', i.quantity,
        'unit_price', i.unit_price,
        'variant_name', i.variant_name,
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

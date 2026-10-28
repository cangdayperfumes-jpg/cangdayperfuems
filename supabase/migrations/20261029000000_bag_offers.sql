-- Automatic bag offers, edited in Admin → Offers (see src/lib/offers.ts):
--   pair    — two perfumes ≤ maxPrice: the cheaper one is percent% off
--   trio    — count perfumes ≤ maxPrice: all of them for price
--   premium — every perfume over minPrice: percent% off
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS offers jsonb NOT NULL DEFAULT '{
    "pair":    {"enabled": true, "maxPrice": 2500, "percent": 30},
    "trio":    {"enabled": true, "maxPrice": 2500, "count": 3, "price": 5999},
    "premium": {"enabled": true, "minPrice": 2750, "percent": 20}
  }'::jsonb;

-- What the offers took off an order, saved at checkout so the admin pages,
-- Telegram and the invoice all show the same amounts later.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS offer_discount numeric NOT NULL DEFAULT 0 CHECK (offer_discount >= 0),
  ADD COLUMN IF NOT EXISTS offer_lines jsonb;

-- Order-confirmation page: also return the offer fields.
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

-- Evening Telegram summary: discounts include the offers.
CREATE OR REPLACE FUNCTION public.tg_daily_summary(p_secret text, p_day date)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_from timestamptz := (p_day::timestamp - interval '3 hours') AT TIME ZONE 'UTC';
  v_to timestamptz := v_from + interval '1 day';
BEGIN
  IF NOT tg_secret_ok(p_secret) THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'orders', (SELECT count(*) FROM orders WHERE created_at >= v_from AND created_at < v_to),
    'cancelled', (SELECT count(*) FROM orders WHERE created_at >= v_from AND created_at < v_to AND status = 'cancelled'),
    'revenue', (SELECT coalesce(sum(total_amount), 0) FROM orders WHERE created_at >= v_from AND created_at < v_to AND status <> 'cancelled'),
    'discounts', (SELECT coalesce(sum(discount_amount + offer_discount), 0) FROM orders WHERE created_at >= v_from AND created_at < v_to AND status <> 'cancelled'),
    'items', (SELECT coalesce(sum(i.quantity), 0) FROM order_items i JOIN orders o ON o.id = i.order_id
              WHERE o.created_at >= v_from AND o.created_at < v_to AND o.status <> 'cancelled'),
    'pending_total', (SELECT count(*) FROM orders WHERE status = 'pending'),
    'top', coalesce((
      SELECT jsonb_agg(t) FROM (
        SELECT coalesce(p.name_en, '—') AS name, sum(i.quantity) AS quantity
        FROM order_items i JOIN orders o ON o.id = i.order_id LEFT JOIN products p ON p.id = i.product_id
        WHERE o.created_at >= v_from AND o.created_at < v_to AND o.status <> 'cancelled'
        GROUP BY 1 ORDER BY 2 DESC LIMIT 3
      ) t
    ), '[]'::jsonb),
    'chats', coalesce((SELECT jsonb_agg(jsonb_build_object('chat_id', chat_id, 'lang', lang)) FROM telegram_recipients), '[]'::jsonb)
  );
END $$;

-- The dashboard's "delete order" had no DELETE policy to rely on, so RLS
-- silently blocked it (0 rows) and the action reported a generic error.
-- Signed-in admins may delete orders and their items; guests still can't.
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;
CREATE POLICY "Admins can delete order items" ON public.order_items
  FOR DELETE TO authenticated USING (true);

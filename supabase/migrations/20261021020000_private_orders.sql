-- Orders contain customers' names, phones and addresses. They were readable
-- by anyone holding the public anon key ("Public can read …" policies, left
-- over from checkout reading back the row it inserted). Remove that; only
-- signed-in admins read orders now ("Enable read for authenticated users
-- only" stays).
DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
DROP POLICY IF EXISTS "Public can read order items" ON public.order_items;
-- Applied after the checkout stopped reading orders back (uses
-- get_order_receipt instead).

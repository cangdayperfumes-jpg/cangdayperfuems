-- Replace the per-item increment_sales_count RPC with a single batched call.
-- checkout-form.tsx was calling this once per cart line item (N round trips
-- per order, unawaited, errors silently swallowed); the new function takes
-- the whole item list and updates all rows in one set-based statement.

CREATE OR REPLACE FUNCTION increment_sales_counts(items jsonb)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products p
  SET sales_count = COALESCE(p.sales_count, 0) + i.qty
  FROM jsonb_to_recordset(items) AS i(id uuid, qty integer)
  WHERE p.id = i.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The old single-item function is superseded; checkout-form.tsx (its only caller) is being updated
-- in the same change, so it's safe to drop here rather than leave unused.
DROP FUNCTION IF EXISTS increment_sales_count(uuid, integer);

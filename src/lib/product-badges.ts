const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "New" when the admin ticked the product's New box, or it was added within
 * the last `days` days (Settings → New badge; 0 turns the automatic part off).
 */
export function isProductNew(
  product: { is_new?: boolean | null; created_at?: string | null },
  days: number
) {
  if (product.is_new) return true;
  if (!days || !product.created_at) return false;
  const created = new Date(product.created_at).getTime();
  return Number.isFinite(created) && Date.now() - created < days * DAY_MS;
}

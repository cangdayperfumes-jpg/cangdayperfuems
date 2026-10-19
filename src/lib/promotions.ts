/**
 * The free mini gift threshold and on/off switch now live in Settings
 * (system_settings.gift_enabled / gift_threshold) and reach components via
 * useSettings().gift — this only formats the amount for marketing copy.
 */

/** "₺750" — no ",00" in promo text, but keeps kuruş when the amount has them. */
export function formatPromoAmount(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

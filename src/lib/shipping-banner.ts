import { formatPromoAmount } from '@/lib/promotions';

/**
 * Text for the shipping item in the announcement bar and trust badges, built
 * from the real Turkey rate so it never contradicts checkout: "free shipping"
 * only when Turkey is ₺0, otherwise the flat rate. Returns null to hide it
 * (switched off in Settings, or Turkey not shipped to).
 */
export function shippingBannerLabel(
  banner: { enabled: boolean; domesticPrice: number | null },
  t: (key: string, values?: Record<string, string>) => string
): string | null {
  if (!banner.enabled || banner.domesticPrice === null) return null;
  return banner.domesticPrice <= 0
    ? t('freeShipping')
    : t('shippingFlat', { amount: formatPromoAmount(banner.domesticPrice) });
}

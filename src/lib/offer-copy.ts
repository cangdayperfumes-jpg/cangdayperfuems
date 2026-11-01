import { formatPromoAmount } from '@/lib/promotions';
import type { OfferCardKey, OffersConfig } from '@/lib/offers';

/** Message prefix in the `home` namespace for each offer (…Eyebrow / …Title / …Body / …Cta). */
export const OFFER_MESSAGE_PREFIX: Record<OfferCardKey, string> = {
  pair: 'offerPair',
  trio: 'offerTrio',
  premium: 'offerPremium',
  gift: 'promo3',
};

/** Built-in photo per offer, used until the admin uploads one (public/images/stock). */
export const OFFER_STOCK_PHOTO: Record<OfferCardKey, string> = {
  pair: '/images/stock/photo-1557170334-a9632e77c6e4.jpg',
  trio: '/images/stock/photo-1588405748880-12d1d2a59f75.jpg',
  premium: '/images/stock/photo-1643797517590-c44cb552ddcc.jpg',
  gift: '/images/stock/photo-1770301410072-f6ef6dad65b2.jpg',
};

/** Whether each offer is switched on (the gift has its own setting). */
export function offerEnabled(offers: OffersConfig, gift: { enabled: boolean }): Record<OfferCardKey, boolean> {
  return { pair: offers.pair.enabled, trio: offers.trio.enabled, premium: offers.premium.enabled, gift: gift.enabled };
}

/** Values the offer messages interpolate — the admin's current numbers. */
export function offerCopyValues(offers: OffersConfig, gift: { threshold: number }) {
  return {
    pairPercent: offers.pair.percent,
    pairMax: formatPromoAmount(offers.pair.maxPrice),
    count: offers.trio.count,
    trioMax: formatPromoAmount(offers.trio.maxPrice),
    trioPrice: formatPromoAmount(offers.trio.price),
    premiumPercent: offers.premium.percent,
    premiumMin: formatPromoAmount(offers.premium.minPrice),
    amount: formatPromoAmount(gift.threshold),
  };
}

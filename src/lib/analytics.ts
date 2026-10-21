/**
 * Google Analytics 4 helpers. Every call is a no-op until gtag is on the page
 * (only when a measurement ID is set in Settings), and GA itself stores no
 * cookies until the visitor accepts the cookie banner (Consent Mode v2).
 */

type GtagItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_variant?: string;
  item_brand?: string;
  item_category?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const CONSENT_KEY = 'cookies_accepted';

export function hasAnalyticsConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(granted: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'true' : 'false');
  } catch {
    // Storage blocked — consent just isn't remembered.
  }
  window.gtag?.('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    // No advertising on this site.
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params);
}

const CURRENCY = 'TRY';

export const analytics = {
  viewItem: (item: GtagItem) => track('view_item', { currency: CURRENCY, value: item.price ?? 0, items: [item] }),
  addToCart: (item: GtagItem) =>
    track('add_to_cart', { currency: CURRENCY, value: (item.price ?? 0) * (item.quantity ?? 1), items: [item] }),
  addToWishlist: (item: GtagItem) => track('add_to_wishlist', { currency: CURRENCY, value: item.price ?? 0, items: [item] }),
  beginCheckout: (value: number, items: GtagItem[], coupon?: string) =>
    track('begin_checkout', { currency: CURRENCY, value, items, ...(coupon ? { coupon } : {}) }),
  purchase: (p: { id: string; value: number; shipping: number; coupon?: string | null; items: GtagItem[] }) =>
    track('purchase', {
      transaction_id: p.id,
      currency: CURRENCY,
      value: p.value,
      shipping: p.shipping,
      ...(p.coupon ? { coupon: p.coupon } : {}),
      items: p.items,
    }),
  search: (term: string) => track('search', { search_term: term }),
};

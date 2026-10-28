'use client';

import { useMemo } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { applyOffers } from '@/lib/offers';

/** Offers for the current bag — the same calculation the checkout saves on the order. */
export function useBagOffers(items: { price: number; quantity: number }[] | undefined) {
  const { offers, hidePrices } = useSettings();
  return useMemo(() => {
    const list = items ?? [];
    const subtotal = list.reduce((s, i) => s + i.price * i.quantity, 0);
    const result = hidePrices ? { lines: [], discount: 0 } : applyOffers(list, offers);
    return { subtotal, ...result, afterOffers: Math.max(subtotal - result.discount, 0) };
  }, [items, offers, hidePrices]);
}

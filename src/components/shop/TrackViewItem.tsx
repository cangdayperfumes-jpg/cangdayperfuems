'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

/** Sends GA4 view_item once per product page view. */
export default function TrackViewItem({ id, name, price, brand, category }: { id: string; name: string; price: number; brand?: string; category?: string }) {
  useEffect(() => {
    analytics.viewItem({ item_id: id, item_name: name, price, ...(brand ? { item_brand: brand } : {}), ...(category ? { item_category: category } : {}) });
  }, [id, name, price, brand, category]);
  return null;
}

'use client';

import { useTranslations } from 'next-intl';
import { useSettings } from '@/components/providers/SettingsProvider';
import { isProductNew } from '@/lib/product-badges';

/** "New" pill for server-rendered pages, which can't read the badge-days setting themselves. */
export default function NewBadge({ product }: { product: { is_new?: boolean | null; created_at?: string | null } }) {
  const t = useTranslations('product');
  const { newBadgeDays } = useSettings();
  if (!isProductNew(product, newBadgeDays)) return null;
  return (
    <span className="inline-flex items-center rounded-sm bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ivory">
      {t('new')}
    </span>
  );
}

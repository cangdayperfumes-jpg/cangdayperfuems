'use client';

import { Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/components/providers/SettingsProvider';

/** "₺X away from your free mini gift" bar — shared by the cart sheet and checkout summary. Hidden when the promotion is off. */
export default function GiftProgress({ subtotal }: { subtotal: number }) {
  const t = useTranslations('cart');
  const { gift } = useSettings();
  if (!gift.enabled || !(gift.threshold > 0)) return null;

  const remaining = Math.max(0, gift.threshold - subtotal);
  const pct = Math.min(100, (subtotal / gift.threshold) * 100);
  const unlocked = remaining === 0;

  return (
    <div className="rounded-sm border border-gold/30 bg-gold/5 px-3 py-2.5">
      <p className="flex items-center gap-2 text-xs text-ink/80">
        <Gift className="h-3.5 w-3.5 shrink-0 text-gold-deep" strokeWidth={1.75} />
        {unlocked ? (
          <span className="font-medium text-gold-deep">{t('giftUnlocked')}</span>
        ) : (
          <span>{t.rich('giftProgress', { amount: formatCurrency(remaining), b: (c) => <strong className="font-semibold text-ink">{c}</strong> })}</span>
        )}
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="h-full rounded-full bg-gold-deep transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

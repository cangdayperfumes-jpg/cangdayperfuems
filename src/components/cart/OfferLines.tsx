'use client';

import { Tag } from 'lucide-react';
import { useLocale } from 'next-intl';
import { offerLineLabel, type OfferLine } from '@/lib/offers';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** "Applied offer  −₺1.234" rows under the subtotal (cart drawer and checkout summary). */
export default function OfferLines({ lines, className }: { lines: OfferLine[]; className?: string }) {
  const locale = useLocale();
  if (!lines.length) return null;
  return (
    <ul className={cn('space-y-1.5', className)}>
      {lines.map((l) => (
        <li key={l.offer} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-gold-deep">
            <Tag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{offerLineLabel(l, locale)}</span>
          </span>
          <span className="shrink-0 font-medium tabular-nums text-gold-deep">−{formatCurrency(l.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

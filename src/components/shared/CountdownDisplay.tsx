'use client';

import { useTranslations } from 'next-intl';
import { pad2, type CountdownParts } from '@/hooks/use-countdown';
import { cn } from '@/lib/utils';

/** Boxed "02 d : 14 h : 05 m : 33 s" clock used by the offer pop-up. */
export function CountdownBoxes({ parts, className }: { parts: CountdownParts; className?: string }) {
  const t = useTranslations('offer');
  const units = [
    { value: parts.days, label: t('days') },
    { value: parts.hours, label: t('hours') },
    { value: parts.minutes, label: t('minutes') },
    { value: parts.seconds, label: t('seconds') },
  ];

  return (
    <div className={cn('flex items-start justify-center gap-2', className)} role="timer" aria-live="off">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-start gap-2">
          <div className="flex w-14 flex-col items-center rounded-sm border border-gold/40 bg-ivory py-2">
            <span className="font-heading text-2xl font-semibold tabular-nums leading-none text-ink">{pad2(u.value)}</span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-ink/50">{u.label}</span>
          </div>
          {i < units.length - 1 && <span className="pt-2 font-heading text-xl text-gold-deep">:</span>}
        </div>
      ))}
    </div>
  );
}

/** Compact inline "2d 14:05:33" for the thin offer bar. */
export function CountdownInline({ parts }: { parts: CountdownParts }) {
  const t = useTranslations('offer');
  return (
    <span className="tabular-nums font-semibold" role="timer" aria-live="off">
      {parts.days > 0 && `${parts.days}${t('daysShort')} `}
      {pad2(parts.hours)}:{pad2(parts.minutes)}:{pad2(parts.seconds)}
    </span>
  );
}

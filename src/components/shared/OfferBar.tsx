'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Clock, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useCountdown } from '@/hooks/use-countdown';
import { CountdownInline } from '@/components/shared/CountdownDisplay';
import { localizeOffer } from '@/lib/offer';

/**
 * Thin countdown strip above the header for the active timed offer (the same
 * offer the pop-up shows), so the deadline stays visible after the pop-up is
 * closed. Renders nothing without an end time, once it passes, or when the
 * admin turned the bar off.
 */
export default function OfferBar() {
  const t = useTranslations('offer');
  const locale = useLocale();
  const pathname = usePathname();
  const { popupSettings: s } = useSettings();
  const parts = useCountdown(s?.popup_enabled && s.popup_show_bar !== false ? s.popup_ends_at : null);
  const [hidden, setHidden] = useState(false);

  if (!s || !parts || parts.done || hidden || pathname?.startsWith('/checkout')) return null;
  const offer = localizeOffer(s, locale);

  return (
    <div className="relative w-full bg-ink text-ivory">
      <Link
        href={offer.buttonLink}
        className="flex h-9 items-center justify-center gap-2 px-10 text-[11px] sm:text-xs tracking-wide hover:text-gold transition-colors"
      >
        <Clock className="h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.75} />
        <span className="truncate font-medium">{offer.title || t('limitedOffer')}</span>
        <span className="hidden sm:inline text-ivory/50">·</span>
        <span className="hidden sm:inline text-ivory/70">{t('endsIn')}</span>
        <span className="text-gold">
          <CountdownInline parts={parts} />
        </span>
        <ArrowRight className="hidden sm:block h-3.5 w-3.5 shrink-0" />
      </Link>
      <button
        type="button"
        aria-label={t('closeBar')}
        onClick={() => setHidden(true)}
        className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-ivory/60 hover:text-ivory"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { usePathname, Link } from '@/i18n/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useCountdown } from '@/hooks/use-countdown';
import { CountdownBoxes } from '@/components/shared/CountdownDisplay';
import { isOfferExpired, localizeOffer, offerSignature } from '@/lib/offer';

const DISMISS_KEY = 'popup_dismissed_v3';

export default function SitePopup() {
  const t = useTranslations('common');
  const tOffer = useTranslations('offer');
  const locale = useLocale();
  const { popupSettings: settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const countdown = useCountdown(settings?.popup_ends_at);

  useEffect(() => {
    // Don't show on admin pages, or if popup config isn't enabled
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/checkout')) return;
    if (!settings || !settings.popup_enabled || isOfferExpired(settings)) return;

    // Dismissed within the last 24 hours — unless it's a different offer since.
    try {
      const dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || 'null');
      if (dismissed && dismissed.offer === offerSignature(settings)) {
        const hoursSinceDismissed = (Date.now() - dismissed.timestamp) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) return;
      }
    } catch {
      // Storage unavailable or unparsable — just show it.
    }

    const showOn = settings.popup_show_on || 'all';
    const shouldShow =
      showOn === 'all' ||
      (showOn === 'shop' && pathname?.startsWith('/shop')) ||
      (showOn === 'home' && (pathname === '/' || pathname === '/home1'));

    if (shouldShow) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname, settings]);

  const handleClose = () => {
    setIsOpen(false);
    if (!settings) return;
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({ timestamp: Date.now(), offer: offerSignature(settings) }));
    } catch {
      // Ignore — it will simply show again next visit.
    }
  };

  // A timed offer disappears by itself the moment it runs out.
  if (!isOpen || !settings || countdown?.done) return null;
  const offer = localizeOffer(settings, locale);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={offer.title || tOffer('limitedOffer')}
          className="relative bg-white w-full max-w-md pointer-events-auto shadow-2xl animate-in zoom-in-95 fade-in duration-300"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-gray-500 hover:text-black transition-colors"
            aria-label={t('closePopup')}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Optional Image */}
          {settings.popup_image_url && (
            <div className="relative w-full aspect-[16/9] bg-gray-100">
              <ImageWithFallback
                src={settings.popup_image_url}
                alt={offer.title || 'Promotion'}
                fill
                className="object-cover"
                sizes="(max-width: 448px) 100vw, 448px"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8 text-center">
            {countdown && !countdown.done && (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep">
                {tOffer('limitedOffer')}
              </p>
            )}

            {offer.title && (
              <h2 className="text-2xl md:text-3xl font-heading font-medium mb-3">
                {offer.title}
              </h2>
            )}

            {offer.message && (
              <p className="text-sm md:text-base text-gray-500 font-body font-light leading-relaxed mb-6">
                {offer.message}
              </p>
            )}

            {countdown && !countdown.done && (
              <div className="mb-6">
                <p className="mb-2 text-xs text-ink/60">{tOffer('endsIn')}</p>
                <CountdownBoxes parts={countdown} />
              </div>
            )}

            {offer.buttonText && (
              <Link
                href={offer.buttonLink}
                onClick={handleClose}
                className="inline-flex items-center justify-center bg-black text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-body font-medium hover:bg-gray-800 transition-colors w-full"
              >
                {offer.buttonText}
              </Link>
            )}

            <button
              onClick={handleClose}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest font-body transition-colors"
            >
              {t('noThanks')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ResponsiveCroppedImage from '@/components/shared/ResponsiveCroppedImage';
import { useSettings } from '@/components/providers/SettingsProvider';
import { OFFER_STOCK_PHOTO, offerCopyValues, offerEnabled } from '@/lib/offer-copy';
import { cn } from '@/lib/utils';
import Reveal from '@/components/shared/Reveal';

// `offer` names the photo slot in Admin → Offers (offers.cards); the built-in
// photo (moody, low-key, so ivory copy keeps contrast) is used until the
// admin uploads one.
const CARDS = [
  { key: 'offerPair', offer: 'pair' },
  { key: 'offerTrio', offer: 'trio' },
  { key: 'offerPremium', offer: 'premium' },
  { key: 'promo3', offer: 'gift' },
] as const;

/**
 * The automatic offers (Admin → Offers) and the free mini gift as photo
 * cards; each one follows its on/off switch and shows the admin's numbers.
 *
 * On mobile they stack one under another as short landscape banners (copy
 * on the left over a side gradient) so the column stays compact; from md up
 * they sit as a grid of portrait cards with copy over a bottom gradient.
 */
export default function PromoBanners() {
  const t = useTranslations('home');
  const { gift, offers } = useSettings();
  const on = offerEnabled(offers, gift);
  const cards = CARDS.filter((c) => on[c.offer]);
  const values = offerCopyValues(offers, gift);
  if (!cards.length) return null;

  return (
    <section className="w-full bg-ivory">
      <div className="max-w-[1400px] mx-auto px-4 py-10 md:px-6 md:py-20 lg:px-8">
        <div className={cn("grid grid-cols-1 gap-3 sm:gap-4 md:gap-5", cards.length >= 2 && "md:grid-cols-2", cards.length === 3 && "lg:grid-cols-3", cards.length === 4 && "lg:grid-cols-4")}>
          {cards.map(({ key, offer }, i) => {
            const photo = offers.cards[offer];
            return (
            <Reveal key={key} delay={i * 0.1}>
            <Link
              href="/shop"
              className="group relative block min-h-[210px] sm:min-h-[240px] md:min-h-0 md:aspect-[4/5] overflow-hidden rounded-sm bg-ink"
            >
              <ResponsiveCroppedImage
                src={photo.image || OFFER_STOCK_PHOTO[offer]}
                cropDesktop={photo.image ? photo.cropDesktop : null}
                cropMobile={photo.image ? photo.cropMobile : null}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                // Same warm/desaturated grading as the other photo cards on
                // the page, so stock photos read as one material.
                className="object-cover transition-transform duration-700 group-hover:scale-105 [filter:grayscale(0.3)_sepia(0.15)_saturate(0.9)_brightness(0.8)]"
              />
              {/* Side gradient for the mobile banners, bottom gradient for the
                  portrait cards. */}
              <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/10 md:bg-gradient-to-t md:from-ink/95 md:via-ink/45 md:to-ink/5" />

              <div className="relative flex h-full min-h-[inherit] flex-col justify-center md:justify-end p-6 md:p-8 max-w-[75%] sm:max-w-[60%] md:max-w-none">
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-gold font-semibold mb-2">
                  {t(`${key}Eyebrow`, values)}
                </p>
                <h3 className="font-heading text-[28px] md:text-[34px] font-medium leading-[1.05] text-ivory">
                  {t(`${key}Title`, values)}
                </h3>
                <span aria-hidden="true" className="mt-3 block h-px w-10 bg-gold/70 transition-all duration-500 group-hover:w-16" />
                {/* Reserve two lines on desktop so titles line up across the row. */}
                <p className="mt-3 text-[13px] md:text-sm leading-snug text-ivory/75 max-w-[30ch] md:min-h-[2.75em]">
                  {t(`${key}Body`, values)}
                </p>
                <span className="mt-4 md:mt-5 inline-flex items-center gap-2 text-[11px] md:text-xs uppercase tracking-widest font-semibold text-gold group-hover:text-gold-soft transition-colors">
                  {t(`${key}Cta`, values)}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

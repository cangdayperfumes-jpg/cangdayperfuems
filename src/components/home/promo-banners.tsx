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
 * On phones they're tall 4:5 cards stacked one under another (copy over a
 * bottom gradient); from md up they're wide 1.6:1 banners in a grid (copy on the
 * left over a side gradient). Same shapes as the crop editor in Admin → Offers.
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
        <div className={cn("grid grid-cols-1 gap-4 md:gap-5", cards.length > 1 && "md:grid-cols-2")}>
          {cards.map(({ key, offer }, i) => {
            const photo = offers.cards[offer];
            return (
            <Reveal key={key} delay={i * 0.1}>
            <Link
              href="/shop"
              className="group relative block aspect-[4/5] md:aspect-[1.6/1] overflow-hidden rounded-sm bg-ink"
            >
              <ResponsiveCroppedImage
                src={photo.image || OFFER_STOCK_PHOTO[offer]}
                cropDesktop={photo.image ? photo.cropDesktop : null}
                cropMobile={photo.image ? photo.cropMobile : null}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
                // Same warm/desaturated grading as the other photo cards on
                // the page, so stock photos read as one material.
                className="object-cover transition-transform duration-700 group-hover:scale-105 [filter:grayscale(0.3)_sepia(0.15)_saturate(0.9)_brightness(0.8)]"
              />
              {/* Bottom gradient for the tall phone cards, side gradient for
                  the wide desktop banners. */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/45 to-ink/5 md:bg-gradient-to-r md:from-ink/95 md:via-ink/70 md:to-ink/10" />

              <div className="relative flex h-full flex-col justify-end md:justify-center p-6 md:p-8 lg:p-10 md:max-w-[60%]">
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-gold font-semibold mb-2">
                  {t(`${key}Eyebrow`, values)}
                </p>
                <h3 className="font-heading text-[28px] md:text-[34px] font-medium leading-[1.05] text-ivory">
                  {t(`${key}Title`, values)}
                </h3>
                <span aria-hidden="true" className="mt-3 block h-px w-10 bg-gold/70 transition-all duration-500 group-hover:w-16" />
                <p className="mt-3 text-[13px] md:text-sm leading-snug text-ivory/75 max-w-[30ch]">
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

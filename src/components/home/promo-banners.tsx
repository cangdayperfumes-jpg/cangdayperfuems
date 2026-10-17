'use client';

import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

// Moody, low-key photography so ivory copy over the bottom gradient always
// has contrast — one per offer: a single dark bottle (first-order code),
// three bottles together (buy 2, get 1), and a bottle with its gift box
// (free mini gift). Swap for the site's own shoot when available.
const CARDS = [
  {
    key: 'promo1',
    href: '/shop',
    image: 'https://images.unsplash.com/photo-1643797517590-c44cb552ddcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    key: 'promo2',
    href: '/shop',
    image: 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    key: 'promo3',
    href: '/shop',
    image: 'https://images.unsplash.com/photo-1770301410072-f6ef6dad65b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
] as const;

/**
 * Retail conversion row — replaces the wholesale "bulk pricing" banner from
 * the source project with the discount/bundle/gift-threshold pattern a
 * direct-to-consumer storefront actually needs.
 *
 * Photo cards with copy over a bottom gradient. On mobile they're a
 * horizontal snap row with the next card peeking in (so it reads as
 * swipeable), instead of three tall text-only blocks stacked down the page;
 * from md up they sit as a 3-column grid.
 */
export default function PromoBanners() {
  const t = useTranslations('home');

  return (
    <section className="w-full bg-ivory">
      <div className="max-w-[1400px] mx-auto py-10 md:py-20 md:px-6 lg:px-8">
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-px-4 px-4 md:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CARDS.map(({ key, href, image }) => (
            <Link
              key={key}
              href={href}
              className="group relative shrink-0 w-[80%] sm:w-[55%] md:w-auto snap-start aspect-[4/5] overflow-hidden rounded-sm bg-ink"
            >
              <ImageWithFallback
                src={image}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 640px) 80vw, (max-width: 768px) 55vw, 33vw"
                // Same warm/desaturated grading as the other photo cards on
                // the page, so stock photos read as one material.
                className="object-cover transition-transform duration-700 group-hover:scale-105 [filter:grayscale(0.3)_sepia(0.15)_saturate(0.9)_brightness(0.8)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/45 to-ink/5" />

              <div className="relative flex h-full flex-col justify-end p-5 md:p-8">
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-gold font-semibold mb-2">
                  {t(`${key}Eyebrow`)}
                </p>
                <h3 className="font-heading text-[28px] md:text-4xl font-medium leading-[1.05] text-ivory">
                  {t(`${key}Title`)}
                </h3>
                <span aria-hidden="true" className="mt-3 block h-px w-10 bg-gold/70 transition-all duration-500 group-hover:w-16" />
                <p className="mt-3 text-[13px] md:text-sm leading-snug text-ivory/75 max-w-[30ch]">
                  {t(`${key}Body`)}
                </p>
                <span className="mt-4 md:mt-5 inline-flex items-center gap-2 text-[11px] md:text-xs uppercase tracking-widest font-semibold text-gold group-hover:text-gold-soft transition-colors">
                  {t(`${key}Cta`)}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

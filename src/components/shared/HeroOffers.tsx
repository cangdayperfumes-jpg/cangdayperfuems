'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Layers, Percent, Sparkles } from 'lucide-react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { formatPromoAmount } from '@/lib/promotions';
import { cn } from '@/lib/utils';

// Same copy keys as the homepage offer cards (promo-banners.tsx).
const OFFERS = [
  { key: 'offerPair', icon: Percent },
  { key: 'offerTrio', icon: Layers },
  { key: 'offerPremium', icon: Sparkles },
  { key: 'promo3', icon: Gift },
] as const;

/** Whether the hero shows the offers — Hero uses it to make room for them. */
export function useHeroOffersVisible() {
  const { gift, offers } = useSettings();
  return offers.hero && (offers.pair.enabled || offers.trio.enabled || offers.premium.enabled || gift.enabled);
}

/**
 * The active offers (Admin → Offers) as dark glass cards laid over the
 * bottom of the hero photo, lined up with the hero copy's column. Mobile:
 * a swipeable row of compact pills. Desktop: one column per offer.
 * Turned on/off by the "Show offers in the hero" switch.
 */
export default function HeroOffers() {
  const t = useTranslations('home');
  const { gift, offers } = useSettings();
  const visible = useHeroOffersVisible();
  if (!visible) return null;

  const on = { offerPair: offers.pair.enabled, offerTrio: offers.trio.enabled, offerPremium: offers.premium.enabled, promo3: gift.enabled };
  const items = OFFERS.filter((o) => on[o.key]);
  const values = {
    pairPercent: offers.pair.percent,
    pairMax: formatPromoAmount(offers.pair.maxPrice),
    count: offers.trio.count,
    trioMax: formatPromoAmount(offers.trio.maxPrice),
    trioPrice: formatPromoAmount(offers.trio.price),
    premiumPercent: offers.premium.percent,
    premiumMin: formatPromoAmount(offers.premium.minPrice),
    amount: formatPromoAmount(gift.threshold),
  };

  return (
    <div
      aria-label={t('heroOffersLabel')}
      role="region"
      className="absolute inset-x-0 bottom-0 z-20 pb-3 md:pb-5"
      // Scrolling the cards sideways must not also swipe the hero slides.
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="max-w-[1400px] mx-auto md:px-6 lg:px-8">
        <ul
          className={cn(
            'flex gap-2 overflow-x-auto snap-x snap-mandatory px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'md:grid md:gap-3 md:overflow-visible md:px-0',
            items.length === 1 && 'md:grid-cols-1 md:max-w-sm',
            items.length === 2 && 'md:grid-cols-2 md:max-w-3xl',
            items.length === 3 && 'md:grid-cols-3',
            items.length === 4 && 'md:grid-cols-4'
          )}
        >
          {items.map(({ key, icon: Icon }, i) => (
            <motion.li
              key={key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="snap-start shrink-0 md:min-w-0"
            >
              <Link
                href="/shop"
                className="group relative flex h-full items-center gap-2.5 md:gap-3 overflow-hidden rounded-full md:rounded-md border border-gold/30 bg-ink/85 backdrop-blur-md py-1.5 pl-1.5 pr-4 md:p-3 lg:p-3.5 shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] transition-colors hover:border-gold/70 hover:bg-ink/95"
              >
                {/* Soft gold glow in the corner, brighter on hover. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 hidden md:block h-20 w-20 rounded-full bg-gold/20 blur-2xl opacity-50 transition-opacity duration-500 group-hover:opacity-100"
                />
                <span className="relative flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[9px] md:text-[10px] uppercase tracking-[0.24em] font-semibold text-gold leading-none">
                    {t(`${key}Eyebrow`, values)}
                  </span>
                  <span className="mt-1 block whitespace-nowrap md:truncate font-heading text-sm md:text-base lg:text-lg leading-tight text-ivory">
                    {t(`${key}Title`, values)}
                  </span>
                  <span className="mt-0.5 hidden lg:block truncate text-[11px] text-ivory/60">
                    {t(`${key}Body`, values)}
                  </span>
                </span>
                <ArrowRight className="relative hidden md:block h-4 w-4 shrink-0 text-gold/60 transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

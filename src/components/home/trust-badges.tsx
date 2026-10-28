'use client';

import { Truck, Gift, ShieldCheck, PackageCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/components/providers/SettingsProvider';
import { formatPromoAmount } from '@/lib/promotions';
import { shippingBannerLabel } from '@/lib/shipping-banner';
import { cn } from '@/lib/utils';

const ITEMS = [
  { icon: Truck, key: 'freeShipping' },
  { icon: Gift, key: 'freeGift' },
  { icon: ShieldCheck, key: 'original' },
  { icon: PackageCheck, key: 'sameDayDispatch' },
] as const;

/**
 * Static, always-visible counterpart to the scrolling AnnouncementBar
 * marquee at the very top of the page: same four facts (reuses the
 * `trustBar` copy), but as a prominent icon grid right under the hero,
 * where it's far more likely to actually be read than a thin strip above
 * the header.
 *
 * Mobile stacks each badge (icon above a centered label) in a 2×2 grid —
 * side-by-side icon + text in a half-width cell forced every label to wrap
 * awkwardly. Hairline dividers come from `gap-px` over a border-colored
 * background, so the lines are always exactly between cells at any
 * column count.
 */
export default function TrustBadges() {
  const t = useTranslations('trustBar');
  const { gift, shippingBanner } = useSettings();
  const shippingLabel = shippingBannerLabel(shippingBanner, t);
  const items = ITEMS.filter((i) => (i.key !== 'freeGift' || gift.enabled) && (i.key !== 'freeShipping' || !!shippingLabel));
  return (
    <section className="w-full bg-ivory border-b border-border">
      <div className="max-w-[1400px] mx-auto md:px-6 lg:px-8">
        <div className={cn('grid gap-px bg-border', items.length === 4 ? 'grid-cols-2 md:grid-cols-4' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {items.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="bg-ivory flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-3 py-4 md:py-6 text-center md:text-left"
            >
              <span className="flex h-10 w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/5">
                <Icon className="h-[18px] w-[18px] md:h-5 md:w-5 text-gold-deep" strokeWidth={1.5} />
              </span>
              <span className="text-[11px] md:text-sm font-medium text-ink/80 leading-snug max-w-[14ch] md:max-w-none">
                {key === 'freeGift'
                  ? t('freeGift', { amount: formatPromoAmount(gift.threshold) })
                  : key === 'freeShipping'
                  ? shippingLabel
                  : t(key)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

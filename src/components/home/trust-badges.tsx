import { Truck, Gift, ShieldCheck, RotateCcw } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const ITEMS = [
  { icon: Truck, key: 'freeShipping' },
  { icon: Gift, key: 'freeGift' },
  { icon: ShieldCheck, key: 'original' },
  { icon: RotateCcw, key: 'easyReturns' },
] as const;

/**
 * Static, always-visible counterpart to the scrolling AnnouncementBar
 * marquee at the very top of the page: same four facts (reuses the
 * `trustBar` copy), but as a prominent icon grid right under the hero,
 * where it's far more likely to actually be read than a thin strip above
 * the header.
 */
export default async function TrustBadges() {
  const t = await getTranslations('trustBar');
  return (
    <section className="w-full bg-ivory border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
          {ITEMS.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-5 md:py-6">
              <Icon className="h-6 w-6 md:h-7 md:w-7 text-gold-deep shrink-0" strokeWidth={1.5} />
              <span className="text-xs md:text-sm font-medium text-ink/80 leading-tight">
                {t(key)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

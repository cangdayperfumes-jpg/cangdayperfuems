import { Truck, Gift, ShieldCheck, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

const ITEMS = [
  { icon: Truck, key: 'freeShipping' },
  { icon: Gift, key: 'freeGift' },
  { icon: ShieldCheck, key: 'original' },
  { icon: RotateCcw, key: 'easyReturns' },
] as const;

// Repeated several times so a single row's content is always wider than any
// realistic viewport — with just 4 short items, one unrepeated pass is
// narrower than the screen, which leaves a visible gap of empty space once
// it scrolls past and the loop has nothing left to show before restarting.
const REPEATS = 6;
const REPEATED_ITEMS = Array.from({ length: REPEATS }, () => ITEMS).flat();

function Row({ t, hidden }: { t: (key: (typeof ITEMS)[number]['key']) => string; hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex items-center gap-10 md:gap-14 px-5 shrink-0 animate-marquee-banner">
      {REPEATED_ITEMS.map(({ icon: Icon, key }, index) => (
        <Fragment key={`${key}-${index}`}>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Icon className="h-3.5 w-3.5 text-gold-deep shrink-0" strokeWidth={1.75} />
            <span className="text-[11px] font-medium tracking-wide text-ink/70">{t(key)}</span>
          </div>
          <span aria-hidden="true" className="inline-block h-1 w-1 rotate-45 border border-gold/50 shrink-0" />
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Light, continuously auto-scrolling strip above the header — same marquee
 * technique as BrandTicker (two duplicated rows translated via CSS, no JS
 * timer), but on an ivory ground instead of ink so it reads as part of the
 * light chrome, not a dark holdover. Visible at every breakpoint, unlike the
 * old desktop-only static TrustBar it replaces.
 */
export default function AnnouncementBar() {
  const t = useTranslations('trustBar');
  return (
    <div className="w-full bg-ivory border-b border-border overflow-hidden">
      <div
        className="flex whitespace-nowrap h-8 items-center"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 14%, black 86%, transparent)' }}
      >
        <Row t={t} />
        <Row t={t} hidden />
      </div>
    </div>
  );
}

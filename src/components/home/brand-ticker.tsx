import { Link } from '@/i18n/navigation';
import { Fragment } from 'react';

interface BrandTickerProps {
  brands?: { name: string; slug?: string }[];
}

function Diamond() {
  return (
    <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rotate-45 border border-gold/50 shrink-0" />
  );
}

function BrandRow({ brands, hidden }: { brands: { name: string; slug?: string }[]; hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      // shrink-0 is load-bearing: without it, the flex algorithm can size this
      // and its sibling loop to slightly different widths, which desyncs the
      // -100%-of-self marquee keyframe and shows up as a stutter/skip in the loop.
      className="flex items-center gap-8 md:gap-12 px-4 md:px-6 shrink-0 animate-marquee-slow"
    >
      {brands.map((brand, index) => (
        <Fragment key={`${brand.name}-${index}`}>
          {brand.slug && !hidden ? (
            <Link
              href={`/shop?brands=${brand.slug}`}
              prefetch={false}
              className="text-xl md:text-2xl font-heading font-medium tracking-widest text-ink/60 uppercase hover:text-gold-deep transition-colors"
            >
              {brand.name}
            </Link>
          ) : (
            <span className="text-xl md:text-2xl font-heading font-medium tracking-widest text-ink/60 uppercase">
              {brand.name}
            </span>
          )}
          <Diamond />
        </Fragment>
      ))}
    </div>
  );
}

export default function BrandTicker({ brands = [] }: BrandTickerProps) {
  // Fallback (no slugs available) if no brands provided (though page should provide them)
  const displayBrands: { name: string; slug?: string }[] = brands.length > 0
    ? brands
    : ["CHANEL", "DIOR", "CREED", "TOM FORD", "GUCCI", "VERSACE", "YSL", "ARMANI"].map((name) => ({ name }));

  return (
    <div className="relative w-full bg-secondary/60 border-y border-border overflow-hidden py-3 md:py-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div
        className="flex whitespace-nowrap"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 14%, black 86%, transparent)' }}
      >
        {/* Real links when a slug is available, doubling as internal linking
            to /shop?brands=<slug>. Second copy is a decorative duplicate for
            the seamless scroll, kept plain text and aria-hidden. */}
        <BrandRow brands={displayBrands} />
        <BrandRow brands={displayBrands} hidden />
      </div>
    </div>
  );
}

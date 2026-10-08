import { Link } from '@/i18n/navigation';
import { Fragment } from 'react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface BrandTickerProps {
  brands?: { name: string; slug?: string; image_url?: string | null }[];
}

function Diamond() {
  return (
    <span aria-hidden="true" className="inline-block h-1 w-1 rotate-45 border border-gold/50 shrink-0" />
  );
}

// Real product photography (each brand's own oldest active listing —
// see the 20261008010000 migration), not a licensed brand logo or a
// generic stock bottle that wouldn't actually be that brand's product.
// Same desaturate/warm grading as every other photo card on the page, so
// photos sourced from dozens of different suppliers still read as one
// material in the strip.
function BrandThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative h-7 w-7 md:h-8 md:w-8 rounded-full overflow-hidden shrink-0 bg-ivory border border-gold/30">
      <ImageWithFallback
        src={src}
        alt=""
        fill
        sizes="32px"
        className="object-cover [filter:grayscale(0.4)_sepia(0.15)_saturate(0.9)_brightness(0.9)]"
      />
      <span className="sr-only">{alt}</span>
    </span>
  );
}

function BrandRow({
  brands,
  hidden,
}: {
  brands: { name: string; slug?: string; image_url?: string | null }[];
  hidden?: boolean;
}) {
  return (
    <div
      aria-hidden={hidden}
      // shrink-0 is load-bearing: without it, the flex algorithm can size this
      // and its sibling loop to slightly different widths, which desyncs the
      // -100%-of-self marquee keyframe and shows up as a stutter/skip in the loop.
      className="flex items-center gap-8 md:gap-12 px-4 md:px-6 shrink-0 animate-marquee-slow"
    >
      {brands.map((brand, index) => {
        const thumb = brand.image_url ? <BrandThumb src={brand.image_url} alt={brand.name} /> : null;
        return (
          <Fragment key={`${brand.name}-${index}`}>
            {brand.slug && !hidden ? (
              <Link
                href={`/shop?brands=${brand.slug}`}
                prefetch={false}
                className="flex items-center gap-2.5 text-xs md:text-sm font-heading font-medium tracking-widest text-ink/60 uppercase hover:text-gold-deep transition-colors"
              >
                {thumb}
                {brand.name}
              </Link>
            ) : (
              <span className="flex items-center gap-2.5 text-xs md:text-sm font-heading font-medium tracking-widest text-ink/60 uppercase">
                {thumb}
                {brand.name}
              </span>
            )}
            <Diamond />
          </Fragment>
        );
      })}
    </div>
  );
}

export default function BrandTicker({ brands = [] }: BrandTickerProps) {
  // Fallback (no slugs available) if no brands provided (though page should provide them)
  const displayBrands: { name: string; slug?: string; image_url?: string | null }[] = brands.length > 0
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

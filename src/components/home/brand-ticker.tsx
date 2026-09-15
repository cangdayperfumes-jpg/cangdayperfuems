import Link from 'next/link';

interface BrandTickerProps {
  brands?: { name: string; slug?: string }[];
}

export default function BrandTicker({ brands = [] }: BrandTickerProps) {
  // Fallback (no slugs available) if no brands provided (though page should provide them)
  const displayBrands: { name: string; slug?: string }[] = brands.length > 0
    ? brands
    : ["CHANEL", "DIOR", "CREED", "TOM FORD", "GUCCI", "VERSACE", "YSL", "ARMANI"].map((name) => ({ name }));

  return (
    <div className="w-full bg-white border-b border-gray-100 overflow-hidden py-6 md:py-8">
      <div className="flex whitespace-nowrap">
        {/* First Loop — real links when a slug is available, so this doubles as
            internal linking to /shop?brands=<slug> instead of static text. */}
        <div className="flex items-center gap-16 md:gap-24 px-8 md:px-12 animate-marquee">
          {displayBrands.map((brand, index) =>
            brand.slug ? (
              <Link
                key={`${brand.name}-1-${index}`}
                href={`/shop?brands=${brand.slug}`}
                prefetch={false}
                className="text-xl md:text-2xl font-heading font-medium tracking-widest text-gray-900 opacity-80 uppercase hover:opacity-100 transition-opacity"
              >
                {brand.name}
              </Link>
            ) : (
              <span key={`${brand.name}-1-${index}`} className="text-xl md:text-2xl font-heading font-medium tracking-widest text-gray-900 opacity-80 uppercase">
                {brand.name}
              </span>
            )
          )}
        </div>
        {/* Second Loop (decorative duplicate for seamless scroll) — kept as plain
            text and aria-hidden, since it's a visual repeat, not extra content. */}
        <div className="flex items-center gap-16 md:gap-24 px-8 md:px-12 animate-marquee" aria-hidden="true">
          {displayBrands.map((brand, index) => (
            <span key={`${brand.name}-2-${index}`} className="text-xl md:text-2xl font-heading font-medium tracking-widest text-gray-900 opacity-80 uppercase">
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

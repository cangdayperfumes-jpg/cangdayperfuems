'use client';

import { Category } from '@/types';
import { Link } from '@/i18n/navigation';
import ResponsiveCroppedImage from '@/components/shared/ResponsiveCroppedImage';
import { useAutoScrollLoop } from '@/hooks/use-auto-scroll-loop';

interface CategoryCarouselProps {
  categories: Category[];
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="relative w-full aspect-[4/7] overflow-hidden whitespace-normal bg-ink">
      {category.image_url ? (
        <ResponsiveCroppedImage
          src={category.image_url}
          cropDesktop={category.image_crop_desktop}
          cropMobile={category.image_crop_mobile}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 300px"
          // Same consistent grading pass as "Find Your Category" above, so
          // every photo-card section on the page reads as one material.
          className="object-cover transition-all duration-500 group-hover/card:scale-110 [filter:grayscale(0.5)_sepia(0.15)_saturate(0.9)_brightness(0.8)] group-hover/card:[filter:grayscale(0.3)_sepia(0.1)_saturate(1)_brightness(0.65)]"
        />
      ) : (
        <div className="w-full h-full bg-ink-elevated flex items-center justify-center text-ivory/40">
          <span className="text-xs">No Image</span>
        </div>
      )}
      {/* Name overlaid near the top of the image, not in a separate row below. */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-ink/80 via-ink/20 to-transparent pt-5 pb-10 px-2">
        <span className="block w-full line-clamp-2 text-center text-sm sm:text-base md:text-lg font-heading font-normal text-ivory transition-colors">
          {category.name}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gold/0 group-hover/card:bg-gold/60 transition-colors" />
    </div>
  );
}

/**
 * Continuously drifting, draggable strip (see useAutoScrollLoop) instead of
 * an embla+Autoplay carousel — the previous version fought with real touch
 * scrolling on mobile (embla's own drag handling competing with the
 * browser's native swipe), which is exactly the kind of thing that only
 * shows up on an actual phone, not in a desktop browser.
 */
const MIN_CARDS_PER_COPY = 24;

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const { viewportRef, trackRef, handlers } = useAutoScrollLoop(categories.length);

  // One "copy" of the strip must be wider than the viewport, or the
  // halfway-point loop reset has nothing to scroll through and the strip
  // stops short of the right edge on wide screens — so short category lists
  // are repeated up to MIN_CARDS_PER_COPY (24 × 224px ≈ 5400px, enough for
  // ultra-wide/zoomed-out screens), then doubled for the seamless reset.
  // Every copy is a real link, since a user dragging by hand can land on any
  // of them before the loop resets it back under them.
  const repeat = categories.length > 0 ? Math.ceil(MIN_CARDS_PER_COPY / categories.length) : 0;
  const oneCopy = Array.from({ length: repeat }, () => categories).flat();
  const items = [...oneCopy, ...oneCopy];

  return (
    <div ref={viewportRef} className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none" {...handlers}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {items.map((category, index) => (
          <Link
            key={`${category.id}-${index}`}
            href={`/shop?category=${category.slug}`}
            draggable={false}
            className="group/card block w-36 md:w-56 shrink-0"
          >
            <CategoryCard category={category} />
          </Link>
        ))}
      </div>
    </div>
  );
}

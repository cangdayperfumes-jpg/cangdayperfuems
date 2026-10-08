'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/shared/ProductCard';

interface NewArrivalsCarouselProps {
  products: any[];
}

/**
 * Fully user-driven: no autoplay. Desktop moves it with the hover-revealed
 * arrow buttons (one "page" — a full view of cards — at a time); touch
 * devices swipe the native overflow-x-auto scroller directly.
 *
 * The item list is tripled and the scroller starts centered on the middle
 * copy so dragging/clicking either direction always has more cards to reveal
 * — a silent scrollLeft jump on scroll (not a smoothed one — see why
 * `scroll-smooth` is deliberately absent below) resets back into the middle
 * copy once you stray into the first or last third, so the loop never shows
 * a visible seam or a dead end.
 */
export default function NewArrivalsCarousel({ products }: NewArrivalsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isAdjustingRef = useRef(false);

  const items = products.length > 0 ? [...products, ...products, ...products] : [];

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || products.length === 0) return;
    el.scrollLeft = el.scrollWidth / 3;
  }, [products.length]);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || isAdjustingRef.current) return;
    const third = el.scrollWidth / 3;
    if (el.scrollLeft < third * 0.5) {
      isAdjustingRef.current = true;
      el.scrollLeft += third;
      isAdjustingRef.current = false;
    } else if (el.scrollLeft > third * 2.5) {
      isAdjustingRef.current = true;
      el.scrollLeft -= third;
      isAdjustingRef.current = false;
    }
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className="group/carousel relative w-full">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex w-full overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((product, index) => (
          <div key={`${product.id}-${index}`} className="w-[42%] md:w-1/4 shrink-0 px-1.5 md:px-3 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous"
        onClick={() => scrollByPage(-1)}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-ivory"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => scrollByPage(1)}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-ivory"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

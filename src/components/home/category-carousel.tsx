'use client';

import { useEffect, useRef } from 'react';
import { Category } from '@/types';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface CategoryCarouselProps {
  categories: Category[];
}

function CategoryAvatar({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group flex flex-col items-center gap-1.5 md:gap-2 p-1 md:p-2"
    >
      <div className="relative w-14 h-14 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gold/40 transition-all shadow-sm group-hover:shadow-md">
        {category.image_url ? (
          <ImageWithFallback
            src={category.image_url}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 80px, 128px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <span className="text-xs">No Image</span>
          </div>
        )}
      </div>
      <span className="text-[10px] md:text-sm font-medium font-heading uppercase tracking-wide md:tracking-wider group-hover:text-gold-deep transition-colors text-center leading-tight">
        {category.name}
      </span>
    </Link>
  );
}

const RESUME_DELAY_MS = 1200;
const PIXELS_PER_FRAME = 0.6;

/**
 * Continuous scrollLeft-driven auto-scroll on a natively-scrollable element,
 * instead of an embla+Autoplay carousel — the previous version fought with
 * real touch scrolling on mobile (embla's own drag handling competing with
 * the browser's native swipe), which is exactly the kind of thing that only
 * shows up on an actual phone, not in a desktop browser.
 */
export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || categories.length === 0) return;

    let rafId: number;
    // Tracked in plain JS, not read back from `el.scrollLeft` each frame —
    // some WebKit/Safari builds round scrollLeft to a whole pixel on every
    // write, which silently eats sub-pixel increments read-modify-write
    // style and can leave the loop stuck at 0 on an iPhone even though it
    // animates fine in Chromium.
    let position = el.scrollLeft;
    const step = () => {
      if (pausedRef.current) {
        // Stay in sync with manual dragging while paused, so resuming
        // continues from wherever the user left it instead of snapping back.
        position = el.scrollLeft;
      } else {
        const halfWidth = el.scrollWidth / 2;
        position += PIXELS_PER_FRAME;
        if (position >= halfWidth) {
          position -= halfWidth;
        }
        el.scrollLeft = position;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [categories.length]);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };
  const scheduleResume = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  };

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  // Duplicated once so the scrollLeft reset at the halfway point is
  // seamless — both copies are real links since a user dragging by hand can
  // land on either one before the loop resets it back under them.
  const items = [...categories, ...categories];

  return (
    <div
      ref={scrollerRef}
      className="flex w-full max-w-6xl mx-auto overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onPointerDown={pause}
      onPointerUp={scheduleResume}
      onPointerLeave={scheduleResume}
      onTouchStart={pause}
      onTouchEnd={scheduleResume}
      onMouseEnter={pause}
      onMouseLeave={scheduleResume}
    >
      {items.map((category, index) => (
        <div key={`${category.id}-${index}`} className="shrink-0 basis-1/3 md:basis-[14%]">
          <CategoryAvatar category={category} />
        </div>
      ))}
    </div>
  );
}

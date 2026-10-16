'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Testimonial } from '@/lib/testimonials-data';
import { useAutoScrollLoop } from '@/hooks/use-auto-scroll-loop';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

// A single copy of the strip needs to be wider than the viewport, or the
// halfway-point loop reset in useAutoScrollLoop has nothing to scroll
// through — short testimonial lists are repeated up to this many cards
// before being doubled for the seamless loop.
// 16 × ~316px ≈ 5000px — wide enough for ultra-wide / zoomed-out screens.
const MIN_CARDS_PER_COPY = 16;

/**
 * Customer feedback photos — an infinite, continuously auto-scrolling strip
 * (same scrollLeft-driven loop as the Browse by Type carousel, so native
 * swipe/drag still works on top of it and it pauses while hovered or
 * touched). Tapping a card opens a near-fullscreen lightbox; the loop stays
 * paused while it's open.
 */
export default function Testimonials({ testimonials }: TestimonialsProps) {
  const t = useTranslations('home');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const repeat = testimonials.length > 0 ? Math.ceil(MIN_CARDS_PER_COPY / testimonials.length) : 0;
  const oneCopy = Array.from({ length: repeat }, () => testimonials).flat();
  const items = [...oneCopy, ...oneCopy];

  const { viewportRef, trackRef, handlers, pause, scheduleResume, nudge } = useAutoScrollLoop(items.length, 30);

  useEffect(() => {
    if (lightboxIndex !== null) pause();
    else scheduleResume();
    // pause/scheduleResume only touch refs — safe to leave out of deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex]);

  if (testimonials.length === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    nudge(direction * el.clientWidth * 0.8);
  };

  const showPrev = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + testimonials.length) % testimonials.length));
  const showNext = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % testimonials.length));

  return (
    <section className="py-8 md:py-12 w-full bg-ivory">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-4 md:mb-6">
        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
            {t('testimonialsEyebrow')}
          </p>
          <h2 className="text-lg md:text-2xl font-heading font-medium">
            {t('testimonialsTitle')}
          </h2>
        </div>
      </div>

      <div className="group/carousel relative w-full">
        <div
          ref={viewportRef}
          className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
          {...handlers}
          style={{ ...handlers.style, maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}
        >
        {/* pr matches the gap so both copies are exactly the same width and the halfway reset is seamless */}
        <div ref={trackRef} className="flex w-max gap-3 md:gap-4 pr-3 md:pr-4 will-change-transform">
          {items.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => setLightboxIndex(index % testimonials.length)}
              // Only the first real copy is reachable by keyboard/screen
              // readers — the repeats exist purely for the visual loop.
              tabIndex={index < testimonials.length ? 0 : -1}
              aria-hidden={index >= testimonials.length || undefined}
              draggable={false}
              className="group/card relative shrink-0 w-[44vw] sm:w-[30vw] md:w-[19vw] max-w-[300px] aspect-[3/4] overflow-hidden rounded-sm ring-1 ring-border hover:ring-gold/60 transition-colors"
            >
              <Image
                src={item.image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 44vw, (max-width: 768px) 30vw, 300px"
                className="object-cover transition-transform duration-700 group-hover/card:scale-105"
              />
            </button>
          ))}
        </div>
        </div>

        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollByPage(-1)}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-ivory"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollByPage(1)}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-ivory"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none"
        >
          <DialogTitle className="sr-only">{t('testimonialsTitle')}</DialogTitle>
          {lightboxIndex !== null && (
            <div className="relative aspect-[3/4] w-full max-h-[85vh]">
              <Image
                src={testimonials[lightboxIndex].image_url}
                alt=""
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )}

          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightboxIndex(null)}
            className="absolute -top-10 right-0 md:top-2 md:-right-10 h-9 w-9 flex items-center justify-center rounded-full bg-ivory/90 text-ink hover:bg-ivory"
          >
            <X className="h-5 w-5" />
          </button>

          {testimonials.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={showPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-ivory/80 text-ink hover:bg-ivory"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={showNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-ivory/80 text-ink hover:bg-ivory"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

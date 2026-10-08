'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Testimonial } from '@/lib/testimonials-data';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

const MOBILE_CARD_WIDTH_PCT = 62; // center card's width, as % of the scroller
const MOBILE_SIDE_PADDING_PCT = (100 - MOBILE_CARD_WIDTH_PCT) / 2; // keeps the active card centered at rest
const MOBILE_MIN_SCALE = 0.78;
const MOBILE_MIN_OPACITY = 0.45;

/**
 * Mobile-only "coverflow": the centered card sits at full size, and its
 * neighbors shrink/fade continuously as they scroll away from center —
 * computed live from each card's actual position relative to the scroller's
 * center (not a fixed 3-slot layout), so it stays correct through drag,
 * momentum scroll, and arrow-key scrolling alike. Desktop keeps the plain
 * multi-up row below instead; a coverflow reads as fussy once several cards
 * are visible at once.
 */
function MobileCoverflow({
  testimonials,
  onSelect,
}: {
  testimonials: Testimonial[];
  onSelect: (index: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const [cardStyles, setCardStyles] = useState<{ scale: number; opacity: number }[]>(
    testimonials.map((_, i) => ({ scale: i === 0 ? 1 : MOBILE_MIN_SCALE, opacity: i === 0 ? 1 : MOBILE_MIN_OPACITY }))
  );
  const [hasSwiped, setHasSwiped] = useState(false);

  const updateCardStyles = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const centerX = scrollerRect.left + scrollerRect.width / 2;
    const halfWidth = scrollerRect.width / 2;

    setCardStyles(
      cardRefs.current.map((el) => {
        if (!el) return { scale: MOBILE_MIN_SCALE, opacity: MOBILE_MIN_OPACITY };
        const rect = el.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const distance = Math.min(Math.abs(cardCenterX - centerX) / halfWidth, 1);
        return {
          scale: 1 - distance * (1 - MOBILE_MIN_SCALE),
          opacity: 1 - distance * (1 - MOBILE_MIN_OPACITY),
        };
      })
    );
  }, []);

  const handleScroll = useCallback(() => {
    if (!hasSwiped) setHasSwiped(true);
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      updateCardStyles();
      rafRef.current = null;
    });
  }, [hasSwiped, updateCardStyles]);

  useEffect(() => {
    updateCardStyles();
    window.addEventListener('resize', updateCardStyles);
    return () => window.removeEventListener('resize', updateCardStyles);
  }, [updateCardStyles, testimonials.length]);

  return (
    <div className="md:hidden relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingLeft: `${MOBILE_SIDE_PADDING_PCT}%`, paddingRight: `${MOBILE_SIDE_PADDING_PCT}%` }}
      >
        {testimonials.map((item, index) => (
          <button
            key={item.id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            type="button"
            onClick={() => onSelect(index)}
            style={{
              width: `${MOBILE_CARD_WIDTH_PCT}%`,
              transform: `scale(${cardStyles[index]?.scale ?? MOBILE_MIN_SCALE})`,
              opacity: cardStyles[index]?.opacity ?? MOBILE_MIN_OPACITY,
            }}
            className="relative shrink-0 aspect-[3/4] snap-center overflow-hidden rounded-sm ring-1 ring-border"
          >
            <Image
              src={item.image_url}
              alt=""
              fill
              sizes="62vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Swipe hint — a nudging chevron over the center card's right edge,
          gone for good the first time the user actually scrolls/swipes. */}
      {!hasSwiped && testimonials.length > 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 rounded-full bg-ivory/90 shadow-md animate-nudge-x"
          style={{ right: `calc(${MOBILE_SIDE_PADDING_PCT}% + 4px)` }}
        >
          <ChevronRight className="h-5 w-5 text-ink" />
        </div>
      )}
    </div>
  );
}

/**
 * Customer feedback photos — swipeable on every breakpoint (native
 * overflow-x-auto + scroll-snap, same touch-friendly technique as the
 * product carousels, no extra carousel library needed) and opens a
 * near-fullscreen lightbox on click/tap. Replaces the static quote "brand
 * breaker" section that used to sit here, right before the footer.
 */
export default function Testimonials({ testimonials }: TestimonialsProps) {
  const t = useTranslations('home');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (testimonials.length === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
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

      <MobileCoverflow testimonials={testimonials} onSelect={setLightboxIndex} />

      <div className="group/carousel relative hidden md:block w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={scrollerRef}
          className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="relative shrink-0 w-[22%] aspect-[3/4] snap-start overflow-hidden rounded-sm ring-1 ring-border hover:ring-gold/50 transition-colors"
            >
              <Image
                src={item.image_url}
                alt=""
                fill
                sizes="22vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollByPage(-1)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-ivory"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollByPage(1)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-ivory"
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

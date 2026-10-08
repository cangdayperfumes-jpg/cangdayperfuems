'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { HeroSlide } from '@/types';

const OBJECT_POSITION: Record<HeroSlide['image_position'], string> = {
  center: '70% center',
  top: '70% top',
  bottom: '70% bottom',
  left: 'left center',
  right: 'right center',
};

// Used only if no slides are configured yet in /admin/marketing/hero-slides —
// keeps the homepage looking intentional before the admin sets one up.
const FALLBACK_SLIDE: HeroSlide = {
  id: 'fallback',
  eyebrow: 'Modern Perfumery',
  headline: 'Wear what',
  headline_accent: 'lingers.',
  subheading:
    'An edited collection of designer and niche fragrances — chosen for how they feel hours after you stop noticing them.',
  image_url:
    'https://images.unsplash.com/photo-1774682060997-f8959850a7d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
  image_position: 'center',
  button_text: 'Shop the Collection',
  button_link: '/shop',
  secondary_button_text: 'Our Story',
  secondary_button_link: '/about',
  display_order: 0,
  is_active: true,
  created_at: '',
  updated_at: '',
};

interface HeroProps {
  slides?: HeroSlide[];
}

function Slide({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-ivory text-ink">
      <div className="absolute inset-0 z-0">
        <Image
          src={slide.image_url}
          alt=""
          fill
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes="100vw"
          style={{ objectPosition: OBJECT_POSITION[slide.image_position] }}
          className="object-cover"
        />
        {/* Light ivory scrim, strongest where the text sits (left) and clear
            over the product photo (right) — same role the dark ink gradient
            used to play, inverted for a white ground instead of a black one. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/85 to-ivory/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-ivory/50 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 h-full container flex flex-col justify-center max-w-none py-4">
        <div className="max-w-xl">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-2 md:mb-3">
            {slide.eyebrow}
          </p>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.03] tracking-tight text-ink">
            {slide.headline}
            {slide.headline_accent && (
              <>
                <br />
                <span className="italic font-normal text-gold-deep">{slide.headline_accent}</span>
              </>
            )}
          </h1>

          {slide.subheading && (
            <p className="mt-3 md:mt-4 text-sm md:text-base text-ink/70 font-light max-w-md leading-snug line-clamp-2">
              {slide.subheading}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 md:mt-5">
            <Link href={slide.button_link}>
              <Button
                size="lg"
                className="notch-corners bg-ink text-ivory hover:bg-gold-deep hover:text-ivory rounded-none text-sm px-6 py-3 md:px-7 md:py-3.5 font-body font-semibold tracking-wider uppercase transition-colors"
              >
                {slide.button_text}
              </Button>
            </Link>
            {slide.secondary_button_text && slide.secondary_button_link && (
              <Link href={slide.secondary_button_link}>
                <Button
                  variant="outline"
                  size="lg"
                  className="notch-corners bg-transparent border border-ink/30 text-ink hover:bg-ink/5 hover:border-ink rounded-none text-sm px-6 py-3 md:px-7 md:py-3.5 font-body tracking-wider uppercase transition-colors"
                >
                  {slide.secondary_button_text}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero({ slides }: HeroProps) {
  const activeSlides = slides && slides.length > 0 ? slides : [FALLBACK_SLIDE];
  const isMulti = activeSlides.length > 1;

  // Embla driven directly (not through the shared <Carousel> UI primitive):
  // that shared component's nested wrapper divs have no explicit height,
  // which is fine for content-sized card carousels but silently collapses
  // a full-bleed, viewport-height hero to its text's natural content height.
  // Every div in this chain below carries an explicit h-full so the height
  // actually propagates from the section down to each slide.
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: isMulti },
    isMulti ? [Autoplay({ delay: 6000, stopOnMouseEnter: true, stopOnInteraction: false })] : []
  );
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative h-[46vh] md:h-[60vh] min-h-[400px] md:min-h-[480px] max-h-[520px] md:max-h-[660px] w-full overflow-hidden bg-ivory"
    >
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {activeSlides.map((slide, index) => (
            <div key={slide.id} className="relative h-full w-full min-w-0 flex-[0_0_100%]">
              <Slide slide={slide} priority={index === 0} />
            </div>
          ))}
        </div>
      </div>

      {isMulti && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {activeSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === selected ? 'w-6 bg-gold-deep' : 'w-1.5 bg-ink/20 hover:bg-ink/35'
              }`}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}

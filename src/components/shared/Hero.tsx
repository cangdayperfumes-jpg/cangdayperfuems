'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { motion, type Variants } from 'framer-motion';
import { HeroSlide } from '@/types';
import ResponsiveCroppedImage from '@/components/shared/ResponsiveCroppedImage';
import type { CropMeta } from '@/lib/image-crop';
import { HERO_DESKTOP_ASPECT, HERO_MOBILE_ASPECT, HERO_MAX_WIDTH_PX } from '@/lib/hero-aspect';

// Legacy focal-point presets, kept as the fallback for slides with no
// image_crop_desktop/mobile set yet. Expressed as full-frame CropMeta boxes
// (100% width/height, zoom 1) so they flow through the same rendering path
// as a real crop — only the center point differs.
const LEGACY_FOCAL_CENTER: Record<HeroSlide['image_position'], { x: number; y: number }> = {
  center: { x: 70, y: 50 },
  top: { x: 70, y: 0 },
  bottom: { x: 70, y: 100 },
  left: { x: 0, y: 50 },
  right: { x: 100, y: 50 },
};

function legacyFocalCrop(position: HeroSlide['image_position']): CropMeta {
  const { x, y } = LEGACY_FOCAL_CENTER[position];
  return { x: x - 50, y: y - 50, width: 100, height: 100, zoom: 1 };
}

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
  eyebrow_tr: 'Modern Parfümeri',
  headline_tr: 'İz bırakan',
  headline_accent_tr: 'kokuyu taşıyın.',
  subheading_tr:
    'Fark etmeyi bıraktıktan saatler sonra bile hissettirdikleri için seçilmiş tasarımcı ve niş parfümlerden oluşan özel bir koleksiyon.',
  button_text_tr: 'Koleksiyonu Keşfet',
  secondary_button_text_tr: 'Hikayemiz',
  display_order: 0,
  is_active: true,
  created_at: '',
  updated_at: '',
};

/**
 * Swaps in a slide's Turkish copy on the /tr storefront. Each field falls
 * back to its English column independently, so a partially translated
 * slide still renders complete instead of showing blanks.
 */
function localizeSlide(slide: HeroSlide, locale: string): HeroSlide {
  if (locale !== 'tr') return slide;
  const pick = (tr: string | null | undefined, en: string | null | undefined) => (tr?.trim() ? tr : en);
  return {
    ...slide,
    eyebrow: pick(slide.eyebrow_tr, slide.eyebrow) ?? '',
    headline: pick(slide.headline_tr, slide.headline) ?? '',
    headline_accent: pick(slide.headline_accent_tr, slide.headline_accent),
    subheading: pick(slide.subheading_tr, slide.subheading),
    button_text: pick(slide.button_text_tr, slide.button_text) ?? '',
    secondary_button_text: pick(slide.secondary_button_text_tr, slide.secondary_button_text),
  };
}

interface HeroProps {
  slides?: HeroSlide[];
}

const AUTOPLAY_DELAY_MS = 6000;
// Crossfade length. The incoming slide fades in on top of the outgoing one,
// which stays fully opaque underneath until the fade completes — so the
// photo never dips through to the bare ivory background mid-transition.
const FADE_DURATION_S = 1.2;
const SWIPE_THRESHOLD_PX = 50;

const textContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } },
};

// Outgoing text fades out quickly (rather than waiting) so the two slides'
// copy never visibly overlaps while the photos crossfade.
const textItem: Variants = {
  hidden: { opacity: 0, y: 18, transition: { duration: 0.3, ease: 'easeOut' } },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

function Slide({ slide, priority, active }: { slide: HeroSlide; priority: boolean; active: boolean }) {
  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden bg-ivory text-ink ${active ? 'z-10' : 'z-0 pointer-events-none'}`}
      aria-hidden={!active}
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={
        active
          ? { duration: FADE_DURATION_S, ease: 'easeInOut' }
          // Hold the outgoing slide opaque underneath until the incoming
          // one has fully faded in over it, then drop it instantly.
          : { duration: 0, delay: FADE_DURATION_S }
      }
    >
      <div className="absolute inset-0 z-0">
        {/* Slow "Ken Burns" push-in on the active slide only. Resets with no
            transition once the slide is hidden, so the jump back to scale 1
            is never visible. */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: active ? 1.06 : 1 }}
          transition={
            active
              ? { duration: AUTOPLAY_DELAY_MS / 1000 + 1, ease: 'easeOut' }
              : { duration: 0, delay: FADE_DURATION_S }
          }
        >
        <ResponsiveCroppedImage
          src={slide.image_url}
          alt=""
          fill
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={`(min-width: ${HERO_MAX_WIDTH_PX}px) ${HERO_MAX_WIDTH_PX}px, 100vw`}
          cropDesktop={slide.image_crop_desktop ?? legacyFocalCrop(slide.image_position)}
          cropMobile={slide.image_crop_mobile ?? legacyFocalCrop(slide.image_position)}
          className="object-cover"
        />
        </motion.div>
        {/* Light ivory scrim, strongest where the text sits (left) and clear
            over the product photo (right) — same role the dark ink gradient
            used to play, inverted for a white ground instead of a black one. */}
        {/* Mobile: the copy spans almost the full square frame, so it keeps a
            broad scrim. Desktop: the copy only occupies the left ~40% of the
            frame, so the scrim stays dense behind it and then clears fully by
            ~60% — the photo's subject on the right shows at full color
            instead of under a milky wash. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/80 to-ivory/10 md:bg-[linear-gradient(to_right,rgb(var(--brand-ivory)/0.94)_0%,rgb(var(--brand-ivory)/0.82)_26%,rgb(var(--brand-ivory)/0.45)_44%,rgb(var(--brand-ivory)/0)_62%)]" />
        {/* Short, light fade at the very bottom only — just enough to seat the
            progress dots and blend into the trust bar below. */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-ivory/40 to-transparent" />
      </div>

      {/* Same max-w-[1400px] + gutters as every section below, so the hero
          copy lines up with the page's content column instead of hugging the
          viewport's left edge on wide screens. */}
      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center py-4">
        <motion.div
          className="max-w-xl"
          variants={textContainer}
          initial="hidden"
          animate={active ? 'show' : 'hidden'}
        >
          <motion.p variants={textItem} className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-2 md:mb-3">
            {slide.eyebrow}
          </motion.p>

          <motion.h1 variants={textItem} className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.03] tracking-tight text-ink">
            {slide.headline}
            {slide.headline_accent && (
              <>
                <br />
                <span className="italic font-normal text-gold-deep">{slide.headline_accent}</span>
              </>
            )}
          </motion.h1>

          {slide.subheading && (
            <motion.p variants={textItem} className="mt-3 md:mt-4 text-sm md:text-base text-ink/70 font-light max-w-md leading-snug line-clamp-2">
              {slide.subheading}
            </motion.p>
          )}

          <motion.div variants={textItem} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 md:mt-5">
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
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Hero({ slides }: HeroProps) {
  const locale = useLocale();
  const activeSlides = (slides && slides.length > 0 ? slides : [FALLBACK_SLIDE]).map((slide) =>
    localizeSlide(slide, locale)
  );
  const isMulti = activeSlides.length > 1;

  const [selected, setSelected] = useState(0);
  // Autoplay pauses while hovered and restarts its full delay on mouse
  // leave — the progress bar mirrors that: shown full while hovered, then
  // restarted from zero (via `progressRun` in its key) once the pointer leaves.
  const [hovered, setHovered] = useState(false);
  const [progressRun, setProgressRun] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const goTo = (index: number) => {
    const count = activeSlides.length;
    setSelected(((index % count) + count) % count);
  };

  // One timeout per slide (re-armed whenever the slide, hover state or
  // progress run changes) instead of a fixed interval, so a manual dot
  // click or swipe always gets the full 6s before the next auto-advance.
  useEffect(() => {
    if (!isMulti || hovered) return;
    const timeout = setTimeout(() => {
      setSelected((i) => (i + 1) % activeSlides.length);
    }, AUTOPLAY_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [isMulti, hovered, selected, progressRun, activeSlides.length]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setProgressRun((n) => n + 1);
      }}
      // Swipe left/right on touch devices — replaces the drag gesture the
      // old sliding carousel provided.
      onTouchStart={(e) => {
        touchStartXRef.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (!isMulti || touchStartXRef.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartXRef.current;
        touchStartXRef.current = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        goTo(selected + (dx < 0 ? 1 : -1));
      }}
      className="relative w-full overflow-hidden bg-ivory"
    >
      {/* Fixed-aspect frame matching the admin crop editor exactly (square on
          mobile, 2.6:1 from md up), driven by CSS vars from lib/hero-aspect so
          the two can never drift apart. Stops widening at HERO_MAX_WIDTH_PX
          and centers, rather than stretching wider and re-cropping. */}
      <div
        className="relative mx-auto w-full [aspect-ratio:var(--hero-mobile-aspect)] md:[aspect-ratio:var(--hero-desktop-aspect)]"
        style={{
          '--hero-mobile-aspect': HERO_MOBILE_ASPECT,
          '--hero-desktop-aspect': HERO_DESKTOP_ASPECT,
          maxWidth: HERO_MAX_WIDTH_PX,
        } as React.CSSProperties}
      >
        {/* All slides stacked in place; only opacity changes between them. */}
        {activeSlides.map((slide, index) => (
          <Slide key={slide.id} slide={slide} priority={index === 0} active={index === selected} />
        ))}
      </div>

      {isMulti && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {activeSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                index === selected ? 'w-10 bg-ink/15' : 'w-1.5 bg-ink/20 hover:bg-ink/35'
              }`}
            >
              {index === selected && (
                <span
                  key={`${selected}-${progressRun}`}
                  // animate-slide-progress runs for the same 6s as AUTOPLAY_DELAY_MS;
                  // while hovered (autoplay stopped) it just shows as a full bar.
                  className={`absolute inset-0 origin-left rounded-full bg-gold-deep ${hovered ? '' : 'animate-slide-progress'}`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </motion.section>
  );
}

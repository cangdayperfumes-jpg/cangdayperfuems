'use client';

import { ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStickyBarStore } from '@/store/useStickyBarStore';
import { useScrolledPast } from '@/hooks/use-scrolled-past';
import { cn } from '@/lib/utils';

/**
 * Back-to-top button, bottom-right. Fades and rises in once the page is
 * scrolled past SCROLL_TOP_THRESHOLD — the WhatsApp button (same corner)
 * slides up above it at the same moment, using the same easing.
 */
export default function ScrollToTop() {
  const t = useTranslations('common');
  const isVisible = useScrolledPast();
  const stickyBarVisible = useStickyBarStore((s) => s.visible);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const motion = cn(
    'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
    isVisible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'
  );

  return (
    <>
      {/* Desktop: bottom-right corner */}
      <button
        onClick={scrollToTop}
        aria-label={t('scrollToTop')}
        aria-hidden={!isVisible}
        tabIndex={isVisible ? 0 : -1}
        className={cn(
          'hidden md:flex fixed bottom-8 right-8 z-50 w-11 h-11 items-center justify-center bg-black text-white shadow-lg hover:bg-gray-800 hover:scale-105 active:scale-95',
          motion
        )}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* Mobile: above bottom nav (h-16 = 64px, so we place at bottom-20 = 80px) —
          pushed higher still when the product page's sticky Add to Cart bar
          is showing, so the two don't overlap in that same corner. */}
      <button
        onClick={scrollToTop}
        aria-label={t('scrollToTop')}
        aria-hidden={!isVisible}
        tabIndex={isVisible ? 0 : -1}
        className={cn(
          'md:hidden fixed right-4 z-50 w-10 h-10 flex items-center justify-center bg-black text-white shadow-lg active:scale-95',
          stickyBarVisible ? 'bottom-36' : 'bottom-20',
          motion
        )}
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </>
  );
}

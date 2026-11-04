'use client';

import { useEffect, useState } from 'react';

/** Scroll depth at which the scroll-to-top button appears (and the WhatsApp button moves up above it). */
export const SCROLL_TOP_THRESHOLD = 400;

/** True once the page is scrolled further than `px`. */
export function useScrolledPast(px = SCROLL_TOP_THRESHOLD) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > px);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [px]);
  return past;
}

'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Desktop: bottom-right corner */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="hidden md:flex fixed bottom-8 right-8 z-50 w-11 h-11 items-center justify-center bg-black text-white shadow-lg hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* Mobile: above bottom nav (h-16 = 64px, so we place at bottom-20 = 80px) */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="md:hidden fixed bottom-20 right-4 z-50 w-10 h-10 flex items-center justify-center bg-black text-white shadow-lg active:scale-95 transition-transform"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </>
  );
}

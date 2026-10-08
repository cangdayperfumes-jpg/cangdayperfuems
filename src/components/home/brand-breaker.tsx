'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function BrandBreaker() {
  const t = useTranslations('home');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[24vh] min-h-[200px] max-h-[300px] flex items-center justify-center overflow-hidden bg-ivory"
    >
      {/* Soft gold glow on a light ground — same radial motif as before,
          just warmed for a white surface instead of carved out of black. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 40%, rgba(184,154,99,0.16) 0%, rgba(243,238,229,0) 70%)',
        }}
      />

      <div
        className={`relative z-10 max-w-3xl mx-auto px-6 text-center transition-all duration-1000 ease-out ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <p className="text-xl md:text-3xl lg:text-4xl font-heading italic text-ink leading-snug">
          {t('breakerQuote')}
        </p>
        <span className="block mt-3 text-sm uppercase tracking-[0.3em] text-gold-deep/80">
          Cangday
        </span>
      </div>
    </section>
  );
}

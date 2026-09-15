'use client';

import { useEffect, useRef, useState } from 'react';

export default function BrandBreaker() {
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
      className="ink-grain relative h-[40vh] flex items-center justify-center overflow-hidden bg-ink"
    >
      {/* Radial gold glow instead of a flat gradient — ties back to the hero's
          amber-lit-bottle motif without repeating a photograph. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 40%, rgba(201,162,75,0.14) 0%, rgba(18,13,10,0) 70%)',
        }}
      />

      <div
        className={`relative z-10 max-w-3xl mx-auto px-6 text-center transition-all duration-1000 ease-out ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <p className="text-2xl md:text-4xl lg:text-5xl font-heading italic text-ivory leading-snug">
          &ldquo;A scent is the only thing you leave behind in a room.&rdquo;
        </p>
        <span className="block mt-6 text-sm uppercase tracking-[0.3em] text-gold/70">
          Cangday
        </span>
      </div>
    </section>
  );
}

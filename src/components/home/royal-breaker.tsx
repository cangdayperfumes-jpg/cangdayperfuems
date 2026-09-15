'use client';

import { useEffect, useRef, useState } from 'react';

export default function RoyalBreaker() {
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
      className="relative h-[40vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background with parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0a0a0a"/><stop offset="50%" style="stop-color:#1a1a1a"/><stop offset="100%" style="stop-color:#0d0d0d"/></linearGradient></defs><rect fill="url(#g)" width="800" height="600"/><circle cx="200" cy="300" r="250" fill="#111" opacity="0.5"/><circle cx="600" cy="200" r="300" fill="#000" opacity="0.4"/><circle cx="400" cy="500" r="200" fill="#151515" opacity="0.3"/></svg>`
          )}')`
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Quote */}
      <div
        className={`relative z-10 max-w-3xl mx-auto px-6 text-center transition-all duration-1000 ease-out ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <p className="text-2xl md:text-4xl lg:text-5xl font-heading italic text-white leading-snug">
          &ldquo;Perfume is the art that makes memory speak.&rdquo;
        </p>
        <span className="block mt-6 text-sm uppercase tracking-[0.3em] text-white/50">
          Royal Perfumes
        </span>
      </div>
    </section>
  );
}

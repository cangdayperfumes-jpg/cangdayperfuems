import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ShinyText from '@/components/ui/shiny-text';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Royal Perfumes, our manufacturing expertise, global logistics network, and commitment to quality.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const strengths = [
    { label: "10+ Years", sub: "Manufacturing Experience" },
    { label: "1,300+", sub: "Fragrance Models" },
    { label: "35+", sub: "Countries Worldwide" },
    { label: "Istanbul", sub: "Headquarters, Türkiye" },
  ];

  const capabilities = [
    "High Scent Similarity & Precise Scent Matching",
    "Premium-Quality Fragrance Essences",
    "High Fragrance Oil Concentration",
    "Strong Projection & Long-Lasting Performance",
    "1,300+ Fragrance Models",
    "Strict Quality Control & Consistent Production",
    "Premium Packaging Standards",
    "Fast & Structured Order Processing",
    "Wholesale & High-Volume Order Solutions",
    "Secure International Shipping to 35+ Countries",
    "Visual Product & Order Documentation",
    "Reliable Support Throughout the Order Process",
  ];

  const statements = [
    { n: '01', prefix: 'We operate with', word: 'precision.' },
    { n: '02', prefix: 'We deliver with', word: 'consistency.' },
    { n: '03', prefix: 'We build partnerships based on', word: 'trust.' },
  ];

  return (
    <div className="bg-white">

      {/* ── 1. Hero ── */}
      <section className="relative pt-20 pb-14 md:pt-28 md:pb-20 flex flex-col items-center text-center px-4 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <p className="text-xs tracking-[0.35em] text-gray-400 uppercase mb-5 font-medium">
          Corporate Profile
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-light tracking-tight text-gray-900 uppercase leading-none">
          Royal{' '}
          <span className="italic">Perfumes</span>
        </h1>
        <div className="mt-6 w-8 h-px bg-gray-300 mx-auto" />
        <p className="mt-6 max-w-xl text-base md:text-lg text-gray-500 font-light leading-relaxed">
          Operational precision. Manufacturing excellence. Uncompromising quality — delivered to wholesale partners worldwide.
        </p>
      </section>

      {/* ── 2. Stats Row ── */}
      <section className="border-y border-gray-100 py-8 md:py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-gray-100">
          {strengths.map(({ label, sub }) => (
            <div key={sub} className="text-center px-4 py-2 md:py-0">
              <p className="text-2xl md:text-3xl font-heading font-light text-gray-900 tracking-tight">
                {label}
              </p>
              <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                {sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Our Story ── */}
      <section className="max-w-3xl mx-auto px-4 py-14 md:py-20 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-400 uppercase font-medium mb-3">
          Our Story
        </p>
        <h2 className="sr-only">Our Story</h2>
        <p className="text-xl md:text-2xl lg:text-3xl font-heading font-light text-gray-800 leading-snug">
          Royal Perfumes specializes in manufacturing high-quality fragrances inspired by some of the world&apos;s most recognized scent profiles.
        </p>
        <div className="mt-8 space-y-5 text-sm md:text-base text-gray-500 font-light leading-relaxed max-w-xl mx-auto">
          <p>
            Based in Istanbul, Türkiye, our portfolio has grown to more than 1,300 fragrance models, developed with a strong focus on high scent similarity, premium-quality fragrance essences, high oil concentrations, strong projection, and long-lasting performance.
          </p>
          <p>
            With over 10 years of manufacturing experience, every product is handled through a structured process — from fragrance development and production to strict quality control, presentation, professional packaging, and final preparation for international shipping.
          </p>
          <p>
            Today, we supply wholesale fragrance businesses across 35+ countries worldwide, providing the variety, consistency, and reliable service our partners need to grow with confidence.
          </p>
        </div>
        <p className="mt-8 text-base md:text-lg font-heading font-medium text-gray-900">
          More Than a Supplier. Your Trusted Fragrance Manufacturing Partner.
        </p>
      </section>

      {/* ── 4. Statement Section ── */}
      <section className="w-full bg-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-10 md:pt-14">
            <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase font-medium">
              Our Commitment
            </p>
          </div>
          <div className="divide-y divide-zinc-700">
            {statements.map(({ n, prefix, word }, i) => (
              <div key={n} className="grid grid-cols-[3rem_1fr] md:grid-cols-[5rem_1fr] gap-6 items-center py-8 md:py-10">
                <span className="text-xs text-zinc-500 tracking-widest font-medium">{n}</span>
                <p className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-zinc-200 leading-snug">
                  {prefix}{' '}
                  <ShinyText
                    text={word}
                    speed={3 + i * 0.5}
                    color="#e4e4e7"
                    shineColor="#ffffff"
                    className="font-normal"
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Core Strengths ── */}
      <section className="max-w-5xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10 md:mb-14 text-center">
          <p className="text-xs tracking-[0.3em] text-gray-400 uppercase font-medium mb-3">
            Our Capabilities
          </p>
          <h2 className="text-2xl md:text-4xl font-heading font-light text-gray-900 tracking-tight">
            Core Strengths
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-0">
          {capabilities.map((item, i) => (
            <div key={i} className="flex gap-4 items-start border-t border-gray-100 py-5">
              <span className="text-gray-200 text-base leading-none mt-0.5 flex-shrink-0">—</span>
              <p className="text-sm md:text-base text-gray-600 font-light leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Partner With Us ── */}
      <section className="border-t border-gray-100 py-14 md:py-20 px-4 text-center">
        <h2 className="sr-only">Partner With Us</h2>
        <div className="max-w-xl mx-auto space-y-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Partner with us</p>
          <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-900">
            Built for wholesalers. Designed for growth.
          </h3>
          <p className="text-sm md:text-base text-gray-500 font-light leading-relaxed max-w-lg mx-auto">
            Royal Perfumes combines manufacturing experience, extensive product variety, consistent quality, and international supply capabilities to support fragrance businesses in markets around the world.
          </p>
          <p className="text-base md:text-lg font-heading font-medium text-gray-900">
            More Than a Supplier. A Partner in Your Growth.
          </p>
          <Link
            href="/shipping"
            className="inline-flex items-center gap-2 px-7 py-3 bg-black text-white text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors"
          >
            View Wholesale Policy <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── 7. Closing Brand Block ── */}
      <section className="bg-gray-50 border-t border-gray-100 py-14 md:py-20 px-4 text-center">
        <h2 className="sr-only">Royal Perfumes</h2>
        <div className="max-w-xl mx-auto space-y-3">
          <p className="text-xs tracking-[0.3em] text-gray-400 uppercase font-medium">
            Royal Perfumes
          </p>
          <div className="space-y-2 text-2xl md:text-3xl font-heading font-light text-gray-800">
            <p>Crafted in Istanbul • Trusted Worldwide</p>
            <p>10+ Years • 1,300+ Models • 35+ Countries</p>
          </div>
        </div>
      </section>

    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ShinyText from '@/components/ui/shiny-text';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Cangday — a modern fragrance house offering an edited collection of designer and niche perfumes for everyday wear.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const values = [
    { label: 'Curated', sub: 'Not Everything, On Purpose' },
    { label: '100%', sub: 'Original, Guaranteed' },
    { label: 'Worldwide', sub: 'Shipping' },
    { label: '14-Day', sub: 'Easy Returns' },
  ];

  const capabilities = [
    'A tightly edited catalog, not an endless scroll',
    'Designer and niche fragrances side by side',
    'Every bottle checked before it ships',
    'Secure packaging built for fragile glass',
    'Clear, upfront pricing — no surprises at checkout',
    'Fast order processing and shipping updates',
    'Responsive support if anything needs fixing',
    'Easy 14-day returns, no hoops to jump through',
  ];

  const statements = [
    { n: '01', prefix: 'We choose with', word: 'restraint.' },
    { n: '02', prefix: 'We ship with', word: 'care.' },
    { n: '03', prefix: 'We stand behind', word: 'every bottle.' },
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
          Our Story
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-light tracking-tight text-gray-900 leading-none">
          Cang<span className="italic">day</span>
        </h1>
        <div className="mt-6 w-8 h-px bg-gray-300 mx-auto" />
        <p className="mt-6 max-w-xl text-base md:text-lg text-gray-500 font-light leading-relaxed">
          A modern fragrance house — an edited collection of designer and niche perfumes for
          everyday wear.
        </p>
      </section>

      {/* ── 2. Values Row ── */}
      <section className="border-y border-gray-100 py-8 md:py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-gray-100">
          {values.map(({ label, sub }) => (
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
          Why Cangday
        </p>
        <h2 className="sr-only">Our Story</h2>
        <p className="text-xl md:text-2xl lg:text-3xl font-heading font-light text-gray-800 leading-snug">
          Fragrance shouldn&apos;t require a lecture on notes and sillage to enjoy.
        </p>
        <div className="mt-8 space-y-5 text-sm md:text-base text-gray-500 font-light leading-relaxed max-w-xl mx-auto">
          <p>
            Cangday is a tightly edited collection of designer and niche perfumes — chosen for
            how they actually wear, not just how they&apos;re marketed. No endless scroll of
            near-identical bottles, no pressure to know your fragrance family before you buy.
          </p>
          <p>
            Every order is checked before it ships, packed to survive the trip, and backed by an
            easy return if it&apos;s not the one. We&apos;d rather sell you the right bottle once
            than sell you five you&apos;ll never wear.
          </p>
        </div>
        <p className="mt-8 text-base md:text-lg font-heading font-medium text-gray-900">
          Wear What Lingers.
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
            What You Get
          </p>
          <h2 className="text-2xl md:text-4xl font-heading font-light text-gray-900 tracking-tight">
            Shopping With Cangday
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

      {/* ── 6. CTA ── */}
      <section className="border-t border-gray-100 py-14 md:py-20 px-4 text-center">
        <h2 className="sr-only">Shop Cangday</h2>
        <div className="max-w-xl mx-auto space-y-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Ready to explore</p>
          <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-900">
            Find your next signature scent.
          </h3>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-7 py-3 bg-black text-white text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors"
          >
            Shop the Collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── 7. Closing Brand Block ── */}
      <section className="bg-gray-50 border-t border-gray-100 py-14 md:py-20 px-4 text-center">
        <h2 className="sr-only">Cangday</h2>
        <div className="max-w-xl mx-auto space-y-2">
          <p className="text-xs tracking-[0.3em] text-gray-400 uppercase font-medium">
            Cangday
          </p>
          <p className="text-2xl md:text-3xl font-heading font-light text-gray-800">
            Wear What Lingers.
          </p>
        </div>
      </section>

    </div>
  );
}

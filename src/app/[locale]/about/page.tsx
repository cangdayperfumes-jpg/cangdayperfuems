import { localeAlternates } from '@/lib/seo';
import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import ShinyText from '@/components/ui/shiny-text';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(await getLocale(), '/about'),
  };
}

export default async function AboutPage() {
  const t = await getTranslations('about');

  const values = [
    { label: t('value1Label'), sub: t('value1Sub') },
    { label: t('value2Label'), sub: t('value2Sub') },
    { label: t('value3Label'), sub: t('value3Sub') },
    { label: t('value4Label'), sub: t('value4Sub') },
  ];

  const capabilities = [
    t('capability1'),
    t('capability2'),
    t('capability3'),
    t('capability4'),
    t('capability5'),
    t('capability6'),
    t('capability7'),
    t('capability8'),
  ];

  const statements = [
    { n: '01', prefix: t('statement1Prefix'), word: t('statement1Word') },
    { n: '02', prefix: t('statement2Prefix'), word: t('statement2Word') },
    { n: '03', prefix: t('statement3Prefix'), word: t('statement3Word') },
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
          {t('ourStory')}
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-light tracking-tight text-gray-900 leading-none">
          Cang<span className="italic">day</span>
        </h1>
        <div className="mt-6 w-8 h-px bg-gray-300 mx-auto" />
        <p className="mt-6 max-w-xl text-base md:text-lg text-gray-500 font-light leading-relaxed">
          {t('tagline')}
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
          {t('whyCangday')}
        </p>
        <h2 className="sr-only">{t('ourStory')}</h2>
        <p className="text-xl md:text-2xl lg:text-3xl font-heading font-light text-gray-800 leading-snug">
          {t('storyHeadline')}
        </p>
        <div className="mt-8 space-y-5 text-sm md:text-base text-gray-500 font-light leading-relaxed max-w-xl mx-auto">
          <p>
            {t('storyP1')}
          </p>
          <p>
            {t('storyP2')}
          </p>
        </div>
        <p className="mt-8 text-base md:text-lg font-heading font-medium text-gray-900">
          {t('slogan')}
        </p>
      </section>

      {/* ── 4. Statement Section ── */}
      <section className="w-full bg-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-10 md:pt-14">
            <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase font-medium">
              {t('ourCommitment')}
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
            {t('whatYouGet')}
          </p>
          <h2 className="text-2xl md:text-4xl font-heading font-light text-gray-900 tracking-tight">
            {t('shoppingWithCangday')}
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
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{t('readyToExplore')}</p>
          <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-900">
            {t('findYourScent')}
          </h3>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-7 py-3 bg-black text-white text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors"
          >
            {t('shopTheCollection')} <ArrowRight className="h-4 w-4" />
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
            {t('slogan')}
          </p>
        </div>
      </section>

    </div>
  );
}

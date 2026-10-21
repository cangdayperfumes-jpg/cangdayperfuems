import { localeAlternates } from '@/lib/seo';
import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import ShinyText from '@/components/ui/shiny-text';
import Reveal from '@/components/shared/Reveal';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(await getLocale(), '/about'),
  };
}

/** Small gold eyebrow label used above every section heading on the site. */
function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p className={`text-[10px] md:text-xs uppercase tracking-[0.35em] font-semibold ${onDark ? 'text-gold' : 'text-gold-deep'}`}>
      {children}
    </p>
  );
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
    <div className="bg-ivory text-ink">

      {/* ── 1. Hero — ink surface with the site's grain, like the home hero ── */}
      <section className="ink-grain bg-ink text-ivory overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(var(--brand-gold)/0.18),transparent_60%)]"
        />
        <Reveal className="relative z-[2] mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-16 text-center md:pt-32 md:pb-24">
          <Eyebrow onDark>{t('ourStory')}</Eyebrow>
          <h1 className="mt-5 font-heading text-6xl font-light leading-none tracking-tight sm:text-7xl md:text-8xl">
            Cang<span className="italic text-gold-soft">day</span>
          </h1>
          <span aria-hidden className="mt-7 block h-px w-12 bg-gold/70" />
          <p className="mt-7 max-w-xl text-base font-light leading-relaxed text-ivory/70 md:text-lg">
            {t('tagline')}
          </p>
        </Reveal>
      </section>

      {/* ── 2. Values row ── */}
      <section className="border-b border-ink/10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 px-4 md:grid-cols-4">
          {values.map(({ label, sub }, i) => (
            <Reveal
              key={sub}
              delay={i * 0.08}
              className={`px-3 py-7 text-center md:py-10 ${i % 2 === 1 ? 'border-l border-ink/10' : ''} ${i >= 2 ? 'border-t border-ink/10 md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}
            >
              <p className="font-heading text-2xl font-light tracking-tight md:text-3xl">{label}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-deep">{sub}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 3. Our story ── */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
        <Reveal>
          <Eyebrow>{t('whyCangday')}</Eyebrow>
          <h2 className="sr-only">{t('ourStory')}</h2>
          <p className="mt-4 font-heading text-2xl font-light leading-snug md:text-3xl lg:text-4xl">
            {t('storyHeadline')}
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto mt-8 max-w-xl space-y-5 text-sm font-light leading-relaxed text-ink/70 md:text-base">
          <p>{t('storyP1')}</p>
          <p>{t('storyP2')}</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-10 flex items-center justify-center gap-4">
          <span aria-hidden className="h-px w-10 bg-gold/60" />
          <p className="font-heading text-lg italic text-gold-deep md:text-xl">{t('slogan')}</p>
          <span aria-hidden className="h-px w-10 bg-gold/60" />
        </Reveal>
      </section>

      {/* ── 4. Commitment ── */}
      <section className="ink-grain bg-ink text-ivory">
        <div className="relative z-[2] mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal className="pt-12 md:pt-16">
            <Eyebrow onDark>{t('ourCommitment')}</Eyebrow>
          </Reveal>
          <div className="divide-y divide-ivory/10 pb-4 md:pb-8">
            {statements.map(({ n, prefix, word }, i) => (
              <Reveal key={n} delay={i * 0.1} className="grid grid-cols-[2.5rem_1fr] items-center gap-5 py-8 md:grid-cols-[5rem_1fr] md:gap-6 md:py-10">
                <span className="font-heading text-sm italic text-gold">{n}</span>
                <p className="font-heading text-2xl font-light leading-snug text-ivory/85 md:text-3xl lg:text-4xl">
                  {prefix}{' '}
                  <ShinyText
                    text={word}
                    speed={3 + i * 0.5}
                    color="#D5C4A4"
                    shineColor="#F3EEE5"
                    className="font-normal italic"
                  />
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. What you get ── */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <Reveal className="mb-10 text-center md:mb-14">
          <Eyebrow>{t('whatYouGet')}</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl font-light tracking-tight md:text-4xl">
            {t('shoppingWithCangday')}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          {capabilities.map((item, i) => (
            <Reveal key={i} delay={(i % 2) * 0.06} className="flex items-start gap-4 border-t border-ink/10 py-5">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
              <p className="text-sm font-light leading-snug text-ink/80 md:text-base">{item}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 6. CTA + sign-off ── */}
      <section className="px-4 pb-16 md:pb-24">
        <Reveal className="ink-grain mx-auto max-w-5xl overflow-hidden rounded-sm bg-ink-elevated px-6 py-14 text-center text-ivory md:py-20">
          <div className="relative z-[2] mx-auto max-w-xl">
            <h2 className="sr-only">Shop Cangday</h2>
            <Eyebrow onDark>{t('readyToExplore')}</Eyebrow>
            <h3 className="mt-4 font-heading text-3xl font-light md:text-4xl">{t('findYourScent')}</h3>
            <Link
              href="/shop"
              className="notch-corners mt-8 inline-flex items-center gap-2 bg-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink transition-colors hover:bg-gold-soft"
            >
              {t('shopTheCollection')} <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-10 font-heading text-base italic text-ivory/50">{t('slogan')}</p>
          </div>
        </Reveal>
      </section>

    </div>
  );
}

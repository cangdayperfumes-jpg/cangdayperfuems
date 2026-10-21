import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(await getLocale(), '/privacy-policy'),
    robots: { index: true, follow: true },
  };
}

const lastUpdated = 'October 21, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-heading font-medium text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm md:text-base text-gray-600 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations('privacy');
  const bold = { b: (chunks: React.ReactNode) => <strong>{chunks}</strong> };

  return (
    <div className="container py-12 md:py-20 max-w-3xl mx-auto space-y-10">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-medium text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-400">{t('lastUpdated', { date: lastUpdated })}</p>
      </div>

      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
        {t('intro')}
      </p>

      <Section title={t('s1Title')}>
        <p>{t.rich('s1Body1', bold)}</p>
        <p>{t.rich('s1Body2', bold)}</p>
      </Section>

      <Section title={t('s2Title')}>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t('s2Item1')}</li>
          <li>{t('s2Item2')}</li>
          <li>{t('s2Item3')}</li>
          <li>{t('s2Item4')}</li>
        </ul>
        <p>{t('s2Body')}</p>
      </Section>

      <Section title={t('s3Title')}>
        <p>{t('s3Body')}</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t.rich('s3Item1', bold)}</li>
          <li>{t.rich('s3Item2', bold)}</li>
        </ul>
      </Section>

      <Section title={t('s4Title')}>
        <p>{t('s4Body')}</p>
      </Section>

      <Section title={t('s5Title')}>
        <p>{t('s5Body')}</p>
      </Section>

      <Section title={t('s6Title')}>
        <p>{t('s6Body')}</p>
      </Section>

      <Section title={t('s7Title')}>
        <p>{t('s7Body')}</p>
      </Section>

      <Section title={t('s8Title')}>
        <p>{t('s8Body')}</p>
      </Section>

      <Section title={t('s9Title')}>
        <p>
          {t.rich('s9Body', {
            link: () => (
              <Link href="/contact" className="text-gray-900 underline underline-offset-2 hover:no-underline">
                {t('s9LinkText')}
              </Link>
            ),
          })}
        </p>
      </Section>
    </div>
  );
}

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: '/terms-of-service' },
    robots: { index: true, follow: true },
  };
}

const lastUpdated = 'August 22, 2026';

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

export default async function TermsOfServicePage() {
  const t = await getTranslations('terms');
  const linkClass = 'text-gray-900 underline underline-offset-2 hover:no-underline';

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
        <p>{t('s1Body')}</p>
      </Section>

      <Section title={t('s2Title')}>
        <p>{t('s2Body')}</p>
      </Section>

      <Section title={t('s3Title')}>
        <p>
          {t.rich('s3Body', {
            link: () => (
              <Link href="/shipping" className={linkClass}>
                {t('s3LinkText')}
              </Link>
            ),
          })}
        </p>
      </Section>

      <Section title={t('s4Title')}>
        <p>
          {t.rich('s4Body', {
            link: () => (
              <Link href="/contact" className={linkClass}>
                {t('s4LinkText')}
              </Link>
            ),
          })}
        </p>
      </Section>

      <Section title={t('s5Title')}>
        <p>
          {t.rich('s5Body', {
            link: () => (
              <Link href="/contact" className={linkClass}>
                {t('s5LinkText')}
              </Link>
            ),
          })}
        </p>
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
        <p>{t('s9Body')}</p>
      </Section>

      <Section title={t('s10Title')}>
        <p>
          {t.rich('s10Body', {
            contactLink: () => (
              <Link href="/contact" className={linkClass}>
                {t('s10ContactLinkText')}
              </Link>
            ),
            privacyLink: () => (
              <Link href="/privacy-policy" className={linkClass}>
                {t('s10PrivacyLinkText')}
              </Link>
            ),
          })}
        </p>
      </Section>
    </div>
  );
}

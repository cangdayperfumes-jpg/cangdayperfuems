import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: '/contact' },
  };
}

export default async function ContactPage() {
  const t = await getTranslations('contact');
  return (
    <div className="container py-12 md:py-24 space-y-8 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-heading font-bold">{t('title')}</h1>
      <p className="text-lg text-muted-foreground">
        {t('intro')}
      </p>
      <div className="p-6 bg-secondary/50 rounded-lg space-y-4 text-left">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">{t('email')}</p>
            <a
              href="mailto:support@cangdayperfume.com"
              className="text-muted-foreground hover:text-black transition-colors"
            >
              support@cangdayperfume.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

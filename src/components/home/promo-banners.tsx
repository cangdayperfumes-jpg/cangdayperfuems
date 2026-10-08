'use client';

import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

const CARD_KEYS = ['promo1', 'promo2', 'promo3'] as const;
const CARD_HREFS = ['/shop', '/shop', '/shop'] as const;

/**
 * Retail conversion row — replaces the wholesale "bulk pricing" banner from
 * the source project with the discount/bundle/gift-threshold pattern a
 * direct-to-consumer storefront actually needs.
 */
export default function PromoBanners() {
  const t = useTranslations('home');

  return (
    <section className="w-full bg-ivory">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {CARD_KEYS.map((key, index) => (
            <Link
              key={key}
              href={CARD_HREFS[index]}
              className="group bg-ivory p-8 md:p-10 flex flex-col justify-between min-h-[220px] hover:bg-ink transition-colors duration-500"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold-deep group-hover:text-gold transition-colors font-semibold mb-3">
                  {t(`${key}Eyebrow`)}
                </p>
                <h3 className="font-heading text-3xl md:text-4xl font-medium text-ink group-hover:text-ivory transition-colors">
                  {t(`${key}Title`)}
                </h3>
                <p className="mt-3 text-sm text-ink/60 group-hover:text-ivory/60 transition-colors max-w-[26ch]">
                  {t(`${key}Body`)}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-ink group-hover:text-gold transition-colors">
                {t(`${key}Cta`)}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PromoCard {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}

const CARDS: PromoCard[] = [
  {
    eyebrow: 'First Order',
    title: '10% Off',
    body: 'New here? Use code CANGDAY10 at checkout.',
    cta: 'Shop Now',
    href: '/shop',
  },
  {
    eyebrow: 'Bundle & Save',
    title: 'Buy 2, Get 1',
    body: 'Mix and match any three 50ml bottles.',
    cta: 'See Eligible Scents',
    href: '/shop',
  },
  {
    eyebrow: 'On Us',
    title: 'Free Mini Gift',
    body: 'Automatically added to orders over $75.',
    cta: 'Start Shopping',
    href: '/shop',
  },
];

/**
 * Retail conversion row — replaces the wholesale "bulk pricing" banner from
 * the source project with the discount/bundle/gift-threshold pattern a
 * direct-to-consumer storefront actually needs.
 */
export default function PromoBanners() {
  return (
    <section className="w-full bg-ivory">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-ivory p-8 md:p-10 flex flex-col justify-between min-h-[220px] hover:bg-ink transition-colors duration-500"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold-deep group-hover:text-gold transition-colors font-semibold mb-3">
                  {card.eyebrow}
                </p>
                <h3 className="font-heading text-3xl md:text-4xl font-medium text-ink group-hover:text-ivory transition-colors">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm text-ink/60 group-hover:text-ivory/60 transition-colors max-w-[26ch]">
                  {card.body}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-ink group-hover:text-gold transition-colors">
                {card.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

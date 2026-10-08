'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SHOP_LINKS = [
  { href: '/shop', key: 'allPerfumes' },
  { href: '/shop?audience=Men', key: 'men' },
  { href: '/shop?audience=Women', key: 'women' },
  { href: '/shop?audience=Unisex', key: 'unisex' },
] as const;

const COMPANY_LINKS = [
  { href: '/about', key: 'aboutUs' },
  { href: '/blog', key: 'journal' },
  { href: '/contact', key: 'contact' },
  { href: '/shipping', key: 'shippingReturns' },
] as const;

const LEGAL_LINKS = [
  { href: '/privacy-policy', key: 'privacyPolicy' },
  { href: '/terms-of-service', key: 'termsOfService' },
] as const;

/**
 * Deliberately the inverse surface of the (dark, centered-logo) Navbar: a
 * light ivory ground, an oversized italic wordmark as the anchor instead of
 * a small logo lockup, and link columns arranged around it rather than
 * beside a brand blurb — so the two don't read as the same recolored shell.
 */
export default function Footer() {
  const t = useTranslations('footer');
  const pathname = usePathname();
  const isShopPage = pathname === '/shop';
  // Product pages: the mobile sticky Add to Cart bar (see ProductActions)
  // already owns that bottom strip of the screen on small viewports, and a
  // full footer right below a dense related-products grid is a lot of extra
  // scroll for little payoff there — so it's mobile-hidden, desktop-visible.
  const isProductPage = pathname?.startsWith('/shop/') ?? false;

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: trimmed });
    setIsSubmitting(false);

    if (!error) {
      toast.success(t('newsletterSuccess'));
      setEmail('');
      return;
    }

    // Unique constraint violation — already on the list, not a real error.
    if (error.code === '23505') {
      toast.info(t('newsletterDuplicate'));
      setEmail('');
      return;
    }

    toast.error(t('newsletterError'));
  };

  if (isShopPage) {
    return null;
  }

  return (
    <footer className={cn(
      "w-full bg-ivory text-ink pt-8 pb-20 md:pt-16 md:pb-16",
      isProductPage && "hidden md:block"
    )}>
      <div className="container">
        <div className="text-center pb-4 md:pb-10">
          <p className="font-heading italic text-2xl md:text-6xl text-ink">Cangday</p>
          <p className="mt-1.5 md:mt-3 text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold-deep font-semibold">
            {t('brandTagline')}
          </p>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="py-6 md:py-10 max-w-md mx-auto text-center">
          <h4 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-ink">{t('newsletterTitle')}</h4>
          <p className="mt-1.5 text-xs md:text-sm text-ink/60">{t('newsletterSubtitle')}</p>
          <form onSubmit={handleSubscribe} className="mt-4 flex items-center gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletterPlaceholder')}
              className="bg-background border-border rounded-sm h-11"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="shrink-0 h-11 rounded-sm bg-ink text-ivory hover:bg-gold-deep hover:text-ivory text-xs uppercase tracking-widest font-semibold px-5"
            >
              {t('newsletterCta')}
            </Button>
          </form>
        </div>

        <div className="h-px w-full bg-border" />

        <div className="grid grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-5 md:gap-8 py-5 md:py-12 text-xs md:text-sm">
          <div className="col-span-3 md:col-span-1 order-first md:order-none">
            <p className="text-ink/60 leading-relaxed max-w-[26ch] text-center md:text-left">
              {t('tagline')}
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-ink">{t('shop')}</h4>
            <ul className="space-y-1.5 md:space-y-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-ink/60 hover:text-ink transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 md:space-y-3">
            <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-ink">{t('company')}</h4>
            <ul className="space-y-1.5 md:space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-ink/60 hover:text-ink transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 md:space-y-3">
            <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-ink">{t('legal')}</h4>
            <ul className="space-y-1.5 md:space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-ink/60 hover:text-ink transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        <div className="pt-3 md:pt-6 text-center text-[10px] md:text-xs text-ink/40">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}

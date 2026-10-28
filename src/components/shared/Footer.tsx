'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { BludoraMark, BludoraWordmark } from '@/components/shared/BludoraLogo';

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
  const locale = useLocale();
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
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: trimmed, locale });
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
              aria-busy={isSubmitting}
              className="shrink-0 h-11 min-w-[7rem] rounded-sm bg-ink text-ivory hover:bg-gold-deep hover:text-ivory text-xs uppercase tracking-widest font-semibold px-5"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('newsletterCta')}
            </Button>
          </form>
        </div>

        <div className="h-px w-full bg-border" />

        <div className="grid grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-5 md:gap-8 py-5 md:py-12 text-xs md:text-sm">
          <div className="col-span-3 md:col-span-1 order-first md:order-none flex flex-col items-center md:items-start">
            <p className="text-ink/60 leading-relaxed max-w-[26ch] text-center md:text-left">
              {t('tagline')}
            </p>
            {/* Developer credit — opens Bludora Software's Instagram. */}
            <a
              href="https://www.instagram.com/bludorasoftware/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('madeByLabel')}
              className="group mt-4 inline-flex md:mt-5 items-center gap-3 rounded-sm border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-gold/60"
            >
              <BludoraMark className="h-9 w-auto shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span className="leading-tight">
                <span className="block text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-ink/50">{t('madeBy')}</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <BludoraWordmark className="text-sm md:text-base" />
                  <span className="text-[10px] md:text-[11px] font-medium text-ink/50">Software</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-ink/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-deep" />
                </span>
              </span>
            </a>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SHOP_LINKS = [
  { href: '/shop', label: 'All Perfumes' },
  { href: '/shop?audience=Men', label: 'Men' },
  { href: '/shop?audience=Women', label: 'Women' },
  { href: '/shop?audience=Unisex', label: 'Unisex' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/blog', label: 'Journal' },
  { href: '/contact', label: 'Contact' },
  { href: '/shipping', label: 'Shipping & Returns' },
];

const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
];

/**
 * Deliberately the inverse surface of the (dark, centered-logo) Navbar: a
 * light ivory ground, an oversized italic wordmark as the anchor instead of
 * a small logo lockup, and link columns arranged around it rather than
 * beside a brand blurb — so the two don't read as the same recolored shell.
 */
export default function Footer() {
  const pathname = usePathname();
  const isShopPage = pathname === '/shop';

  if (isShopPage) {
    return null;
  }

  return (
    <footer className="w-full bg-ivory text-ink pt-16 pb-24 md:pb-16">
      <div className="container">
        <div className="text-center pb-10">
          <p className="font-heading italic text-4xl md:text-6xl text-ink">Cangday</p>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gold-deep font-semibold">
            Modern Perfumery
          </p>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-sm">
          <div className="col-span-2 md:col-span-1">
            <p className="text-ink/60 leading-relaxed max-w-[26ch]">
              An edited collection of designer and niche perfumes for everyday wear.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">Shop</h4>
            <ul className="space-y-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-ink/60 hover:text-gold-deep transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">Company</h4>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-ink/60 hover:text-gold-deep transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">Legal</h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-ink/60 hover:text-gold-deep transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        <div className="pt-6 text-center text-xs text-ink/40">
          <p>&copy; {new Date().getFullYear()} Cangday. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

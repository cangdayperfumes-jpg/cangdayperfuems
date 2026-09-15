'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isShopPage = pathname === '/shop';

  if (isShopPage) {
    return null;
  }

  return (
    <footer className="w-full bg-ink text-ivory py-12 md:py-16 pb-24 md:pb-16">
      <div className="container grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-2xl font-heading">Cangday</h3>
          <p className="text-sm text-ivory/60 max-w-xs">
            A modern fragrance house — an edited collection of designer and niche perfumes for
            everyday wear.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:col-span-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-ivory/70 hover:text-ivory transition-colors">
                  All Perfumes
                </Link>
              </li>
              <li>
                <Link href="/shop?audience=Men" className="text-ivory/70 hover:text-ivory transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/shop?audience=Women" className="text-ivory/70 hover:text-ivory transition-colors">
                  Women
                </Link>
              </li>
              <li>
                <Link href="/shop?audience=Unisex" className="text-ivory/70 hover:text-ivory transition-colors">
                  Unisex
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-ivory/70 hover:text-ivory transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-ivory/70 hover:text-ivory transition-colors">
                  Journal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-ivory/70 hover:text-ivory transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-ivory/70 hover:text-ivory transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-ivory/70 hover:text-ivory transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-ivory/70 hover:text-ivory transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container mt-12 border-t border-ink-line pt-8 text-center text-xs text-ivory/40">
        <p>&copy; {new Date().getFullYear()} Cangday. All rights reserved.</p>
      </div>
    </footer>
  );
}

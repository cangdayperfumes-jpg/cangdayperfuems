'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Send } from 'lucide-react';
import { WHATSAPP_URL, TELEGRAM_URL } from '@/lib/social';

export default function Footer() {
  const pathname = usePathname();
  const isShopPage = pathname === '/shop';

  if (isShopPage) {
    return null;
  }

  return (
    <footer className="w-full bg-black text-white py-12 md:py-16 pb-24 md:pb-16">
      <div className="container grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-2xl font-heading">Royal Perfumes</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Exquisite scents for the modern aristocracy. Handcrafted with the finest ingredients.
          </p>
          <div className="flex items-center gap-4 pt-1">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message us on Telegram"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 md:col-span-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-gray-300 transition-colors">
                  All Perfumes
                </Link>
              </li>
              <li>
                <Link href="/shop?audience=Men" className="hover:text-gray-300 transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/shop?audience=Women" className="hover:text-gray-300 transition-colors">
                  Women
                </Link>
              </li>
              <li>
                <Link href="/shop?audience=Unisex" className="hover:text-gray-300 transition-colors">
                  Unisex
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-gray-300 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-gray-300 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-300 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-gray-300 transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-gray-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-gray-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container mt-12 border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Royal Perfumes. All rights reserved.</p>
      </div>
    </footer>
  );
}

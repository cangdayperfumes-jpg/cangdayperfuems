'use client';

import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import CartSheet from '@/components/cart/cart-sheet';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface NavbarProps {
  categories?: Category[];
}

/**
 * Structurally distinct from the footer on purpose: dark ink chrome,
 * logo dead-center between two link groups (not left-aligned with an
 * absolutely-positioned centered link row) — a different "shape" of nav
 * than the typical left-logo layout, so header and footer don't read as
 * the same recolored template.
 */
export default function Navbar({ categories = [] }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
  const itemCount = useStore(useCartStore, (state) => state.getItemCount());
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full bg-ink text-ivory transition-shadow duration-300',
        isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.35)]' : 'border-b border-ink-line'
      )}
      suppressHydrationWarning
    >
      <div className="container grid grid-cols-[auto_1fr_auto] md:grid-cols-3 items-center h-16 md:h-20 gap-4">
        {/* Left: mobile trigger + desktop link group */}
        <div className="flex items-center gap-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-ivory hover:bg-ivory/10 hover:text-ivory">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" showCloseButton={false} className="w-full max-w-none sm:max-w-none h-full border-none p-0 bg-ink text-ivory flex flex-col">
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>

              <div className="flex justify-end p-6">
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-ivory/10 text-ivory">
                    <X className="h-8 w-8" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <nav className="flex flex-col space-y-6">
                  <Link href="/" onClick={() => setIsOpen(false)} className="text-4xl font-light font-heading text-ivory hover:text-gold transition-colors border-b border-ink-line pb-4">
                    Home
                  </Link>
                  <Link href="/about" onClick={() => setIsOpen(false)} className="text-4xl font-light font-heading text-ivory hover:text-gold transition-colors border-b border-ink-line pb-4">
                    About
                  </Link>
                  <Link href="/shop" onClick={() => setIsOpen(false)} className="text-4xl font-light font-heading text-ivory hover:text-gold transition-colors border-b border-ink-line pb-4">
                    Shop
                  </Link>
                  <Link href="/shipping" onClick={() => setIsOpen(false)} className="text-4xl font-light font-heading text-ivory hover:text-gold transition-colors border-b border-ink-line pb-4">
                    Shipping
                  </Link>
                  <Link href="/blog" onClick={() => setIsOpen(false)} className="text-4xl font-light font-heading text-ivory hover:text-gold transition-colors border-b border-ink-line pb-4">
                    Journal
                  </Link>

                  <div className="border-b border-ink-line pb-4">
                    <div className="flex items-center justify-between">
                      <Link href="/categories" onClick={() => setIsOpen(false)} className="text-4xl font-light font-heading text-ivory hover:text-gold transition-colors">
                        Collections
                      </Link>
                      <button
                        onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                        className="p-2 hover:bg-ivory/10 rounded-full transition-colors"
                      >
                        {isCollectionsOpen ? <ChevronUp className="h-6 w-6 text-ivory/50" /> : <ChevronDown className="h-6 w-6 text-ivory/50" />}
                      </button>
                    </div>

                    {isCollectionsOpen && (
                      <div className="flex flex-col space-y-3 pl-4 mt-4 animate-in slide-in-from-top-2 duration-300">
                        {categories?.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/shop?category=${cat.slug}`}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'text-lg font-body text-ivory/60 hover:text-ivory transition-colors',
                              activeCategory === cat.slug && 'text-gold font-medium'
                            )}
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              <div className="p-8 mt-auto border-t border-ink-line">
                <div className="flex items-center justify-center gap-8">
                  <Link
                    href="/contact"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-body uppercase tracking-widest text-ivory/60 hover:text-gold transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/shop" className="text-sm font-medium tracking-wide text-ivory/80 hover:text-gold transition-colors">
              Shop
            </Link>
            <Link href="/categories" className="text-sm font-medium tracking-wide text-ivory/80 hover:text-gold transition-colors">
              Collections
            </Link>
          </div>
        </div>

        {/* Center: logo, dead-center regardless of side content width */}
        <Link href="/" className="flex flex-col items-center justify-self-center leading-none">
          <span className="text-xl md:text-2xl font-heading font-semibold tracking-tight">
            Cangday
          </span>
          <span className="hidden sm:block text-[9px] md:text-[10px] font-body uppercase tracking-[0.2em] text-gold/80">
            Modern Perfumery
          </span>
        </Link>

        {/* Right: desktop link group + icons */}
        <div className="flex items-center justify-end gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium tracking-wide text-ivory/80 hover:text-gold transition-colors">
              Our Story
            </Link>
            <Link href="/blog" className="text-sm font-medium tracking-wide text-ivory/80 hover:text-gold transition-colors">
              Journal
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Search" className="hidden md:inline-flex text-ivory hover:bg-ivory/10 hover:text-gold">
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Cart"
              className="relative hidden md:inline-flex text-ivory hover:bg-ivory/10 hover:text-gold"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount !== undefined && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-ink text-xs flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </Button>

            <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
          </div>
        </div>
      </div>
    </nav>
  );
}

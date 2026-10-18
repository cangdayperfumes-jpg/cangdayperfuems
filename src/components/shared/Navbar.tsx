'use client';

import Image from 'next/image';
import { ShoppingBag, Search, Menu, X, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import CartSheet from '@/components/cart/cart-sheet';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Category } from '@/types';
import { cn } from '@/lib/utils';
import SearchSuggestions from '@/components/shared/SearchSuggestions';

const MOBILE_NAV_LINKS = [
  { href: '/', key: 'home' },
  { href: '/shop', key: 'shop' },
  { href: '/categories', key: 'collections' },
  { href: '/shipping', key: 'shipping' },
  { href: '/blog', key: 'journal' },
  { href: '/about', key: 'about' },
] as const;

interface NavbarProps {
  categories?: Category[];
}

/**
 * Structurally distinct from the footer on purpose: logo dead-center
 * between two link groups (not left-aligned with an absolutely-positioned
 * centered link row) — a different "shape" of nav than the typical
 * left-logo layout, so header and footer don't read as the same recolored
 * template, even though both now share the same light ivory ground.
 */
export default function Navbar({ categories = [] }: NavbarProps) {
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const itemCount = useStore(useCartStore, (state) => state.getItemCount());
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');
  const [isScrolled, setIsScrolled] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
    setIsSearchOpen(false);
    setIsOpen(false);
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
    setMobileSearchQuery('');
  };
  // Matches SearchSuggestions' own 2-character threshold for showing results.
  const isMobileSearching = mobileSearchQuery.trim().length >= 2;

  return (
    <nav
      className={cn(
        'w-full bg-ivory text-ink transition-shadow duration-300',
        isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]' : 'border-b border-border'
      )}
      suppressHydrationWarning
    >
      <div
        className={cn(
          'container relative flex items-center justify-between gap-4 transition-[height] duration-300',
          isScrolled ? 'h-14 md:h-16' : 'h-16 md:h-20'
        )}
      >
        {/* Left: mobile trigger + desktop link group */}
        <div className="flex items-center gap-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-ink hover:bg-ink/5 hover:text-ink">
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t('toggleMenu')}</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" showCloseButton={false} className="w-full max-w-none sm:max-w-sm h-full border-none p-0 bg-ivory text-ink flex flex-col">
              <SheetTitle className="sr-only">{t('mobileMenu')}</SheetTitle>

              {/* Header — logo + close, same height as the main nav bar so
                  opening the menu doesn't make the top of the screen jump. */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
                <Link href="/" onClick={closeMobileMenu} className="flex items-center">
                  <Image
                    src="/images/cangday-logo.png"
                    alt="Cangday — Modern Perfumery"
                    width={2172}
                    height={724}
                    className="h-10 w-auto"
                  />
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-ink/5 text-ink">
                    <X className="h-5 w-5" />
                    <span className="sr-only">{t('close')}</span>
                  </Button>
                </SheetClose>
              </div>

              <div className="px-5 pt-4 pb-2 shrink-0">
                <div className="rounded-sm border border-border bg-white/70 overflow-hidden focus-within:border-gold/60 transition-colors">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitSearch(mobileSearchQuery);
                    }}
                    className="flex items-center gap-2 px-3 h-12"
                  >
                    <Search className="h-4 w-4 text-ink/40 shrink-0" />
                    <Input
                      value={mobileSearchQuery}
                      onChange={(e) => setMobileSearchQuery(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto text-sm"
                    />
                    {mobileSearchQuery && (
                      <button
                        type="button"
                        aria-label={t('close')}
                        onClick={() => setMobileSearchQuery('')}
                        className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full text-ink/40 hover:bg-ink/5 hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </form>
                  <SearchSuggestions query={mobileSearchQuery} onNavigate={closeMobileMenu} />
                </div>
              </div>

              {/* While searching, results take over — the rest of the menu
                  is hidden so the list isn't squeezed between nav sections. */}
              {!isMobileSearching && (
                <div className="flex-1 overflow-y-auto px-5 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <nav className="mt-2">
                    {MOBILE_NAV_LINKS.map(({ href, key }) => {
                      const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeMobileMenu}
                          className="group flex items-center justify-between py-3.5 border-b border-border"
                        >
                          <span
                            className={cn(
                              'font-heading text-xl transition-colors',
                              isActive ? 'text-gold-deep' : 'text-ink group-hover:text-gold-deep'
                            )}
                          >
                            {t(key)}
                          </span>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 transition-all',
                              isActive ? 'text-gold-deep' : 'text-ink/30 group-hover:text-gold-deep group-hover:translate-x-0.5'
                            )}
                          />
                        </Link>
                      );
                    })}
                  </nav>

                  {categories.length > 0 && (
                    <section className="mt-7">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gold-deep">
                          {t('shopByCategory')}
                        </p>
                        <Link
                          href="/categories"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-1 text-xs font-medium text-ink/60 hover:text-ink"
                        >
                          {t('viewAll')}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat, index) => {
                          const isActive = activeCategory === cat.slug;
                          // An odd count would otherwise leave the last tile
                          // alone next to an empty gap — let it span both columns.
                          const isLastOdd = categories.length % 2 === 1 && index === categories.length - 1;
                          return (
                            <Link
                              key={cat.id}
                              href={`/shop?category=${cat.slug}`}
                              onClick={closeMobileMenu}
                              className={cn(
                                // Fixed height + centered text: tiles stay uniform
                                // even when a long name wraps to two lines.
                                'group flex h-14 items-center justify-between gap-2 rounded-sm border px-3 transition-colors',
                                isLastOdd && 'col-span-2',
                                isActive
                                  ? 'border-gold-deep bg-gold/10 text-gold-deep'
                                  : 'border-border bg-white/60 text-ink/80 hover:border-gold/50 hover:text-ink'
                              )}
                            >
                              <span className={cn('text-[13px] leading-tight line-clamp-2', isActive && 'font-medium')}>
                                {cat.name}
                              </span>
                              <ChevronRight
                                className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-colors',
                                  isActive ? 'text-gold-deep' : 'text-ink/25 group-hover:text-gold-deep'
                                )}
                              />
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}
              {isMobileSearching && <div className="flex-1" />}

              <div className="shrink-0 border-t border-border px-5 py-4 flex items-center justify-between">
                <Link
                  href="/contact"
                  onClick={closeMobileMenu}
                  className="text-xs font-semibold uppercase tracking-widest text-ink/70 hover:text-ink transition-colors"
                >
                  {t('contactUs')}
                </Link>
                <LanguageSwitcher />
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/shop" className="text-sm font-medium tracking-wide text-ink/70 hover:text-ink transition-colors">
              {t('shop')}
            </Link>
            <Link href="/categories" className="text-sm font-medium tracking-wide text-ink/70 hover:text-ink transition-colors">
              {t('collections')}
            </Link>
          </div>
        </div>

        {/* Center: logo, absolutely positioned so it stays dead-center on
            the viewport regardless of how wide the left/right content is
            (a grid's middle 1fr track only centers between the side
            tracks, which drifts off-center whenever they're unequal width —
            e.g. once the mobile language switcher made the right side wider
            than the hamburger button on the left). */}
        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center leading-none">
          <Image
            src="/images/cangday-logo.png"
            alt="Cangday — Modern Perfumery"
            width={2172}
            height={724}
            priority
            className={cn(
              'w-auto transition-[height] duration-300',
              isScrolled ? 'h-9 md:h-12' : 'h-12 md:h-16'
            )}
          />
        </Link>

        {/* Right: desktop link group + icons */}
        <div className="flex items-center justify-end gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium tracking-wide text-ink/70 hover:text-ink transition-colors">
              {t('ourStory')}
            </Link>
            <Link href="/blog" className="text-sm font-medium tracking-wide text-ink/70 hover:text-ink transition-colors">
              {t('journal')}
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher className="flex mr-1" />

            <Button
              variant="ghost"
              size="icon"
              aria-label={t('search')}
              className="hidden md:inline-flex text-ink hover:bg-ink/5 hover:text-ink"
              onClick={() => setIsSearchOpen((open) => !open)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label={t('cart')}
              className="relative hidden md:inline-flex text-ink hover:bg-ink/5 hover:text-ink"
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

      {/* Inline search panel — drops down below the nav instead of taking
          over the centered-logo header, so the row above never has to
          rearrange itself to make room for an input. */}
      {isSearchOpen && (
        <div
          ref={searchPanelRef}
          className="hidden md:block absolute inset-x-0 top-full bg-ivory border-b border-border shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(searchQuery);
            }}
            className="container flex items-center gap-3 h-16"
          >
            <Search className="h-5 w-5 text-ink/40 shrink-0" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="border-0 bg-transparent shadow-none text-base focus-visible:ring-0 px-0 h-auto"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('close')}
              className="text-ink/50 hover:bg-ink/5 hover:text-ink shrink-0"
              onClick={() => setIsSearchOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </form>
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <SearchSuggestions query={searchQuery} onNavigate={() => setIsSearchOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

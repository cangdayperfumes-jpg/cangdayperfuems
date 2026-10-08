'use client';

import { ShoppingBag, Search, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import CartSheet from '@/components/cart/cart-sheet';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Category } from '@/types';
import { cn } from '@/lib/utils';
import OptionWheel from '@/components/OptionWheel';

// Experimental — trying react-bits' OptionWheel as the mobile menu's primary
// nav picker in place of the flat link list, to see if it reads well here.
const WHEEL_NAV_HREFS = ['/', '/shop', '/categories', '/shipping', '/blog', '/about'] as const;

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
  const wheelLabels = [t('home'), t('shop'), t('collections'), t('shipping'), t('journal'), t('about')];
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
  const itemCount = useStore(useCartStore, (state) => state.getItemCount());
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');
  const [isScrolled, setIsScrolled] = useState(false);
  const [wheelIndex, setWheelIndex] = useState(2);
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelDragStartRef = useRef<{ x: number; y: number } | null>(null);

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

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full bg-ivory text-ink transition-shadow duration-300',
        isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]' : 'border-b border-border'
      )}
      suppressHydrationWarning
    >
      <div className="container relative flex items-center justify-between h-16 md:h-20 gap-4">
        {/* Left: mobile trigger + desktop link group */}
        <div className="flex items-center gap-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-ink hover:bg-ink/5 hover:text-ink">
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t('toggleMenu')}</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" showCloseButton={false} className="w-full max-w-none sm:max-w-none h-full border-none p-0 bg-ivory text-ink flex flex-col">
              <SheetTitle className="sr-only">{t('mobileMenu')}</SheetTitle>

              <div className="flex justify-end p-6">
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-ink/5 text-ink">
                    <X className="h-8 w-8" />
                    <span className="sr-only">{t('close')}</span>
                  </Button>
                </SheetClose>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <nav className="flex flex-col space-y-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitSearch(mobileSearchQuery);
                    }}
                    className="flex items-center gap-2 border border-border rounded-sm px-3 h-12 bg-background"
                  >
                    <Search className="h-4 w-4 text-ink/40 shrink-0" />
                    <Input
                      value={mobileSearchQuery}
                      onChange={(e) => setMobileSearchQuery(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto"
                    />
                  </form>

                  <div className="border-b border-border pb-4">
                    <div
                      ref={wheelRef}
                      className="h-[230px]"
                      onPointerDownCapture={(e) => {
                        wheelDragStartRef.current = { x: e.clientX, y: e.clientY };
                      }}
                      onClick={(e) => {
                        // Ignore drag-releases (scroll/spin gestures) — only a
                        // near-stationary tap should navigate.
                        const start = wheelDragStartRef.current;
                        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;

                        // The component only re-centers a clicked item; it
                        // doesn't navigate. Walk the DOM to find which item
                        // (by fixed render order, unaffected by the curve
                        // animation) was tapped and route straight there.
                        const target = (e.target as HTMLElement).closest('.option-wheel__item');
                        if (!target || !wheelRef.current) return;
                        const els = Array.from(wheelRef.current.querySelectorAll('.option-wheel__item'));
                        const idx = els.indexOf(target);
                        if (idx === -1) return;
                        router.push(WHEEL_NAV_HREFS[idx]);
                        setIsOpen(false);
                      }}
                    >
                      <OptionWheel
                        items={wheelLabels}
                        defaultSelected={2}
                        onChange={(idx: number) => setWheelIndex(idx)}
                        textColor="rgba(13, 13, 12, 0.35)"
                        activeColor="rgb(var(--brand-gold-deep))"
                        fontSize={1.4}
                        spacing={1.3}
                        tilt={4}
                        blur={1}
                        fade={0.18}
                        minOpacity={0.15}
                        inset={0}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(WHEEL_NAV_HREFS[wheelIndex]);
                        setIsOpen(false);
                      }}
                      className="mt-4 w-full border border-gold/40 text-gold py-3 text-sm uppercase tracking-widest hover:bg-gold hover:text-ink transition-colors"
                    >
                      {t('goTo', { label: wheelLabels[wheelIndex] })}
                    </button>
                  </div>

                  <div className="border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                      <Link href="/categories" onClick={() => setIsOpen(false)} className="text-4xl font-light font-heading text-ink hover:text-ink/70 transition-colors">
                        {t('collections')}
                      </Link>
                      <button
                        onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                        className="p-2 hover:bg-ink/5 rounded-full transition-colors"
                      >
                        {isCollectionsOpen ? <ChevronUp className="h-6 w-6 text-ink/40" /> : <ChevronDown className="h-6 w-6 text-ink/40" />}
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
                              'text-lg font-body text-ink/60 hover:text-ink transition-colors',
                              activeCategory === cat.slug && 'text-gold-deep font-medium'
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

              <div className="p-8 mt-auto border-t border-border space-y-5">
                <div className="flex items-center justify-center gap-8">
                  <Link
                    href="/contact"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-body uppercase tracking-widest text-ink/60 hover:text-ink transition-colors"
                  >
                    {t('contactUs')}
                  </Link>
                </div>
                <LanguageSwitcher className="justify-center" />
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
          <span className="text-xl md:text-2xl font-heading font-semibold tracking-tight">
            Cangday
          </span>
          <span className="hidden sm:block text-[9px] md:text-[10px] font-body uppercase tracking-[0.2em] text-gold/80">
            {t('tagline')}
          </span>
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
        </div>
      )}
    </nav>
  );
}

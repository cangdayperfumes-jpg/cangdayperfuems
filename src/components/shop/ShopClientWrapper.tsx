
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Product, Category, Brand } from '@/types';
import ShopSidebar from '@/components/shop/ShopSidebar';
import ProductCard from '@/components/shared/ProductCard';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, ChevronDown, SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { useDebounce } from 'use-debounce';
import { useTranslations } from 'next-intl';

interface ShopClientWrapperProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  productCounts: Record<string, number>;
  initialCategorySlug?: string;
  initialAudience?: string;
  initialPopular?: boolean;
  initialBrands?: string[];
  initialFilter?: string;
  initialSeason?: string;
  seasonTitle?: string;
  initialSearchQuery?: string;
  /** Exact count of products matching the current filters (not just the loaded pages). */
  totalProducts: number;
  pagination: {
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function ShopClientWrapper({
  products,
  categories,
  brands,
  productCounts,
  initialCategorySlug,
  initialAudience,
  initialPopular,
  initialBrands = [],
  initialFilter,
  initialSeason,
  seasonTitle,
  initialSearchQuery,
  totalProducts,
  pagination,
}: ShopClientWrapperProps) {
  const t = useTranslations('shop');
  // Must match `limit` in app/[locale]/shop/page.tsx — used to restart the
  // fade-in stagger at the top of every newly loaded page.
  const limitPerPage = 12;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Initialize search query from URL
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
  // Seeded from ?q= — starting from '' made the debounced-search effect below
  // see '' !== 'dior' on first render and push a URL with q removed, wiping
  // any search arriving via a link (or Google's sitelinks search box).
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [filter, setFilter] = useState<string | null>(initialFilter || null);

  // Infinite scroll state
  const [allProducts, setAllProducts] = useState<Product[]>(products);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // `products` is now always the full cumulative list from page 1 through
    // the current page, so we can just replace state directly.
    setAllProducts(products);
    setIsLoadingMore(false);
  }, [products]);

  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  // Products present on first paint render immediately (no fade) so the
  // server-rendered grid isn't hidden until hydration; anything that arrives
  // afterwards — filter changes, infinite-scroll pages — fades in.
  const [firstPaintIds] = useState(() => new Set(products.map((p) => p.id)));

  // Mobile: a floating "Filters" pill appears once the in-page header row
  // (with its own Filters button) has scrolled out of view.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showFloatingFilters, setShowFloatingFilters] = useState(false);
  const headerRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = headerRowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowFloatingFilters(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (isLoadingMore || isPending || !pagination.hasMore) return;

        setIsLoadingMore(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', (pagination.page + 1).toString());
        startTransition(() => {
          router.push(`/shop?${params.toString()}`, { scroll: false });
        });
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoadingMore, isPending, pagination.hasMore, pagination.page, router, searchParams]);

  // Debounced Search Update
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    if (debouncedQuery !== currentQ) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      } else {
        params.delete('q');
      }
      params.set('page', '1'); // Reset to page 1 on search
      
      startTransition(() => {
        router.push(`/shop?${params.toString()}`);
      });
    }
  }, [debouncedQuery, router, searchParams]);


  const selectedCategory = initialCategorySlug
    ? categories.find(c => c.slug === initialCategorySlug)
    : undefined;

  const translatedAudience = initialAudience === 'Men'
    ? t('men')
    : initialAudience === 'Women'
    ? t('women')
    : initialAudience === 'Unisex'
    ? t('unisex')
    : initialAudience;

  const audienceLabel = initialAudience === 'Unisex'
    ? t('unisexCollection')
    : initialAudience
    ? t('audienceCollection', { audience: translatedAudience ?? initialAudience })
    : undefined;

  const selectedCategoryName = seasonTitle
    ? seasonTitle
    : selectedCategory
    ? selectedCategory.name
    : audienceLabel
    ? audienceLabel
    : t('allCollection');

  // Cuts a long DB description down to one complete-reading sentence/clause
  // instead of letting CSS line-clamp chop it mid-word with a trailing "…".
  const toShortIntro = (text: string, maxLength = 100) => {
    const firstSentence = text.match(/^[^.!?]+[.!?]/)?.[0]?.trim();
    if (firstSentence && firstSentence.length <= maxLength) return firstSentence;
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
  };

  // Short intro line under the H1 — real on-page copy instead of leaving
  // the page with nothing but a product grid, since Google indexes this
  // page as mobile and previously saw no on-page copy at all here.
  const pageIntro = seasonTitle
    ? undefined
    : selectedCategory
    ? toShortIntro(selectedCategory.description || `Shop ${selectedCategory.name} at Cangday — an edited collection of designer and niche perfumes.`)
    : initialAudience
    ? t('shopAudience', { audience: translatedAudience?.toLowerCase?.() ?? initialAudience.toLowerCase() })
    : t('defaultIntro');

  // Real crawlable link to the next page — the infinite-scroll sentinel below
  // is JS-only (IntersectionObserver), so Googlebot has no <a href> path past
  // page 1 without this. Kept out of the visible UI/UX (display:none + inert
  // to real users/assistive tech) since the actual browsing experience is
  // still the existing infinite scroll, unchanged.
  const nextPageHref = pagination.hasMore
    ? (() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', (pagination.page + 1).toString());
        return `/shop?${params.toString()}`;
      })()
    : null;

  const handleOptimisticNavigation = (url: string, options?: { scroll?: boolean }) => {
      startTransition(() => {
          router.push(url, options);
      });
  };

  const handleFilterChange = (url: string) => {
    startTransition(() => {
      router.push(url);
    });
  };

  const navigateWithParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.set('page', '1');
    startTransition(() => {
      router.push(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  const handleSortChange = (value: string) => {
    setFilter(value || null);
    navigateWithParams((params) => {
      if (value) params.set('filter', value);
      else params.delete('filter');
    });
  };

  // Removable chips for every active filter (season keeps its own banner above).
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (selectedCategory) {
    activeChips.push({ key: 'category', label: selectedCategory.name, onRemove: () => navigateWithParams((p) => p.delete('category')) });
  }
  if (initialAudience) {
    activeChips.push({ key: 'audience', label: translatedAudience ?? initialAudience, onRemove: () => navigateWithParams((p) => p.delete('audience')) });
  }
  if (initialPopular) {
    activeChips.push({ key: 'popular', label: t('popular'), onRemove: () => navigateWithParams((p) => p.delete('popular')) });
  }
  selectedBrands.forEach((slug) => {
    const brand = brands.find((b) => b.slug === slug);
    if (!brand) return;
    activeChips.push({
      key: `brand-${slug}`,
      label: brand.name,
      onRemove: () => {
        const remaining = selectedBrands.filter((b) => b !== slug);
        setSelectedBrands(remaining);
        navigateWithParams((p) => {
          if (remaining.length > 0) p.set('brands', remaining.join(','));
          else p.delete('brands');
        });
      },
    });
  });
  const urlQuery = searchParams.get('q');
  if (urlQuery) {
    activeChips.push({
      key: 'q',
      label: t('searchChip', { query: urlQuery }),
      onRemove: () => {
        setSearchQuery('');
        navigateWithParams((p) => p.delete('q'));
      },
    });
  }

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBrands([]);
    setFilter(null);
    startTransition(() => {
      router.push('/shop', { scroll: false });
    });
  };

  const sortOptions = [
    { value: '', label: t('featured') },
    { value: 'new', label: t('newArrivals') },
    { value: 'best', label: t('bestSellers') },
    { value: 'price-asc', label: t('priceLowHigh') },
    { value: 'price-desc', label: t('priceHighLow') },
  ];

  const sidebarProps = {
    categories,
    brands,
    selectedCategory: initialCategorySlug || null,
    selectedAudience: initialAudience || null,
    selectedPopular: initialPopular || false,
    selectedBrands,
    searchQuery,
    setSearchQuery,
    productCounts,
    totalProducts,
    onNavigate: handleFilterChange,
    selectedFilter: filter,
  };

  const handleClearSeason = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('season');
    params.set('page', '1');
    startTransition(() => {
      router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`);
    });
  };



  return (
    <div className="flex flex-col md:flex-row gap-8 pb-24 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <ShopSidebar {...sidebarProps} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
         {initialSeason && seasonTitle && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-4 py-2.5 text-sm">
               <span>
                  {t('viewing')} <span className="font-medium">{seasonTitle}</span>
               </span>
               <button
                  type="button"
                  onClick={handleClearSeason}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
               >
                  <X className="h-3.5 w-3.5" />
                  {t('clear')}
               </button>
            </div>
         )}

         <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-3xl font-heading text-ink mb-1">{selectedCategoryName}</h1>
            {pageIntro && (
               <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mb-3 truncate md:whitespace-normal">{pageIntro}</p>
            )}
            <div ref={headerRowRef} className="flex items-center justify-between gap-3 border-y border-border py-2.5">
               <p className="text-xs md:text-sm text-muted-foreground">
                  {t('showingOf', { shown: allProducts.length, total: totalProducts })}
               </p>
               <div className="flex items-center gap-2">
                  {/* Sort — native select so mobile gets the OS picker for free. */}
                  <label className="relative flex items-center">
                     <span className="sr-only">{t('sortBy')}</span>
                     <select
                        value={filter || ''}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="appearance-none bg-transparent pl-2 pr-7 py-1.5 text-xs md:text-sm font-medium text-ink border border-border rounded-sm cursor-pointer hover:border-ink/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                     >
                        {sortOptions.map((o) => (
                           <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                     </select>
                     <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-ink/60" />
                  </label>
                  {/* Filters trigger — mobile only; desktop uses the static sidebar */}
                  <Button
                     variant="outline"
                     size="sm"
                     className="gap-2 md:hidden flex-shrink-0"
                     onClick={() => setFiltersOpen(true)}
                  >
                     <SlidersHorizontal className="h-4 w-4" />
                     {t('filters')}
                  </Button>
               </div>
            </div>

            {activeChips.length > 0 && (
               <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={t('activeFilters')}>
                  {activeChips.map((chip) => (
                     <button
                        key={chip.key}
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={t('removeFilter', { label: chip.label })}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-secondary/60 pl-3 pr-2 py-1 text-xs font-medium text-ink hover:border-ink/40 transition-colors"
                     >
                        {chip.label}
                        <X className="h-3 w-3 text-ink/50 group-hover:text-ink" />
                     </button>
                  ))}
                  {activeChips.length > 1 && (
                     <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-ink"
                     >
                        {t('resetAll')}
                     </button>
                  )}
               </div>
            )}

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
               <SheetContent
                  side="left"
                  className="w-[300px] sm:w-[400px]"
                  onOpenAutoFocus={(e) => e.preventDefault()}
               >
                  <SheetTitle className="sr-only">{t('filters')}</SheetTitle>
                  <div className="py-6 h-[calc(100vh-100px)] overflow-y-auto">
                     <ShopSidebar {...sidebarProps} />
                  </div>
               </SheetContent>
            </Sheet>
         </div>

         <div className={`transition-opacity duration-300 ${isPending && !isLoadingMore ? 'opacity-50' : 'opacity-100'}`}>
             {allProducts.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-6 px-3 md:px-0">
                    {allProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={firstPaintIds.has(product.id) ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: (index % limitPerPage) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <ProductCard product={product} priority={index < 4} />
                        </motion.div>
                    ))}
                    </div>

                    {/* Sentinel for infinite scroll — observed instead of a scroll listener */}
                    {pagination.hasMore && <div ref={loadMoreSentinelRef} className="h-1" />}

                    {/* Crawler-only pagination link — see nextPageHref comment above */}
                    {nextPageHref && (
                        <a
                            href={nextPageHref}
                            onClick={(e) => e.preventDefault()}
                            className="hidden"
                            aria-hidden="true"
                            tabIndex={-1}
                        >
                            Next page
                        </a>
                    )}

                    {/* Loading Indicator for Infinite Scroll */}
                    {/* Skeleton cards for the incoming page, in the same grid
                        rhythm, instead of a lone spinner. */}
                    {isLoadingMore && (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-6 px-3 md:px-0">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="aspect-[4/5] md:aspect-[3/4] w-full rounded-sm" />
                                    <Skeleton className="h-3.5 w-3/4 md:mx-auto" />
                                    <Skeleton className="h-3.5 w-1/3 md:mx-auto" />
                                </div>
                            ))}
                        </div>
                    )}
                </>
             ) : (
                <div className="flex flex-col items-center text-center py-16 md:py-20 px-6 bg-secondary/40 border border-dashed border-border rounded-sm">
                    <SearchX className="h-8 w-8 text-gold-deep mb-4" strokeWidth={1.5} />
                    <h2 className="font-heading text-lg md:text-xl text-ink mb-1">{t('emptyTitle')}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">{t('emptyHint')}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            className="rounded-none uppercase tracking-wider text-xs"
                            onClick={clearAllFilters}
                        >
                            {t('clearFilters')}
                        </Button>
                        <Button asChild className="rounded-none uppercase tracking-wider text-xs bg-ink text-ivory hover:bg-gold-deep">
                            <Link href="/shop?popular=true">{t('popularPicks')}</Link>
                        </Button>
                    </div>
                </div>
             )}
         </div>
      </div>

      <AnimatePresence>
        {showFloatingFilters && !filtersOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={() => setFiltersOpen(true)}
            // Sits above the h-16 BottomNav, centered so it clears the
            // right-aligned mobile scroll-to-top button.
            className="md:hidden fixed bottom-20 inset-x-0 mx-auto w-fit z-40 flex items-center gap-2 rounded-full bg-ink text-ivory px-5 py-2.5 text-xs font-semibold uppercase tracking-widest shadow-lg active:bg-gold-deep"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('filters')}
            {activeChips.length > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] text-ink">
                {activeChips.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}



import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Hero from "@/components/shared/Hero";
import BrandTicker from '@/components/home/brand-ticker';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import CategoryCarousel from '@/components/home/category-carousel';
import dynamic from 'next/dynamic';
import SeasonalCollectionSection from '@/components/home/seasonal-collection-section';
import ProductCard from '@/components/shared/ProductCard';
import {
  getActiveSeasonalCollections,
  getSeasonalSectionSettings,
  resolveVisibleSeasonalCollections,
} from '@/lib/seasonal-collections-data';
import { getActiveHeroSlides } from '@/lib/hero-slides-data';
import { getActiveCategoryTiles } from '@/lib/category-tiles-data';
import type { CategoryTile } from '@/types';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';
// TEMP DEMO DATA — see src/lib/demo-data.ts for removal steps.
import { DEMO_CATEGORIES, DEMO_NEW_ARRIVALS } from '@/lib/demo-data';

const BrandBreaker = dynamic(() => import('@/components/home/brand-breaker'), {
  ssr: true,
});
import ElegantSeparator from '@/components/ui/elegant-separator';

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function Home() {
  // Cookie-free client: this page only reads public data, and cookies() would
  // force fully dynamic (uncached) rendering, overriding `revalidate` above.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Skips these 3 network calls entirely when Supabase isn't configured
  // (e.g. a placeholder URL) — otherwise each one still attempts a request
  // that only fails after a slow DNS lookup, adding real latency to every
  // page load for no benefit since they'd resolve to empty data anyway.
  const supabaseConfigured = isSupabaseConfigured();
  const emptyQueryResult = Promise.resolve({ data: null, error: null } as { data: any; error: any });

  // These 3 queries are fully independent — run them concurrently instead of
  // awaiting each one in sequence.
  const [
    { data: newArrivals },
    { data: categories },
    { data: brands },
    seasonalCollections,
    seasonalSettings,
    heroSlides,
    categoryTiles,
  ] = await Promise.all([
    // New Arrivals (last 8 created)
    supabaseConfigured
      ? supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8)
      : emptyQueryResult,
    // Categories
    supabaseConfigured ? supabase.from('categories').select('*').order('name') : emptyQueryResult,
    // Brands — no brands are currently flagged is_featured in the DB, which
    // silently emptied this ticker down to the hardcoded fallback names.
    // Use the same "has active products" pattern as the shop page's brand
    // list instead, so this shows real catalog data.
    supabaseConfigured
      ? supabase.from('brands').select('name, slug, products!inner(id)').eq('products.is_active', true).order('name').limit(24)
      : emptyQueryResult,
    getActiveSeasonalCollections(),
    getSeasonalSectionSettings(),
    getActiveHeroSlides(),
    getActiveCategoryTiles(),
  ]);

  // TEMP DEMO DATA: fall back to mock content only when the real query came
  // back empty, so this is a no-op once the DB actually has data. Remove
  // these two lines (and go back to using newArrivals/categories directly
  // below) per src/lib/demo-data.ts.
  const displayNewArrivals = newArrivals && newArrivals.length > 0 ? newArrivals : DEMO_NEW_ARRIVALS;
  const displayCategories = categories && categories.length > 0 ? categories : DEMO_CATEGORIES;

  const visibleSeasonalCollections = resolveVisibleSeasonalCollections(
    seasonalCollections,
    seasonalSettings.seasonal_collections_multi_active
  );
  const seasonalPosition = seasonalSettings.seasonal_section_position;
  const seasonalSection = visibleSeasonalCollections.length > 0 ? (
    <SeasonalCollectionSection collections={visibleSeasonalCollections} />
  ) : null;

  // Fallback used only if /admin/marketing/category-tiles has no rows yet —
  // matches the migration's seed data so the grid never renders empty.
  const FALLBACK_TILES: CategoryTile[] = [
    { id: 'fallback-1', label: "Women's", link_href: '/shop?audience=Women', image_url: 'https://images.unsplash.com/photo-1774682060959-efe13b7a12b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', col_span: 2, row_span: 2, display_order: 0, is_active: true, created_at: '', updated_at: '' },
    { id: 'fallback-2', label: "Men's", link_href: '/shop?audience=Men', image_url: 'https://images.unsplash.com/photo-1780943004155-1b2c5424fb2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', col_span: 2, row_span: 1, display_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'fallback-3', label: 'Unisex', link_href: '/shop?audience=Unisex', image_url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700', col_span: 1, row_span: 1, display_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: 'fallback-4', label: 'Niche', link_href: '/shop?category=niche-perfumes', image_url: 'https://images.unsplash.com/photo-1780811070739-faa3b575b669?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700', col_span: 1, row_span: 1, display_order: 3, is_active: true, created_at: '', updated_at: '' },
  ];
  const collections = categoryTiles.length > 0 ? categoryTiles : FALLBACK_TILES;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cangday.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Cangday",
    url: siteUrl,
    description: "An edited collection of designer and niche perfumes for everyday wear.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── 1. Hero Section (Full Screen) ── */}
      <Hero slides={heroSlides} />
      {seasonalPosition === 'after_hero' && seasonalSection}

      {/* ── 2. Brand Ticker (Infinite Loop) ── */}
      <BrandTicker brands={brands || []} />
      {seasonalPosition === 'after_brand_ticker' && seasonalSection}

      {/* ── 3. Category Discovery — framed gallery cards, not full-bleed
             overlay tiles with a hover-reveal caption (the generic pattern
             Royal used, shared by most fashion e-commerce templates). Each
             tile is a small "matted print": image inset with a frame margin,
             caption always visible on its own plaque strip below. ── */}
      <section className="py-8 md:py-12 w-full bg-ivory">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 md:mb-6">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-2">
              Shop by Category
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-medium text-ink">
              Find Your Category
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-2.5 md:gap-4 md:h-[520px]">
            {collections.map((item) => {
              // Tailwind's JIT needs these as literal strings somewhere in
              // source (not built from a template string) to generate them.
              const colSpanClass = { 1: '', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4' }[item.col_span];
              const rowSpanClass = { 1: 'md:row-span-1', 2: 'md:row-span-2' }[item.row_span];
              // Mobile is a fixed 2-up grid (spans only apply from md up), so
              // every tile gets the same compact aspect-square there. At md
              // the per-item ratio class is inert: with both md:w-full and
              // md:h-full making the tile's width/height explicit (not
              // "auto"), aspect-ratio has no dimension left to compute from,
              // so the tile simply fills its grid area instead of shrinking
              // to satisfy the ratio (which is what happened without the
              // explicit md:w-full — the box shrank to keep the ratio and
              // left blank space in the rest of its grid cell).
              const aspectClass = item.row_span === 2 ? 'md:aspect-[3/4]' : item.col_span >= 2 ? 'md:aspect-[4/3]' : 'md:aspect-square';

              return (
              <Link
                key={item.id}
                href={item.link_href}
                className={`group flex flex-col bg-ivory border border-border hover:border-gold/50 transition-colors overflow-hidden ${colSpanClass} ${rowSpanClass} aspect-square ${aspectClass} md:h-full md:w-full`}
              >
                <div className="relative flex-1 overflow-hidden m-1.5 mb-0 md:m-2">
                  <Image
                    src={item.image_url}
                    alt={item.label}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 50vw, 50vw"
                    // One consistent grading pass (desaturate + warm + darken) so
                    // photos from different sources still read as one material.
                    className="object-cover transition-all duration-700 group-hover:scale-105 [filter:grayscale(0.55)_sepia(0.2)_saturate(0.85)_brightness(0.72)]"
                  />
                </div>
                <div className="flex items-center justify-between px-2.5 py-2 md:px-4 md:py-3.5 shrink-0">
                  <h3 className="text-sm md:text-xl font-heading text-ink font-medium truncate">
                    {item.label}
                  </h3>
                  <ArrowRight className="hidden md:block h-4 w-4 text-gold-deep -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>
      {seasonalPosition === 'after_gender_collection' && seasonalSection}

      <ElegantSeparator />

      {/* ── 4. Browse by Type (Carousel) — deliberately distinct wording and
             layout from "Find Your Category" above: that one is audience
             (Men/Women/Unisex/Niche), this is product type (Perfumes, Body
             Mists, Gift Sets…), so the two sections don't read as repeats. ── */}
      <section className="py-5 md:py-7 w-full bg-secondary/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-3 md:mb-4">
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
              Every Format
            </p>
            <h2 className="text-lg md:text-2xl font-heading font-medium">
              Browse by Type
            </h2>
          </div>
        </div>

        {/* Full-bleed — intentionally outside the max-width container so the
            cards run edge to edge instead of being boxed in by page padding. */}
        {displayCategories && displayCategories.length > 0 ? (
          <CategoryCarousel categories={displayCategories} />
        ) : (
          <div className="text-center text-muted-foreground py-10">
            No categories found.
          </div>
        )}
      </section>
      {seasonalPosition === 'after_category_carousel' && seasonalSection}

      <ElegantSeparator />

      {/* ── 5. Just Arrived — a dense grid (not a carousel) so it reads like
             a mini shop preview: more products visible at once, stacked the
             same way the real /shop listing stacks them. On mobile, a
             solid "Shop Now" button sits right under the heading (before the
             grid) as the fast path — one obvious tap to the full, pre-filtered
             listing for anyone who doesn't want to browse card-by-card. ── */}
      <section className="py-5 md:py-7 w-full bg-secondary/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-3 md:mb-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
                Fresh In
              </p>
              <h2 className="text-lg md:text-2xl font-heading font-medium">
                Just Arrived
              </h2>
            </div>
            <Link
              href="/shop?filter=new"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-ink hover:text-gold-deep transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Link
            href="/shop?filter=new"
            className="md:hidden mb-4 flex items-center justify-center gap-2 w-full bg-ink text-ivory py-3.5 rounded-sm text-sm font-semibold uppercase tracking-widest active:bg-gold active:text-ink transition-colors"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>

          {displayNewArrivals && displayNewArrivals.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6 md:gap-6">
              {displayNewArrivals.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No products yet.
            </div>
          )}
        </div>
      </section>
      {seasonalPosition === 'after_new_arrivals' && seasonalSection}

       {/* ── 7. Brand Breaker (quote) ── */}
      <BrandBreaker />
      {seasonalPosition === 'before_footer' && seasonalSection}
    </div>
  );
}

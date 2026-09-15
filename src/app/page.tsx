

import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Hero from "@/components/shared/Hero";
import BrandTicker from '@/components/home/brand-ticker';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import CategoryCarousel from '@/components/home/category-carousel';
import dynamic from 'next/dynamic';
import { StarBorder } from '@/components/ui/star-border';
import SeasonalCollectionSection from '@/components/home/seasonal-collection-section';
import {
  getActiveSeasonalCollections,
  getSeasonalSectionSettings,
  resolveVisibleSeasonalCollections,
} from '@/lib/seasonal-collections-data';
import { getActiveHeroSlides } from '@/lib/hero-slides-data';
import { getActiveCategoryTiles } from '@/lib/category-tiles-data';
import type { CategoryTile } from '@/types';
import { getAllPosts } from '@/lib/blog';

const ProductCarousel = dynamic(() => import('@/components/home/product-carousel'), {
  loading: () => <div className="h-[400px] flex items-center justify-center">Loading...</div>,
  ssr: true,
});

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

  // Local filesystem read, not a network call — fine to run synchronously
  // alongside the Supabase queries below rather than adding it to Promise.all.
  const recentPosts = getAllPosts().slice(0, 3);

  // These 4 queries are fully independent — run them concurrently instead of
  // awaiting each one in sequence.
  const [
    { data: bestSellers },
    { data: newArrivals },
    { data: categories },
    { data: brands },
    seasonalCollections,
    seasonalSettings,
    heroSlides,
    categoryTiles,
  ] = await Promise.all([
    // Best Sellers (top 8 active products by sales_count)
    supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .order('sales_count', { ascending: false })
      .limit(8),
    // New Arrivals (last 8 created)
    supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    // Categories
    supabase.from('categories').select('*').order('name'),
    // Brands — no brands are currently flagged is_featured in the DB, which
    // silently emptied this ticker down to the hardcoded fallback names.
    // Use the same "has active products" pattern as the shop page's brand
    // list instead, so this shows real catalog data.
    supabase.from('brands').select('name, slug, products!inner(id)').eq('products.is_active', true).order('name').limit(24),
    getActiveSeasonalCollections(),
    getSeasonalSectionSettings(),
    getActiveHeroSlides(),
    getActiveCategoryTiles(),
  ]);

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
      <section className="py-16 md:py-24 w-full bg-ivory">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-3">
              Shop by Category
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-ink">
              Find Your Category
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[720px]">
            {collections.map((item) => {
              // Tailwind's JIT needs these as literal strings somewhere in
              // source (not built from a template string) to generate them.
              const colSpanClass = { 1: '', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4' }[item.col_span];
              const rowSpanClass = { 1: 'md:row-span-1', 2: 'md:row-span-2' }[item.row_span];
              const aspectClass = item.row_span === 2 ? 'aspect-[3/4]' : item.col_span >= 2 ? 'aspect-[4/3]' : 'aspect-square';

              return (
              <Link
                key={item.id}
                href={item.link_href}
                className={`group flex flex-col bg-ivory border border-border hover:border-gold/50 transition-colors overflow-hidden ${colSpanClass} ${rowSpanClass} ${aspectClass} md:aspect-auto md:h-full`}
              >
                <div className="relative flex-1 overflow-hidden m-2 mb-0">
                  <Image
                    src={item.image_url}
                    alt={item.label}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    // One consistent grading pass (desaturate + warm + darken) so
                    // photos from different sources still read as one material.
                    className="object-cover transition-all duration-700 group-hover:scale-105 [filter:grayscale(0.55)_sepia(0.2)_saturate(0.85)_brightness(0.72)]"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3.5 shrink-0">
                  <h3 className="text-lg md:text-xl font-heading text-ink font-medium">
                    {item.label}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-gold-deep -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
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
      <section className="py-16 md:py-24 w-full bg-secondary/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
              Every Format
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-medium">
              Browse by Type
            </h2>
          </div>

          {categories && categories.length > 0 ? (
            <CategoryCarousel categories={categories} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No categories found.
            </div>
          )}
        </div>
      </section>
      {seasonalPosition === 'after_category_carousel' && seasonalSection}

      <ElegantSeparator />

      {/* ── 5. Best Sellers (Product Carousel) ── */}
      <section className="py-16 md:py-24 w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
                Most Loved
              </p>
              <h2 className="text-3xl md:text-5xl font-heading font-medium">
                Best Sellers
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-ink hover:text-gold-deep transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {bestSellers && bestSellers.length > 0 ? (
            <ProductCarousel products={bestSellers} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No products yet.
            </div>
          )}

          <div className="mt-12 flex justify-center md:hidden w-full max-w-sm mx-auto">
            <Link href="/shop" className="w-full">
              <StarBorder as="div" color="rgb(var(--brand-gold))" speed="3s" thickness={3} className="uppercase tracking-widest text-sm font-medium">
                View All Products
              </StarBorder>
            </Link>
          </div>
        </div>
      </section>
      {seasonalPosition === 'after_best_sellers' && seasonalSection}

      <ElegantSeparator />

      {/* ── 7. New Arrivals (Product Carousel) ── */}
      <section className="py-16 md:py-24 w-full bg-secondary/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
                Fresh In
              </p>
              <h2 className="text-3xl md:text-5xl font-heading font-medium">
                Just Arrived
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-ink hover:text-gold-deep transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {newArrivals && newArrivals.length > 0 ? (
            <ProductCarousel products={newArrivals} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No products yet.
            </div>
          )}

          <div className="mt-12 flex justify-center md:hidden w-full max-w-sm mx-auto">
            <Link href="/shop" className="w-full">
              <StarBorder as="div" color="rgb(var(--brand-gold))" speed="4s" thickness={2} className="uppercase tracking-widest text-sm font-medium">
                Shop New Arrivals
              </StarBorder>
            </Link>
          </div>
        </div>
      </section>
      {seasonalPosition === 'after_new_arrivals' && seasonalSection}

      {recentPosts.length > 0 && (
        <>
          <ElegantSeparator className="opacity-30" />
          {/* ── 10. Fragrance Journal (Blog) ── */}
          <section className="py-16 md:py-24 w-full bg-secondary/50">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-12">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-heading font-medium">
                    The Journal
                  </h2>
                  <p className="text-muted-foreground font-body text-lg">
                    Notes on fragrance, layering, and finding your signature scent.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="hidden md:flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4"
                >
                  Read More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {recentPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-secondary mb-4">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      {post.readingTime}
                    </p>
                    <h3 className="font-heading text-xl font-medium text-foreground group-hover:text-gold-deep transition-colors leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                ))}
              </div>

              <div className="mt-10 flex justify-center md:hidden">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium border-b border-ink pb-1">
                  Read More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

       {/* ── 11. Brand Breaker (quote) ── */}
      <BrandBreaker />
      {seasonalPosition === 'before_footer' && seasonalSection}
    </div>
  );
}



import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Hero from "@/components/shared/Hero";
import BrandTicker from '@/components/home/brand-ticker';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, Shield, Clock } from 'lucide-react';
import CategoryCarousel from '@/components/home/category-carousel';
import dynamic from 'next/dynamic';
import { StarBorder } from '@/components/ui/star-border';
import PromoBanners from '@/components/home/promo-banners';
import SeasonalCollectionSection from '@/components/home/seasonal-collection-section';
import {
  getActiveSeasonalCollections,
  getSeasonalSectionSettings,
  resolveVisibleSeasonalCollections,
} from '@/lib/seasonal-collections-data';
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
  ]);

  const visibleSeasonalCollections = resolveVisibleSeasonalCollections(
    seasonalCollections,
    seasonalSettings.seasonal_collections_multi_active
  );
  const seasonalPosition = seasonalSettings.seasonal_section_position;
  const seasonalSection = visibleSeasonalCollections.length > 0 ? (
    <SeasonalCollectionSection collections={visibleSeasonalCollections} />
  ) : null;

  // Sourced for design-review placeholder use — swapped for real Cangday
  // product photography once the catalog/image migration lands.
  const collections = [
    {
      label: "Women's",
      audience: 'Women',
      image: 'https://images.unsplash.com/photo-1774682060959-efe13b7a12b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
      span: 'md:col-span-2 md:row-span-2',
      aspect: 'aspect-[3/4]',
    },
    {
      label: "Men's",
      audience: 'Men',
      image: 'https://images.unsplash.com/photo-1780943004155-1b2c5424fb2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
      span: 'md:col-span-2 md:row-span-1',
      aspect: 'aspect-[4/3]',
    },
    {
      label: 'Unisex',
      audience: 'Unisex',
      image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700',
      span: 'md:row-span-1',
      aspect: 'aspect-square',
    },
    {
      label: 'Niche',
      audience: undefined,
      image: 'https://images.unsplash.com/photo-1780811070739-faa3b575b669?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700',
      span: 'md:row-span-1',
      aspect: 'aspect-square',
    },
  ] as const;

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
      <Hero />
      {seasonalPosition === 'after_hero' && seasonalSection}

      {/* ── 2. Brand Ticker (Infinite Loop) ── */}
      <BrandTicker brands={brands || []} />
      {seasonalPosition === 'after_brand_ticker' && seasonalSection}

      {/* ── 3. Category Discovery (asymmetric bento — not four equal squares) ── */}
      <section className="py-16 md:py-24 w-full bg-ivory">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-ink">
              Find Your Category
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 md:h-[640px]">
            {collections.map((item) => (
              <Link
                key={item.label}
                href={item.audience ? `/shop?audience=${item.audience}` : '/shop?category=niche-perfumes'}
                className={`group relative overflow-hidden block ${item.span} ${item.aspect} md:aspect-auto`}
              >
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  // One consistent grading pass (desaturate + warm + darken) so
                  // photos from different sources still read as one material.
                  className="object-cover transition-all duration-700 group-hover:scale-105 [filter:grayscale(0.55)_sepia(0.2)_saturate(0.85)_brightness(0.72)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-6">
                  <h3 className="text-2xl md:text-3xl font-heading text-ivory font-medium">
                    {item.label}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {seasonalPosition === 'after_gender_collection' && seasonalSection}

      <ElegantSeparator />

      {/* ── 4. Shop by Category (Carousel) ── */}
      <section className="py-16 md:py-24 w-full bg-secondary/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-5xl font-heading font-medium">
              Shop by Category
            </h2>
            <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
              Explore our exquisite range of fragrances and body care products.
            </p>
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
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-heading font-medium">
                Best Sellers
              </h2>
              <p className="text-muted-foreground font-body text-lg">
                Our most loved fragrances.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4"
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
              <StarBorder as="div" color="#C9A24B" speed="3s" thickness={3} className="uppercase tracking-widest text-sm font-medium">
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
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-heading font-medium">
                Just Arrived
              </h2>
              <p className="text-muted-foreground font-body text-lg">
                The latest additions to our collection.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4"
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
              <StarBorder as="div" color="#C9A24B" speed="4s" thickness={2} className="uppercase tracking-widest text-sm font-medium">
                Shop New Arrivals
              </StarBorder>
            </Link>
          </div>
        </div>
      </section>
      {seasonalPosition === 'after_new_arrivals' && seasonalSection}

      {/* ── 8. Retail Promotions (first order / bundle / gift threshold) ── */}
      <PromoBanners />

      {/* ── 9. Shipping Info ── */}
      <Link href="/shipping" className="block">
        <section className="py-16 w-full bg-ivory transition-colors cursor-pointer group">
          <h2 className="sr-only">Shipping & Delivery Information</h2>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">

              {/* Item 1 */}
              <div className="flex flex-col items-center text-center space-y-4 py-8 md:py-0 px-4">
                <Truck className="h-10 w-10 text-gold-deep stroke-[1.5] group-hover:scale-110 transition-transform duration-500" />
                <div className="space-y-2">
                  <h3 className="font-heading text-xl md:text-2xl font-medium tracking-wide text-ink">Worldwide Shipping</h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs mx-auto">
                    We deliver every bottle straight to your door, wherever you are.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex flex-col items-center text-center space-y-4 py-8 md:py-0 px-4">
                <Shield className="h-10 w-10 text-gold-deep stroke-[1.5] group-hover:scale-110 transition-transform duration-500" />
                <div className="space-y-2">
                  <h3 className="font-heading text-xl md:text-2xl font-medium tracking-wide text-ink">Secure Packaging</h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs mx-auto">
                    Every bottle is encased in premium protective packaging.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex flex-col items-center text-center space-y-4 py-8 md:py-0 px-4">
                <Clock className="h-10 w-10 text-gold-deep stroke-[1.5] group-hover:scale-110 transition-transform duration-500" />
                <div className="space-y-2">
                  <h3 className="font-heading text-xl md:text-2xl font-medium tracking-wide text-ink">Fast Delivery</h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs mx-auto">
                    Express shipping options available for urgent gifts.
                  </p>
                </div>
              </div>

            </div>

            <div className="mt-12 text-center">
              <span className="inline-flex items-center text-sm font-medium text-ink border-b border-ink pb-1 group-hover:text-gold-deep group-hover:border-gold-deep transition-colors">
                View Full Shipping Policy <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </div>
          </div>
        </section>
      </Link>

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

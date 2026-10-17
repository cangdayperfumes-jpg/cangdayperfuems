

import { createClient } from '@supabase/supabase-js';
import { PLACEHOLDER_SUPABASE_URL } from '@/utils/supabase/placeholder';
import Hero from "@/components/shared/Hero";
import BrandTicker from '@/components/home/brand-ticker';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import CategoryCarousel from '@/components/home/category-carousel';
import DiscoverCategories from '@/components/home/discover-categories';
import SeasonalCollectionSection from '@/components/home/seasonal-collection-section';
import {
  getActiveSeasonalCollections,
  getSeasonalSectionSettings,
  resolveVisibleSeasonalCollections,
} from '@/lib/seasonal-collections-data';
import { getActiveHeroSlides } from '@/lib/hero-slides-data';
import { getActiveCategoryTiles } from '@/lib/category-tiles-data';
import type { CategoryTile } from '@/types';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';
import { getTranslations } from 'next-intl/server';

import NewArrivalsCarousel from '@/components/home/new-arrivals-carousel';
// Same generic carousel reused for Best Sellers — it only ever takes a
// products array, no "new arrivals"-specific behavior baked in.
import BestSellersCarousel from '@/components/home/new-arrivals-carousel';
import QuickNav from '@/components/home/quick-nav';
import PromoBanners from '@/components/home/promo-banners';
import TrustBadges from '@/components/home/trust-badges';
import Testimonials from '@/components/home/testimonials';
import { getActiveTestimonials } from '@/lib/testimonials-data';
import Reveal from '@/components/shared/Reveal';

export const revalidate = 60;

// No page-level canonical: the [locale] layout already sets it to
// `${siteUrl}/${locale}` — a fixed '/' here made /en point at the bare
// domain, which redirects to /tr.

export default async function Home() {
  const t = await getTranslations('home');
  // Cookie-free client: this page only reads public data, and cookies() would
  // force fully dynamic (uncached) rendering, overriding `revalidate` above.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
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
    { data: bestSellers },
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
    // Best Sellers (highest sales_count first)
    supabaseConfigured
      ? supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('is_active', true)
          .order('sales_count', { ascending: false })
          .limit(8)
      : emptyQueryResult,
    // Categories
    supabaseConfigured ? supabase.from('categories').select('*').order('name') : emptyQueryResult,
    // Brands — no brands are currently flagged is_featured in the DB, which
    // silently emptied this ticker down to the hardcoded fallback names.
    // Use the same "has active products" pattern as the shop page's brand
    // list instead, so this shows real catalog data.
    supabaseConfigured
      ? supabase.from('brands').select('name, slug, image_url, products!inner(id)').eq('products.is_active', true).order('name').limit(24)
      : emptyQueryResult,
    getActiveSeasonalCollections(),
    getSeasonalSectionSettings(),
    getActiveHeroSlides(),
    getActiveCategoryTiles(),
  ]);

  const testimonials = await getActiveTestimonials();

  const visibleSeasonalCollections = resolveVisibleSeasonalCollections(
    seasonalCollections,
    seasonalSettings.seasonal_collections_multi_active
  );
  const seasonalPosition = seasonalSettings.seasonal_section_position;
  const seasonalSection = visibleSeasonalCollections.length > 0 ? (
    <SeasonalCollectionSection collections={visibleSeasonalCollections} />
  ) : null;

  // Fallback used only if /admin/marketing/category-tiles has no rows yet —
  // same shape the migration seeds, except the last two slots point at real
  // product-type categories (Gift Sets, Body Mists) instead of the removed
  // Designer/Niche concept the original seed's "Niche" tile dangled a link
  // to (`category=niche-perfumes` — that category no longer exists; see
  // 20260730000000_replace_type_with_popular.sql). DiscoverCategories maps
  // these four link patterns to localized copy; any other admin-added tile
  // falls back to its own label.
  const FALLBACK_TILES: CategoryTile[] = [
    { id: 'fallback-1', label: "Women's", link_href: '/shop?audience=Women', image_url: 'https://images.unsplash.com/photo-1774682060959-efe13b7a12b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', col_span: 2, row_span: 2, display_order: 0, is_active: true, created_at: '', updated_at: '' },
    { id: 'fallback-2', label: "Men's", link_href: '/shop?audience=Men', image_url: 'https://images.unsplash.com/photo-1780943004155-1b2c5424fb2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', col_span: 2, row_span: 1, display_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'fallback-3', label: 'Gift Sets', link_href: '/shop?category=gift-sets', image_url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700', col_span: 1, row_span: 1, display_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: 'fallback-4', label: 'Body Mists', link_href: '/shop?category=body-mists', image_url: 'https://images.unsplash.com/photo-1780811070739-faa3b575b669?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700', col_span: 1, row_span: 1, display_order: 3, is_active: true, created_at: '', updated_at: '' },
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
      target: `${siteUrl}/shop?q={search_term_string}`,
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

      {/* ── 1a. Trust Badges — static icon grid restating the same facts as
             the top marquee, but prominent and unmissable right under the
             hero's emotional pitch, before any product content. ── */}
      <Reveal>
        <TrustBadges />
      </Reveal>

      {/* ── 2. Brand Ticker (Infinite Loop) ── */}
      <BrandTicker brands={brands || []} />
      {seasonalPosition === 'after_brand_ticker' && seasonalSection}

      {/* ── 3. Category Discovery — large, image-driven editorial cards
             (Women's/Men's as the hero pair, Gift Sets/Body Mists secondary)
             with bottom-anchored gradient overlays, bilingual via
             next-intl rather than the admin-entered `label` column (which
             isn't locale-aware). Replaces the previous compact "matted
             print" bento — kept as one section rather than two, since both
             were the same audience-driven category story at different
             sizes. ── */}
      <Reveal>
        <DiscoverCategories tiles={collections} />
      </Reveal>
      {seasonalPosition === 'after_gender_collection' && seasonalSection}

      {/* ── 3a. Quick Nav — icon shortcuts straight to real shop filters. ── */}
      <Reveal>
        <QuickNav />
      </Reveal>

      {/* ── 3b. Best Sellers — ranked by sales_count, the same carousel
             component as "Just Arrived" below (it's generic over any product
             list), so this doesn't duplicate carousel logic for a second
             product rail. ── */}
      <section className="py-4 md:py-5 w-full bg-ivory">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex items-end justify-between mb-3 md:mb-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
                {t('mostLoved')}
              </p>
              <h2 className="text-lg md:text-2xl font-heading font-medium">
                {t('bestSellers')}
              </h2>
            </div>
            <Link
              href="/shop?filter=best"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-ink hover:text-gold-deep transition-colors"
            >
              {t('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Link
            href="/shop?filter=best"
            className="md:hidden mb-4 flex items-center justify-center gap-2 w-full bg-ink text-ivory py-3.5 rounded-sm text-sm font-semibold uppercase tracking-widest active:bg-gold active:text-ink transition-colors"
          >
            {t('shopNow')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Reveal delay={0.1} className="max-w-[1400px] mx-auto">
          {bestSellers && bestSellers.length > 0 ? (
            <BestSellersCarousel products={bestSellers} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              {t('noProductsYet')}
            </div>
          )}
        </Reveal>
      </section>

      {/* ── 4. Browse by Type (Carousel) — deliberately distinct from
             "Find Your Category" above: that's a curated 4-tile editorial
             mix (Women's/Men's plus two product types), this is the full,
             exhaustive list of every product-type category (Perfumes, Body
             Mists, Gift Sets…), so the two sections don't read as repeats. ── */}
      <section className="py-4 md:py-5 w-full bg-secondary/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-3 md:mb-4">
          <Reveal className="text-center space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
              {t('everyFormat')}
            </p>
            <h2 className="text-lg md:text-2xl font-heading font-medium">
              {t('browseByType')}
            </h2>
          </Reveal>
        </div>

        {/* Full-bleed — intentionally outside the max-width container so the
            cards run edge to edge instead of being boxed in by page padding. */}
        {categories && categories.length > 0 ? (
          <Reveal delay={0.1}>
            <CategoryCarousel categories={categories} />
          </Reveal>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            {t('noCategoriesFound')}
          </div>
        )}
      </section>
      {seasonalPosition === 'after_category_carousel' && seasonalSection}

      {/* ── 5. Just Arrived — a single-row, infinite-loop carousel (same
             continuous-auto-scroll technique as CategoryCarousel above):
             4 cards visible at once on desktop, 2 on mobile, looping
             seamlessly left/right instead of wrapping into a multi-row grid.
             On mobile, a solid "Shop Now" button sits right under the
             heading (before the row) as the fast path — one obvious tap to
             the full, pre-filtered listing for anyone who doesn't want to
             scroll card-by-card. ── */}
      <section className="py-4 md:py-5 w-full bg-secondary/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex items-end justify-between mb-3 md:mb-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold">
                {t('freshIn')}
              </p>
              <h2 className="text-lg md:text-2xl font-heading font-medium">
                {t('justArrived')}
              </h2>
            </div>
            <Link
              href="/shop?filter=new"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-ink hover:text-gold-deep transition-colors"
            >
              {t('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Link
            href="/shop?filter=new"
            className="md:hidden mb-4 flex items-center justify-center gap-2 w-full bg-ink text-ivory py-3.5 rounded-sm text-sm font-semibold uppercase tracking-widest active:bg-gold active:text-ink transition-colors"
          >
            {t('shopNow')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Capped at the same max-width as every other section and centered
            to match — only the cards bleed to the container's own edges,
            not past it, so this doesn't run wider than the page above it on
            large screens. */}
        <Reveal delay={0.1} className="max-w-[1400px] mx-auto">
          {newArrivals && newArrivals.length > 0 ? (
            <NewArrivalsCarousel products={newArrivals} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              {t('noProductsYet')}
            </div>
          )}
        </Reveal>
      </section>
      {seasonalPosition === 'after_new_arrivals' && seasonalSection}

      {/* ── 6. Promo Banners — discount/bundle/gift-threshold cards. ── */}
      <Reveal>
        <PromoBanners />
      </Reveal>

      {/* ── 7. Testimonials — swipeable customer feedback photos, each
             opening a fullscreen lightbox on click. Replaces the previous
             static quote "brand breaker" section in this slot. ── */}
      <Reveal>
        <Testimonials testimonials={testimonials} />
      </Reveal>
      {seasonalPosition === 'before_footer' && seasonalSection}
    </div>
  );
}

import { createClient } from '@supabase/supabase-js';
import { SITE_URL, localeAlternates } from '@/lib/seo';
import { PLACEHOLDER_SUPABASE_URL } from '@/utils/supabase/placeholder';
import ShopClientWrapper from '@/components/shop/ShopClientWrapper';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getActiveSeasonalCollections } from '@/lib/seasonal-collections-data';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60; // Revalidate every minute, or 0 for dynamic

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
}

// Cache categories with active products (changes rarely)
const getCachedCategories = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase();
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, description, description_tr, is_featured, products!inner(id)')
      .eq('products.is_active', true)
      .order('name');
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      image_url: item.image_url,
      description: item.description,
      description_tr: item.description_tr,
      is_featured: item.is_featured,
    }));
  },
  ['shop-categories'],
  { revalidate: 60, tags: ['products'] }
);

// Cache brands with active products (changes rarely)
const getCachedBrands = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase();
    const { data } = await supabase
      .from('brands')
      .select('id, name, slug, image_url, is_featured, products!inner(id)')
      .eq('products.is_active', true)
      .order('name');
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      image_url: item.image_url,
      is_featured: item.is_featured,
    }));
  },
  ['shop-brands'],
  { revalidate: 60, tags: ['products'] }
);

// Cache all product category_ids for sidebar counts (changes rarely)
const getCachedProductCounts = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return { all: 0 } as Record<string, number>;
    const supabase = getSupabase();

    // fetchAllRows throws on a query error (unlike the categories/brands
    // fetches above, which just fall back to empty data) — catch it here so
    // a transient DB issue degrades the sidebar counts to zero instead of
    // crashing the whole shop page.
    try {
      const rows = await fetchAllRows<{ category_id: string | null }>((from, to) =>
        supabase.from('products').select('category_id').eq('is_active', true).range(from, to)
      );

      const counts: Record<string, number> = {};
      rows.forEach(({ category_id }) => {
        if (category_id) counts[category_id] = (counts[category_id] || 0) + 1;
      });
      counts['all'] = rows.length;
      return counts;
    } catch (error) {
      console.error('Shop Product Counts Error:', error);
      return { all: 0 } as Record<string, number>;
    }
  },
  ['shop-product-counts'],
  { revalidate: 60, tags: ['products'] }
);

/** Minimum price for the Niche collection (Settings → General). Tagged so saving Settings refreshes it. */
const getNicheMinPrice = unstable_cache(
  async (): Promise<number> => {
    if (!isSupabaseConfigured()) return 3000;
    const { data } = await getSupabase().from('system_settings').select('niche_min_price').eq('id', 'global').single();
    const value = Number((data as { niche_min_price?: number } | null)?.niche_min_price);
    return Number.isFinite(value) && value >= 0 ? value : 3000;
  },
  ['niche-min-price'],
  { revalidate: 300, tags: ['site-settings'] }
);

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ searchParams, params }: { searchParams: SearchParams; params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('shop');
  const resolvedParams = await searchParams;
  const categorySlug = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const audience = typeof resolvedParams.audience === 'string' ? resolvedParams.audience : undefined;
  const searchQuery = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const seasonSlug = typeof resolvedParams.season === 'string' ? resolvedParams.season : undefined;
  const niche = resolvedParams.niche === 'true';

  let title = t('metaTitleAll');
  let description = t('metaDescriptionAll');
  let ogImage: string | undefined;

  if (categorySlug) {
    const categories = await getCachedCategories();
    const category = categories.find((c: any) => c.slug === categorySlug);
    if (category) {
      title = category.name;
      const catDescription = (locale === 'tr' && category.description_tr) || category.description;
      if (catDescription && catDescription.length > 50) {
        description = catDescription;
      } else {
        description = t('metaCategoryDescription', { category: category.name });
      }
    }
  } else if (seasonSlug) {
    const collections = await getActiveSeasonalCollections();
    const collection = collections.find((c) => c.slug === seasonSlug);
    if (collection) {
      title = collection.seo_title || collection.title;
      description = collection.seo_description || collection.description || `Shop our ${collection.title} collection at Cangday.`;
      ogImage = collection.banner_image_desktop || undefined;
    }
  } else if (niche) {
    title = t('nicheCollection');
    description = t('metaNicheDescription');
  } else if (audience) {
    title = t('audienceCollection', { audience });
    description = t('metaAudienceDescription', { audience });
  } else if (searchQuery) {
    title = t('metaSearchTitle', { query: searchQuery });
    description = t('metaSearchDescription', { query: searchQuery });
  }

  // To prevent indexing infinite parameter combinations, we set canonical to base shop url if there are many params
  let shopPath = '/shop';
  if (categorySlug && !searchQuery) shopPath += `?category=${encodeURIComponent(categorySlug)}`;
  else if (seasonSlug && !searchQuery) shopPath += `?season=${encodeURIComponent(seasonSlug)}`;
  else if (niche && !searchQuery) shopPath += '?niche=true';
  else if (audience && !searchQuery) shopPath += `?audience=${encodeURIComponent(audience)}`;
  const alternates = localeAlternates(locale, shopPath);
  const canonicalUrl = alternates.canonical as string;

  return {
    title,
    description,
    alternates,
    // Search results are thin, endless duplicates — keep them out of the
    // index but let crawlers follow through to the products.
    ...(searchQuery ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function ShopPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams;
  const supabase = getSupabase();
  const supabaseConfigured = isSupabaseConfigured();

  // Params
  const categorySlug = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const audience = typeof searchParams.audience === 'string' ? searchParams.audience : undefined;
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const filter = typeof searchParams.filter === 'string' ? searchParams.filter : undefined;
  const popularOnly = searchParams.popular === 'true';
  const nicheOnly = searchParams.niche === 'true';
  const seasonSlug = typeof searchParams.season === 'string' ? searchParams.season : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = 12;
  // Always fetch cumulatively from the start through the current page. This way a
  // fresh/cold load at e.g. page=5 (reopened tab, back/forward navigation) returns
  // all products from page 1-5, not just the 12 belonging to page 5.
  const from = 0;
  const to = page * limit - 1;

  // 1. Load cached Categories, Brands, and product counts (all independent — parallel)
  const [categories, brands, productCounts, nicheMinPrice] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getCachedProductCounts(),
    nicheOnly ? getNicheMinPrice() : Promise.resolve(undefined),
  ]);

  if (!categories || !brands) {
      return <div>Error loading data</div>;
  }

  // 2. Determine Category ID if slug is present
  let categoryId: string | undefined;
  if (categorySlug) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
          categoryId = category.id;
      } else if (supabaseConfigured) {
          // Fallback: It might be a valid category but with no active products (filtered out above)
          const { data: fallbackCategory } = await supabase
             .from('categories')
             .select('id')
             .eq('slug', categorySlug)
             .single();

          if (fallbackCategory) {
              categoryId = fallbackCategory.id;
          } else {
              notFound();
          }
      } else {
          notFound();
      }
  }

  // Determine Brand IDs from slugs
  const brandSlugs = typeof searchParams.brands === 'string' ? searchParams.brands.split(',') : [];
  let brandIds: string[] = [];
  if (brandSlugs.length > 0) {
      brandIds = brands.filter(b => brandSlugs.includes(b.slug)).map(b => b.id);
  }

  // 2b. Resolve season slug -> collection id. Unlike categories, an
  // unknown/expired/disabled season slug always 404s — a collection that
  // isn't currently active should never be browsable, that's the entire
  // point of scheduling/enable-disable.
  let seasonCollectionId: string | undefined;
  let seasonTitle: string | undefined;
  if (seasonSlug) {
      const seasonalCollections = await getActiveSeasonalCollections();
      const match = seasonalCollections.find((c) => c.slug === seasonSlug);
      if (match) {
          seasonCollectionId = match.id;
          seasonTitle = match.title;
      } else {
          notFound();
      }
  }

  // 3. Build Product Query. The select() string is built conditionally —
  // an unconditional inner-join embed on seasonal_collection_products would
  // wrongly exclude every product that has zero collection links.
  let selectStr = '*, product_variants(*)';
  if (seasonCollectionId) {
      selectStr += ', seasonal_collection_products!inner(collection_id)';
  }

  let query = supabase
    .from('products')
    .select(selectStr, { count: 'exact' })
    .eq('is_active', true);

  if (categoryId) {
      query = query.eq('category_id', categoryId);
  }

  if (seasonCollectionId) {
      query = query.eq('seasonal_collection_products.collection_id', seasonCollectionId);
  }

  if (brandIds.length > 0) {
      query = query.in('brand_id', brandIds);
  }

  if (popularOnly) {
      query = query.eq('is_popular', true);
  }

  // Niche: highest selling price (incl. sizes — see products.max_price) at or
  // above the minimum set in Settings.
  if (nicheOnly && nicheMinPrice !== undefined) {
      query = query.gte('max_price', nicheMinPrice);
  }

  if (audience) {
      if (audience === 'Men') {
         query = query.in('target_audience', ['Men', 'Unisex']);
      } else if (audience === 'Women') {
         query = query.in('target_audience', ['Women', 'Unisex']);
      } else {
         query = query.eq('target_audience', audience);
      }
  }

  if (searchQuery) {
      // PostgREST's or() takes a comma/parenthesis-delimited filter string, so
      // raw user input containing , ( ) or the ilike wildcards * % could break
      // the query or change what it matches — strip those before interpolating.
      const term = searchQuery.replace(/[,()*%\\:"']/g, ' ').trim().slice(0, 80);
      if (term) {
          const orFilters = [`name_en.ilike.%${term}%`, `description_en.ilike.%${term}%`];
          // Also match by brand name (e.g. "dior"), resolved against the
          // already-cached brand list instead of a second join query.
          const lowerTerm = term.toLowerCase();
          const matchingBrandIds = brands
              .filter((b) => b.name.toLowerCase().includes(lowerTerm))
              .map((b) => b.id);
          if (matchingBrandIds.length > 0) {
              orFilters.push(`brand_id.in.(${matchingBrandIds.join(',')})`);
          }
          query = query.or(orFilters.join(','));
      }
  }

  // 4. Pagination & Sorting
  query = query.range(from, to);
  
  if (filter === 'new') {
      query = query.order('created_at', { ascending: false });
  } else if (filter === 'best') {
      query = query.order('sales_count', { ascending: false });
  } else if (filter === 'price-asc') {
      query = query.order('price', { ascending: true });
  } else if (filter === 'price-desc') {
      query = query.order('price', { ascending: false });
  } else {
      query = query.order('created_at', { ascending: false }); // Default sorting
  }

  const { data: products, count, error } = supabaseConfigured
    ? await query
    : { data: null, count: 0, error: null };

  if (error) {
      console.error("Shop Query Error:", error);
  }

  const totalProducts = count || 0;
  const totalPages = Math.ceil(totalProducts / limit);

  return (
    <div className="container py-8 md:py-12">
      <ShopClientWrapper
        products={(products || []) as any}
        categories={categories}
        brands={brands}
        productCounts={productCounts}
        initialCategorySlug={categorySlug}
        initialAudience={audience}
        initialBrands={brandSlugs}
        initialPopular={popularOnly}
        nicheMinPrice={nicheOnly ? nicheMinPrice : undefined}
        initialFilter={filter}
        initialSeason={seasonSlug}
        seasonTitle={seasonTitle}
        initialSearchQuery={searchQuery}
        totalProducts={totalProducts}
        pagination={{
            page,
            totalPages,
            hasMore: page < totalPages
        }}
      />
    </div>
  );
}

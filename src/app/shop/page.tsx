import { createClient } from '@supabase/supabase-js';
import ShopClientWrapper from '@/components/shop/ShopClientWrapper';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getActiveSeasonalCollections } from '@/lib/seasonal-collections-data';
import { fetchAllRows } from '@/lib/fetch-all-rows';

export const revalidate = 60; // Revalidate every minute, or 0 for dynamic

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Cache categories with active products (changes rarely)
const getCachedCategories = unstable_cache(
  async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, description, is_featured, products!inner(id)')
      .eq('products.is_active', true)
      .order('name');
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      image_url: item.image_url,
      description: item.description,
      is_featured: item.is_featured,
    }));
  },
  ['shop-categories'],
  { revalidate: 60 }
);

// Cache brands with active products (changes rarely)
const getCachedBrands = unstable_cache(
  async () => {
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
  { revalidate: 60 }
);

// Cache all product category_ids for sidebar counts (changes rarely)
const getCachedProductCounts = unstable_cache(
  async () => {
    const supabase = getSupabase();

    const rows = await fetchAllRows<{ category_id: string | null }>((from, to) =>
      supabase.from('products').select('category_id').eq('is_active', true).range(from, to)
    );

    const counts: Record<string, number> = {};
    rows.forEach(({ category_id }) => {
      if (category_id) counts[category_id] = (counts[category_id] || 0) + 1;
    });
    counts['all'] = rows.length;
    return counts;
  },
  ['shop-product-counts'],
  { revalidate: 60 }
);

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const categorySlug = typeof params.category === 'string' ? params.category : undefined;
  const audience = typeof params.audience === 'string' ? params.audience : undefined;
  const searchQuery = typeof params.q === 'string' ? params.q : undefined;
  const seasonSlug = typeof params.season === 'string' ? params.season : undefined;

  let title = 'Shop All';
  let description = 'Browse our extensive collection of luxury perfumes and body care products at Royal Perfumes. Discover the perfect signature scent tailored to your lifestyle.';
  let ogImage: string | undefined;

  if (categorySlug) {
    const categories = await getCachedCategories();
    const category = categories.find((c: any) => c.slug === categorySlug);
    if (category) {
      title = category.name;
      if (category.description && category.description.length > 50) {
        description = category.description;
      } else {
        description = `Explore our premium ${category.name} collection at Royal Perfumes. Discover handcrafted, luxury fragrances and exclusive products designed for everyday elegance.`;
      }
    }
  } else if (seasonSlug) {
    const collections = await getActiveSeasonalCollections();
    const collection = collections.find((c) => c.slug === seasonSlug);
    if (collection) {
      title = collection.seo_title || collection.title;
      description = collection.seo_description || collection.description || `Shop our ${collection.title} collection at Royal Perfumes.`;
      ogImage = collection.banner_image_desktop || undefined;
    }
  } else if (audience) {
    title = `${audience}'s Collection`;
    description = `Shop our exclusive ${audience} fragrance collection at Royal Perfumes. Explore a curated selection of premium, long-lasting luxury perfumes crafted for elegance.`;
  } else if (searchQuery) {
    title = `Search Results for "${searchQuery}"`;
    description = `Explore our premium search results for "${searchQuery}" at Royal Perfumes. Find the perfect luxury fragrance, body care product, or gift set to match your style.`;
  }

  // To prevent indexing infinite parameter combinations, we set canonical to base shop url if there are many params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.royalperfumes.company";
  let canonicalUrl = `${baseUrl}/shop`;
  if (categorySlug && !searchQuery) canonicalUrl += `?category=${categorySlug}`;
  else if (seasonSlug && !searchQuery) canonicalUrl += `?season=${seasonSlug}`;
  else if (audience && !searchQuery) canonicalUrl += `?audience=${audience}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
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

  // Params
  const categorySlug = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const audience = typeof searchParams.audience === 'string' ? searchParams.audience : undefined;
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const filter = typeof searchParams.filter === 'string' ? searchParams.filter : undefined;
  const popularOnly = searchParams.popular === 'true';
  const seasonSlug = typeof searchParams.season === 'string' ? searchParams.season : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = 12;
  // Always fetch cumulatively from the start through the current page. This way a
  // fresh/cold load at e.g. page=5 (reopened tab, back/forward navigation) returns
  // all products from page 1-5, not just the 12 belonging to page 5.
  const from = 0;
  const to = page * limit - 1;

  // 1. Load cached Categories, Brands, and product counts (all independent — parallel)
  const [categories, brands, productCounts] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getCachedProductCounts(),
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
      } else {
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
      query = query.or(`name_en.ilike.%${searchQuery}%,description_en.ilike.%${searchQuery}%`);
  }

  // 4. Pagination & Sorting
  query = query.range(from, to);
  
  if (filter === 'new') {
      query = query.order('created_at', { ascending: false });
  } else if (filter === 'best') {
      query = query.order('sales_count', { ascending: false });
  } else {
      query = query.order('created_at', { ascending: false }); // Default sorting
  }

  const { data: products, count, error } = await query;

  if (error) {
      console.error("Shop Query Error:", error);
      return <div>Error loading products</div>;
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
        initialFilter={filter}
        initialSeason={seasonSlug}
        seasonTitle={seasonTitle}
        pagination={{
            page,
            totalPages,
            hasMore: page < totalPages
        }}
      />
    </div>
  );
}

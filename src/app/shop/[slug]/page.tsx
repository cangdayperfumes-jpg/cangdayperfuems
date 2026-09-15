import { createClient } from '@supabase/supabase-js';
import { notFound, permanentRedirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import ProductGallery from '@/components/shop/ProductGallery';
import ProductActions from '@/components/shop/ProductActions';
import ProductDescription from '@/components/shop/ProductDescription';
import ProductCard from '@/components/shared/ProductCard';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

export const revalidate = 60;

interface PageProps {
  params: {
    slug: string;
  };
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Resolve a product by slug first, fall back to UUID for backward compat */
async function getProduct(slugOrId: string) {
  const supabase = getSupabase();

  // Try slug first
  const { data: bySlug } = await supabase
    .from('products')
    .select('*, product_variants(*), categories(name), brands(name)')
    .eq('slug', slugOrId)
    .single();

  if (bySlug) return bySlug;

  // Fallback: try by UUID (handles old bookmarked / shared links)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  if (isUuid) {
    const { data: byId } = await supabase
      .from('products')
      .select('*, product_variants(*), categories(name), brands(name)')
      .eq('id', slugOrId)
      .single();

    // If the product has a slug now, redirect to the canonical URL
    if (byId?.slug) return { ...byId, _redirect: byId.slug };
    return byId;
  }

  return null;
}

/** Cached version of getProduct — reuses data across generateMetadata + page render */
const getCachedProduct = (slugOrId: string) =>
  unstable_cache(
    () => getProduct(slugOrId),
    [`product-${slugOrId}`],
    { revalidate: 60 }
  )();

/**
 * Cached system_settings row — shares the same cache key (and must select the
 * same columns) as the root layout's query, since unstable_cache keys purely
 * on `['layout-settings']` regardless of which call site populates it first.
 */
const getCachedSettings = unstable_cache(
  async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('system_settings')
      .select('hide_prices, popup_enabled, popup_title, popup_message, popup_button_text, popup_button_link, popup_image_url, popup_show_on')
      .eq('id', 'global')
      .single();
    return data;
  },
  ['layout-settings'],
  { revalidate: 60 }
);

/**
 * Related products for internal linking — same category first, falling back
 * to same brand if the category doesn't have enough. Deep catalog pages were
 * otherwise only reachable via /shop pagination, not from other product
 * pages.
 */
async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  brandId: string | null
) {
  const supabase = getSupabase();
  const limit = 8;

  const results: any[] = [];
  const seenIds = new Set([productId]);

  if (categoryId) {
    const { data } = await supabase
      .from('products')
      .select('id, name_en, slug, price, discount, images, stock, has_variants, is_popular, product_variants(*)')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', productId)
      .order('sales_count', { ascending: false })
      .limit(limit);
    (data || []).forEach((p) => {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        results.push(p);
      }
    });
  }

  if (results.length < limit && brandId) {
    const { data } = await supabase
      .from('products')
      .select('id, name_en, slug, price, discount, images, stock, has_variants, is_popular, product_variants(*)')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .neq('id', productId)
      .order('sales_count', { ascending: false })
      .limit(limit - results.length + seenIds.size);
    (data || []).forEach((p) => {
      if (!seenIds.has(p.id) && results.length < limit) {
        seenIds.add(p.id);
        results.push(p);
      }
    });
  }

  return results;
}

const getCachedRelatedProducts = (productId: string, categoryId: string | null, brandId: string | null) =>
  unstable_cache(
    () => getRelatedProducts(productId, categoryId, brandId),
    [`related-products-${productId}`],
    { revalidate: 300 }
  )();

/**
 * Cached list of real shipping-destination country codes — same source
 * table /shipping renders from. Used for MerchantReturnPolicy.applicableCountry
 * so the schema states actual verified destinations instead of a guess.
 */
const getCachedShippingCountries = unstable_cache(
  async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('shipping_zones')
      .select('country_code')
      .not('country_code', 'is', null);
    const codes = Array.from(new Set((data || []).map((z: any) => z.country_code).filter(Boolean)));
    return codes as string[];
  },
  ['shipping-zone-countries'],
  { revalidate: 300 }
);

/** Ensure an image URL is always absolute */
function toAbsoluteUrl(url: string | undefined | null, siteUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${siteUrl}${url}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) return { title: 'Product Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.royalperfumes.company';
  const ogImageUrl = toAbsoluteUrl(product.images?.[0], siteUrl);

  return {
    title: product.name_en,
    description: product.description_en?.substring(0, 160) || 'Explore our luxury perfumes.',
    alternates: {
      canonical: `${siteUrl}/shop/${product.slug || slug}`,
    },
    openGraph: {
      title: product.name_en,
      description: product.description_en?.substring(0, 160) || 'Explore our luxury perfumes.',
      images: ogImageUrl ? [{ url: ogImageUrl, width: 800, height: 800, alt: product.name_en }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name_en,
      description: product.description_en?.substring(0, 160) || 'Explore our luxury perfumes.',
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) notFound();

  // Redirect old UUID links to the slug URL (permanent — helps Google drop the UUID URL from its index)
  if ((product as any)._redirect) {
    permanentRedirect(`/shop/${(product as any)._redirect}`);
  }

  const settings = await getCachedSettings();
  const hidePrices = settings?.hide_prices || false;
  const shippingCountries = await getCachedShippingCountries();
  const relatedProducts = await getCachedRelatedProducts(
    product.id,
    (product as any).category_id,
    (product as any).brand_id
  );

  // Determine Price Display
  let priceDisplay = null;
  let hasDiscount = false;
  let finalPrice = product.price;

  if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
    const prices = product.product_variants.map((v: any) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    priceDisplay =
      minPrice === maxPrice ? (
        <span className="text-2xl font-medium">{formatCurrency(minPrice)}</span>
      ) : (
        <span className="text-2xl font-medium">
          {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
        </span>
      );
  } else {
    hasDiscount = product.discount > 0;
    finalPrice = hasDiscount ? product.price - product.discount : product.price;

    priceDisplay = hasDiscount ? (
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground line-through text-xl">
          {formatCurrency(product.price)}
        </span>
        <span className="text-2xl font-medium">{formatCurrency(finalPrice)}</span>
      </div>
    ) : (
      <span className="text-2xl font-medium">{formatCurrency(product.price)}</span>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.royalperfumes.company';
  const canonicalSlug = product.slug || product.id;
  const imageUrl = toAbsoluteUrl(product.images?.[0], siteUrl);
  const brandName = (product as any).brands?.name || 'Royal Perfumes';

  // Offer.price/availability are only truthful to include when the storefront
  // actually shows a number — with hide_prices on, the page reads "Contact for
  // price", so claiming a numeric price+InStock here would contradict the
  // visible page (a real Google structured-data policy violation, not a
  // cosmetic one). Shipping cost is quoted per order (see /shipping — "final
  // shipping cost will always be confirmed with the customer before payment"),
  // so it is never a fixed $0/free rate and OfferShippingDetails is omitted
  // rather than inventing a number. The 7-day mail return policy IS a real,
  // published fact (see the wholesale-fragrance-sourcing-guide blog post).
  const offers: Record<string, any> = {
    '@type': 'Offer',
    url: `${siteUrl}/shop/${canonicalSlug}`,
    seller: {
      '@type': 'Organization',
      name: 'Royal Perfumes',
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      // Real destination list from shipping_zones (same table /shipping
      // renders from), not a guess — falls back to the verified seller
      // country if the table is ever empty.
      applicableCountry: shippingCountries.length > 0 ? shippingCountries : 'TR',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 7,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
  };

  if (!hidePrices) {
    offers.priceCurrency = 'USD';
    offers.price = finalPrice;
    offers.availability = product.stock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name_en,
    description: product.description_en || 'Luxury perfume from Royal Perfumes.',
    image: imageUrl,
    url: `${siteUrl}/shop/${canonicalSlug}`,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers,
  };

  return (
    <>
      {/* Google requires `image` on Product structured data — emitting the block
          without one gets the page flagged as an invalid Merchant listing in GSC,
          so skip it entirely for products that have no images yet. */}
      {imageUrl && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="container py-12 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 lg:items-start">
          {/* Left: Gallery — sticks in view on large screens while a long description scrolls */}
          <div className="lg:sticky lg:top-24">
            <ProductGallery images={product.images || []} name={product.name_en} />
          </div>

          {/* Right: Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                {hasDiscount && <Badge variant="destructive">Sale</Badge>}
                {!product.stock && <Badge variant="secondary">Out of Stock</Badge>}
              </div>

              <h1 className="text-4xl md:text-5xl font-heading font-medium text-foreground mb-2">
                {product.name_en}
              </h1>

              {(product.categories || product.target_audience) && (
                <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {product.categories && (
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {product.categories.name}
                    </span>
                  )}
                  {product.categories && product.target_audience && (
                    <span className="text-sm text-muted-foreground">•</span>
                  )}
                  {product.target_audience && (
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {product.target_audience}
                    </span>
                  )}
                </div>
              )}

              <div>
                {hidePrices ? (
                  <span className="text-xl text-muted-foreground italic">Contact for price</span>
                ) : (
                  priceDisplay
                )}
              </div>
            </div>

            {product.description_en && <ProductDescription text={product.description_en} />}

            <div className="pt-8 border-t">
              <ProductActions
                product={{
                  id: product.id,
                  name: product.name_en,
                  price: finalPrice,
                  images: product.images || [],
                  stock: product.stock,
                  has_variants: product.has_variants,
                }}
                initialVariants={product.product_variants || []}
              />
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-20 md:mt-28 pt-12 border-t">
            <h2 className="text-2xl md:text-3xl font-heading font-medium mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-6">
              {relatedProducts.map((related: any) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

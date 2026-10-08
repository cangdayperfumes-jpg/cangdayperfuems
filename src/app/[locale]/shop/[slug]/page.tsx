import { createClient } from '@supabase/supabase-js';
import { PLACEHOLDER_SUPABASE_URL } from '@/utils/supabase/placeholder';
import { notFound, permanentRedirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ProductGallery from '@/components/shop/ProductGallery';
import ProductActions from '@/components/shop/ProductActions';
import ProductDescription from '@/components/shop/ProductDescription';
import ProductCard from '@/components/shared/ProductCard';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';

export const revalidate = 60;

interface PageProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
}

/** Resolve a product by slug first, fall back to UUID for backward compat */
async function getProduct(slugOrId: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();

  // Try slug first
  const { data: bySlug } = await supabase
    .from('products')
    .select('*, product_variants(*), categories(name, slug), brands(name)')
    .eq('slug', slugOrId)
    .single();

  if (bySlug) return bySlug;

  // Fallback: try by UUID (handles old bookmarked / shared links)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  if (isUuid) {
    const { data: byId } = await supabase
      .from('products')
      .select('*, product_variants(*), categories(name, slug), brands(name)')
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
    if (!isSupabaseConfigured()) return null;
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
  if (!isSupabaseConfigured()) return [];
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
    if (!isSupabaseConfigured()) return [];
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
  const { locale, slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) return { title: 'Product Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cangday.com';
  const ogImageUrl = toAbsoluteUrl(product.images?.[0], siteUrl);
  const canonicalSlug = product.slug || slug;
  // Product data is English-only for now — both locales
  // show the same name/description, but each still gets its own canonical
  // URL + hreflang alternate so Google indexes /tr and /en separately.
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${siteUrl}/${l}/shop/${canonicalSlug}`])
  );

  return {
    title: product.name_en,
    description: product.description_en?.substring(0, 160) || 'Explore our luxury perfumes.',
    alternates: {
      canonical: `${siteUrl}/${locale}/shop/${canonicalSlug}`,
      languages,
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
  const { locale, slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) notFound();

  // Redirect old UUID links to the slug URL (permanent — helps Google drop the UUID URL from its index)
  if ((product as any)._redirect) {
    permanentRedirect(`/${locale}/shop/${(product as any)._redirect}`);
  }

  const settings = await getCachedSettings();
  const hidePrices = settings?.hide_prices || false;
  const shippingCountries = await getCachedShippingCountries();
  const relatedProducts = await getCachedRelatedProducts(
    product.id,
    (product as any).category_id,
    (product as any).brand_id
  );

  // Only used for the Sale badge and structured data below — the actual
  // price display lives entirely in <ProductActions>, since it's the only
  // place that can react to a variant/size selection. This page used to
  // also render its own static price here, which duplicated it (and for
  // variant products, went stale the moment a variant was picked).
  const hasDiscount = !product.has_variants && product.discount > 0;
  const finalPrice = hasDiscount ? product.price - product.discount : product.price;

  const t = await getTranslations('product');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cangday.com';
  const canonicalSlug = product.slug || product.id;
  const imageUrl = toAbsoluteUrl(product.images?.[0], siteUrl);
  const brandName = (product as any).brands?.name || 'Cangday';
  const localePath = `/${locale}`;

  // Offer.price/availability are only truthful to include when the storefront
  // actually shows a number — with hide_prices on, the page reads "Contact for
  // price", so claiming a numeric price+InStock here would contradict the
  // visible page (a real Google structured-data policy violation, not a
  // cosmetic one). Shipping cost is quoted per order, so it is never a fixed
  // $0/free rate and OfferShippingDetails is omitted rather than inventing a
  // number. The 14-day mail return policy matches /terms-of-service.
  const offers: Record<string, any> = {
    '@type': 'Offer',
    url: `${siteUrl}/shop/${canonicalSlug}`,
    seller: {
      '@type': 'Organization',
      name: 'Cangday',
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      // Real destination list from shipping_zones (same table /shipping
      // renders from) — omitted entirely if that table is ever empty,
      // rather than guessing a country Cangday may not actually ship from.
      ...(shippingCountries.length > 0 ? { applicableCountry: shippingCountries } : {}),
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
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
    description: product.description_en || 'Perfume from Cangday.',
    image: imageUrl,
    url: `${siteUrl}${localePath}/shop/${canonicalSlug}`,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers,
  };

  const breadcrumbItems = [
    { name: t('breadcrumbHome'), href: '/' },
    { name: t('breadcrumbShop'), href: '/shop' },
    ...(product.categories ? [{ name: product.categories.name, href: `/shop?category=${product.categories.slug}` }] : []),
    { name: product.name_en, href: `/shop/${canonicalSlug}` },
  ];
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${localePath}${item.href === '/' ? '' : item.href}`,
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container py-5 md:py-10">
        <nav aria-label="Breadcrumb" className="mb-4 md:mb-6 overflow-x-auto">
          <ol className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <li key={item.href} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
                  {isLast ? (
                    <span className="text-foreground font-medium max-w-[160px] truncate">{item.name}</span>
                  ) : (
                    <Link href={item.href} className="hover:text-foreground transition-colors">
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="grid grid-cols-1 gap-6 md:gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">
          {/* Left: Gallery — sticks in view on large screens while a long description scrolls */}
          <div className="lg:sticky lg:top-20 max-w-md mx-auto lg:mx-0 w-full">
            <ProductGallery images={product.images || []} name={product.name_en} />
          </div>

          {/* Right: Details */}
          <div className="space-y-5 md:space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                {hasDiscount && <Badge variant="destructive">{t('sale')}</Badge>}
                {!product.stock && <Badge variant="secondary">{t('outOfStock')}</Badge>}
                {/* Only shown for simple (non-variant) products — a variant's
                    stock can only be known once one is selected, which is
                    handled reactively inside <ProductActions>. */}
                {!product.has_variants && product.stock && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-deep">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                    {t('inStock')}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-heading font-medium text-foreground mb-1.5">
                {product.name_en}
              </h1>

              {(product.categories || product.target_audience) && (
                <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {product.categories && (
                    <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {product.categories.name}
                    </span>
                  )}
                  {product.categories && product.target_audience && (
                    <span className="text-xs md:text-sm text-muted-foreground">•</span>
                  )}
                  {product.target_audience && (
                    <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {product.target_audience}
                    </span>
                  )}
                </div>
              )}
            </div>

            {product.description_en && <ProductDescription text={product.description_en} />}

            <div className="pt-5 md:pt-6 border-t">
              <ProductActions
                product={{
                  id: product.id,
                  name: product.name_en,
                  price: product.price,
                  discount: product.discount || 0,
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
          <div className="mt-10 md:mt-14 pt-6 md:pt-8 border-t">
            <h2 className="text-lg md:text-2xl font-heading font-medium mb-4 md:mb-6">
              {t('relatedProducts')}
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

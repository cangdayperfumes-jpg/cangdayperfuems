import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getActiveSeasonalCollections } from '@/lib/seasonal-collections-data';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getAllPosts } from '@/lib/blog';
import { routing } from '@/i18n/routing';

// getAllPosts() (@/lib/blog) now reads from a JSON file generated at build
// time (scripts/generate-blog-data.js) instead of the filesystem at request
// time, so this route no longer has any untraceable runtime dependency --
// safe to go back to force-dynamic, which is what we actually want so newly
// added/removed products and categories (fetched from Supabase below) show
// up in the sitemap immediately rather than waiting on an ISR window.
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cangday.com';

// Every route is served under both /tr and /en (localePrefix: "always" —
// see src/i18n/routing.ts), so each path becomes one sitemap entry per
// locale, cross-linked via alternates.languages for correct hreflang.
function localizedEntries(
  path: string,
  fields: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${siteUrl}/${locale}${path}`])
  );
  languages['x-default'] = `${siteUrl}/${routing.defaultLocale}${path}`;

  return routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}${path}`,
    alternates: { languages },
    ...fields,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use a public client for sitemap generation to avoid cookie dependencies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Base Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    ...localizedEntries('', { lastModified: new Date(), changeFrequency: 'daily', priority: 1 }),
    ...localizedEntries('/shop', { lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 }),
    ...localizedEntries('/categories', { lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 }),
    ...localizedEntries('/about', { lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 }),
    ...localizedEntries('/contact', { lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 }),
    ...localizedEntries('/shipping', { lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 }),
    ...localizedEntries('/privacy-policy', { lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 }),
    ...localizedEntries('/terms-of-service', { lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 }),
    ...localizedEntries('/blog', { lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 }),
  ];

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts().flatMap((post) =>
    localizedEntries(`/blog/${post.slug}`, {
      lastModified: new Date(post.updated || post.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  );

  // 2. Fetch Dynamic Data
  const [
    { data: categories },
    products,
    seasonalCollections
  ] = await Promise.all([
    supabase.from('categories').select('id, slug, created_at'),
    fetchAllRows<{ id: string; slug: string | null; created_at: string }>((from, to) =>
      supabase.from('products').select('id, slug, created_at').eq('is_active', true).range(from, to)
    ),
    getActiveSeasonalCollections()
  ]);

  // 3. Map Dynamic Routes
  // /categories/[slug] is just a permanent redirect to /shop?category=<slug> —
  // the actual indexable category page (with its own title/description/canonical)
  // lives at the query-param URL, so that's what belongs in the sitemap.
  // A bare UUID fallback would just be a slugless dead end, so require a slug.
  const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
    .filter((cat) => cat.slug)
    .flatMap((cat) =>
      localizedEntries(`/shop?category=${cat.slug}`, {
        lastModified: cat.created_at ? new Date(cat.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );

  // Only list products with a real slug — a bare UUID URL would just 308-redirect when crawled,
  // which is exactly the "Page with redirect" pattern we want the sitemap to avoid feeding Google.
  const productRoutes: MetadataRoute.Sitemap = (products || [])
    .filter((product) => product.slug)
    .flatMap((product) =>
      localizedEntries(`/shop/${product.slug}`, {
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      })
    );

  const seasonalRoutes: MetadataRoute.Sitemap = seasonalCollections.flatMap((collection) =>
    localizedEntries(`/shop?season=${collection.slug}`, {
      lastModified: collection.updated_at ? new Date(collection.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  );

  // 4. Combine and Return
  return [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...productRoutes, ...seasonalRoutes];
}

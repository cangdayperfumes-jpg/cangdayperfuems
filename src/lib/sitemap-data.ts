import { createClient } from '@supabase/supabase-js';
import { PLACEHOLDER_SUPABASE_URL } from '@/utils/supabase/placeholder';
import { getActiveSeasonalCollections } from '@/lib/seasonal-collections-data';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getPublishedRows, postLocales } from '@/lib/blog';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo';

/**
 * The sitemap is split into sections (pages, collections, products, blog)
 * under /sitemap.xml (an index). Search Console then reports indexing per
 * section, and /sitemap.xsl renders each file as a readable table in a
 * browser — the XML itself is unchanged for Google.
 */

export const SITEMAP_SECTIONS = ['pages', 'collections', 'products', 'blog'] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
  /** hreflang → absolute URL (includes x-default when relevant). */
  alternates?: Record<string, string>;
  images?: string[];
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    { auth: { persistSession: false } }
  );
}

/** One entry per locale with reciprocal hreflang links. */
function localized(path: string, locales: readonly string[], fields: Omit<SitemapEntry, 'loc' | 'alternates'>): SitemapEntry[] {
  const alternates: Record<string, string> = Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`]));
  if (locales.includes(routing.defaultLocale)) alternates['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`;
  return locales.map((l) => ({ loc: `${SITE_URL}/${l}${path}`, alternates, ...fields }));
}

const iso = (d?: string | null) => (d ? new Date(d).toISOString() : undefined);

export async function sitemapSection(section: SitemapSection): Promise<SitemapEntry[]> {
  const all = routing.locales;

  switch (section) {
    case 'pages': {
      const now = new Date().toISOString();
      const pages: [string, SitemapEntry['changefreq'], number][] = [
        ['', 'daily', 1],
        ['/shop', 'daily', 0.9],
        ['/categories', 'weekly', 0.8],
        ['/blog', 'weekly', 0.7],
        ['/about', 'monthly', 0.6],
        ['/contact', 'monthly', 0.5],
        ['/shipping', 'monthly', 0.5],
        ['/terms-of-service', 'yearly', 0.3],
        ['/privacy-policy', 'yearly', 0.3],
      ];
      return pages.flatMap(([path, changefreq, priority]) => localized(path, all, { lastmod: now, changefreq, priority }));
    }

    case 'collections': {
      const [{ data: categories }, seasonal] = await Promise.all([
        db().from('categories').select('slug, created_at').order('name'),
        getActiveSeasonalCollections(),
      ]);
      return [
        ...(categories ?? [])
          .filter((c) => c.slug)
          .flatMap((c) =>
            localized(`/shop?category=${encodeURIComponent(c.slug)}`, all, { lastmod: iso(c.created_at), changefreq: 'weekly', priority: 0.7 })
          ),
        ...seasonal.flatMap((c) =>
          localized(`/shop?season=${encodeURIComponent(c.slug)}`, all, { lastmod: iso(c.updated_at), changefreq: 'weekly', priority: 0.7 })
        ),
      ];
    }

    case 'products': {
      const supabase = db();
      const products = await fetchAllRows<{ slug: string | null; created_at: string; images: string[] | null }>((from, to) =>
        supabase.from('products').select('slug, created_at, images').eq('is_active', true).order('created_at', { ascending: false }).range(from, to)
      );
      // Only real slugs — a bare UUID URL 308-redirects, which Search Console
      // reports as "Page with redirect".
      return products
        .filter((p) => p.slug)
        .flatMap((p) =>
          localized(`/shop/${p.slug}`, all, {
            lastmod: iso(p.created_at),
            changefreq: 'weekly',
            priority: 0.8,
            images: p.images?.[0] ? [p.images[0]] : [],
          })
        );
    }

    case 'blog': {
      const rows = await getPublishedRows();
      // Each post only in the languages it's written in.
      return rows.flatMap((post) =>
        localized(`/blog/${post.slug}`, postLocales(post), {
          lastmod: iso(post.updated_at),
          changefreq: 'monthly',
          priority: 0.6,
          images: post.cover_image_url ? [post.cover_image_url] : [],
        })
      );
    }
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';

export function urlsetXml(entries: SitemapEntry[]) {
  const urls = entries
    .map((e) => {
      const parts = [`    <loc>${esc(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      for (const [lang, href] of Object.entries(e.alternates ?? {})) {
        parts.push(`    <xhtml:link rel="alternate" hreflang="${lang}" href="${esc(href)}" />`);
      }
      for (const img of e.images ?? []) parts.push(`    <image:image><image:loc>${esc(img)}</image:loc></image:image>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');
  return `${XML_HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;
}

export function sitemapIndexXml(sections: { name: SitemapSection; lastmod?: string }[]) {
  const items = sections
    .map((s) => `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/${s.name}.xml</loc>${s.lastmod ? `\n    <lastmod>${s.lastmod}</lastmod>` : ''}\n  </sitemap>`)
    .join('\n');
  return `${XML_HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

export const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600',
};

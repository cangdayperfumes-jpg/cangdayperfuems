import { SITEMAP_SECTIONS, sitemapIndexXml, sitemapSection, XML_HEADERS } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';

/** /sitemap.xml — index of the section sitemaps (pages, collections, products, blog). */
export async function GET() {
  const sections = await Promise.all(
    SITEMAP_SECTIONS.map(async (name) => {
      const entries = await sitemapSection(name).catch(() => []);
      const lastmod = entries.map((e) => e.lastmod).filter(Boolean).sort().at(-1);
      return { name, lastmod, count: entries.length };
    })
  );
  // An empty section (e.g. no blog posts yet) is left out rather than listed empty.
  return new Response(sitemapIndexXml(sections.filter((s) => s.count > 0)), { headers: XML_HEADERS });
}

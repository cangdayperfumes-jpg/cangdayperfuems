import { SITEMAP_SECTIONS, sitemapSection, urlsetXml, XML_HEADERS, type SitemapSection } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';

/** /sitemaps/pages.xml, /sitemaps/collections.xml, /sitemaps/products.xml, /sitemaps/blog.xml */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = file.replace(/\.xml$/, '') as SitemapSection;
  if (!file.endsWith('.xml') || !SITEMAP_SECTIONS.includes(name)) return new Response('Not found', { status: 404 });
  try {
    return new Response(urlsetXml(await sitemapSection(name)), { headers: XML_HEADERS });
  } catch (e) {
    console.error('[sitemap] section failed:', name, e);
    return new Response('Sitemap temporarily unavailable', { status: 503 });
  }
}

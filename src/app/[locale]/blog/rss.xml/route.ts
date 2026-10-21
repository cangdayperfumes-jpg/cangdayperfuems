import { getPosts, type BlogLocale } from '@/lib/blog';
import { localeUrl, SITE_NAME } from '@/lib/seo';

export const revalidate = 300;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** /tr/blog/rss.xml and /en/blog/rss.xml — feed readers and AI crawlers pick up new posts fast. */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'tr' && locale !== 'en') return new Response('Not found', { status: 404 });
  const posts = (await getPosts(locale as BlogLocale)).slice(0, 50);
  const blogUrl = localeUrl(locale, '/blog');

  const items = posts
    .map((p) => {
      const url = localeUrl(locale, `/blog/${p.slug}`);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${esc(p.excerpt || p.summary)}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
${p.image ? `      <enclosure url="${esc(p.image)}" type="image/jpeg" length="0" />` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE_NAME} — ${locale === 'tr' ? 'Günlük' : 'Journal'}`)}</title>
    <link>${blogUrl}</link>
    <atom:link href="${blogUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(locale === 'tr' ? 'Parfüm rehberleri ve koku notları' : 'Fragrance guides and scent notes')}</description>
    <language>${locale === 'tr' ? 'tr-TR' : 'en'}</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}

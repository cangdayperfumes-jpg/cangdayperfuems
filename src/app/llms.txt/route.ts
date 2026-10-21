import { createClient } from '@supabase/supabase-js';
import { getPublishedRows, localizePost, postLocales } from '@/lib/blog';
import { SITE_URL } from '@/lib/seo';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';

export const revalidate = 3600;

/**
 * /llms.txt — a plain-text map of the shop for AI assistants (ChatGPT,
 * Claude, Perplexity). Google Search ignores it; it's cheap and harmless.
 */
export async function GET() {
  let categories: { name: string; slug: string }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data } = await supabase.from('categories').select('name, slug').order('name');
    categories = (data ?? []).filter((x) => x.slug);
  }
  const posts = (await getPublishedRows()).slice(0, 30);

  const lines = [
    '# Cangday — Modern Perfumery',
    '',
    '> Cangday is an online perfume shop based in Turkey selling high-quality, long-lasting perfumes (eau de parfum, extrait de parfum, body mists). Ships across Turkey and internationally; 14-day returns. Site available in Turkish (/tr) and English (/en). Prices in Turkish lira (TRY).',
    '',
    '## Shop',
    `- [All perfumes (TR)](${SITE_URL}/tr/shop): Full catalogue with filters by brand, category, gender and price`,
    `- [All perfumes (EN)](${SITE_URL}/en/shop)`,
    `- [Collections](${SITE_URL}/en/categories): Browse by category`,
    ...categories.map((c) => `- [${c.name}](${SITE_URL}/en/shop?category=${encodeURIComponent(c.slug)})`),
    '',
    '## Customer information',
    `- [Shipping](${SITE_URL}/en/shipping): Destinations and delivery prices`,
    `- [Terms of service](${SITE_URL}/en/terms-of-service): Returns (14 days), cancellations`,
    `- [Privacy policy](${SITE_URL}/en/privacy-policy)`,
    `- [Contact](${SITE_URL}/en/contact)`,
    `- [About Cangday](${SITE_URL}/en/about)`,
  ];


  if (posts.length) {
    lines.push('', '## Journal (fragrance guides)');
    for (const row of posts) {
      for (const l of postLocales(row)) {
        const p = localizePost(row, l);
        lines.push(`- [${p.title}](${SITE_URL}/${l}/blog/${p.slug})${p.excerpt ? `: ${p.excerpt}` : ''}`);
      }
    }
  }

  lines.push('', `Sitemap: ${SITE_URL}/sitemap.xml`, '');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}

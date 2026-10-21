import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';

/**
 * Blog posts live in the blog_posts table and are edited in Dashboard → Blog.
 * Reads use a cookie-less anon client (RLS only exposes published posts whose
 * publish date has passed) and are cached under the "blog" tag, which the
 * dashboard expires on every save.
 */

export type BlogLocale = 'tr' | 'en';

export interface BlogFaq {
  q_en: string;
  a_en: string;
  q_tr: string;
  a_tr: string;
}

export interface BlogPostRow {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  published_at: string | null;
  featured: boolean;
  title_en: string;
  title_tr: string;
  excerpt_en: string;
  excerpt_tr: string;
  summary_en: string;
  summary_tr: string;
  content_en: string;
  content_tr: string;
  seo_title_en: string;
  seo_title_tr: string;
  cover_image_url: string | null;
  cover_alt_en: string;
  cover_alt_tr: string;
  tags: string[];
  author_name: string;
  author_bio_en: string;
  author_bio_tr: string;
  faq: BlogFaq[];
  related_product_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  locale: BlogLocale;
  title: string;
  seoTitle: string;
  excerpt: string;
  summary: string;
  content: string;
  image: string | null;
  imageAlt: string;
  tags: string[];
  author: string;
  authorBio: string;
  faq: { q: string; a: string }[];
  relatedProductIds: string[];
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  /** Locales this post is written in (title + content filled). */
  locales: BlogLocale[];
}

export const BLOG_CACHE_TAG = 'blog';

export function postLocales(row: Pick<BlogPostRow, 'title_en' | 'title_tr' | 'content_en' | 'content_tr'>): BlogLocale[] {
  const out: BlogLocale[] = [];
  if (row.title_tr.trim() && row.content_tr.trim()) out.push('tr');
  if (row.title_en.trim() && row.content_en.trim()) out.push('en');
  return out;
}

export function readingMinutes(markdown: string) {
  const words = markdown.replace(/[#>*_`\[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function localizePost(row: BlogPostRow, locale: BlogLocale): BlogPost {
  const pick = <K extends 'title' | 'excerpt' | 'summary' | 'content' | 'seo_title' | 'cover_alt' | 'author_bio'>(k: K) =>
    (row[`${k}_${locale}` as keyof BlogPostRow] as string) || '';
  const content = pick('content');
  return {
    id: row.id,
    slug: row.slug,
    locale,
    title: pick('title'),
    seoTitle: pick('seo_title') || pick('title'),
    excerpt: pick('excerpt'),
    summary: pick('summary'),
    content,
    image: row.cover_image_url,
    imageAlt: pick('cover_alt') || pick('title'),
    tags: row.tags ?? [],
    author: row.author_name || 'Cangday',
    authorBio: pick('author_bio'),
    faq: (row.faq ?? [])
      .map((f) => ({ q: (locale === 'tr' ? f.q_tr : f.q_en) || '', a: (locale === 'tr' ? f.a_tr : f.a_en) || '' }))
      .filter((f) => f.q.trim() && f.a.trim()),
    relatedProductIds: row.related_product_ids ?? [],
    featured: row.featured,
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    readingMinutes: readingMinutes(content),
    locales: postLocales(row),
  };
}

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Every published, already-live post (all languages). */
export const getPublishedRows = unstable_cache(
  async (): Promise<BlogPostRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await client()
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });
    if (error) {
      console.error('[blog] load failed:', error);
      return [];
    }
    return (data ?? []) as BlogPostRow[];
  },
  ['blog-published'],
  // Short revalidate so a scheduled post goes live soon after its time.
  { revalidate: 300, tags: [BLOG_CACHE_TAG] }
);

export async function getPosts(locale: BlogLocale): Promise<BlogPost[]> {
  const rows = await getPublishedRows();
  return rows.filter((r) => postLocales(r).includes(locale)).map((r) => localizePost(r, locale));
}

export async function getPost(slug: string, locale: BlogLocale): Promise<BlogPost | null> {
  const row = (await getPublishedRows()).find((r) => r.slug === slug);
  if (!row || !postLocales(row).includes(locale)) return null;
  return localizePost(row, locale);
}

/** Markdown "## Heading" lines → table of contents entries with stable ids. */
export function headingId(text: string) {
  return (
    text
      .toLocaleLowerCase('tr')
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  );
}

export function tableOfContents(markdown: string) {
  return markdown
    .split('\n')
    .map((l) => /^(#{2,3})\s+(.+?)\s*#*$/.exec(l))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => {
      const text = m[2].replace(/[*_`]/g, '');
      return { level: m[1].length, text, id: headingId(text) };
    });
}

/** "Şık Kokular & Rehber" → "sik-kokular-rehber" */
export function slugify(text: string) {
  return headingId(text).slice(0, 80).replace(/-$/, '');
}

'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { BLOG_CACHE_TAG, slugify, type BlogFaq } from '@/lib/blog';

export interface BlogPostInput {
  slug: string;
  status: 'draft' | 'published';
  /** ISO; null = publish now (set by the database). */
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
}

type Result = { success: true; id: string; slug: string } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error('Not signed in');
  return supabase;
}

function refreshBlog(slug?: string) {
  updateTag(BLOG_CACHE_TAG);
  revalidatePath('/[locale]/blog', 'page');
  if (slug) revalidatePath('/[locale]/blog/[slug]', 'page');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/blog');
}

function clean(input: BlogPostInput): BlogPostInput {
  const trim = (s: string) => (s ?? '').trim();
  return {
    ...input,
    slug: slugify(input.slug || input.title_en || input.title_tr),
    title_en: trim(input.title_en),
    title_tr: trim(input.title_tr),
    excerpt_en: trim(input.excerpt_en),
    excerpt_tr: trim(input.excerpt_tr),
    summary_en: trim(input.summary_en),
    summary_tr: trim(input.summary_tr),
    seo_title_en: trim(input.seo_title_en),
    seo_title_tr: trim(input.seo_title_tr),
    cover_alt_en: trim(input.cover_alt_en),
    cover_alt_tr: trim(input.cover_alt_tr),
    author_name: trim(input.author_name) || 'Cangday',
    tags: [...new Set(input.tags.map(trim).filter(Boolean))].slice(0, 12),
    faq: input.faq.filter((f) => [f.q_en, f.a_en, f.q_tr, f.a_tr].some((v) => v?.trim())),
    related_product_ids: [...new Set(input.related_product_ids)].slice(0, 12),
  };
}

export async function saveBlogPost(id: string | null, raw: BlogPostInput): Promise<Result> {
  try {
    const supabase = await requireAdmin();
    const input = clean(raw);
    if (!input.slug) return { success: false, error: 'slug_required' };
    const hasLanguage = (input.title_en && input.content_en) || (input.title_tr && input.content_tr);
    if (input.status === 'published' && !hasLanguage) return { success: false, error: 'needs_language' };

    const query = id
      ? supabase.from('blog_posts').update(input).eq('id', id).select('id, slug').single()
      : supabase.from('blog_posts').insert(input).select('id, slug').single();
    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.code === '23505' ? 'slug_taken' : error.message };
    }
    refreshBlog(data.slug);
    return { success: true, id: data.id, slug: data.slug };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'failed' };
  }
}

export async function deleteBlogPost(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    refreshBlog();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'failed' };
  }
}

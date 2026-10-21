import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import BlogPostForm from '@/components/admin/blog/BlogPostForm';
import type { BlogPostRow } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).single();
  if (!post) notFound();

  const ids = (post as BlogPostRow).related_product_ids ?? [];
  const { data: products } = ids.length
    ? await supabase.from('products').select('id, name_en, images').in('id', ids)
    : { data: [] as { id: string; name_en: string; images: string[] | null }[] };
  const relatedProducts = ids
    .map((pid, i) => {
      const p = (products ?? []).find((x) => x.id === pid);
      return p ? { product_id: p.id, name_en: p.name_en, image: p.images?.[0] ?? null, display_order: i } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  return <BlogPostForm post={post as BlogPostRow} relatedProducts={relatedProducts} />;
}

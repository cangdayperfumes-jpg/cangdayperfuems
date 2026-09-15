import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface ProductCalloutProps {
  slug: string;
}

/**
 * Inline product recommendation embedded in blog content (server component,
 * used from MDX via `<ProductCallout slug="..." />`). Fetches live by slug
 * rather than hardcoding image/name in the .mdx file, so it never goes stale
 * if the product is edited or its image changes.
 */
export default async function ProductCallout({ slug }: ProductCalloutProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: product } = await supabase
    .from('products')
    .select('name_en, slug, images, is_active, brands(name)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  // Silently omit rather than break the article if the product was removed
  // or deactivated since the post was written.
  if (!product) return null;

  const brandName = (product as any).brands?.name;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="not-prose group flex items-center gap-4 my-8 p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors bg-gray-50/50"
    >
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        <ImageWithFallback
          src={product.images?.[0] || '/placeholder.svg'}
          alt={product.name_en}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
          Featured Fragrance
        </p>
        {brandName && (
          <p className="text-xs text-gray-500 uppercase tracking-wide">{brandName}</p>
        )}
        <p className="font-heading text-base md:text-lg text-gray-900 leading-snug truncate">
          {product.name_en}
        </p>
        <span className="inline-flex items-center gap-1 text-sm text-gray-700 group-hover:text-gray-900 mt-1">
          Shop this fragrance
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

import {
  buildProxiedRenderUrl,
  isLocalStaticImage,
  isSupabaseStorageUrl,
  isSupabaseTransformsEnabled,
  toProxiedObjectUrl,
} from './images';

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Next.js custom image loader — routes Supabase images through our own
 * `/images` proxy (see `next.config.ts` rewrites) instead of Vercel Image
 * Optimization (/_next/image) AND instead of exposing the raw
 * `*.supabase.co` Storage host to the browser.
 *
 * Existing database URLs are preserved; transformation happens at render time.
 */
export default function supabaseImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (isLocalStaticImage(src)) {
    // A custom `loader` makes Next.js skip registering its own /_next/image
    // route entirely — so without this, local /public images were served as
    // the same unresized file at every requested width. /api/local-image
    // (sharp-backed) restores real per-width resizing for these. Requires
    // the production build to use webpack (see package.json's "build"
    // script) — sharp's native binding fails under this project's Turbopack
    // build specifically, on Linux, regardless of libc (verified on both
    // Alpine and Debian); confirmed unaffected under webpack.
    const params = new URLSearchParams({
      path: src,
      w: String(width),
      q: String(quality ?? 75),
    });
    return `/api/local-image?${params.toString()}`;
  }

  if (isSupabaseStorageUrl(src) || (!src.startsWith('http') && !src.startsWith('/'))) {
    if (isSupabaseTransformsEnabled()) {
      return buildProxiedRenderUrl(src, { width, quality, resize: 'cover' });
    }
    return toProxiedObjectUrl(src);
  }

  // Non-Supabase remote URLs (popup images, third-party assets) — serve directly.
  return src;
}

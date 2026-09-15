/**
 * Image URL utilities for Supabase Storage delivery.
 *
 * Converts existing `object/public` URLs (stored in the database) into
 * `render/image/public` URLs at request time. Original URLs are never modified.
 */

const SUPABASE_OBJECT_REGEX =
  /^https:\/\/([a-z0-9-]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/i;

const SUPABASE_RENDER_REGEX =
  /^https:\/\/([a-z0-9-]+\.supabase\.co)\/storage\/v1\/render\/image\/public\/(.+)$/i;

export type ResizeMode = 'cover' | 'contain' | 'fill';

export interface SupabaseImageTransformOptions {
  width: number;
  quality?: number;
  resize?: ResizeMode;
}

export interface ParsedSupabaseImage {
  host: string;
  path: string;
}

/** Returns true when the URL points to Supabase Storage (object or render). */
export function isSupabaseStorageUrl(src: string): boolean {
  return SUPABASE_OBJECT_REGEX.test(src) || SUPABASE_RENDER_REGEX.test(src);
}

/** Returns true for same-origin static assets served from /public. */
export function isLocalStaticImage(src: string): boolean {
  return src.startsWith('/') && !src.startsWith('//');
}

/** Parse a Supabase public object or render URL into host + bucket/path. */
export function parseSupabaseStorageUrl(src: string): ParsedSupabaseImage | null {
  const objectMatch = SUPABASE_OBJECT_REGEX.exec(src);
  if (objectMatch) {
    return {
      host: `https://${objectMatch[1]}`,
      path: decodeURIComponent(objectMatch[2]),
    };
  }

  const renderMatch = SUPABASE_RENDER_REGEX.exec(src);
  if (renderMatch) {
    return {
      host: `https://${renderMatch[1]}`,
      path: decodeURIComponent(renderMatch[2]),
    };
  }

  // Relative bucket/path (e.g. "products/image.jpg") — used by Supabase loader docs pattern.
  if (!src.startsWith('/') && !src.startsWith('http')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        return {
          host: new URL(supabaseUrl).origin,
          path: src,
        };
      } catch {
        return null;
      }
    }
  }

  return null;
}

/** Clamp width/quality to Supabase transformation limits. */
export function clampTransformParams(
  width: number,
  quality?: number
): { width: number; quality: number } {
  return {
    width: Math.min(2500, Math.max(1, Math.round(width))),
    quality: Math.min(100, Math.max(20, quality ?? 80)),
  };
}

/**
 * Build a Supabase render URL from any supported source format.
 * Falls back to the original src when parsing fails.
 */
export function buildSupabaseRenderUrl(
  src: string,
  options: SupabaseImageTransformOptions
): string {
  const parsed = parseSupabaseStorageUrl(src);
  if (!parsed) return src;

  const { width, quality } = clampTransformParams(options.width, options.quality);
  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality),
    resize: options.resize ?? 'cover',
  });

  return `${parsed.host}/storage/v1/render/image/public/${parsed.path}?${params.toString()}`;
}

/** Return the original public object URL (safe fallback when transforms are disabled). */
export function toSupabaseObjectUrl(src: string): string {
  const parsed = parseSupabaseStorageUrl(src);
  if (!parsed) return src;
  return `${parsed.host}/storage/v1/object/public/${parsed.path}`;
}

/**
 * Same-origin equivalent of `toSupabaseObjectUrl` — never exposes the raw
 * `*.supabase.co` host to the browser. Proxied via `next.config.ts` rewrites
 * to the real Supabase Storage object URL.
 */
export function toProxiedObjectUrl(src: string): string {
  const parsed = parseSupabaseStorageUrl(src);
  if (!parsed) return src;
  return `/images/${parsed.path}`;
}

/**
 * Same-origin equivalent of `buildSupabaseRenderUrl` — proxied via
 * `next.config.ts` rewrites to the real Supabase Storage render/transform URL.
 */
export function buildProxiedRenderUrl(
  src: string,
  options: SupabaseImageTransformOptions
): string {
  const parsed = parseSupabaseStorageUrl(src);
  if (!parsed) return src;

  const { width, quality } = clampTransformParams(options.width, options.quality);
  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality),
    resize: options.resize ?? 'cover',
  });

  return `/images/render/${parsed.path}?${params.toString()}`;
}

/** Whether Supabase on-the-fly transforms should be used (requires Pro plan + dashboard toggle). */
export function isSupabaseTransformsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS_ENABLED !== 'false';
}

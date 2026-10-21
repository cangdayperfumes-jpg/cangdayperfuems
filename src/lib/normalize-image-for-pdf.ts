'use client';

/**
 * @react-pdf/renderer's <Image> only supports JPEG/PNG — webp/avif product
 * images (common in this store's uploads) fail to embed silently and leave
 * broken pages. Everything is re-encoded here via canvas before it reaches
 * react-pdf:
 *
 * - photos  → JPEG on a white background (a transparent PNG/WebP bottle
 *             would otherwise turn black in a JPEG) and downscaled, so a
 *             catalog of hundreds of products stays fast and small;
 * - logos   → PNG, keeping transparency so a gold logo sits on any colour.
 *
 * Any failure (missing image, fetch/decode error) falls back to a generated
 * placeholder so one bad image can't abort a whole catalog. Results are
 * cached per URL + options for the life of the tab.
 */

export interface PdfImageOptions {
  /** Longest side in px. Default 900. */
  maxDimension?: number;
  /** 'jpeg' (photos, white background) or 'png' (logos, keeps transparency). */
  format?: 'jpeg' | 'png';
}

const cache = new Map<string, Promise<string>>();
let placeholderPromise: Promise<string> | null = null;

async function convert(url: string, { maxDimension = 900, format = 'jpeg' }: PdfImageOptions): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    if (format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    return format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.86);
  } finally {
    bitmap.close();
  }
}

/** Soft ivory "no image" tile in the catalog palette. */
function getPlaceholderDataUrl(): Promise<string> {
  if (!placeholderPromise) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FBF8F3';
      ctx.fillRect(0, 0, 400, 500);
      ctx.strokeStyle = '#E4D9C6';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 398, 498);
      ctx.fillStyle = '#B9AD9C';
      ctx.font = 'italic 34px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cangday', 200, 250);
    }
    placeholderPromise = Promise.resolve(canvas.toDataURL('image/jpeg', 0.9));
  }
  return placeholderPromise;
}

export function normalizeImageForPdf(url: string | null | undefined, options: PdfImageOptions = {}): Promise<string> {
  if (!url) return getPlaceholderDataUrl();
  // Already-embedded data URIs (e.g. the built-in logo) pass straight through.
  if (url.startsWith('data:')) return Promise.resolve(url);

  const key = `${url}|${options.maxDimension ?? 900}|${options.format ?? 'jpeg'}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = convert(url, options).catch((err) => {
      console.error('normalizeImageForPdf failed for', url, err);
      return getPlaceholderDataUrl();
    });
    cache.set(key, pending);
  }
  return pending;
}

/** Normalizes a batch of image URLs in parallel, returning a url -> normalized-src map. */
export async function normalizeImagesForPdf(
  urls: (string | null | undefined)[],
  options: PdfImageOptions = {}
): Promise<Map<string, string>> {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean) as string[]));
  const results = await Promise.all(uniqueUrls.map((url) => normalizeImageForPdf(url, options)));
  const map = new Map<string, string>();
  uniqueUrls.forEach((url, i) => map.set(url, results[i]));
  return map;
}

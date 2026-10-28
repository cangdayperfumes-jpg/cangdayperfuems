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
 * - watermark → optional text (the catalog's "CANGDAY") drawn into the
 *               photo itself, so it can't be switched off in the PDF and
 *               costs nothing extra to lay out.
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
  /** Text stamped diagonally across the middle of the photo. */
  watermark?: string;
}

const cache = new Map<string, Promise<string>>();
let placeholderPromise: Promise<string> | null = null;

async function convert(url: string, { maxDimension = 900, format = 'jpeg', watermark }: PdfImageOptions): Promise<string> {
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
    if (watermark) drawWatermark(ctx, width, height, watermark);
    return format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    bitmap.close();
  }
}

/**
 * Light text with a faint dark edge, rotated like a stamp — readable on
 * both pale and dark photos without hiding the bottle.
 */
function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, text: string) {
  let size = Math.round(Math.min(width, height) * 0.11);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = () => {
    ctx.font = `700 ${size}px Manrope, "Helvetica Neue", Arial, sans-serif`;
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(size * 0.14)}px`;
  };
  setFont();
  // Keep long custom text inside the photo.
  const fit = width * 0.82;
  const measured = ctx.measureText(text).width;
  if (measured > fit) {
    size = Math.max(8, Math.floor((size * fit) / measured));
    setFont();
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, size * 0.07);
  ctx.strokeStyle = 'rgba(18, 13, 10, 0.3)';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText(text, 0, 0);
  ctx.restore();
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

  const key = `${url}|${options.maxDimension ?? 900}|${options.format ?? 'jpeg'}|${options.watermark ?? ''}`;
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

'use client';

const PDF_SAFE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const cache = new Map<string, Promise<string>>();
let placeholderPromise: Promise<string> | null = null;

function isAlreadyPdfSafe(url: string): boolean {
  const lower = url.split('?')[0].toLowerCase();
  return PDF_SAFE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function canvasToJpeg(draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  draw(ctx, canvas);
  return canvas.toDataURL('image/jpeg', 0.9);
}

async function convertToJpegDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  try {
    return canvasToJpeg((ctx) => ctx.drawImage(bitmap, 0, 0), bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

/** Simple generated "No Image" placeholder — avoids needing a static PNG/JPG
 *  asset in the repo just for this one fallback case. */
function getPlaceholderDataUrl(): Promise<string> {
  if (!placeholderPromise) {
    placeholderPromise = Promise.resolve(
      canvasToJpeg((ctx, canvas) => {
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#DDDDDD';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        ctx.fillStyle = '#999999';
        ctx.font = '28px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No Image', canvas.width / 2, canvas.height / 2);
      }, 400, 500)
    );
  }
  return placeholderPromise;
}

/**
 * @react-pdf/renderer's <Image> only supports JPEG/PNG, picked by file
 * extension — webp/avif/jfif product images (common in this store's
 * uploads) fail to embed silently. Re-encodes anything not already a
 * jpg/png into a JPEG data URL via canvas before it reaches react-pdf.
 * Falls back to a generated placeholder on any failure (missing image,
 * fetch/decode error) so one bad image can't abort an entire catalog
 * generation. Results are cached per URL for the life of the page/tab.
 */
export function normalizeImageForPdf(url: string | null | undefined): Promise<string> {
  if (!url) return getPlaceholderDataUrl();
  if (isAlreadyPdfSafe(url)) return Promise.resolve(url);

  let pending = cache.get(url);
  if (!pending) {
    pending = convertToJpegDataUrl(url).catch((err) => {
      console.error('normalizeImageForPdf failed for', url, err);
      return getPlaceholderDataUrl();
    });
    cache.set(url, pending);
  }
  return pending;
}

/** Normalizes a batch of image URLs in parallel, returning a url -> normalized-src map. */
export async function normalizeImagesForPdf(urls: (string | null | undefined)[]): Promise<Map<string, string>> {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean) as string[]));
  const results = await Promise.all(uniqueUrls.map((url) => normalizeImageForPdf(url)));
  const map = new Map<string, string>();
  uniqueUrls.forEach((url, i) => map.set(url, results[i]));
  return map;
}

import { Product } from '@/types';
import { normalizeImageForPdf } from '@/lib/normalize-image-for-pdf';
import supabaseImageLoader from '@/lib/supabase-image-loader';

/** Card photos are at most ~220pt tall; 560px stays sharp in print while keeping big catalogs quick to build. */
const CARD_IMAGE_MAX_PX = 560;
/** Stamped on every product photo — fixed, not a setting. */
export const CATALOG_PHOTO_WATERMARK = 'CANGDAY';
/** Photos fetched and decoded at once — hundreds in parallel stalls the tab. */
const CONCURRENCY = 6;

/**
 * Resolves every product's first image (or a placeholder, if it has none)
 * to a react-pdf-safe, downscaled JPEG with the CANGDAY stamp, keyed by
 * product id. Photos go
 * through the site's image loader (a resized copy where the storage
 * supports it) a few at a time, and normalizeImageForPdf's cache makes
 * re-generating cheap. `onProgress` reports (done, total) for the UI.
 */
export async function prepareCatalogImages(
  products: Product[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < products.length) {
      const product = products[next++];
      const original = product.images?.[0];
      const url = original ? supabaseImageLoader({ src: original, width: CARD_IMAGE_MAX_PX, quality: 80 }) : original;
      result.set(product.id, await normalizeImageForPdf(url, { maxDimension: CARD_IMAGE_MAX_PX, watermark: CATALOG_PHOTO_WATERMARK }));
      onProgress?.(++done, products.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, products.length) }, worker));
  return result;
}

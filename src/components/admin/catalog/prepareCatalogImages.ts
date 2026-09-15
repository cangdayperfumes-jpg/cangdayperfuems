import { Product } from '@/types';
import { normalizeImageForPdf } from '@/lib/normalize-image-for-pdf';

/**
 * Resolves every product's first image (or a placeholder, if it has none)
 * to a react-pdf-safe src, keyed by product id for simple lookup while
 * rendering. Dedupes by URL under the hood via normalizeImageForPdf's own
 * cache, so re-generating with mostly-overlapping product sets stays cheap.
 */
export async function prepareCatalogImages(products: Product[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    products.map(async (product) => {
      const src = await normalizeImageForPdf(product.images?.[0]);
      return [product.id, src] as const;
    })
  );
  return new Map(entries);
}

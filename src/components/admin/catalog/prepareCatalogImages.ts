import { Product } from '@/types';
import { normalizeImageForPdf } from '@/lib/normalize-image-for-pdf';

/** Card photos are at most ~180pt tall; 700px keeps them crisp in print while keeping big catalogs fast. */
const CARD_IMAGE_MAX_PX = 700;

/**
 * Resolves every product's first image (or a placeholder, if it has none)
 * to a react-pdf-safe, downscaled JPEG, keyed by product id. Dedupes by URL
 * via normalizeImageForPdf's cache, so re-generating stays cheap.
 */
export async function prepareCatalogImages(products: Product[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    products.map(async (product) => {
      const src = await normalizeImageForPdf(product.images?.[0], { maxDimension: CARD_IMAGE_MAX_PX });
      return [product.id, src] as const;
    })
  );
  return new Map(entries);
}

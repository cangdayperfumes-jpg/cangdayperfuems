import { Product, Category, Brand } from '@/types';
import {
  CatalogConfig,
  CatalogModel,
  CatalogModelGroup,
  UNCATEGORIZED_GROUP_KEY,
  UNBRANDED_GROUP_KEY,
  OTHER_BRANDS_THRESHOLD,
} from './types';

function passesBaseFilters(product: Product, config: CatalogConfig): boolean {
  if (config.filterCategoryIds.length > 0) {
    if (!product.category_id || !config.filterCategoryIds.includes(product.category_id)) return false;
  }
  if (config.filterPopular === 'popular' && !product.is_popular) return false;
  if (config.filterPopular === 'not-popular' && product.is_popular) return false;
  if (config.filterStock === 'in-stock' && !product.stock) return false;
  return true;
}

/**
 * Pure data-shaping function — no JSX, no react-pdf, no DOM. Single source
 * of truth for both the editor's HTML preview and the final CatalogPDF, so
 * the two can never disagree on which products/groups actually appear.
 */
export function buildCatalogModel(
  products: Product[],
  categories: Category[],
  brands: Brand[],
  config: CatalogConfig
): CatalogModel {
  // "manualSelectionOnly" skips the base filters entirely — otherwise leaving
  // every category unchecked means "match everything" (see passesBaseFilters),
  // which silently pulls in the whole catalog around a hand-picked Force
  // Include selection instead of showing just the chosen products.
  let selected = config.manualSelectionOnly ? [] : products.filter((p) => passesBaseFilters(p, config));

  const selectedIds = new Set(selected.map((p) => p.id));
  for (const id of config.includeProductIds) {
    if (!selectedIds.has(id)) {
      const product = products.find((p) => p.id === id);
      if (product) {
        selected.push(product);
        selectedIds.add(id);
      }
    }
  }

  if (config.excludeProductIds.length > 0) {
    const excludeSet = new Set(config.excludeProductIds);
    selected = selected.filter((p) => !excludeSet.has(p.id));
  }

  // Bucket into groups keyed by category_id/brand_id (or the "uncategorized"/
  // "unbranded" sentinel), preserving each product's position within its
  // bucket from `selected` (i.e. the original fetch order) as the default.
  const buckets = new Map<string, Product[]>();
  const bucketNames = new Map<string, string>();

  if (config.groupBy === 'brand') {
    brands.forEach((b) => bucketNames.set(b.id, b.name));
    bucketNames.set(UNBRANDED_GROUP_KEY, 'Other Brands');
    selected.forEach((product) => {
      const key = product.brand_id || UNBRANDED_GROUP_KEY;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(product);
    });

    // Fold brands with only a handful of products into the shared "Other
    // Brands" bucket instead of giving each one its own one-page section.
    const smallBrandKeys = Array.from(buckets.keys()).filter(
      (key) => key !== UNBRANDED_GROUP_KEY && buckets.get(key)!.length <= OTHER_BRANDS_THRESHOLD
    );
    if (smallBrandKeys.length > 0) {
      const otherBucket = buckets.get(UNBRANDED_GROUP_KEY) ?? [];
      smallBrandKeys.forEach((key) => {
        otherBucket.push(...buckets.get(key)!);
        buckets.delete(key);
      });
      buckets.set(UNBRANDED_GROUP_KEY, otherBucket);
    }
  } else {
    categories.forEach((c) => bucketNames.set(c.id, c.name));
    bucketNames.set(UNCATEGORIZED_GROUP_KEY, 'Uncategorized');
    selected.forEach((product) => {
      const key = product.category_id || UNCATEGORIZED_GROUP_KEY;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(product);
    });
  }

  // Group order: explicit drag-order first, then any remaining non-empty
  // buckets in their natural (already alphabetical) order, so a newly
  // filtered-in category never silently disappears just because it wasn't
  // part of a previously-saved order.
  const orderedKeys: string[] = [];
  const seenKeys = new Set<string>();
  config.groupOrder.forEach((key) => {
    if (buckets.has(key) && !seenKeys.has(key)) {
      orderedKeys.push(key);
      seenKeys.add(key);
    }
  });
  Array.from(buckets.keys()).forEach((key) => {
    if (!seenKeys.has(key)) {
      orderedKeys.push(key);
      seenKeys.add(key);
    }
  });

  const groups: CatalogModelGroup[] = orderedKeys
    .map((key) => {
      const groupProducts = buckets.get(key) || [];
      const explicitOrder = config.productOrderByGroup[key];
      const ordered = explicitOrder
        ? [...groupProducts].sort((a, b) => {
            const ai = explicitOrder.indexOf(a.id);
            const bi = explicitOrder.indexOf(b.id);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          })
        : groupProducts;
      return {
        id: key,
        name: bucketNames.get(key) || key,
        products: ordered,
      };
    })
    .filter((group) => group.products.length > 0);

  const bannersByGroupId = new Map<string | null, typeof config.banners>();
  config.banners.forEach((banner) => {
    const list = bannersByGroupId.get(banner.afterGroupId) || [];
    list.push(banner);
    bannersByGroupId.set(banner.afterGroupId, list);
  });

  return {
    groupBy: config.groupBy,
    cover: config.cover,
    headerFooter: config.headerFooter,
    visibleFields: config.visibleFields,
    productsPerRow: config.productsPerRow,
    groups,
    totalProductCount: groups.reduce((sum, g) => sum + g.products.length, 0),
    bannersByGroupId,
    watermarkLines: config.watermarkLines,
    imageWatermark: config.imageWatermark,
  };
}

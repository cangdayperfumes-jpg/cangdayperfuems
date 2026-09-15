import { Product } from '@/types';

export interface CatalogCoverConfig {
  title: string;
  subtitle: string;
  companyName: string;
  phone: string;
  email: string;
  website: string;
  social: string;
  address: string;
  seasonName: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
}

export interface CatalogHeaderFooterConfig {
  logoUrl: string;
  website: string;
  phone: string;
  email: string;
  social: string;
  copyrightText: string;
}

export interface CatalogVisibleFields {
  price: boolean;
  discount: boolean;
  description: boolean;
  category: boolean; // shows the product's category (or brand, if grouped by brand) as a tag
  popular: boolean;
  stock: boolean; // "Out of Stock" badge
}

export interface CatalogBanner {
  id: string;
  /** Insert after this group's key (category/brand id, or the sentinels above). null = before the first group. Id-based rather than index-based so a banner's position stays stable as filters change which groups actually render. */
  afterGroupId: string | null;
  title: string;
  subtitle: string;
  imageUrl: string;
  backgroundColor: string;
}

export type CatalogGroupBy = 'category' | 'brand';
export type CatalogPopularFilter = 'all' | 'popular' | 'not-popular';
export type CatalogStockFilter = 'all' | 'in-stock';
export type CatalogProductsPerRow = 3 | 4;

export interface CatalogWatermarkLine {
  id: string;
  enabled: boolean;
  /** Empty string falls back to the cover company name (or "ROYAL PERFUMES"). */
  text: string;
  /** 0–1 */
  opacity: number;
}

export type CatalogImageWatermarkMode = 'none' | 'text' | 'logo';

/** The small watermark stamped on top of each individual product photo (separate from the page-wide diagonal CatalogWatermarkLine bands). */
export interface CatalogImageWatermarkConfig {
  mode: CatalogImageWatermarkMode;
  /** Used when mode === 'text'. Empty string falls back to the cover company name. */
  text: string;
  /** 0–1 */
  opacity: number;
  /** Font size in pt, text mode only. */
  fontSize: number;
  /** Outline color around the text, text mode only. */
  strokeColor: string;
  /** Outline thickness in pt, text mode only — 0 disables the outline. */
  strokeWidth: number;
  /** Logo image URL, logo mode only. */
  logoUrl: string;
  /** Logo width as a % of the photo's width, logo mode only. */
  logoSize: number;
}

export interface CatalogConfig {
  groupBy: CatalogGroupBy;
  productsPerRow: CatalogProductsPerRow;
  /** Force-include these product ids regardless of the filters below. */
  includeProductIds: string[];
  /** Force-exclude these product ids — always wins, even over includeProductIds. */
  excludeProductIds: string[];
  filterCategoryIds: string[];
  filterPopular: CatalogPopularFilter;
  filterStock: CatalogStockFilter;
  /**
   * When true, the filters above are skipped entirely and the catalog only
   * contains products from `includeProductIds` — for hand-curating a catalog
   * from scratch instead of "no category checked" silently meaning "every
   * category".
   */
  manualSelectionOnly: boolean;
  /** Ordered group keys (category/brand id, or the sentinel below) from drag-reorder. Empty = default order. */
  groupOrder: string[];
  /** groupKey -> ordered product ids, from per-group drag-reorder. Missing entries keep filtered order. */
  productOrderByGroup: Record<string, string[]>;
  visibleFields: CatalogVisibleFields;
  cover: CatalogCoverConfig;
  headerFooter: CatalogHeaderFooterConfig;
  banners: CatalogBanner[];
  watermarkLines: CatalogWatermarkLine[];
  imageWatermark: CatalogImageWatermarkConfig;
}

export const UNCATEGORIZED_GROUP_KEY = 'uncategorized';
export const UNBRANDED_GROUP_KEY = 'unbranded';

/** Brands with this many products or fewer in the catalog get folded into the "Other Brands" group instead of getting their own section. */
export const OTHER_BRANDS_THRESHOLD = 3;

export function groupAnchorId(groupId: string): string {
  return `group-${groupId}`;
}

export interface CatalogModelGroup {
  /** Stable key used for the group order, product-order lookups, and the PDF's TOC anchor. */
  id: string;
  name: string;
  products: Product[];
}

export interface CatalogModel {
  groupBy: CatalogGroupBy;
  cover: CatalogCoverConfig;
  headerFooter: CatalogHeaderFooterConfig;
  visibleFields: CatalogVisibleFields;
  productsPerRow: CatalogProductsPerRow;
  groups: CatalogModelGroup[];
  totalProductCount: number;
  /** Banners to render immediately after the group with this key; null = before the first group. */
  bannersByGroupId: Map<string | null, CatalogBanner[]>;
  watermarkLines: CatalogWatermarkLine[];
  imageWatermark: CatalogImageWatermarkConfig;
}

// Pre-filled so the catalog has a sensible default without requiring an
// upload; the logo upload field in the editor still overrides it.
export const DEFAULT_CATALOG_LOGO_URL = '/images/royalLogo.png';

export function defaultCoverConfig(): CatalogCoverConfig {
  return {
    title: 'Product Catalog',
    subtitle: '',
    companyName: 'Royal Perfumes',
    phone: '',
    email: '',
    website: '',
    social: '',
    address: '',
    seasonName: '',
    description: '',
    logoUrl: DEFAULT_CATALOG_LOGO_URL,
    coverImageUrl: '',
  };
}

export function defaultHeaderFooterConfig(): CatalogHeaderFooterConfig {
  return {
    logoUrl: DEFAULT_CATALOG_LOGO_URL,
    website: '',
    phone: '',
    email: '',
    social: '',
    copyrightText: `© ${new Date().getFullYear()} Royal Perfumes. All rights reserved.`,
  };
}

export function defaultVisibleFields(): CatalogVisibleFields {
  return {
    price: true,
    discount: true,
    description: true,
    category: true,
    popular: true,
    stock: true,
  };
}

/**
 * Line 1 mirrors the catalog's original single fixed watermark (repeats the
 * brand/company name, faint 5% opacity, enabled by default). Lines 2–4 are
 * off until the merchant turns them on, so existing catalogs look unchanged.
 */
export function defaultWatermarkLines(): CatalogWatermarkLine[] {
  return [
    { id: 'watermark-1', enabled: true, text: '', opacity: 0.05 },
    { id: 'watermark-2', enabled: false, text: '', opacity: 0.05 },
    { id: 'watermark-3', enabled: false, text: '', opacity: 0.05 },
    { id: 'watermark-4', enabled: false, text: '', opacity: 0.05 },
  ];
}

/**
 * Matches the catalog's original hardcoded per-photo stamp: faint "ROYAL
 * PERFUMES" text, 14% opacity, no outline — so existing catalogs render
 * unchanged until a merchant switches mode or tweaks the sliders.
 */
export function defaultImageWatermark(): CatalogImageWatermarkConfig {
  return {
    mode: 'text',
    text: '',
    opacity: 0.14,
    fontSize: 11,
    strokeColor: '#FFFFFF',
    strokeWidth: 0,
    logoUrl: '',
    logoSize: 40,
  };
}

export function defaultCatalogConfig(): CatalogConfig {
  return {
    groupBy: 'category',
    productsPerRow: 4,
    includeProductIds: [],
    excludeProductIds: [],
    filterCategoryIds: [],
    filterPopular: 'all',
    filterStock: 'all',
    manualSelectionOnly: false,
    groupOrder: [],
    productOrderByGroup: {},
    visibleFields: defaultVisibleFields(),
    cover: defaultCoverConfig(),
    headerFooter: defaultHeaderFooterConfig(),
    banners: [],
    watermarkLines: defaultWatermarkLines(),
    imageWatermark: defaultImageWatermark(),
  };
}

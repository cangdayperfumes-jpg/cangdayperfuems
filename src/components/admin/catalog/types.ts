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
/** Language of the PDF's own labels and of product descriptions. */
export type CatalogLanguage = 'tr' | 'en';

export interface CatalogWatermarkLine {
  id: string;
  enabled: boolean;
  /** Empty string falls back to the cover company name (or "CANGDAY"). */
  text: string;
  /** 0–1 */
  opacity: number;
}

export interface CatalogConfig {
  language: CatalogLanguage;
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
  language: CatalogLanguage;
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
}

// Empty = the built-in Cangday logo (gold, transparent) is used.
export const DEFAULT_CATALOG_LOGO_URL = '';

export const STORE_DEFAULTS = {
  companyName: 'Cangday',
  website: 'cangdayperfume.com',
  email: 'support@cangdayperfume.com',
};

/** "Autumn / Winter 2026" — the season the catalog is made in. */
export function currentSeasonName(language: CatalogLanguage, date = new Date()): string {
  const m = date.getMonth();
  const y = date.getFullYear();
  const springSummer = m >= 2 && m <= 7;
  if (language === 'tr') return `${springSummer ? 'İlkbahar / Yaz' : 'Sonbahar / Kış'} ${y}`;
  return `${springSummer ? 'Spring / Summer' : 'Autumn / Winter'} ${y}`;
}

/** Pre-filled cover copy per language, so a catalog is ready without typing. */
export function coverCopy(language: CatalogLanguage) {
  return language === 'tr'
    ? {
        title: 'Parfüm Kataloğu',
        subtitle: 'Modern Parfümeri',
        seasonName: currentSeasonName('tr'),
        description:
          'Nasıl kokduklarına göre seçilmiş, özenle derlenmiş tasarımcı ve niş parfümler. Kalıcı, şık ve seçmesi kolay.',
      }
    : {
        title: 'Fragrance Catalogue',
        subtitle: 'Modern Perfumery',
        seasonName: currentSeasonName('en'),
        description:
          'An edited collection of designer and niche fragrances, chosen for how they actually wear — long-lasting, beautifully made and easy to choose from.',
      };
}

export function defaultCoverConfig(language: CatalogLanguage = 'tr'): CatalogCoverConfig {
  return {
    ...coverCopy(language),
    companyName: STORE_DEFAULTS.companyName,
    phone: '',
    email: STORE_DEFAULTS.email,
    website: STORE_DEFAULTS.website,
    social: '',
    address: '',
    logoUrl: DEFAULT_CATALOG_LOGO_URL,
    coverImageUrl: '',
  };
}

export function defaultHeaderFooterConfig(): CatalogHeaderFooterConfig {
  return {
    logoUrl: DEFAULT_CATALOG_LOGO_URL,
    website: STORE_DEFAULTS.website,
    phone: '',
    email: STORE_DEFAULTS.email,
    social: '',
    copyrightText: `© ${new Date().getFullYear()} Cangday`,
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

/** Page-wide diagonal text is off by default (it fights the product photos); lines can be turned on. */
export function defaultWatermarkLines(): CatalogWatermarkLine[] {
  return [
    { id: 'watermark-1', enabled: false, text: '', opacity: 0.04 },
    { id: 'watermark-2', enabled: false, text: '', opacity: 0.04 },
    { id: 'watermark-3', enabled: false, text: '', opacity: 0.04 },
    { id: 'watermark-4', enabled: false, text: '', opacity: 0.04 },
  ];
}

export function defaultCatalogConfig(language: CatalogLanguage = 'tr'): CatalogConfig {
  return {
    language,
    groupBy: 'category',
    productsPerRow: 4,
    includeProductIds: [],
    excludeProductIds: [],
    filterCategoryIds: [],
    filterPopular: 'all',
    filterStock: 'in-stock',
    manualSelectionOnly: false,
    groupOrder: [],
    productOrderByGroup: {},
    visibleFields: defaultVisibleFields(),
    cover: defaultCoverConfig(language),
    headerFooter: defaultHeaderFooterConfig(),
    banners: [],
    watermarkLines: defaultWatermarkLines(),
  };
}

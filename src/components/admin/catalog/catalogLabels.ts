import type { Product } from '@/types';
import type { CatalogLanguage } from './types';

/** Fixed wording printed in the catalog PDF / preview, per catalog language. */
export function catalogLabels(language: CatalogLanguage) {
  const tr = language === 'tr';
  return {
    contents: tr ? 'İçindekiler' : 'Contents',
    contentsEyebrow: tr ? 'Koleksiyon' : 'The collection',
    items: (n: number) => (tr ? `${n} ürün` : `${n} ${n === 1 ? 'item' : 'items'}`),
    groups: (n: number, byBrand: boolean) =>
      tr ? `${n} ${byBrand ? 'marka' : 'kategori'}` : `${n} ${byBrand ? (n === 1 ? 'brand' : 'brands') : n === 1 ? 'category' : 'categories'}`,
    products: (n: number) => (tr ? `${n} ürün` : `${n} ${n === 1 ? 'product' : 'products'}`),
    page: (n: number, total: number) => (tr ? `Sayfa ${n} / ${total}` : `Page ${n} of ${total}`),
    popular: tr ? 'Popüler' : 'Popular',
    outOfStock: tr ? 'Stokta yok' : 'Out of stock',
    edition: (date: string) => (tr ? `${date} baskısı` : `Edition ${date}`),
    slogan: tr ? 'İzini Bırakan Kokular.' : 'Wear What Lingers.',
    pricesNote: tr ? 'Fiyatlar Türk lirası (₺) cinsindendir. Fiyat ve stok durumu değişebilir.' : 'Prices are in Turkish lira (₺). Prices and availability may change.',
    orderOnline: tr ? 'Sipariş için' : 'Order online',
    other: tr ? 'Diğer' : 'Other',
    from: tr ? 'başlayan' : 'from',
    dateLocale: tr ? 'tr-TR' : 'en-GB',
  };
}

export type CatalogLabels = ReturnType<typeof catalogLabels>;

/** Description in the catalog's language, falling back to the other one. */
export function catalogDescription(product: Product, language: CatalogLanguage): string {
  const tr = (product as Product & { description_tr?: string | null }).description_tr;
  const en = product.description_en;
  return ((language === 'tr' ? tr || en : en || tr) || '').trim();
}

/** Cuts at a word boundary so text never overflows its card. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 12)).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** True for dark backgrounds, so banner copy switches to ivory. */
export function isDarkColor(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

export interface CatalogPrice {
  price: number;
  /** Original price when discounted, else null. */
  was: number | null;
  /** True when the product has sizes and this is the lowest one. */
  from: boolean;
}

/**
 * The price a catalog card shows. Products with sizes keep their prices on
 * product_variants (the product row's own price is 0), so use the cheapest
 * active size and mark it "from".
 */
export function catalogPrice(product: Product, withDiscount: boolean): CatalogPrice | null {
  const variants = ((product as Product & { product_variants?: { price: number; discount: number; is_active?: boolean }[] })
    .product_variants || []).filter((v) => v.is_active !== false && Number(v.price) > 0);
  if (product.has_variants && variants.length) {
    const finals = variants.map((v) => ({ final: v.price - (withDiscount ? v.discount || 0 : 0), base: v.price }));
    const cheapest = finals.reduce((a, b) => (b.final < a.final ? b : a));
    return { price: cheapest.final, was: cheapest.final < cheapest.base ? cheapest.base : null, from: variants.length > 1 };
  }
  if (!(Number(product.price) > 0)) return null;
  const discounted = withDiscount && product.discount > 0;
  return { price: product.price - (discounted ? product.discount : 0), was: discounted ? product.price : null, from: false };
}

/**
 * Product copy per language for the page body, <meta> tags and structured
 * data. Products without a written description get a short factual one built
 * from real fields (name, brand, audience, category) — never invented scent
 * notes — so every page still has a unique, language-correct meta description.
 */

interface ProductCopyInput {
  name_en: string;
  description_en?: string | null;
  description_tr?: string | null;
  target_audience?: string | null;
  brands?: { name?: string | null } | null;
  categories?: { name?: string | null } | null;
}

const AUDIENCE: Record<string, { tr: string; en: string }> = {
  Men: { tr: 'erkek', en: "men's" },
  Women: { tr: 'kadın', en: "women's" },
  Unisex: { tr: 'unisex', en: 'unisex' },
};

/** The written description in this language, if there is one. */
export function productDescription(p: ProductCopyInput, locale: string): string {
  const tr = (p.description_tr ?? '').trim();
  const en = (p.description_en ?? '').trim();
  return locale === 'tr' ? tr || en : en || tr;
}

/** Factual fallback when no description is written. */
export function productFallbackDescription(p: ProductCopyInput, locale: string): string {
  const brand = p.brands?.name?.trim();
  const aud = AUDIENCE[p.target_audience ?? ''];
  const category = p.categories?.name?.trim();
  if (locale === 'tr') {
    return [
      // No category here: category names are English ("Perfumes").
      `${p.name_en}${brand ? `, ${brand}` : ''} imzalı orijinal ${aud ? `${aud.tr} ` : ''}parfüm.`,
      'Cangday güvencesiyle %100 orijinal şişe, Türkiye’ye hızlı kargo ve 14 gün kolay iade.',
    ].join(' ');
  }
  return [
    `${p.name_en}${brand ? ` by ${brand}` : ''} — an original ${aud ? `${aud.en} ` : ''}fragrance${category ? ` (${category})` : ''}.`,
    '100% authentic bottle from Cangday, fast shipping across Turkey and 14-day easy returns.',
  ].join(' ');
}

/** ≤160 characters for <meta name="description">, cut at a word boundary. */
export function metaDescription(p: ProductCopyInput, locale: string): string {
  const text = (productDescription(p, locale) || productFallbackDescription(p, locale)).replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:—-]+$/, '')}…`;
}

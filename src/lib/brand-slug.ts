/**
 * URL-safe brand slug: lowercase ASCII letters/digits joined by single dashes.
 * "Dolce & Gabbana" → "dolce-gabbana", "Penhaligon's" → "penhaligons",
 * "  Sol de Janeiro Cheirosa" → "sol-de-janeiro-cheirosa".
 *
 * The same rule is used by supabase/migrations/20261104010000_clean_brand_slugs.sql,
 * so brands created before and after it get identical slugs.
 */
export function brandSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

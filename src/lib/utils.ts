import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Generates a URL-friendly slug from a string.
 * e.g. "Black Rose Oud!" → "black-rose-oud"
 */
export function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '');          // trim leading/trailing hyphens
}

/**
 * Resolves a unique slug for `name` within `table`/`column`, appending `-2`,
 * `-3`, etc. on collision. Table-agnostic core shared by every entity that
 * needs a unique slug (products, seasonal collections, ...).
 */
async function resolveUniqueSlug(
  supabase: any,
  table: string,
  column: string,
  name: string,
  excludeId?: string,
  fallbackPrefix: string = table
): Promise<string> {
  let baseSlug = generateSlug(name);
  if (!baseSlug) {
    baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `${fallbackPrefix}-${Date.now()}`;
  }

  const { data: slugMatches } = await supabase
    .from(table)
    .select(column)
    .or(`${column}.eq.${baseSlug},${column}.like.${baseSlug}-%`)
    .neq('id', excludeId || '00000000-0000-0000-0000-000000000000');

  if (!slugMatches || slugMatches.length === 0) return baseSlug;

  const existingSlugs = new Set(slugMatches.map((row: any) => row[column]));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let counter = 2;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

/**
 * Resolves a unique product slug for `name`, appending `-2`, `-3`, etc. on
 * collision. Shared by the single-product admin form and bulk Excel import
 * so every product always ends up with a slug — never left null.
 */
export async function resolveUniqueProductSlug(
  supabase: any,
  name: string,
  excludeId?: string
): Promise<string> {
  return resolveUniqueSlug(supabase, 'products', 'slug', name, excludeId, 'product');
}

/**
 * Resolves a unique seasonal collection slug for `name`, appending `-2`,
 * `-3`, etc. on collision — same strategy as products.
 */
export async function resolveUniqueSeasonalCollectionSlug(
  supabase: any,
  name: string,
  excludeId?: string
): Promise<string> {
  return resolveUniqueSlug(supabase, 'seasonal_collections', 'slug', name, excludeId, 'collection');
}

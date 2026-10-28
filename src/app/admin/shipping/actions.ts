'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { DOMESTIC_COUNTRY_CODE } from '@/lib/shipping';

function revalidateShipping() {
  updateTag('shipping-zones');
  revalidatePath('/admin/shipping');
  revalidatePath('/[locale]/shipping', 'page');
}

function isValidPrice(price: number) {
  return Number.isFinite(price) && price >= 0;
}

type Result = { success: true } | { success: false; error: string };

/** Save edited price/enabled state for many country rows at once. */
export async function saveZoneChanges(
  changes: { id: string; price: number; is_enabled: boolean; shipping_details?: string | null }[]
): Promise<Result> {
  if (changes.some((c) => !isValidPrice(c.price))) {
    return { success: false, error: 'Invalid price' };
  }
  const supabase = await createClient();
  const now = new Date().toISOString();
  const results = await Promise.all(
    changes.map(({ id, ...data }) =>
      supabase.from('shipping_zones').update({ ...data, updated_at: now }).eq('id', id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { success: false, error: failed.error.message };
  revalidateShipping();
  return { success: true };
}

/**
 * Bulk-apply a price and/or enabled state to every country in a continent
 * (or all international countries when continent is 'all'). Turkey is
 * never touched here — it has its own domestic controls.
 */
export async function bulkUpdateInternational(
  continent: string,
  patch: { price?: number; is_enabled?: boolean }
): Promise<Result> {
  if (patch.price !== undefined && !isValidPrice(patch.price)) {
    return { success: false, error: 'Invalid price' };
  }
  const supabase = await createClient();
  let query = supabase
    .from('shipping_zones')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .is('city', null)
    .neq('country_code', DOMESTIC_COUNTRY_CODE);
  if (continent !== 'all') query = query.eq('continent', continent);
  const { error } = await query;
  if (error) return { success: false, error: error.message };
  revalidateShipping();
  return { success: true };
}

/** Add or update a Turkish province's custom price. */
export async function upsertProvinceOverride(province: string, price: number): Promise<Result> {
  if (!province || !isValidPrice(price)) return { success: false, error: 'Invalid input' };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('shipping_zones')
    .select('id')
    .eq('country_code', DOMESTIC_COUNTRY_CODE)
    .eq('city', province)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from('shipping_zones')
        .update({ price, is_enabled: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    : await supabase.from('shipping_zones').insert({
        country: 'Turkey',
        country_code: DOMESTIC_COUNTRY_CODE,
        continent: 'Europe',
        city: province,
        price,
        is_enabled: true,
      });
  if (error) return { success: false, error: error.message };
  revalidateShipping();
  return { success: true };
}

export async function removeProvinceOverride(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('shipping_zones')
    .delete()
    .eq('id', id)
    .eq('country_code', DOMESTIC_COUNTRY_CODE)
    .not('city', 'is', null);
  if (error) return { success: false, error: error.message };
  revalidateShipping();
  return { success: true };
}

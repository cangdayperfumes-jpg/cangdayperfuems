'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

type Result = { success: true } | { success: false; error: string };

/** Homepage reads reviews through a tagged cache — refresh it and the page. */
function refresh() {
  revalidatePath('/admin/testimonials');
  updateTag('testimonials');
  revalidatePath('/[locale]', 'page');
}

/** Adds already-uploaded screenshots after the existing ones, in the given order. */
export async function addTestimonials(urls: string[]): Promise<Result> {
  if (urls.length === 0) return { success: true };
  const supabase = await createClient();
  const { data: last } = await supabase
    .from('testimonials')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.display_order ?? -1) + 1;
  const { error } = await supabase
    .from('testimonials')
    .insert(urls.map((image_url, i) => ({ image_url, display_order: start + i, is_active: true })));
  if (error) return { success: false, error: error.message };
  refresh();
  return { success: true };
}

export async function setTestimonialActive(id: string, isActive: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('testimonials').update({ is_active: isActive }).eq('id', id);
  if (error) return { success: false, error: error.message };
  refresh();
  return { success: true };
}

export async function deleteTestimonials(ids: string[]): Promise<Result> {
  if (ids.length === 0) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.from('testimonials').delete().in('id', ids);
  if (error) return { success: false, error: error.message };
  refresh();
  return { success: true };
}

/** Saves the whole order at once (ids first → last). */
export async function reorderTestimonials(ids: string[]): Promise<Result> {
  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, display_order) => supabase.from('testimonials').update({ display_order }).eq('id', id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { success: false, error: failed.error.message };
  refresh();
  return { success: true };
}

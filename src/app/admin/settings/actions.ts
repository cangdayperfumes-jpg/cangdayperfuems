'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

/**
 * Called right after Settings are saved. The storefront caches settings for
 * 60s and its pages for another 60s, so a change (e.g. turning the mini gift
 * off) used to take up to two minutes to show. This expires both now.
 */
export async function refreshStorefrontSettings() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { success: false as const };

  updateTag('site-settings');
  revalidatePath('/[locale]', 'layout');
  return { success: true as const };
}

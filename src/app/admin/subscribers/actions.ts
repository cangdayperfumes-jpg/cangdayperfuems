'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

type Result = { success: true } | { success: false; error: string };

export async function deleteSubscribers(ids: string[]): Promise<Result> {
  if (ids.length === 0) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_subscribers').delete().in('id', ids);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/subscribers');
  revalidatePath('/admin');
  return { success: true };
}

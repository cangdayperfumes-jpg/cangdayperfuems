'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath, updateTag } from 'next/cache';
import { CategoryTile } from '@/types';
import type { CropMeta } from '@/lib/image-crop';

export interface CategoryTileInput {
  label: string;
  image_url: string;
  link_href: string;
  col_span: CategoryTile['col_span'];
  row_span: CategoryTile['row_span'];
  display_order: number;
  is_active: boolean;
  image_crop_desktop?: CropMeta | null;
  image_crop_mobile?: CropMeta | null;
}

function revalidateTilePaths() {
  revalidatePath('/admin/marketing/category-tiles');
  // The homepage lives at /tr and /en (the [locale] route), not '/', and
  // reads tiles through a tagged cache — refresh both.
  updateTag('category-tiles');
  revalidatePath('/[locale]', 'page');
}

export async function getCategoryTiles() {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from('category_tiles')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching category tiles:', error);
    return { data: [], totalCount: 0 };
  }

  return { data: data as CategoryTile[], totalCount: count || 0 };
}

export async function getCategoryTileById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('category_tiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching category tile:', error);
    return null;
  }

  return data as CategoryTile;
}

export async function createCategoryTile(input: CategoryTileInput) {
  const supabase = await createClient();

  if (!input.label?.trim()) {
    return { success: false, error: 'Label is required' };
  }
  if (!input.image_url?.trim()) {
    return { success: false, error: 'Image is required' };
  }

  const { data, error } = await supabase
    .from('category_tiles')
    .insert(input)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating category tile:', error);
    return { success: false, error: error.message };
  }

  revalidateTilePaths();
  return { success: true, id: data.id as string };
}

export async function updateCategoryTile(id: string, input: CategoryTileInput) {
  const supabase = await createClient();

  if (!input.label?.trim()) {
    return { success: false, error: 'Label is required' };
  }
  if (!input.image_url?.trim()) {
    return { success: false, error: 'Image is required' };
  }

  const { error } = await supabase
    .from('category_tiles')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating category tile:', error);
    return { success: false, error: error.message };
  }

  revalidateTilePaths();
  return { success: true };
}

export async function deleteCategoryTile(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('category_tiles').delete().eq('id', id);

  if (error) {
    console.error('Error deleting category tile:', error);
    return { success: false, error: error.message };
  }

  revalidateTilePaths();
  return { success: true };
}

export async function updateCategoryTilesOrder(orderedIds: string[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('category_tiles').update({ display_order: index }).eq('id', id)
    )
  );

  revalidateTilePaths();
  return { success: true };
}

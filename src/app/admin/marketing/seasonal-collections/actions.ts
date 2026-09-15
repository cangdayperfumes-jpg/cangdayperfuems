'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { resolveUniqueSeasonalCollectionSlug } from '@/lib/utils';
import { SeasonalCollection, SeasonalCollectionProductLink } from '@/types';

export interface SeasonalCollectionInput {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  season_type?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  banner_image_desktop?: string | null;
  banner_image_mobile?: string | null;
  background_pattern_image?: string | null;
  decorative_image?: string | null;
  background_color: string;
  text_color: string;
  overlay_opacity: number;
  image_position: SeasonalCollection['image_position'];
  section_height: SeasonalCollection['section_height'];
  text_alignment: SeasonalCollection['text_alignment'];
  animation_style: SeasonalCollection['animation_style'];
  button_text: string;
  button_color?: string | null;
  button_style: SeasonalCollection['button_style'];
  display_order: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  products: { product_id: string; display_order: number }[];
}

function revalidateSeasonalPaths() {
  revalidatePath('/admin/marketing/seasonal-collections');
  revalidatePath('/');
  revalidatePath('/shop');
}

export async function getSeasonalCollections({
  query,
  page = 1,
  limit = 20,
}: { query?: string; page?: number; limit?: number } = {}) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let dbQuery = supabase
    .from('seasonal_collections')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true });

  if (query) {
    dbQuery = dbQuery.ilike('title', `%${query}%`);
  }

  const { data, count, error } = await dbQuery.range(from, to);

  if (error) {
    console.error('Error fetching seasonal collections:', error);
    return { data: [], totalPages: 0, totalCount: 0 };
  }

  return {
    data: data as SeasonalCollection[],
    totalPages: count ? Math.ceil(count / limit) : 0,
    totalCount: count || 0,
  };
}

export async function getSeasonalCollectionById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('seasonal_collections')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching seasonal collection:', error);
    return null;
  }

  const { data: productLinks } = await supabase
    .from('seasonal_collection_products')
    .select('collection_id, product_id, display_order, products(id, name_en, images)')
    .eq('collection_id', id)
    .order('display_order', { ascending: true });

  return {
    collection: data as SeasonalCollection,
    products: (productLinks || []) as unknown as SeasonalCollectionProductLink[],
  };
}

async function syncCollectionProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  collectionId: string,
  products: { product_id: string; display_order: number }[]
) {
  const { error: deleteError } = await supabase
    .from('seasonal_collection_products')
    .delete()
    .eq('collection_id', collectionId);

  if (deleteError) throw deleteError;

  if (products.length === 0) return;

  const { error: insertError } = await supabase.from('seasonal_collection_products').insert(
    products.map((p) => ({
      collection_id: collectionId,
      product_id: p.product_id,
      display_order: p.display_order,
    }))
  );

  if (insertError) throw insertError;
}

export async function createSeasonalCollection(input: SeasonalCollectionInput) {
  const supabase = await createClient();

  if (!input.title?.trim()) {
    return { success: false, error: 'Title is required' };
  }

  const slug = await resolveUniqueSeasonalCollectionSlug(supabase, input.title);

  const { products, ...rest } = input;

  const { data, error } = await supabase
    .from('seasonal_collections')
    .insert({ ...rest, slug })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating seasonal collection:', error);
    return { success: false, error: error.message };
  }

  try {
    await syncCollectionProducts(supabase, data.id, products);
  } catch (error: any) {
    console.error('Error syncing seasonal collection products:', error);
    return { success: false, error: 'Collection created, but failed to save products.' };
  }

  revalidateSeasonalPaths();
  return { success: true, id: data.id as string };
}

export async function updateSeasonalCollection(id: string, input: SeasonalCollectionInput) {
  const supabase = await createClient();

  if (!input.title?.trim()) {
    return { success: false, error: 'Title is required' };
  }

  const slug = await resolveUniqueSeasonalCollectionSlug(supabase, input.title, id);

  const { products, ...rest } = input;

  const { error } = await supabase
    .from('seasonal_collections')
    .update({ ...rest, slug, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating seasonal collection:', error);
    return { success: false, error: error.message };
  }

  try {
    await syncCollectionProducts(supabase, id, products);
  } catch (error: any) {
    console.error('Error syncing seasonal collection products:', error);
    return { success: false, error: 'Collection updated, but failed to save products.' };
  }

  revalidateSeasonalPaths();
  return { success: true };
}

export async function deleteSeasonalCollection(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('seasonal_collections').delete().eq('id', id);

  if (error) {
    console.error('Error deleting seasonal collection:', error);
    return { success: false, error: error.message };
  }

  revalidateSeasonalPaths();
  return { success: true };
}

export async function updateSeasonalCollectionsOrder(orderedIds: string[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('seasonal_collections').update({ display_order: index }).eq('id', id)
    )
  );

  revalidateSeasonalPaths();
  return { success: true };
}

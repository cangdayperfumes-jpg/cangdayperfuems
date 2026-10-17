'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { HeroSlide } from '@/types';
import type { CropMeta } from '@/lib/image-crop';

export interface HeroSlideInput {
  eyebrow: string;
  headline: string;
  headline_accent?: string | null;
  subheading?: string | null;
  image_url: string;
  image_position: HeroSlide['image_position'];
  image_crop_desktop?: CropMeta | null;
  image_crop_mobile?: CropMeta | null;
  button_text: string;
  button_link: string;
  secondary_button_text?: string | null;
  secondary_button_link?: string | null;
  eyebrow_tr?: string | null;
  headline_tr?: string | null;
  headline_accent_tr?: string | null;
  subheading_tr?: string | null;
  button_text_tr?: string | null;
  secondary_button_text_tr?: string | null;
  display_order: number;
  is_active: boolean;
}

function revalidateHeroPaths() {
  revalidatePath('/admin/marketing/hero-slides');
  revalidatePath('/');
  // The storefront home lives at /en and /tr (app/[locale]/page.tsx), which
  // revalidatePath('/') alone doesn't reach.
  revalidatePath('/[locale]', 'page');
}

export async function getHeroSlides() {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from('hero_slides')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching hero slides:', error);
    return { data: [], totalCount: 0 };
  }

  return { data: data as HeroSlide[], totalCount: count || 0 };
}

export async function getHeroSlideById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching hero slide:', error);
    return null;
  }

  return data as HeroSlide;
}

export async function createHeroSlide(input: HeroSlideInput) {
  const supabase = await createClient();

  if (!input.headline?.trim()) {
    return { success: false, error: 'Headline is required' };
  }
  if (!input.image_url?.trim()) {
    return { success: false, error: 'Image is required' };
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .insert(input)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating hero slide:', error);
    return { success: false, error: error.message };
  }

  revalidateHeroPaths();
  return { success: true, id: data.id as string };
}

export async function updateHeroSlide(id: string, input: HeroSlideInput) {
  const supabase = await createClient();

  if (!input.headline?.trim()) {
    return { success: false, error: 'Headline is required' };
  }
  if (!input.image_url?.trim()) {
    return { success: false, error: 'Image is required' };
  }

  const { error } = await supabase
    .from('hero_slides')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating hero slide:', error);
    return { success: false, error: error.message };
  }

  revalidateHeroPaths();
  return { success: true };
}

export async function deleteHeroSlide(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('hero_slides').delete().eq('id', id);

  if (error) {
    console.error('Error deleting hero slide:', error);
    return { success: false, error: error.message };
  }

  revalidateHeroPaths();
  return { success: true };
}

export async function updateHeroSlidesOrder(orderedIds: string[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('hero_slides').update({ display_order: index }).eq('id', id)
    )
  );

  revalidateHeroPaths();
  return { success: true };
}

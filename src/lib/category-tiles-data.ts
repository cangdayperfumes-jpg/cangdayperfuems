import { createClient } from '@supabase/supabase-js';
import { PLACEHOLDER_SUPABASE_URL } from '@/utils/supabase/placeholder';
import { unstable_cache } from 'next/cache';
import { CategoryTile } from '@/types';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
}

export const getActiveCategoryTiles = unstable_cache(
  async (): Promise<CategoryTile[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase();
    const { data } = await supabase
      .from('category_tiles')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  },
  ['active-category-tiles'],
  // Tagged so admin edits show on the homepage immediately (see
  // admin/marketing/category-tiles/actions.ts) instead of after the 60s window.
  { revalidate: 60, tags: ['category-tiles'] }
);

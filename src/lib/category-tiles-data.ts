import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { CategoryTile } from '@/types';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getActiveCategoryTiles = unstable_cache(
  async (): Promise<CategoryTile[]> => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('category_tiles')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  },
  ['active-category-tiles'],
  { revalidate: 60 }
);

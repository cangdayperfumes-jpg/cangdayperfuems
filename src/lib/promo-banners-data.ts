import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { PromoBanner } from '@/types';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getActivePromoBanners = unstable_cache(
  async (): Promise<PromoBanner[]> => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('promo_banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  },
  ['active-promo-banners'],
  { revalidate: 60 }
);

import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { HeroSlide } from '@/types';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';

/**
 * Plain (cookie-free) client: unstable_cache forbids request-scoped dynamic
 * data, and this is a public, unauthenticated-shape read anyway.
 */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getActiveHeroSlides = unstable_cache(
  async (): Promise<HeroSlide[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase();
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  },
  ['active-hero-slides'],
  { revalidate: 60 }
);

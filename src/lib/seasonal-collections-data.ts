import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { SeasonalCollection } from '@/types';

/**
 * Single source of truth for "which seasonal collections are currently
 * live" — reused by the homepage, /shop's season filter, and the sitemap so
 * all three agree on exactly the same active/scheduled/expired logic.
 *
 * Plain (cookie-free) client: unstable_cache forbids request-scoped dynamic
 * data, and this is a public, unauthenticated-shape read anyway.
 */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getActiveSeasonalCollections = unstable_cache(
  async (): Promise<SeasonalCollection[]> => {
    const supabase = getSupabase();
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from('seasonal_collections')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${nowIso}`)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)
      .order('display_order', { ascending: true });
    return data || [];
  },
  ['active-seasonal-collections'],
  { revalidate: 60 }
);

export function resolveVisibleSeasonalCollections(
  all: SeasonalCollection[],
  multiActive: boolean
): SeasonalCollection[] {
  if (multiActive) return all;
  return all.slice(0, 1);
}

export interface SeasonalSectionSettings {
  seasonal_collections_multi_active: boolean;
  seasonal_section_position: string;
}

export const getSeasonalSectionSettings = unstable_cache(
  async (): Promise<SeasonalSectionSettings> => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('system_settings')
      .select('seasonal_collections_multi_active, seasonal_section_position')
      .eq('id', 'global')
      .single();
    return {
      seasonal_collections_multi_active: data?.seasonal_collections_multi_active ?? false,
      seasonal_section_position: data?.seasonal_section_position ?? 'after_gender_collection',
    };
  },
  ['seasonal-section-settings'],
  { revalidate: 60 }
);

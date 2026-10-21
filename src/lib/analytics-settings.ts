import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';

/** GA4 measurement ID + Search Console token from Settings (both public by nature). */
export const getAnalyticsSettings = unstable_cache(
  async (): Promise<{ gaId: string; gscVerification: string }> => {
    if (!isSupabaseConfigured()) return { gaId: '', gscVerification: '' };
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data } = await supabase.from('system_settings').select('ga_measurement_id, gsc_verification').eq('id', 'global').single();
    return { gaId: data?.ga_measurement_id || '', gscVerification: data?.gsc_verification || '' };
  },
  ['analytics-settings'],
  { revalidate: 300, tags: ['site-settings'] }
);

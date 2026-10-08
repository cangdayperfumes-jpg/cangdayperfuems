import { createClient } from '@supabase/supabase-js';
import { PLACEHOLDER_SUPABASE_URL } from '@/utils/supabase/placeholder';
import { unstable_cache } from 'next/cache';
import { isSupabaseConfigured } from '@/lib/is-supabase-configured';

export interface Testimonial {
  id: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
}

export const getActiveTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase();
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  },
  ['active-testimonials'],
  { revalidate: 60 }
);

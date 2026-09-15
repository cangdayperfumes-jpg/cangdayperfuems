import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

/**
 * Shared, cached category/brand lists for admin product forms. Reused across
 * every admin route that renders <ProductForm> (products list edit sheet,
 * edit page, new page) instead of each one fetching them client-side on
 * every mount.
 *
 * Uses a plain (cookie-free) client — `unstable_cache` forbids accessing
 * request-scoped dynamic data like `cookies()` (which the shared SSR helper
 * in `@/utils/supabase/server` reads internally) inside a cached function.
 * These are unauthenticated-shape reads (id/name/slug), so no cookie-scoped
 * client is needed here anyway.
 */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getCachedAdminCategories = unstable_cache(
  async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('categories').select('id, name, slug').order('name');
    return data || [];
  },
  ['admin-categories'],
  { revalidate: 60 }
);

export const getCachedAdminBrands = unstable_cache(
  async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('brands').select('id, name, slug').order('name');
    return data || [];
  },
  ['admin-brands'],
  { revalidate: 60 }
);

import { createClient } from '@/utils/supabase/server';
import type { Testimonial } from '@/lib/testimonials-data';
import TestimonialsManager from './TestimonialsManager';

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  const rows = (data ?? []) as Testimonial[];
  // Remount when the set of rows changes (after an upload or delete) so the
  // manager's local, optimistic list starts from the fresh server data.
  return <TestimonialsManager key={rows.map((r) => r.id).join(',')} testimonials={rows} />;
}

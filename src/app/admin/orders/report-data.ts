import { createClient } from '@/utils/supabase/server';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { REPORT_SELECT, type ReportOrder, type ResolvedRange } from '@/lib/order-report';

/** Every order in the range (all pages, not just the 20 on screen) for stats and exports. */
export async function fetchReportOrders(range: ResolvedRange, status?: string): Promise<ReportOrder[]> {
  const supabase = await createClient();
  return fetchAllRows<ReportOrder>((from, to) => {
    let q = supabase.from('orders').select(REPORT_SELECT).order('created_at', { ascending: false });
    if (range.fromIso) q = q.gte('created_at', range.fromIso);
    if (range.toIso) q = q.lt('created_at', range.toIso);
    if (status && status !== 'all') q = q.eq('status', status);
    return q.range(from, to) as unknown as PromiseLike<{ data: ReportOrder[] | null; error: unknown }>;
  });
}

import { createClient } from '@/utils/supabase/server';
import CouponsManager, { type Coupon } from './CouponsManager';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('coupons')
    .select('id, code, discount_type, discount_value, min_order, max_uses, used_count, once_per_customer, expires_at, is_active, batch_id, note, created_at')
    .order('created_at', { ascending: false });

  return <CouponsManager coupons={(data ?? []) as Coupon[]} />;
}

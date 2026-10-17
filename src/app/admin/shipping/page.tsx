import { createClient } from '@/utils/supabase/server';
import ShippingManager from './ShippingManager';
import type { ShippingZone } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

export default async function ShippingPage() {
  const supabase = await createClient();
  const { data: zones } = await supabase
    .from('shipping_zones')
    .select('id, country, country_code, city, price, continent, shipping_details, is_enabled')
    .order('country', { ascending: true });

  return <ShippingManager zones={(zones ?? []) as ShippingZone[]} />;
}

import { createClient } from '@/utils/supabase/server';
import { parseOffers } from '@/lib/offers';
import OffersForm from './OffersForm';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('system_settings')
    .select('offers, gift_enabled, gift_threshold')
    .eq('id', 'global')
    .single();

  return (
    <OffersForm
      initial={{
        offers: parseOffers(data?.offers),
        gift: { enabled: data?.gift_enabled ?? true, threshold: Number(data?.gift_threshold ?? 750) },
      }}
      // false until the 20261029000000_bag_offers.sql migration has run.
      ready={!!data && 'offers' in data}
    />
  );
}

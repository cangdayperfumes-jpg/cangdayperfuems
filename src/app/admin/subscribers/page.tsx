import { createClient } from '@/utils/supabase/server';
import SubscribersManager, { type Subscriber } from './SubscribersManager';

export const dynamic = 'force-dynamic';

export default async function SubscribersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, locale, created_at')
    .order('created_at', { ascending: false });

  return <SubscribersManager subscribers={(data ?? []) as Subscriber[]} />;
}

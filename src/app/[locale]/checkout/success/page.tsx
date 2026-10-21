import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/utils/supabase/server';
import SuccessClient from '@/components/shop/SuccessClient';

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId } = await searchParams;
  const t = await getTranslations('checkout');
  const supabase = await createClient();
  
  let order = null;
  let items = [];

  // Orders aren't publicly readable; this function returns only this order
  // (its random id is the key) and only for a week after it was placed.
  if (orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    const { data } = await supabase.rpc('get_order_receipt', { p_order_id: orderId });
    if (data) {
      order = data.order;
      items = data.items || [];
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-24 text-center bg-white px-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl md:text-5xl font-heading mb-4 text-black">{t('successTitle')}</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto font-body font-light">
          {t('thankYou')}
          {orderId && <span className="block mt-2 font-medium text-black">{t('orderRef', { id: orderId.slice(0, 8) })}</span>}
        </p>

        <div className="flex flex-col gap-4">
          {order && (
              <SuccessClient order={order} items={items} />
          )}

          <div className="mt-12 text-center">
            <Link href="/shop" className="text-sm font-medium border-b border-black pb-1 hover:text-gray-600 transition-colors">
              {t('returnToCatalog')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

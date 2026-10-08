"use client";

import DownloadInvoiceMenu from './DownloadInvoiceMenu';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/hooks/use-cart';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useTranslations } from 'next-intl';

import { Order, OrderItem } from '@/types';

interface SuccessClientProps {
  order: Order;
  items: OrderItem[];
}

export default function SuccessClient({ order, items }: SuccessClientProps) {
  const t = useTranslations('checkout');
  const [isClient, setIsClient] = useState(false);
  const clearCart = useCartStore((state) => state.clearCart);
  const { hidePrices } = useSettings();

  useEffect(() => {
    // Clear the cart when the user reaches the success page
    clearCart();
    
    // Use setTimeout to avoid synchronous setState warning
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, [clearCart]);

  if (!isClient) {
    return (
       <Button variant="outline" size="lg" disabled>
          <Download className="mr-2 h-4 w-4" /> {t('loadingOptions')}
       </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 mt-8 w-full max-w-sm mx-auto">
      <div className="w-full text-center space-y-2">
        <h3 className="font-heading text-lg font-medium">{t('step1')}</h3>
        <p className="text-sm text-muted-foreground">{t('downloadInvoice')}</p>
        <DownloadInvoiceMenu order={order} items={items} variant="default" showPricedOption={!hidePrices} />
      </div>

      <div className="w-full text-center space-y-2 border-t pt-6">
        <h3 className="font-heading text-lg font-medium">{t('step2')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('confirmShippingSoon')}
        </p>
      </div>
    </div>
  );
}

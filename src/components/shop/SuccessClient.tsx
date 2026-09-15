"use client";

import DownloadInvoiceMenu from './DownloadInvoiceMenu';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/hooks/use-cart';
import { useSettings } from '@/components/providers/SettingsProvider';

import { Order, OrderItem } from '@/types';

interface SuccessClientProps {
  order: Order;
  items: OrderItem[];
}

export default function SuccessClient({ order, items }: SuccessClientProps) {
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
          <Download className="mr-2 h-4 w-4" /> Loading Options...
       </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 mt-8 w-full max-w-sm mx-auto">
      <div className="w-full text-center space-y-2">
        <h3 className="font-heading text-lg font-medium">Step 1</h3>
        <p className="text-sm text-muted-foreground">Download your invoice.</p>
        <DownloadInvoiceMenu order={order} items={items} variant="default" showPricedOption={!hidePrices} />
      </div>

      <div className="w-full text-center space-y-2 border-t pt-6">
        <h3 className="font-heading text-lg font-medium">Step 2</h3>
        <p className="text-sm text-muted-foreground">
          Please send this PDF to our team on WhatsApp to finalize shipping and payment.
        </p>
        <Button 
          size="lg" 
          className="w-full rounded-none bg-black hover:bg-gray-800 text-white"
          onClick={() => {
              const message = hidePrices 
                ? `Hello, I placed order #${order.id.slice(0, 8)} on Royal Perfumes.\nPlease find my invoice attached to complete the order.`
                : `Hello, I placed order #${order.id.slice(0, 8)} on Royal Perfumes.\nTotal: ${formatCurrency(order.total_amount)}\nPlease find my invoice attached to complete the payment.`;
              const encodedMessage = encodeURIComponent(message);
              window.open(`https://wa.me/905411158571?text=${encodedMessage}`, '_blank');
          }}
        >
          Open WhatsApp
        </Button>
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

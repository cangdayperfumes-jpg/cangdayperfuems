'use client';

import { useState } from 'react';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import CheckoutForm from '@/components/checkout/checkout-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { CheckoutProvider, useCheckout } from '@/contexts/checkout-context';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useTranslations } from 'next-intl';

function CheckoutContent() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const items = useStore(useCartStore, (state) => state.items);
  const totalPrice = useStore(useCartStore, (state) => state.getTotalPrice());
  const { shippingFee } = useCheckout();
  const { hidePrices } = useSettings();
  const grandTotal = hidePrices ? 0 : ((totalPrice || 0) + shippingFee);
  const totalQuantity = items ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  // Redirect if cart is empty
  if (items !== undefined && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-heading">{t('emptyCartTitle')}</h2>
          <Button asChild>
            <Link href="/shop">{t('continueShopping')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToShop')}
            </Link>
          </Button>
          <h1 className="text-4xl font-heading font-medium">{t('title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Checkout Form */}
          <div>
            <CheckoutForm />
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="sticky top-24 border rounded-lg p-6 space-y-6">
              <h2 className="text-2xl font-heading font-medium">{t('orderSummary')}</h2>
              
              {/* Items */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {items?.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {(item.images?.[0] || item.image) ? (
                        <ImageWithFallback
                          src={item.images?.[0] || item.image || ''}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          {tCommon('noImage')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('qty', { quantity: item.quantity })}
                      </p>
                    </div>
                    <p className="font-medium text-sm">
                      {hidePrices ? tCommon('contactForPrice') : `$${(item.price * item.quantity).toFixed(2)}`}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>{hidePrices ? tCommon('contactForPrice') : (totalPrice !== undefined ? `$${totalPrice.toFixed(2)}` : '$0.00')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('shippingFee')}</span>
                  {hidePrices ? (
                      <span className="text-xs text-muted-foreground">{t('includedInQuote')}</span>
                  ) : totalQuantity >= 500 ? (
                      <span className="text-xs font-medium text-black">{t('calculatedViaWhatsapp')}</span>
                  ) : shippingFee > 0 ? (
                    <span>${shippingFee.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('selectCountry')}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-lg font-heading pt-2 border-t">
                  <span>{t('total')}</span>
                  <span className="font-bold">{hidePrices ? tCommon('contactForPrice') : `$${grandTotal.toFixed(2)}`}</span>
                </div>

                {/* Wholesale Note */}
                {totalQuantity >= 500 && (
                    <div className="bg-black text-white p-4 rounded-sm mt-6">
                        <p className="text-xs font-light leading-relaxed">
                            <strong className="block mb-1 font-medium text-sm">{t('wholesaleTitle')}</strong>
                            {t('wholesaleBody')}
                        </p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CheckoutProvider>
      <CheckoutContent />
    </CheckoutProvider>
  );
}

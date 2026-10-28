'use client';

import { Minus, Plus, ShoppingBag, Truck } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import { useSettings } from '@/components/providers/SettingsProvider';
import GiftProgress from '@/components/cart/GiftProgress';
import OfferLines from '@/components/cart/OfferLines';
import { useBagOffers } from '@/hooks/use-bag-offers';
import { formatCurrency } from '@/lib/utils';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const items = useStore(useCartStore, (state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { subtotal, lines: offerLines, discount: offerDiscount, afterOffers } = useBagOffers(items);
  const { hidePrices } = useSettings();

  const itemCount = items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;
  const isEmpty = !items || items.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="flex w-full flex-col gap-0 bg-ivory p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-baseline gap-2 font-heading text-xl font-medium">
            {t('title')}
            {itemCount > 0 && <span className="text-sm font-normal text-muted-foreground">({itemCount})</span>}
          </SheetTitle>
        </SheetHeader>

        {/* Not hydrated yet — the persisted cart hasn't been read from storage. */}
        {!items ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/5">
              <ShoppingBag className="h-7 w-7 text-gold-deep" strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="font-heading text-lg font-medium">{t('emptyTitle')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('emptySubtitle')}</p>
            </div>
            <Button
              asChild
              onClick={() => onOpenChange(false)}
              className="mt-2 h-12 rounded-none bg-ink px-8 text-xs uppercase tracking-widest text-ivory hover:bg-gold-deep notch-corners"
            >
              <Link href="/shop">{t('browseCollection')}</Link>
            </Button>
          </div>
        ) : (
          <>
            {!hidePrices && (
              <div className="px-5 pt-4">
                <GiftProgress subtotal={afterOffers} />
              </div>
            )}

            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {items.map((item) => (
                <li key={`${item.id}-${item.variantId || 'base'}`} className="flex gap-4 py-5">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-white ring-1 ring-border">
                    {item.images?.[0] || item.image ? (
                      <ImageWithFallback src={item.images?.[0] || item.image || ''} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">{tCommon('noImage')}</div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="line-clamp-2 text-sm font-medium leading-snug text-ink">{item.name}</h4>
                        {item.variantName && <p className="mt-0.5 text-xs text-muted-foreground">{item.variantName}</p>}
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {hidePrices ? tCommon('contactForPrice') : formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                    {!hidePrices && item.quantity > 1 && (
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {t('each', { price: formatCurrency(item.price) })}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex h-9 items-center rounded-full border border-ink/15">
                        <button
                          type="button"
                          aria-label={t('decrease')}
                          onClick={() =>
                            item.quantity > 1
                              ? updateQuantity(item.id, item.variantId, item.quantity - 1)
                              : removeItem(item.id, item.variantId)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:text-ink"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={t('increase')}
                          onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:text-ink"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.variantId)}
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-border bg-secondary/40 px-5 pb-6 pt-4">
              {!hidePrices && offerDiscount > 0 && (
                <>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span className="tabular-nums text-muted-foreground line-through">{formatCurrency(subtotal)}</span>
                  </div>
                  <OfferLines lines={offerLines} />
                </>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">{offerDiscount > 0 ? t('afterOffers') : t('subtotal')}</span>
                <span className="font-heading text-xl font-semibold tabular-nums">
                  {hidePrices ? tCommon('contactForPrice') : formatCurrency(afterOffers)}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t('shippingAtCheckout')}
              </p>
              <Button
                asChild
                size="lg"
                onClick={() => onOpenChange(false)}
                className="h-12 w-full rounded-none bg-ink text-xs font-semibold uppercase tracking-widest text-ivory hover:bg-gold-deep notch-corners"
              >
                <Link href="/checkout">{t('checkout')}</Link>
              </Button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full text-center text-xs uppercase tracking-widest text-ink/60 hover:text-ink"
              >
                {t('continueShopping')}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

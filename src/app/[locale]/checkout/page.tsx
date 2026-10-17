'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, Loader2, Lock, RotateCcw, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import CheckoutForm, { CHECKOUT_FORM_ID } from '@/components/checkout/checkout-form';
import GiftProgress from '@/components/cart/GiftProgress';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { CheckoutProvider, useCheckout } from '@/contexts/checkout-context';
import { useSettings } from '@/components/providers/SettingsProvider';
import { cn, formatCurrency } from '@/lib/utils';
import { useStickyBarStore } from '@/store/useStickyBarStore';

function Steps() {
  const t = useTranslations('checkout');
  const steps = [t('stepBag'), t('stepDetails'), t('stepConfirmation')];
  return (
    <ol className="flex items-center gap-2 text-[11px] md:text-xs uppercase tracking-widest">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
              i === 0 && 'border-gold-deep bg-gold-deep text-ivory',
              i === 1 && 'border-ink bg-ink text-ivory',
              i === 2 && 'border-ink/25 text-ink/40'
            )}
          >
            {i === 0 ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          <span className={cn('font-semibold', i === 2 ? 'text-ink/40' : 'text-ink')}>{label}</span>
          {i < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-6 md:w-10 bg-ink/20" />}
        </li>
      ))}
    </ol>
  );
}

function useTotals() {
  const items = useStore(useCartStore, (state) => state.items);
  const subtotal = useStore(useCartStore, (state) => state.getTotalPrice()) ?? 0;
  const { shipping } = useCheckout();
  const shippingCost = shipping?.available ? shipping.price : 0;
  return { items, subtotal, shipping, total: subtotal + shippingCost };
}

function ShippingValue() {
  const t = useTranslations('checkout');
  const { shipping } = useCheckout();
  const { hidePrices } = useSettings();
  if (hidePrices) return <span className="text-xs text-muted-foreground">{t('includedInQuote')}</span>;
  if (!shipping) return <span className="text-xs text-muted-foreground">{t('selectDestination')}</span>;
  if (!shipping.available) return <span className="text-xs text-destructive">{t('notAvailable')}</span>;
  if (shipping.price === 0) return <span className="font-medium text-sage-deep">{t('free')}</span>;
  return <span>{formatCurrency(shipping.price)}</span>;
}

function OrderSummary() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const { hidePrices } = useSettings();
  const { items, subtotal, total } = useTotals();

  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {items?.map((item) => (
          <li key={`${item.id}-${item.variantId ?? 'base'}`} className="flex items-center gap-4">
            <div className="relative h-20 w-16 shrink-0">
              <div className="relative h-full w-full overflow-hidden rounded-sm bg-white ring-1 ring-border">
                {item.images?.[0] || item.image ? (
                  <ImageWithFallback src={item.images?.[0] || item.image || ''} alt={item.name} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">{tCommon('noImage')}</div>
                )}
              </div>
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-ivory">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
              {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
            </div>
            <p className="text-sm font-medium tabular-nums">
              {hidePrices ? tCommon('contactForPrice') : formatCurrency(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      {!hidePrices && <GiftProgress subtotal={subtotal} />}

      <dl className="space-y-2.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t('subtotal')}</dt>
          <dd className="tabular-nums">{hidePrices ? tCommon('contactForPrice') : formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t('shippingFee')}</dt>
          <dd className="tabular-nums"><ShippingValue /></dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-heading text-lg">{t('total')}</dt>
          <dd className="font-heading text-2xl font-semibold tabular-nums">{hidePrices ? tCommon('contactForPrice') : formatCurrency(total)}</dd>
        </div>
      </dl>

      <ul className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center text-[10px] md:text-[11px] leading-tight text-ink/70">
        <li className="flex flex-col items-center gap-1.5"><Lock className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />{t('secureCheckout')}</li>
        <li className="flex flex-col items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />{t('originalGuaranteed')}</li>
        <li className="flex flex-col items-center gap-1.5"><RotateCcw className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />{t('easyReturns')}</li>
      </ul>
    </div>
  );
}

function CheckoutContent() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const { hidePrices } = useSettings();
  const { items, total, shipping } = useTotals();
  const { isSubmitting } = useCheckout();
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Shift the mobile ScrollToTop button above the sticky total bar below.
  const setStickyBarVisible = useStickyBarStore((s) => s.setVisible);
  useEffect(() => {
    setStickyBarVisible(true);
    return () => setStickyBarVisible(false);
  }, [setStickyBarVisible]);

  if (items !== undefined && items.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/5">
            <ShoppingBag className="h-7 w-7 text-gold-deep" strokeWidth={1.5} />
          </span>
          <h2 className="font-heading text-2xl">{t('emptyCartTitle')}</h2>
          <Button asChild className="notch-corners rounded-none bg-ink text-ivory hover:bg-gold-deep uppercase tracking-widest text-xs px-8 h-12">
            <Link href="/shop">{t('continueShopping')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const itemCount = items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;
  const blocked = shipping !== null && !shipping.available;

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
        <div className="mb-6 md:mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-ink/60 hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('backToShop')}
            </Link>
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-ink">{t('title')}</h1>
          </div>
          <Steps />
        </div>

        {/* Mobile: collapsible order summary */}
        <div className="lg:hidden mb-8 rounded-sm border border-border bg-secondary/40">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm"
            aria-expanded={summaryOpen}
          >
            <span className="flex items-center gap-2 font-medium text-ink">
              <ShoppingBag className="h-4 w-4 text-gold-deep" />
              {summaryOpen ? t('hideSummary') : t('showSummary', { count: itemCount })}
              <ChevronDown className={cn('h-4 w-4 transition-transform', summaryOpen && 'rotate-180')} />
            </span>
            <span className="font-heading text-lg font-semibold tabular-nums">{hidePrices ? '' : formatCurrency(total)}</span>
          </button>
          <AnimatePresence initial={false}>
            {summaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-border px-4 py-5">
                  <OrderSummary />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <CheckoutForm />
          </div>

          <aside className="hidden lg:block lg:col-span-5">
            <div className="sticky top-28 rounded-sm border border-border bg-secondary/40 p-6">
              <h2 className="mb-5 font-heading text-xl font-medium">{t('orderSummary')}</h2>
              <OrderSummary />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile: sticky total + place order (submits the form by id). Sits above the h-16 BottomNav. */}
      <div className="lg:hidden fixed inset-x-0 bottom-16 z-40 border-t border-border bg-ivory/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('total')}</p>
            <p className="font-heading text-xl font-semibold tabular-nums leading-tight">
              {hidePrices ? tCommon('contactForPrice') : formatCurrency(total)}
            </p>
          </div>
          <Button
            type="submit"
            form={CHECKOUT_FORM_ID}
            disabled={isSubmitting || blocked}
            className="h-12 flex-1 rounded-none bg-ink text-ivory hover:bg-gold-deep uppercase tracking-widest text-xs font-semibold"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {isSubmitting ? t('placingOrder') : t('placeOrder')}
          </Button>
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

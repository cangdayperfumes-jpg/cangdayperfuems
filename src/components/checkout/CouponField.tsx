'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Tag, X } from 'lucide-react';
import { useCheckout } from '@/contexts/checkout-context';
import { formatCurrency } from '@/lib/utils';
import { couponDiscount, type CouponProblem } from '@/lib/coupons';

/** "Have a coupon?" — checks the code with the server, then stores it in the checkout context. */
export default function CouponField({ subtotal }: { subtotal: number }) {
  const t = useTranslations('checkout');
  const { coupon, setCoupon, isSubmitting } = useCheckout();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problemText = (reason: CouponProblem, minOrder?: number | null) =>
    reason === 'min_order'
      ? t('couponMinOrder', { amount: formatCurrency(minOrder ?? 0) })
      : t(`coupon_${reason}`);

  const apply = async () => {
    const value = code.trim();
    if (!value) return;
    setChecking(true);
    setError(null);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('validate_coupon', { p_code: value, p_subtotal: subtotal });
      if (rpcError) throw rpcError;
      if (!data?.valid) {
        setError(problemText((data?.reason ?? 'invalid') as CouponProblem, data?.min_order));
        return;
      }
      setCoupon({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        min_order: Number(data.min_order ?? 0),
      });
      setCode('');
      setOpen(false);
    } catch (e) {
      console.error('Coupon check failed:', e);
      setError(t('couponCheckFailed'));
    } finally {
      setChecking(false);
    }
  };

  if (coupon) {
    const amount = couponDiscount(coupon, subtotal);
    const belowMin = subtotal < coupon.min_order;
    return (
      <div className="rounded-sm border border-sage/40 bg-sage/10 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
            <span className="font-mono font-semibold tracking-wide">{coupon.code}</span>
            <span className="text-muted-foreground">
              {coupon.discount_type === 'percent' ? `−%${coupon.discount_value}` : `−${formatCurrency(coupon.discount_value)}`}
            </span>
          </span>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setCoupon(null)}
            aria-label={t('couponRemove')}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {belowMin ? (
          <p className="mt-1 text-xs text-destructive">{t('couponMinOrder', { amount: formatCurrency(coupon.min_order) })}</p>
        ) : (
          <p className="mt-1 text-xs text-sage-deep">{t('couponSaved', { amount: formatCurrency(amount) })}</p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-ink/70 underline-offset-4 hover:text-ink hover:underline"
      >
        <Tag className="h-4 w-4" strokeWidth={1.75} />
        {t('couponPrompt')}
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={code}
          autoFocus
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            // Inside the checkout <form> on mobile — Enter must not place the order.
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
          placeholder={t('couponPlaceholder')}
          aria-label={t('couponPlaceholder')}
          aria-invalid={!!error}
          className="h-11 min-w-0 flex-1 rounded-md border border-input bg-white px-3 font-mono text-sm uppercase tracking-wide focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <button
          type="button"
          onClick={apply}
          disabled={checking || !code.trim()}
          className="h-11 shrink-0 rounded-md bg-ink px-4 text-xs font-semibold uppercase tracking-widest text-ivory hover:bg-gold-deep disabled:opacity-50"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : t('couponApply')}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

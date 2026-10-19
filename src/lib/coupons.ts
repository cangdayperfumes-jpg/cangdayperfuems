export interface AppliedCoupon {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order: number;
}

export type CouponProblem = 'invalid' | 'expired' | 'used_up' | 'min_order' | 'already_used';

/**
 * Same formula as the database's coupon_discount(): the server recomputes it
 * when the order is placed, this copy only drives the live summary.
 */
export function couponDiscount(c: AppliedCoupon | null, subtotal: number) {
  if (!c || subtotal < c.min_order) return 0;
  const raw = c.discount_type === 'percent' ? (subtotal * c.discount_value) / 100 : c.discount_value;
  return Math.round(Math.min(subtotal, raw) * 100) / 100;
}

/** Maps the order trigger's "COUPON_EXPIRED"-style error back to a reason code. */
export function couponProblemFromError(message: string | undefined): CouponProblem | null {
  const m = message?.match(/COUPON_([A-Z_]+)/);
  return m ? (m[1].toLowerCase() as CouponProblem) : null;
}

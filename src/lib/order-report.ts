/**
 * Date ranges and figures for the admin orders tracker / reports. Days are
 * counted in Turkey time (UTC+3 all year — Turkey has no DST), so "Today"
 * means the shop's day, not the server's UTC day.
 */

export const RANGE_KEYS = ['today', '7d', '30d', 'month', 'last_month', 'all', 'custom'] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

const TZ_OFFSET = '+03:00';
const DAY_MS = 86_400_000;

export interface ResolvedRange {
  key: RangeKey;
  /** Inclusive start / exclusive end as ISO instants; null = unbounded. */
  fromIso: string | null;
  toIso: string | null;
  /** YYYY-MM-DD (Turkey time) of the first / last day, for labels and inputs. */
  fromDay: string | null;
  toDay: string | null;
}

/** YYYY-MM-DD of an instant in Turkey time. */
export function turkeyDay(d: Date | string) {
  const t = typeof d === 'string' ? new Date(d) : d;
  return new Date(t.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

const startOfDay = (day: string) => new Date(`${day}T00:00:00${TZ_OFFSET}`);
const addDays = (day: string, n: number) => turkeyDay(new Date(startOfDay(day).getTime() + n * DAY_MS));
const isDay = (s: string | undefined | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function resolveRange(range: string | undefined, from?: string, to?: string, now = new Date()): ResolvedRange {
  const today = turkeyDay(now);
  const key = (RANGE_KEYS as readonly string[]).includes(range ?? '') ? (range as RangeKey) : 'all';
  let fromDay: string | null = null;
  let toDay: string | null = today;

  switch (key) {
    case 'today':
      fromDay = today;
      break;
    case '7d':
      fromDay = addDays(today, -6);
      break;
    case '30d':
      fromDay = addDays(today, -29);
      break;
    case 'month':
      fromDay = `${today.slice(0, 7)}-01`;
      break;
    case 'last_month': {
      const firstThis = `${today.slice(0, 7)}-01`;
      toDay = addDays(firstThis, -1);
      fromDay = `${toDay.slice(0, 7)}-01`;
      break;
    }
    case 'all':
      fromDay = null;
      toDay = null;
      break;
    case 'custom':
      fromDay = isDay(from) ? from : addDays(today, -29);
      toDay = isDay(to) ? to : today;
      if (fromDay > toDay) [fromDay, toDay] = [toDay, fromDay];
      break;
  }

  return {
    key,
    fromDay,
    toDay,
    fromIso: fromDay ? startOfDay(fromDay).toISOString() : null,
    toIso: toDay ? startOfDay(addDays(toDay, 1)).toISOString() : null,
  };
}

export interface ReportOrder {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_cost: number | null;
  discount_amount?: number | null;
  coupon_code?: string | null;
  offer_discount?: number | null;
  customer_name?: string;
  customer_email?: string | null;
  customer_phone?: string;
  customer_address?: { city?: string; country?: string; district?: string | null } | null;
  order_items?: { quantity: number; unit_price: number; products?: { name_en?: string } | null }[];
}

export interface OrderStats {
  orders: number;
  /** Excludes cancelled orders. */
  revenue: number;
  averageOrder: number;
  shipping: number;
  discounts: number;
  couponOrders: number;
  itemsSold: number;
  byStatus: Record<'pending' | 'shipped' | 'delivered' | 'cancelled', number>;
  daily: { day: string; orders: number; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export function computeStats(orders: ReportOrder[], range: ResolvedRange): OrderStats {
  const byStatus = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
  const dayMap = new Map<string, { orders: number; revenue: number }>();
  const products = new Map<string, { quantity: number; revenue: number }>();
  let revenue = 0;
  let shipping = 0;
  let discounts = 0;
  let couponOrders = 0;
  let itemsSold = 0;
  let counted = 0;

  for (const o of orders) {
    if (o.status in byStatus) byStatus[o.status as keyof typeof byStatus]++;
    const day = turkeyDay(o.created_at);
    const bucket = dayMap.get(day) ?? { orders: 0, revenue: 0 };
    bucket.orders++;
    if (o.status !== 'cancelled') {
      counted++;
      revenue += Number(o.total_amount) || 0;
      shipping += Number(o.shipping_cost) || 0;
      discounts += (Number(o.discount_amount) || 0) + (Number(o.offer_discount) || 0);
      if (o.coupon_code) couponOrders++;
      bucket.revenue += Number(o.total_amount) || 0;
      for (const it of o.order_items ?? []) {
        itemsSold += it.quantity;
        const name = it.products?.name_en || '—';
        const p = products.get(name) ?? { quantity: 0, revenue: 0 };
        p.quantity += it.quantity;
        p.revenue += it.quantity * Number(it.unit_price);
        products.set(name, p);
      }
    }
    dayMap.set(day, bucket);
  }

  // Continuous day axis (empty days as zero) so the chart shows real gaps.
  const days = [...dayMap.keys()].sort();
  const first = range.fromDay ?? days[0];
  const last = range.toDay ?? days[days.length - 1];
  const daily: OrderStats['daily'] = [];
  if (first && last) {
    for (let d = first, i = 0; d <= last && i < 731; d = addDays(d, 1), i++) {
      const b = dayMap.get(d);
      daily.push({ day: d, orders: b?.orders ?? 0, revenue: Math.round((b?.revenue ?? 0) * 100) / 100 });
    }
  }

  return {
    orders: orders.length,
    revenue,
    averageOrder: counted ? revenue / counted : 0,
    shipping,
    discounts,
    couponOrders,
    itemsSold,
    byStatus,
    daily,
    topProducts: [...products.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  };
}

export const REPORT_SELECT =
  'id, created_at, status, total_amount, shipping_cost, discount_amount, coupon_code, offer_discount, customer_name, customer_email, customer_phone, customer_address, order_items(quantity, unit_price, products(name_en))';

import { NextResponse, type NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/utils/supabase/server';
import { computeStats, resolveRange, type ReportOrder } from '@/lib/order-report';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import { fetchReportOrders } from '../report-data';
import OrdersReportPDF, { type ReportLabels } from './OrdersReportPDF';
import { formatPdfMoney } from '@/lib/pdf-brand';

export const dynamic = 'force-dynamic';

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * GET /admin/orders/export?format=csv|pdf&range=…&from=…&to=…&status=…
 * Same filters as the orders page; CSV has one row per order, PDF is a
 * printable summary + order list.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // Local JWT check (no Auth round trip); RLS still guards the order query.
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = request.nextUrl.searchParams;
  const format = p.get('format') === 'pdf' ? 'pdf' : 'csv';
  const status = p.get('status') ?? undefined;
  const range = resolveRange(p.get('range') ?? undefined, p.get('from') ?? undefined, p.get('to') ?? undefined);

  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'orders');
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-GB';

  let orders: ReportOrder[];
  try {
    orders = await fetchReportOrders(range, status);
  } catch (e) {
    console.error('Order export failed:', e);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }

  const statusLabel = (s: string) =>
    s === 'shipped' || s === 'delivered' ? t('shipped') : s === 'cancelled' ? t('cancelled') : t('pending');
  const stamp = `${range.fromDay ?? 'start'}_${range.toDay ?? 'today'}`;
  const periodLabel = range.fromDay && range.toDay ? `${range.fromDay} – ${range.toDay}` : t('rangeAll');

  if (format === 'csv') {
    const header = [
      t('csvOrderId'), t('columnDate'), t('csvStatus'), t('columnCustomer'), 'Email', t('csvPhone'),
      t('csvCountry'), t('csvCity'), t('csvDistrict'), t('csvProducts'), t('csvItemCount'),
      t('csvSubtotal'), t('csvDiscount'), t('csvCoupon'), t('csvShipping'), t('columnTotal'),
    ];
    const rows = orders.map((o) => {
      const items = o.order_items ?? [];
      // Coupon + automatic offers.
      const discount = (Number(o.discount_amount) || 0) + (Number(o.offer_discount) || 0);
      const shipping = Number(o.shipping_cost) || 0;
      const total = Number(o.total_amount) || 0;
      return [
        o.id,
        new Date(o.created_at).toLocaleString(dateLocale, { timeZone: 'Europe/Istanbul' }),
        statusLabel(o.status),
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.customer_address?.country,
        o.customer_address?.city,
        o.customer_address?.district,
        items.map((it) => `${it.products?.name_en ?? '—'} ×${it.quantity}`).join('; '),
        items.reduce((n, it) => n + it.quantity, 0),
        (total - shipping + discount).toFixed(2),
        discount.toFixed(2),
        o.coupon_code,
        shipping.toFixed(2),
        total.toFixed(2),
      ];
    });
    // BOM so Excel detects UTF-8 (Turkish characters).
    const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cangday-orders-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const money = formatPdfMoney;
  const labels: ReportLabels = {
    title: t('reportTitle'),
    period: t('reportPeriod'),
    generated: t('reportGenerated'),
    orders: t('statOrders'),
    revenue: t('statRevenue'),
    average: t('statAverage'),
    items: t('statItems'),
    discounts: t('statDiscounts'),
    shipping: t('csvShipping'),
    pending: t('pending'),
    shipped: t('shipped'),
    cancelled: t('cancelled'),
    topProducts: t('topProducts'),
    orderList: t('reportOrderList'),
    page: t('reportPage'),
    colDate: t('columnDate'),
    colCustomer: t('columnCustomer'),
    colDestination: t('columnDestination'),
    colItems: t('csvItemCount'),
    colCoupon: t('csvCoupon'),
    colTotal: t('columnTotal'),
    colStatus: t('csvStatus'),
  };

  const pdf = await renderToBuffer(
    <OrdersReportPDF
      orders={orders}
      stats={computeStats(orders, range)}
      labels={labels}
      periodLabel={periodLabel}
      locale={dateLocale}
      money={money}
      statusLabel={statusLabel}
    />
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cangday-orders-${stamp}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}


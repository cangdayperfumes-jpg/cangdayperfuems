import { getOrders } from '../actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminOrderActions from './AdminOrderActions';
import OrdersChart from './OrdersChart';
import { fetchReportOrders } from './report-data';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Tag } from 'lucide-react';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { computeStats, resolveRange, type RangeKey } from '@/lib/order-report';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';

export const dynamic = 'force-dynamic';

const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'rangeToday' },
  { key: '7d', label: 'range7d' },
  { key: '30d', label: 'range30d' },
  { key: 'month', label: 'rangeMonth' },
  { key: 'last_month', label: 'rangeLastMonth' },
  { key: 'all', label: 'rangeAll' },
];

export default async function OrdersPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const str = (k: string) => (typeof searchParams?.[k] === 'string' ? (searchParams[k] as string) : undefined);
  const statusFilter = str('status');
  const searchQuery = str('q');
  const page = Number(str('page')) || 1;
  const limit = 20;
  const range = resolveRange(str('range'), str('from'), str('to'));

  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'orders');
  const tCommon = await getAdminT(locale, 'common');
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-GB';

  const [{ data: orders, totalPages }, reportOrders] = await Promise.all([
    getOrders({ status: statusFilter, query: searchQuery, page, limit, fromIso: range.fromIso, toIso: range.toIso }),
    // Stats cover the whole period regardless of the status chip.
    fetchReportOrders(range).catch((e) => {
      console.error('Error fetching report orders:', e);
      return [];
    }),
  ]);
  const stats = computeStats(reportOrders, range);

  /** Builds an /admin/orders URL keeping the current filters, with overrides. */
  const href = (overrides: Record<string, string | null>, base = '/admin/orders') => {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      range: range.key,
      from: range.key === 'custom' ? range.fromDay ?? undefined : undefined,
      to: range.key === 'custom' ? range.toDay ?? undefined : undefined,
      status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
      q: searchQuery || undefined,
    };
    for (const [k, v] of Object.entries({ ...current, ...overrides })) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const exportHref = (format: 'csv' | 'pdf') =>
    href({ format, page: null, q: null }, '/admin/orders/export');

  const statCards = [
    { label: t('statOrders'), value: String(stats.orders) },
    { label: t('statRevenue'), value: formatCurrency(stats.revenue), hint: t('statRevenueHint') },
    { label: t('statAverage'), value: formatCurrency(stats.averageOrder) },
    { label: t('statItems'), value: String(stats.itemsSold) },
    { label: t('statDiscounts'), value: formatCurrency(stats.discounts), hint: t('statCouponOrders', { count: stats.couponOrders }) },
  ];

  const statusTabs = [
    { key: 'all', label: t('allOrders'), count: stats.orders, cls: '' },
    { key: 'pending', label: t('pending'), count: stats.byStatus.pending, cls: 'text-amber-600 border-amber-200' },
    { key: 'shipped', label: t('shipped'), count: stats.byStatus.shipped + stats.byStatus.delivered, cls: 'text-emerald-600 border-emerald-200' },
    { key: 'cancelled', label: t('cancelled'), count: stats.byStatus.cancelled, cls: 'text-rose-600 border-rose-200' },
  ];

  const rangeLabel =
    range.fromDay && range.toDay
      ? range.fromDay === range.toDay
        ? new Date(range.fromDay).toLocaleDateString(dateLocale, { dateStyle: 'medium' })
        : `${new Date(range.fromDay).toLocaleDateString(dateLocale, { dateStyle: 'medium' })} – ${new Date(range.toDay).toLocaleDateString(dateLocale, { dateStyle: 'medium' })}`
      : t('rangeAll');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={exportHref('csv')}>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('exportCsv')}
            </Button>
          </a>
          <a href={exportHref('pdf')}>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" /> {t('exportPdf')}
            </Button>
          </a>
        </div>
      </div>

      {/* ── Period ── */}
      <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {RANGE_TABS.map((r) => (
            <Link key={r.key} href={href({ range: r.key, from: null, to: null, page: null })}>
              <Button variant={range.key === r.key ? 'default' : 'outline'} size="sm">
                {t(r.label)}
              </Button>
            </Link>
          ))}
        </div>
        <form action="/admin/orders" method="GET" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="range" value="custom" />
          {statusFilter && statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
          <label className="text-xs text-muted-foreground" htmlFor="from">{t('rangeFrom')}</label>
          <Input id="from" type="date" name="from" defaultValue={range.key === 'custom' ? range.fromDay ?? '' : ''} className="h-9 w-auto bg-white" />
          <label className="text-xs text-muted-foreground" htmlFor="to">{t('rangeTo')}</label>
          <Input id="to" type="date" name="to" defaultValue={range.key === 'custom' ? range.toDay ?? '' : ''} className="h-9 w-auto bg-white" />
          <Button type="submit" size="sm" variant={range.key === 'custom' ? 'default' : 'outline'}>
            {t('rangeApply')}
          </Button>
        </form>
      </div>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="mt-1.5 break-words text-xl font-bold tabular-nums sm:text-2xl">{c.value}</p>
            {c.hint && <p className="mt-0.5 text-[11px] text-gray-400">{c.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-gray-500">{t('chartTitle')}</h2>
          <div className="h-64">
            <OrdersChart data={stats.daily} locale={dateLocale} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-gray-500">{t('topProducts')}</h2>
          {stats.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('noOrders')}</p>
          ) : (
            <ol className="space-y-2.5">
              {stats.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-gray-500">×{p.quantity}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* ── Status + search ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((s) => {
            const active = s.key === 'all' ? !statusFilter || statusFilter === 'all' : statusFilter === s.key;
            return (
              <Link key={s.key} href={href({ status: s.key === 'all' ? null : s.key, page: null })}>
                <Button variant={active ? 'default' : 'outline'} size="sm" className={cn(!active && s.cls)}>
                  {s.label}
                  <span className="ml-1.5 rounded-full bg-black/10 px-1.5 text-[11px] tabular-nums">{s.count}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <form className="relative w-full max-w-md" action="/admin/orders" method="GET">
          <input type="hidden" name="range" value={range.key} />
          {range.key === 'custom' && range.fromDay && <input type="hidden" name="from" value={range.fromDay} />}
          {range.key === 'custom' && range.toDay && <input type="hidden" name="to" value={range.toDay} />}
          {statusFilter && statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" placeholder={t('searchPlaceholder')} className="w-full bg-white pl-9" defaultValue={searchQuery || ''} />
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnOrderId')}</TableHead>
              <TableHead>{t('columnCustomer')}</TableHead>
              <TableHead>{t('columnDate')}</TableHead>
              <TableHead>{t('columnDestination')}</TableHead>
              <TableHead>{t('columnTotal')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead className="text-right">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{order.customer_name}</span>
                    <span className="text-xs text-slate-500">{order.customer_email || order.customer_phone}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(order.created_at).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' })}
                </TableCell>
                <TableCell className="text-sm">
                  {[order.customer_address?.city, order.customer_address?.country_code && order.customer_address.country_code !== 'TR' ? order.customer_address.country : null]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-medium tabular-nums">{formatCurrency(Number(order.total_amount))}</span>
                  {order.coupon_code && (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700">
                      <Tag className="h-3 w-3" /> {order.coupon_code} (−{formatCurrency(Number(order.discount_amount))})
                    </span>
                  )}
                </TableCell>
                <TableCell className="capitalize">
                  {order.status === 'shipped' || order.status === 'delivered' ? (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-sm border">
                      {t('shipped')}
                    </Badge>
                  ) : order.status === 'cancelled' ? (
                    <Badge variant="destructive" className="shadow-sm">
                      {t('cancelled')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 shadow-sm">
                      {t('pending')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <AdminOrderActions order={order} items={order.order_items || []} />
                </TableCell>
              </TableRow>
            ))}
            {(!orders || orders.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-slate-500">
                  {t('noOrders')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Link href={href({ page: String(Math.max(1, page - 1)) })} className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" /> {t('previous')}
            </Button>
          </Link>
          <span className="text-sm font-medium">
            {t('pageOf', { page, totalPages })}
          </span>
          <Link href={href({ page: String(Math.min(totalPages, page + 1)) })} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              {t('next')} <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

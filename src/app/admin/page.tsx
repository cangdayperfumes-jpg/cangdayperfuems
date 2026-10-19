import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Gift,
  Megaphone,
  Package,
  PackageX,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
  BookOpen,
  EyeOff,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import { computeStats, resolveRange, turkeyDay } from '@/lib/order-report';
import { cn, formatCurrency } from '@/lib/utils';
import OrdersChart from './orders/OrdersChart';
import { fetchReportOrders } from './orders/report-data';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

function StatCard({
  href,
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: React.ReactNode;
  tone?: 'default' | 'attention' | 'danger';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex min-w-0 flex-col rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5',
        tone === 'attention' && 'border-amber-300 bg-amber-50/60',
        tone === 'danger' && 'border-rose-200 bg-rose-50/50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <Icon className={cn('h-4 w-4 shrink-0 text-gray-400', tone === 'attention' && 'text-amber-600', tone === 'danger' && 'text-rose-600')} />
      </div>
      <span className="mt-2 break-words text-xl font-bold tabular-nums sm:text-2xl">{value}</span>
      {hint && <span className="mt-1 text-xs text-gray-500">{hint}</span>}
      <ArrowUpRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-gray-300 transition group-hover:text-gray-600" />
    </Link>
  );
}

function StatusRow({ href, icon: Icon, label, value, on }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; value: string; on: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md px-2 py-2.5 transition hover:bg-slate-50">
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-gray-500">{value}</span>
      </span>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', on ? 'bg-emerald-500' : 'bg-slate-300')} />
    </Link>
  );
}

export default async function AdminDashboard() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'dashboard');
  const tOrders = await getAdminT(locale, 'orders');
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-GB';
  const supabase = await createClient();

  const now = new Date();
  const range30 = resolveRange('30d', undefined, undefined, now);
  const prevRange = resolveRange(
    'custom',
    turkeyDay(new Date(now.getTime() - 59 * DAY_MS)),
    turkeyDay(new Date(now.getTime() - 30 * DAY_MS)),
    now
  );
  const today = turkeyDay(now);

  const safe = <T,>(p: Promise<T>, fallback: T) => p.catch((e) => { console.error('Dashboard query failed:', e); return fallback; });

  const [
    orders30,
    ordersPrev,
    { count: pendingCount },
    { data: recentOrders },
    { count: activeProducts },
    { count: outOfStock },
    { count: hiddenProducts },
    { data: coupons },
    { count: subscribers },
    { count: shippingCountries },
    { data: settings },
  ] = await Promise.all([
    safe(fetchReportOrders(range30), []),
    safe(fetchReportOrders(prevRange), []),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('orders')
      .select('id, created_at, customer_name, total_amount, status, customer_address, coupon_code')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('stock', false),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('coupons').select('is_active, expires_at, max_uses, used_count'),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
    supabase.from('shipping_zones').select('id', { count: 'exact', head: true }).eq('is_enabled', true).is('city', null),
    supabase
      .from('system_settings')
      .select('popup_enabled, popup_title, popup_ends_at, gift_enabled, gift_threshold, hide_prices, new_badge_days')
      .eq('id', 'global')
      .single(),
  ]);

  const stats = computeStats(orders30, range30);
  const prevStats = computeStats(ordersPrev, prevRange);
  const todayBucket = stats.daily.find((d) => d.day === today) ?? { orders: 0, revenue: 0 };
  const revenueChange = prevStats.revenue > 0 ? ((stats.revenue - prevStats.revenue) / prevStats.revenue) * 100 : null;

  const liveCoupons = (coupons ?? []).filter(
    (c) =>
      c.is_active &&
      (!c.expires_at || new Date(c.expires_at).getTime() > now.getTime()) &&
      (c.max_uses === null || c.used_count < c.max_uses)
  ).length;

  const offerEnds = settings?.popup_ends_at ? new Date(settings.popup_ends_at) : null;
  const offerLive = !!settings?.popup_enabled && (!offerEnds || offerEnds.getTime() > now.getTime());

  const statusLabel = (s: string) =>
    s === 'shipped' || s === 'delivered' ? tOrders('shipped') : s === 'cancelled' ? tOrders('cancelled') : tOrders('pending');
  const statusClass = (s: string) =>
    s === 'shipped' || s === 'delivered'
      ? 'bg-emerald-50 text-emerald-700'
      : s === 'cancelled'
        ? 'bg-rose-50 text-rose-700'
        : 'bg-amber-50 text-amber-700';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {now.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' })}
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black">
          {t('viewStore')} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* ── Key numbers ── */}
      <h2 className="sr-only">{t('keyStatistics')}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          href="/admin/orders?status=pending"
          icon={Clock}
          label={t('pendingOrders')}
          value={String(pendingCount ?? 0)}
          hint={pendingCount ? t('pendingHint') : t('pendingNone')}
          tone={pendingCount ? 'attention' : 'default'}
        />
        <StatCard
          href="/admin/orders?range=today"
          icon={ShoppingBag}
          label={t('todayOrders')}
          value={String(todayBucket.orders)}
          hint={formatCurrency(todayBucket.revenue)}
        />
        <StatCard
          href="/admin/orders?range=30d"
          icon={Wallet}
          label={t('revenue30')}
          value={formatCurrency(stats.revenue)}
          hint={
            revenueChange === null ? (
              t('noComparison')
            ) : (
              <span className={cn('inline-flex items-center gap-1', revenueChange >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                {revenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {t('vsPrevious', { change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(0)}%` })}
              </span>
            )
          }
        />
        <StatCard
          href="/admin/orders?range=30d"
          icon={TrendingUp}
          label={t('averageOrder')}
          value={formatCurrency(stats.averageOrder)}
          hint={t('ordersIn30', { count: stats.orders })}
        />
        <StatCard href="/admin/products?active=true" icon={Package} label={t('activeProducts')} value={String(activeProducts ?? 0)} hint={t('hiddenProducts', { count: hiddenProducts ?? 0 })} />
        <StatCard
          href="/admin/products?stock=false"
          icon={PackageX}
          label={t('outOfStock')}
          value={String(outOfStock ?? 0)}
          hint={t('outOfStockHint')}
          tone={outOfStock ? 'danger' : 'default'}
        />
        <StatCard href="/admin/coupons" icon={Ticket} label={t('activeCoupons')} value={String(liveCoupons)} hint={t('couponOrders30', { count: stats.couponOrders })} />
        <StatCard href="/admin/shipping" icon={Truck} label={t('shippingCountries')} value={String(shippingCountries ?? 0)} hint={t('subscribers', { count: subscribers ?? 0 })} />
      </div>

      {/* ── Chart + recent orders ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 shadow-sm sm:p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-500">{t('last30')}</h2>
            <Link href="/admin/orders?range=30d" className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black">
              {t('fullReport')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-56 w-full min-w-0 sm:h-64">
            <OrdersChart data={stats.daily} locale={dateLocale} />
          </div>
        </div>

        <div className="min-w-0 rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-500">{t('recentOrders')}</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black">
              {t('viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {(recentOrders ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">{tOrders('noOrders')}</p>
          ) : (
            <ul className="-mx-2 divide-y">
              {(recentOrders ?? []).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?q=${o.id}`} className="flex items-center gap-3 rounded-md px-2 py-2.5 transition hover:bg-slate-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{o.customer_name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {new Date(o.created_at).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                        {o.customer_address?.city ? ` · ${o.customer_address.city}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums">{formatCurrency(Number(o.total_amount))}</span>
                      <span className={cn('mt-0.5 inline-block rounded px-1.5 text-[10px] font-semibold', statusClass(o.status))}>{statusLabel(o.status)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Best sellers + store status + quick actions ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-gray-500">{t('bestSellers30')}</h2>
          {stats.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{tOrders('noOrders')}</p>
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

        <div className="min-w-0 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-medium text-gray-500">{t('storeStatus')}</h2>
          <div className="-mx-2">
            <StatusRow
              href="/admin/settings"
              icon={Megaphone}
              label={t('offerPopup')}
              on={offerLive}
              value={
                offerLive
                  ? offerEnds
                    ? t('offerEnds', { date: offerEnds.toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) })
                    : settings?.popup_title || t('on')
                  : t('off')
              }
            />
            <StatusRow
              href="/admin/settings"
              icon={Gift}
              label={t('freeGift')}
              on={!!settings?.gift_enabled}
              value={settings?.gift_enabled ? t('giftOver', { amount: formatCurrency(Number(settings.gift_threshold ?? 0)) }) : t('off')}
            />
            <StatusRow
              href="/admin/settings"
              icon={Sparkles}
              label={t('newBadge')}
              on={(settings?.new_badge_days ?? 0) > 0}
              value={(settings?.new_badge_days ?? 0) > 0 ? t('newBadgeDays', { days: settings?.new_badge_days ?? 0 }) : t('manualOnly')}
            />
            <StatusRow
              href="/admin/settings"
              icon={EyeOff}
              label={t('prices')}
              on={!settings?.hide_prices}
              value={settings?.hide_prices ? t('pricesHidden') : t('pricesVisible')}
            />
          </div>
        </div>

        <div className="min-w-0 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-gray-500">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/admin/products/new', icon: Plus, label: t('qaAddProduct') },
              { href: '/admin/coupons', icon: Tag, label: t('qaCoupons') },
              { href: '/admin/marketing/hero-slides', icon: Sparkles, label: t('qaHero') },
              { href: '/admin/settings', icon: Megaphone, label: t('qaOffer') },
              { href: '/admin/catalog', icon: BookOpen, label: t('qaCatalog') },
              { href: '/admin/orders?range=month', icon: Wallet, label: t('qaMonthReport') },
            ].map((a) => (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition hover:border-gray-400 hover:bg-slate-50"
              >
                <a.icon className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="truncate">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

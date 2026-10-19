'use client';

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';

/** Revenue bars + order-count line per day for the selected period. */
export default function OrdersChart({
  data,
  locale,
}: {
  data: { day: string; orders: number; revenue: number }[];
  locale: string;
}) {
  const t = useTranslations('orders');

  if (data.length === 0 || data.every((d) => d.orders === 0)) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-400">{t('noOrders')}</div>;
  }

  const label = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="day" tickFormatter={label} tick={{ fontSize: 11 }} minTickGap={16} />
        <YAxis yAxisId="rev" tick={{ fontSize: 11 }} width={56} tickFormatter={(v) => new Intl.NumberFormat(locale, { notation: "compact" }).format(Number(v))} />
        <YAxis yAxisId="cnt" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
        <Tooltip
          labelFormatter={(d) => label(String(d))}
          formatter={(value, name) =>
            name === 'revenue' ? [formatCurrency(Number(value)), t('statRevenue')] : [value, t('statOrders')]
          }
        />
        <Bar yAxisId="rev" dataKey="revenue" fill="#C9A24B" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Line yAxisId="cnt" dataKey="orders" stroke="#120D0A" strokeWidth={2} dot={false} type="monotone" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

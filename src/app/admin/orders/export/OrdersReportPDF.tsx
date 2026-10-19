import path from 'path';
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { OrderStats, ReportOrder } from '@/lib/order-report';

// Helvetica (the PDF default) has no ş/ğ/ı/İ, so Turkish names would come out
// garbled. Noto Sans ships as two subsets — basic Latin and Latin Extended —
// and react-pdf falls back glyph by glyph across the fontFamily array.
// next.config.ts → outputFileTracingIncludes ships these files with the route.
const FONT_DIR = path.join(process.cwd(), 'node_modules/@fontsource/noto-sans/files');
let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  for (const [family, subset] of [['NotoLatin', 'latin'], ['NotoLatinExt', 'latin-ext']] as const) {
    Font.register({
      family,
      fonts: [
        { src: path.join(FONT_DIR, `noto-sans-${subset}-400-normal.woff`), fontWeight: 400 },
        { src: path.join(FONT_DIR, `noto-sans-${subset}-700-normal.woff`), fontWeight: 700 },
      ],
    });
  }
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const FONT = ['NotoLatin', 'NotoLatinExt'];

const s = StyleSheet.create({
  page: { padding: 32, fontFamily: FONT as unknown as string, fontSize: 9, color: '#111' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  brand: { fontSize: 18, fontWeight: 700, letterSpacing: 3 },
  muted: { color: '#666' },
  divider: { borderBottomWidth: 2, borderBottomColor: '#111', marginBottom: 14 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  card: { width: '25%', paddingRight: 8, marginBottom: 8 },
  cardInner: { borderWidth: 1, borderColor: '#ddd', padding: 8 },
  cardLabel: { fontSize: 7, color: '#666', textTransform: 'uppercase', marginBottom: 3 },
  cardValue: { fontSize: 12, fontWeight: 700 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, marginTop: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ddd', paddingVertical: 4 },
  head: { flexDirection: 'row', backgroundColor: '#f2f2f2', paddingVertical: 5, fontWeight: 700 },
  footer: { position: 'absolute', bottom: 18, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#999' },
});

const COLS = [
  { key: 'date', width: '15%' },
  { key: 'customer', width: '22%' },
  { key: 'destination', width: '17%' },
  { key: 'items', width: '8%', align: 'right' },
  { key: 'coupon', width: '13%' },
  { key: 'total', width: '13%', align: 'right' },
  { key: 'status', width: '12%', align: 'right' },
] as const;

export type ReportLabels = Record<
  | 'title' | 'period' | 'generated' | 'orders' | 'revenue' | 'average' | 'items' | 'discounts' | 'shipping'
  | 'pending' | 'shipped' | 'cancelled' | 'topProducts' | 'orderList' | 'page'
  | 'colDate' | 'colCustomer' | 'colDestination' | 'colItems' | 'colCoupon' | 'colTotal' | 'colStatus',
  string
>;

export default function OrdersReportPDF({
  orders,
  stats,
  labels,
  periodLabel,
  locale,
  money,
  statusLabel,
}: {
  orders: ReportOrder[];
  stats: OrderStats;
  labels: ReportLabels;
  periodLabel: string;
  locale: string;
  money: (n: number) => string;
  statusLabel: (status: string) => string;
}) {
  registerFonts();
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' });

  const cards = [
    [labels.orders, String(stats.orders)],
    [labels.revenue, money(stats.revenue)],
    [labels.average, money(stats.averageOrder)],
    [labels.items, String(stats.itemsSold)],
    [labels.discounts, money(stats.discounts)],
    [labels.shipping, money(stats.shipping)],
    [labels.pending, String(stats.byStatus.pending)],
    [`${labels.shipped} / ${labels.cancelled}`, `${stats.byStatus.shipped + stats.byStatus.delivered} / ${stats.byStatus.cancelled}`],
  ];

  const headers: Record<(typeof COLS)[number]['key'], string> = {
    date: labels.colDate,
    customer: labels.colCustomer,
    destination: labels.colDestination,
    items: labels.colItems,
    coupon: labels.colCoupon,
    total: labels.colTotal,
    status: labels.colStatus,
  };

  return (
    <Document title={`${labels.title} — ${periodLabel}`} author="Cangday">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>CANGDAY</Text>
            <Text style={s.muted}>{labels.title}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text>{labels.period}: {periodLabel}</Text>
            <Text style={s.muted}>{labels.generated}: {when(new Date().toISOString())}</Text>
          </View>
        </View>
        <View style={s.divider} />

        <View style={s.cards}>
          {cards.map(([label, value]) => (
            <View key={label} style={s.card}>
              <View style={s.cardInner}>
                <Text style={s.cardLabel}>{label}</Text>
                <Text style={s.cardValue}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {stats.topProducts.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={s.sectionTitle}>{labels.topProducts}</Text>
            {stats.topProducts.map((p, i) => (
              <View key={p.name} style={s.row}>
                <Text style={{ width: '6%' }}>{i + 1}.</Text>
                <Text style={{ width: '64%' }}>{p.name}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>×{p.quantity}</Text>
                <Text style={{ width: '20%', textAlign: 'right' }}>{money(p.revenue)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.sectionTitle}>{labels.orderList}</Text>
        <View style={s.head} fixed>
          {COLS.map((c) => (
            <Text key={c.key} style={{ width: c.width, paddingHorizontal: 3, textAlign: 'align' in c ? c.align : 'left' }}>
              {headers[c.key]}
            </Text>
          ))}
        </View>
        {orders.map((o) => {
          const cells: Record<(typeof COLS)[number]['key'], string> = {
            date: when(o.created_at),
            customer: o.customer_name ?? '',
            destination: [o.customer_address?.city, o.customer_address?.country].filter(Boolean).join(', '),
            items: String((o.order_items ?? []).reduce((n, it) => n + it.quantity, 0)),
            coupon: o.coupon_code ?? '',
            total: money(Number(o.total_amount)),
            status: statusLabel(o.status),
          };
          return (
            <View key={o.id} style={s.row} wrap={false}>
              {COLS.map((c) => (
                <Text key={c.key} style={{ width: c.width, paddingHorizontal: 3, textAlign: 'align' in c ? c.align : 'left' }}>
                  {cells[c.key]}
                </Text>
              ))}
            </View>
          );
        })}

        <View style={s.footer} fixed>
          <Text>Cangday — {labels.title}</Text>
          <Text render={({ pageNumber, totalPages }) => `${labels.page} ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { OrderStats, ReportOrder } from '@/lib/order-report';
import {
  PDF_COLORS as C,
  PDF_FONT_BODY,
  PDF_FONT_HEADING,
  PDF_LOGO_RATIO,
  PDF_LOGO_SRC,
  registerPdfFonts,
} from '@/lib/pdf-brand';

const LOGO_W = 120;

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 52, paddingHorizontal: 36, fontFamily: PDF_FONT_BODY, fontSize: 8.5, color: C.ink, backgroundColor: C.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { width: LOGO_W, height: LOGO_W / PDF_LOGO_RATIO },
  docTitle: { fontFamily: PDF_FONT_HEADING, fontSize: 18, fontWeight: 600, textAlign: 'right' },
  meta: { fontSize: 8, color: C.muted, textAlign: 'right', marginTop: 2 },
  rule: { marginTop: 14, marginBottom: 16, height: 1.5, backgroundColor: C.gold },
  cards: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 12 },
  card: { width: '25%', paddingHorizontal: 4, marginBottom: 8 },
  cardInner: { backgroundColor: C.ivory, borderRadius: 3, paddingVertical: 9, paddingHorizontal: 10, borderLeftWidth: 2, borderLeftColor: C.gold },
  cardLabel: { fontSize: 6.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, fontWeight: 600 },
  cardValue: { fontFamily: PDF_FONT_HEADING, fontSize: 13, fontWeight: 600 },
  sectionTitle: { fontFamily: PDF_FONT_HEADING, fontSize: 11, fontWeight: 600, marginBottom: 6, marginTop: 6, color: C.ink },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 5 },
  rowAlt: { backgroundColor: C.paper },
  head: { flexDirection: 'row', backgroundColor: C.ink, color: C.ivory, paddingVertical: 6, fontWeight: 700, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.6 },
  rank: { color: C.goldDeep, fontWeight: 700 },
  footer: { position: 'absolute', bottom: 22, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: C.muted, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 6 },
});

const COLS = [
  { key: 'date', width: '15%' },
  { key: 'customer', width: '22%' },
  { key: 'destination', width: '17%' },
  { key: 'items', width: '7%', align: 'right' },
  { key: 'coupon', width: '14%' },
  { key: 'total', width: '13%', align: 'right' },
  { key: 'status', width: '12%', align: 'right' },
] as const;

export type ReportLabels = Record<
  | 'title' | 'period' | 'generated' | 'orders' | 'revenue' | 'average' | 'items' | 'discounts' | 'shipping'
  | 'pending' | 'shipped' | 'cancelled' | 'topProducts' | 'orderList' | 'page'
  | 'colDate' | 'colCustomer' | 'colDestination' | 'colItems' | 'colCoupon' | 'colTotal' | 'colStatus',
  string
>;

const STATUS_COLOR: Record<string, string> = {
  pending: C.goldDeep,
  shipped: '#3F6B4E',
  delivered: '#3F6B4E',
  cancelled: C.burgundy,
};

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
  registerPdfFonts();
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

  const cell = (c: (typeof COLS)[number]) => ({
    width: c.width,
    paddingHorizontal: 4,
    textAlign: ('align' in c ? c.align : 'left') as 'left' | 'right',
  });

  return (
    <Document title={`${labels.title} — ${periodLabel}`} author="Cangday">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          <Image src={PDF_LOGO_SRC} style={s.logo} />
          <View>
            <Text style={s.docTitle}>{labels.title}</Text>
            <Text style={s.meta}>{labels.period}: {periodLabel}</Text>
            <Text style={s.meta}>{labels.generated}: {when(new Date().toISOString())}</Text>
          </View>
        </View>
        <View style={s.rule} />

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
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={s.sectionTitle}>{labels.topProducts}</Text>
            {stats.topProducts.map((p, i) => (
              <View key={p.name} style={s.row}>
                <Text style={[s.rank, { width: '6%', paddingHorizontal: 4 }]}>{i + 1}</Text>
                <Text style={{ width: '64%' }}>{p.name}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>×{p.quantity}</Text>
                <Text style={{ width: '20%', textAlign: 'right', paddingHorizontal: 4 }}>{money(p.revenue)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.sectionTitle}>{labels.orderList}</Text>
        <View style={s.head} fixed>
          {COLS.map((c) => (
            <Text key={c.key} style={cell(c)}>{headers[c.key]}</Text>
          ))}
        </View>
        {orders.map((o, i) => {
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
            <View key={o.id} style={i % 2 ? [s.row, s.rowAlt] : s.row} wrap={false}>
              {COLS.map((c) => (
                <Text
                  key={c.key}
                  style={[
                    cell(c),
                    c.key === 'total' ? { fontWeight: 700 } : {},
                    c.key === 'status' ? { color: STATUS_COLOR[o.status] ?? C.ink, fontWeight: 600 } : {},
                  ]}
                >
                  {cells[c.key]}
                </Text>
              ))}
            </View>
          );
        })}

        <View style={s.footer} fixed>
          <Text>Cangday · cangdayperfume.com</Text>
          <Text render={({ pageNumber, totalPages }) => `${labels.page} ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

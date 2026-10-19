import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  PDF_COLORS as C,
  PDF_FONT_BODY,
  PDF_FONT_HEADING,
  PDF_LOGO_RATIO,
  PDF_LOGO_SRC,
  formatPdfMoney,
  registerPdfFonts,
} from '@/lib/pdf-brand';
import { EditableInvoiceItem } from '@/types/invoice';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: C.white,
    paddingTop: 40,
    paddingBottom: 70,
    paddingHorizontal: 44,
    fontFamily: PDF_FONT_BODY,
    color: C.ink,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130 / PDF_LOGO_RATIO,
  },
  docTitle: {
    fontFamily: PDF_FONT_HEADING,
    fontSize: 24,
    fontWeight: 600,
    color: C.ink,
    textAlign: 'right',
    letterSpacing: 1,
  },
  docSub: {
    fontSize: 9,
    color: C.muted,
    textAlign: 'right',
    marginTop: 3,
  },
  goldRule: {
    height: 1.5,
    backgroundColor: C.gold,
    marginTop: 16,
    marginBottom: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 26,
  },
  infoBox: {
    flex: 1,
    backgroundColor: C.ivory,
    borderRadius: 3,
    padding: 12,
  },
  infoGap: { width: 12 },
  eyebrow: {
    fontSize: 7,
    fontWeight: 700,
    color: C.goldDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  strongText: {
    fontSize: 10.5,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 2,
  },
  customerText: {
    fontSize: 9.5,
    color: '#3B342E',
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: C.ink,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tableHeaderCol: {
    color: C.ivory,
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: C.line,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  colItem: { width: '50%' },
  colItemWithShipping: { width: '34%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colPriceSm: { width: '14%', textAlign: 'right' },
  colShipping: { width: '16%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  colTotalSm: { width: '22%', textAlign: 'right' },
  rowText: {
    fontSize: 9.5,
    color: C.ink,
  },
  rowName: {
    fontSize: 9.5,
    fontWeight: 600,
    color: C.ink,
  },
  rowSubText: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 2,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    width: '100%',
  },
  totalsBox: {
    width: '48%',
    backgroundColor: C.paper,
    borderWidth: 0.75,
    borderColor: C.line,
    borderRadius: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 9.5,
    color: C.muted,
  },
  totalValue: {
    fontSize: 9.5,
    color: C.ink,
    textAlign: 'right',
  },
  discountValue: {
    fontSize: 9.5,
    color: '#3F6B4E',
    textAlign: 'right',
  },
  grandTotalDivider: {
    borderTopWidth: 1,
    borderTopColor: C.gold,
    marginTop: 4,
    paddingTop: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  grandTotalLabel: {
    fontFamily: PDF_FONT_HEADING,
    fontSize: 12,
    fontWeight: 600,
    color: C.ink,
  },
  grandTotalValue: {
    fontFamily: PDF_FONT_HEADING,
    fontSize: 15,
    fontWeight: 600,
    color: C.goldDeep,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 44,
    right: 44,
    borderTopWidth: 0.75,
    borderTopColor: C.line,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerThanks: {
    fontFamily: PDF_FONT_HEADING,
    fontSize: 11,
    fontWeight: 500,
    color: C.ink,
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },
  itemCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  itemCountText: {
    fontSize: 8,
    fontWeight: 600,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

interface InvoicePDFProps {
  order: any;
  items: any[];
  hidePrices?: boolean;
  /** Ephemeral, user-edited rows from the "Customize PDF" modal. When
   *  provided, these fully replace `items` for rendering — `items` itself is
   *  never mutated and no DB write ever happens. Omit (both existing call
   *  sites) to render exactly as before. */
  customItems?: EditableInvoiceItem[];
  /** Ephemeral shipping fee entered at download time. When provided, this
   *  replaces `order.shipping_cost` for the PDF only — never written back to
   *  the order. Omit to use the order's saved shipping cost. */
  shippingOverride?: number;
}

const formatPrice = formatPdfMoney;

// Checkout stores the phone as the country calling code immediately
// followed by the number, with no separator (e.g. "905551234567"). Prefix
// it with "+" so it reads as a proper international number.
const formatPhone = (phone: string) => {
  if (!phone) return phone;
  return phone.startsWith('+') ? phone : `+${phone}`;
};

interface InvoiceRow {
  key: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  shipping?: number;
  subLines: string[];
}

export default function InvoicePDF({ order, items, hidePrices = false, customItems, shippingOverride }: InvoicePDFProps) {
  const visibleCustomItems = customItems?.filter((i) => !i.hidden);
  // Per-product shipping is only known when a customItems breakdown is
  // supplied (the Customize PDF flow) — the plain order.items path has no
  // per-line shipping data, only the order's single aggregate cost.
  const showShippingColumn = !hidePrices && !!visibleCustomItems;

  const rows: InvoiceRow[] = visibleCustomItems
    ? visibleCustomItems.map((item) => ({
        key: item._key,
        name: item.name || 'Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
        shipping: item.shippingTotal,
        subLines: [
          item.variant && `Variant: ${item.variant}`,
          item.size && `Size: ${item.size}`,
          item.color && `Color: ${item.color}`,
          item.notes && `Note: ${item.notes}`,
        ].filter(Boolean) as string[],
      }))
    : items.map((item, index) => ({
        key: String(index),
        name: (item.products?.name_en || item.product?.name_en || 'Product'),
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.unit_price * item.quantity,
        subLines: [],
      }));

  // When customizing, totals reflect the edited item prices rather than the
  // original order total. Shipping defaults to the order's saved cost but
  // can be overridden at download time (shippingOverride), in which case the
  // grand total is always recomputed from subtotal + shippingFee.
  const subtotal = visibleCustomItems
    ? rows.reduce((sum, row) => sum + row.total, 0)
    : order.total_amount - order.shipping_cost + (order.discount_amount || 0);
  const couponDiscount = Number(order.discount_amount || 0);
  const shippingFee = shippingOverride ?? order.shipping_cost ?? 0;
  const grandTotal = Math.max(subtotal - couponDiscount, 0) + shippingFee;
  registerPdfFonts();
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          <Image src={PDF_LOGO_SRC} style={styles.logo} />
          <View>
            <Text style={styles.docTitle}>Invoice</Text>
            <Text style={styles.docSub}>Order #{order.id.replace(/-/g, '').slice(0, 15).toUpperCase()}</Text>
            <Text style={styles.docSub}>
              {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View style={styles.goldRule} />

        {/* Customer + delivery */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.eyebrow}>Billed to</Text>
            <Text style={styles.strongText}>{order.customer_name}</Text>
            {order.customer_email && <Text style={styles.customerText}>{order.customer_email}</Text>}
            <Text style={styles.customerText}>{formatPhone(order.customer_phone)}</Text>
          </View>
          <View style={styles.infoGap} />
          <View style={styles.infoBox}>
            <Text style={styles.eyebrow}>Deliver to</Text>
            {order.customer_address?.line1 && <Text style={styles.customerText}>{order.customer_address.line1}</Text>}
            {(order.customer_address?.district || order.customer_address?.city) && (
              <Text style={styles.customerText}>
                {[order.customer_address.district, order.customer_address.city].filter(Boolean).join(', ')}
              </Text>
            )}
            {order.customer_address?.country && (
              <Text style={styles.customerText}>
                {order.customer_address.country} {order.customer_address.postal_code || ''}
              </Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text
              style={[
                styles.tableHeaderCol,
                hidePrices ? { width: '85%' } : showShippingColumn ? styles.colItemWithShipping : styles.colItem,
              ]}
            >
              ITEM
            </Text>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>QTY</Text>
            {!hidePrices && (
              <Text style={[styles.tableHeaderCol, showShippingColumn ? styles.colPriceSm : styles.colPrice]}>
                UNIT PRICE
              </Text>
            )}
            {showShippingColumn && <Text style={[styles.tableHeaderCol, styles.colShipping]}>SHIPPING</Text>}
            {!hidePrices && (
              <Text style={[styles.tableHeaderCol, showShippingColumn ? styles.colTotalSm : styles.colTotal]}>
                TOTAL
              </Text>
            )}
          </View>

          {rows.map((row) => (
            <View key={row.key} style={styles.tableRow}>
              <View style={hidePrices ? { width: '85%' } : showShippingColumn ? styles.colItemWithShipping : styles.colItem}>
                <Text style={styles.rowName}>{row.name}</Text>
                {row.subLines.map((line, i) => (
                  <Text key={i} style={styles.rowSubText}>{line}</Text>
                ))}
              </View>
              <Text style={[styles.rowText, styles.colQty]}>{row.quantity}</Text>
              {!hidePrices && (
                <Text style={[styles.rowText, showShippingColumn ? styles.colPriceSm : styles.colPrice]}>
                  {formatPrice(row.unitPrice)}
                </Text>
              )}
              {showShippingColumn && (
                <Text style={[styles.rowText, styles.colShipping]}>{formatPrice(row.shipping || 0)}</Text>
              )}
              {!hidePrices && (
                <Text style={[styles.rowText, showShippingColumn ? styles.colTotalSm : styles.colTotal]}>
                  {formatPrice(row.total)}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Item Count */}
        <View style={styles.itemCountRow}>
          <Text style={styles.itemCountText}>
            Total: {totalQuantity} {totalQuantity === 1 ? 'Product' : 'Products'}
          </Text>
        </View>

        {/* Totals */}
        {!hidePrices && (
        <View style={styles.totalsContainer}>
           <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
              </View>
              {couponDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</Text>
                <Text style={styles.discountValue}>-{formatPrice(couponDiscount)}</Text>
              </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping Fee</Text>
                <Text style={styles.totalValue}>{formatPrice(shippingFee)}</Text>
              </View>

              <View style={styles.grandTotalDivider}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>{formatPrice(grandTotal)}</Text>
              </View>
           </View>
        </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerThanks}>Thank you for your order</Text>
          <Text style={styles.footerText}>Cangday · Wear What Lingers · cangdayperfume.com</Text>
        </View>

      </Page>
    </Document>
  );
}

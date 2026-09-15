import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { EditableInvoiceItem } from '@/types/invoice';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 57,
  },
  title: {
    fontSize: 28,
    fontWeight: 'extrabold',
    textTransform: 'uppercase',
    color: '#000000',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#888888',
    marginTop: 4,
    marginBottom: 20,
  },
  thickDivider: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    marginBottom: 20,
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metaLeft: {
    flexDirection: 'column',
  },
  metaRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  boldText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  normalText: {
    fontSize: 10,
    color: '#444444',
  },
  customerSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#000000',
    marginBottom: 10,
  },
  customerText: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tableHeaderCol: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 12,
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
    fontSize: 10,
    color: '#000000',
  },
  rowSubText: {
    fontSize: 8,
    color: '#888888',
    marginTop: 2,
  },
  totalsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 10,
    width: '100%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    width: '100%',
  },
  totalLabel: {
    width: 60,
    fontSize: 10,
    color: '#000000',
    textAlign: 'left',
  },
  totalValue: {
    width: 80,
    fontSize: 10,
    color: '#000000',
    textAlign: 'right',
  },
  grandTotalDivider: {
    borderTopWidth: 2,
    borderTopColor: '#000000',
    marginTop: 4,
    paddingTop: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
    color: '#000000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  itemCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  itemCountText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
    color: '#444444',
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

const formatPrice = (amount: number) => {
  return `$${Number(amount).toFixed(2)}`;
};

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
    : order.total_amount - order.shipping_cost;
  const shippingFee = shippingOverride ?? order.shipping_cost ?? 0;
  const grandTotal = subtotal + shippingFee;
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ROYAL PERFUMES</Text>
            <Text style={styles.subtitle}>Luxury Fragrances</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is not an HTML <img>; it has no alt prop */}
          <Image src="/images/hero1.PNG" style={styles.logo} />
        </View>
        <View style={styles.thickDivider} />

        {/* Invoice Meta */}
        <View style={styles.invoiceMetaRow}>
          <View style={styles.metaLeft}>
             <Text style={styles.boldText}>Order #{order.id.replace(/-/g, '').slice(0, 15).toUpperCase()}</Text>
             <Text style={styles.normalText}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.metaRight}>
             <Text style={styles.boldText}>Invoice</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Text style={styles.customerText}>{order.customer_name}</Text>
          {order.customer_email && <Text style={styles.customerText}>{order.customer_email}</Text>}
          <Text style={styles.customerText}>{formatPhone(order.customer_phone)}</Text>
          {order.customer_address?.line1 && <Text style={styles.customerText}>{order.customer_address.line1}</Text>}
          {order.customer_address?.city && (
            <Text style={styles.customerText}>{order.customer_address.city}, {order.customer_address.country} {order.customer_address.postal_code || ''}</Text>
          )}
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
                <Text style={styles.rowText}>{row.name.toUpperCase()}</Text>
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
           <View style={{ width: '50%' }}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping Fee</Text>
                <Text style={styles.totalValue}>{formatPrice(shippingFee)}</Text>
              </View>

              <View style={styles.grandTotalDivider}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>{formatPrice(grandTotal)} USD</Text>
              </View>
           </View>
        </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your order!</Text>
          <Text style={styles.footerText}>Royal Perfumes - Essence of Royalty</Text>
        </View>

      </Page>
    </Document>
  );
}

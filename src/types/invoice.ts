import { OrderItem } from '@/types';

// Ephemeral, client-only editing buffer for the "Customize PDF" flow.
// NEVER written to Supabase/orders/order_items/products — it exists only to
// build a one-off @react-pdf/renderer document.
export interface EditableInvoiceItem {
  _key: string; // crypto.randomUUID() — React/drag identity only, not a DB id
  sourceItemId: string; // originating OrderItem.id, for reference/debug only
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalPriceOverridden: boolean;
  shippingRate: number; // per-unit shipping rate for this line
  shippingTotal: number; // shippingRate * quantity, unless overridden below
  shippingTotalOverridden: boolean;
  variant: string;
  size: string;
  color: string;
  notes: string;
  hidden: boolean;
}

export function toEditableItems(items: OrderItem[], defaultShippingRate = 0): EditableInvoiceItem[] {
  return items.map((item) => {
    const quantity = item.quantity;
    const unitPrice = item.unit_price;
    // Both callers embed the join as `products` (the actual Supabase table
    // name), while the OrderItem type declares it as `product` — read both
    // defensively rather than depending on the mismatched type.
    const anyItem = item as unknown as { products?: { name_en?: string }; product?: { name_en?: string } };
    return {
      _key: crypto.randomUUID(),
      sourceItemId: item.id,
      name: anyItem.products?.name_en || anyItem.product?.name_en || 'Product',
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      totalPriceOverridden: false,
      shippingRate: defaultShippingRate,
      shippingTotal: defaultShippingRate * quantity,
      shippingTotalOverridden: false,
      variant: item.variant_name || '',
      size: '',
      color: '',
      notes: '',
      hidden: false,
    };
  });
}

export function duplicateEditableItem(item: EditableInvoiceItem): EditableInvoiceItem {
  return {
    ...item,
    _key: crypto.randomUUID(),
  };
}

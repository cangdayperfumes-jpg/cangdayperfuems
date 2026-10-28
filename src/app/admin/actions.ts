'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath, updateTag } from 'next/cache';

export async function getOrders({
  status,
  query,
  page = 1,
  limit = 20,
  fromIso,
  toIso,
}: { status?: string; query?: string; page?: number; limit?: number; fromIso?: string | null; toIso?: string | null } = {}) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let dbQuery = supabase
    .from('orders')
    .select('*, order_items(*, products(name_en))', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    dbQuery = dbQuery.eq('status', status);
  }

  if (fromIso) dbQuery = dbQuery.gte('created_at', fromIso);
  if (toIso) dbQuery = dbQuery.lt('created_at', toIso);

  if (query) {
    // Characters that would break PostgREST's or() syntax are stripped.
    const q = query.replace(/[,()*%\\:"']/g, ' ').trim().slice(0, 80);
    // id is a uuid column, which ilike can't search — match it exactly
    // when a full order id is pasted, otherwise search the customer fields.
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)) {
      dbQuery = dbQuery.eq('id', q);
    } else if (q) {
      dbQuery = dbQuery.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`);
    }
  }

  const { data, count, error } = await dbQuery.range(from, to);

  if (error) {
    console.error('Error fetching orders:', error);
    return { data: [], totalPages: 0 };
  }

  return {
    data: data || [],
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export async function toggleOrderVerification(orderId: string, currentStatus: boolean) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('orders')
    .update({ is_verified: !currentStatus })
    .eq('id', orderId);

  if (error) {
    throw new Error('Failed to update order status');
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

/**
 * Called after any product create/update/delete. Storefront product data is
 * cached (tag 'products') and pages are statically re-rendered every 60s, so
 * without this a new price or a new product took up to two minutes to show.
 */
export async function refreshStorefrontProducts() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { success: false as const };

  updateTag('products');
  revalidatePath('/[locale]', 'layout');
  return { success: true as const };
}

function expireProductPages() {
  updateTag('products');
  revalidatePath('/[locale]', 'layout');
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    throw new Error('Failed to delete product');
  }

  revalidatePath('/admin/products');
  expireProductPages();
}

export async function updateProductFields(productId: string, data: Record<string, string | number | boolean>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', productId);

  if (error) {
    throw new Error('Failed to update product');
  }

  revalidatePath('/admin/products');
  expireProductPages();
}

export async function bulkUpdatePrice(productIds: string[], price: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({ price })
    .in('id', productIds);

  if (error) {
    throw new Error('Failed to update prices');
  }

  revalidatePath('/admin/products');
  expireProductPages();
}

export async function deleteShippingZone(zoneId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('shipping_zones')
    .delete()
    .eq('id', zoneId);

  if (error) {
    throw new Error('Failed to delete shipping zone');
  }

  revalidatePath('/admin/shipping');
}

export async function createShippingZone(data: {
  country: string;
  price: number;
  continent?: string;
  country_code?: string;
  shipping_details?: string;
}) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('shipping_zones')
    .insert([data]);

  if (error) {
    throw new Error('Failed to create shipping zone');
  }

  revalidatePath('/admin/shipping');
}

export async function updateShippingZone(zoneId: string, data: {
  country?: string;
  price?: number;
  continent?: string;
  country_code?: string;
  shipping_details?: string;
}) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('shipping_zones')
    .update(data)
    .eq('id', zoneId);

  if (error) {
    throw new Error('Failed to update shipping zone');
  }

  revalidatePath('/admin/shipping');
}

type ActionResult = { success: true } | { success: false; error: string };

// These return the failure instead of throwing: in production Next replaces a
// thrown server-action error with a generic "Server Components render"
// message, so the dashboard could never show what actually went wrong.
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error, data } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select('id');

  if (error) return { success: false, error: `Failed to cancel order: ${error.message}` };
  if (!data || data.length === 0) return { success: false, error: 'Order not found or you do not have permission to modify it.' };

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Items, coupon redemptions and the order go together (order_items and
  // coupon_redemptions cascade from orders); deleting the order is enough.
  const { error, data } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .select('id');

  if (error) return { success: false, error: `Failed to delete order: ${error.message}` };
  if (!data || data.length === 0) return { success: false, error: 'Order not found or you do not have permission to delete it.' };

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}

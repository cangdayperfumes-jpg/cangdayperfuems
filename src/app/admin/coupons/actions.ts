'use server';

import { randomInt, randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export interface CouponRules {
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order: number;
  /** null = unlimited uses per code */
  max_uses: number | null;
  once_per_customer: boolean;
  /** ISO timestamp or null for no expiry */
  expires_at: string | null;
  note?: string | null;
}

type Result<T = unknown> = { success: true; data?: T } | { success: false; error: string };

// No 0/O/1/I/L — codes get read aloud and typed from screenshots.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-Z0-9-]{3,32}$/;

function randomCode(prefix: string, length = 6) {
  let body = '';
  for (let i = 0; i < length; i++) body += ALPHABET[randomInt(ALPHABET.length)];
  return prefix ? `${prefix}-${body}` : body;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function validateRules(r: CouponRules): string | null {
  if (r.discount_type !== 'percent' && r.discount_type !== 'fixed') return 'Invalid discount type';
  if (!Number.isFinite(r.discount_value) || r.discount_value <= 0) return 'Discount must be greater than 0';
  if (r.discount_type === 'percent' && r.discount_value > 100) return 'Percent discount cannot exceed 100';
  if (!Number.isFinite(r.min_order) || r.min_order < 0) return 'Invalid minimum order';
  if (r.max_uses !== null && (!Number.isInteger(r.max_uses) || r.max_uses < 1)) return 'Uses must be 1 or more';
  return null;
}

function rulesRow(r: CouponRules) {
  return {
    discount_type: r.discount_type,
    discount_value: r.discount_value,
    min_order: r.min_order,
    max_uses: r.max_uses,
    once_per_customer: r.once_per_customer,
    expires_at: r.expires_at,
    note: r.note?.trim() || null,
  };
}

function revalidate() {
  revalidatePath('/admin/coupons');
}

export async function createCoupon(code: string, rules: CouponRules): Promise<Result> {
  const normalized = normalizeCode(code);
  if (!CODE_RE.test(normalized)) return { success: false, error: 'Code must be 3–32 letters, numbers or dashes' };
  const invalid = validateRules(rules);
  if (invalid) return { success: false, error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.from('coupons').insert({ code: normalized, ...rulesRow(rules) });
  if (error) {
    return { success: false, error: error.code === '23505' ? 'This code already exists' : error.message };
  }
  revalidate();
  return { success: true };
}

/** Creates `count` unique random codes sharing one batch id; returns the codes. */
export async function generateCoupons(count: number, prefix: string, rules: CouponRules): Promise<Result<string[]>> {
  if (!Number.isInteger(count) || count < 1 || count > 500) return { success: false, error: 'Count must be between 1 and 500' };
  const cleanPrefix = normalizeCode(prefix).replace(/-+$/, '');
  if (cleanPrefix && !/^[A-Z0-9]{1,12}$/.test(cleanPrefix)) return { success: false, error: 'Prefix: up to 12 letters or numbers' };
  const invalid = validateRules(rules);
  if (invalid) return { success: false, error: invalid };

  const codes = new Set<string>();
  while (codes.size < count) codes.add(randomCode(cleanPrefix));
  const batch_id = randomUUID();

  const supabase = await createClient();
  const { error } = await supabase
    .from('coupons')
    .insert([...codes].map((code) => ({ code, batch_id, ...rulesRow(rules) })));
  if (error) {
    // A collision with an existing code is astronomically unlikely, but just retry once.
    if (error.code === '23505') return generateCoupons(count, prefix, rules);
    return { success: false, error: error.message };
  }
  revalidate();
  return { success: true, data: [...codes] };
}

export async function setCouponActive(ids: string[], is_active: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('coupons').update({ is_active }).in('id', ids);
  if (error) return { success: false, error: error.message };
  revalidate();
  return { success: true };
}

export async function deleteCoupons(ids: string[]): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('coupons').delete().in('id', ids);
  if (error) return { success: false, error: error.message };
  revalidate();
  return { success: true };
}

'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { broadcast, siteUrl, telegramConfigured, tg, tgText } from '@/lib/telegram';

export interface TelegramRecipient {
  id: string;
  chat_id: number;
  name: string | null;
  lang: string;
  created_at: string;
}

export interface TelegramStatus {
  configured: boolean;
  botUsername: string | null;
  recipients: TelegramRecipient[];
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error('Not signed in');
  return supabase;
}

async function botUsername() {
  const me = await tg<{ username: string }>('getMe');
  return me.ok ? me.result?.username ?? null : null;
}

export async function getTelegramStatus(): Promise<TelegramStatus> {
  const supabase = await requireAdmin();
  const [{ data }, username] = await Promise.all([
    supabase.from('telegram_recipients').select('id, chat_id, name, lang, created_at').order('created_at'),
    telegramConfigured() ? botUsername() : Promise.resolve(null),
  ]);
  return { configured: telegramConfigured(), botUsername: username, recipients: (data ?? []) as TelegramRecipient[] };
}

/** Registers the webhook (idempotent) and returns one-time links to connect a person or a group. */
export async function createTelegramLink(lang: 'tr' | 'en') {
  const supabase = await requireAdmin();
  if (!telegramConfigured()) return { success: false as const, error: 'not_configured' };

  const username = await botUsername();
  if (!username) return { success: false as const, error: 'bad_token' };

  const hook = await tg('setWebhook', {
    url: `${siteUrl()}/api/telegram/webhook`,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });
  if (!hook.ok) {
    console.error('[telegram] setWebhook failed:', hook.description);
    return { success: false as const, error: 'webhook' };
  }

  const code = randomBytes(12).toString('base64url');
  const { error } = await supabase.from('telegram_link_codes').insert({ code, lang });
  if (error) return { success: false as const, error: error.message };

  return {
    success: true as const,
    personal: `https://t.me/${username}?start=${code}`,
    group: `https://t.me/${username}?startgroup=${code}`,
  };
}

export async function removeTelegramRecipient(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('telegram_recipients').delete().eq('id', id);
  revalidatePath('/admin/settings');
  return error ? { success: false as const, error: error.message } : { success: true as const };
}

export async function sendTelegramTest() {
  const supabase = await requireAdmin();
  const { data } = await supabase.from('telegram_recipients').select('chat_id, lang');
  if (!data?.length) return { success: false as const, sent: 0 };
  const sent = await broadcast(data, (lang) => ({ text: tgText(lang).test }));
  return { success: sent > 0, sent };
}

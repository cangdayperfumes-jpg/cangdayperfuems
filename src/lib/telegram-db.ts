import { createClient } from '@supabase/supabase-js';

/**
 * Cookie-less anon client for the Telegram routes (webhook, cron, checkout
 * ping). Every call goes through the secret-gated tg_* SECURITY DEFINER
 * functions, so the anon key alone can't read or change anything.
 */
export function telegramDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const serverSecret = () => process.env.TELEGRAM_SERVER_SECRET ?? '';

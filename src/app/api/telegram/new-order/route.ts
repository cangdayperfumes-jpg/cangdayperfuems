import { NextResponse } from 'next/server';
import { broadcast, orderMessage, siteUrl, telegramConfigured, tgText, type ClaimedOrder } from '@/lib/telegram';
import { serverSecret, telegramDb } from '@/lib/telegram-db';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checkout pings this after an order (and its items) are saved. The database
 * marks the order as notified the first time (tg_claim_order), so repeated or
 * forged calls can't spam the bot — at most one message per real, fresh order.
 */
export async function POST(req: Request) {
  if (!telegramConfigured() || !serverSecret()) return NextResponse.json({ skipped: true });

  const { orderId } = await req.json().catch(() => ({}));
  if (typeof orderId !== 'string' || !UUID.test(orderId)) {
    return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 });
  }

  const db = telegramDb();
  const { data, error } = await db.rpc('tg_claim_order', { p_secret: serverSecret(), p_order_id: orderId });
  if (error) {
    console.error('[telegram] claim failed:', error);
    return NextResponse.json({ error: 'claim failed' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ skipped: true }); // unknown, old, or already sent

  const payload = data as ClaimedOrder;
  const sent = await broadcast(
    payload.chats,
    (lang) => ({
      text: orderMessage(payload, lang),
      buttonText: tgText(lang).open,
      buttonUrl: `${siteUrl()}/admin/orders?q=${payload.order.id}`,
    }),
    (chatId) => db.rpc('tg_unlink_chat', { p_secret: serverSecret(), p_chat_id: chatId })
  );
  return NextResponse.json({ sent });
}

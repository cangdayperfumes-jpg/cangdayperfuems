import { NextResponse } from 'next/server';
import { tg, tgText } from '@/lib/telegram';
import { serverSecret, telegramDb } from '@/lib/telegram-db';

/**
 * Telegram → us. Only handles "/start <code>" from the dashboard's
 * "Connect Telegram" link, which links that chat (a person or a group) to
 * the order notifications. Requests without the secret header Telegram was
 * given in setWebhook are rejected.
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const text: string = msg?.text ?? '';
  const chatId: number | undefined = msg?.chat?.id;
  if (!chatId || !text.startsWith('/start')) return NextResponse.json({ ok: true });

  // "/start CODE" or "/start@BotName CODE" (groups).
  const code = text.split(/\s+/)[1]?.trim();
  const name =
    msg.chat.title ||
    [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
    msg.from?.username ||
    String(chatId);

  let lang: string | null = null;
  if (code && /^[A-Za-z0-9_-]{8,64}$/.test(code)) {
    const { data, error } = await telegramDb().rpc('tg_link_chat', {
      p_secret: serverSecret(),
      p_code: code,
      p_chat_id: chatId,
      p_name: name,
    });
    if (error) console.error('[telegram] link failed:', error);
    lang = (data as string | null) ?? null;
  }

  await tg('sendMessage', { chat_id: chatId, text: lang ? tgText(lang).linked : tgText('tr').needLink + '\n\n' + tgText('en').needLink });
  return NextResponse.json({ ok: true });
}

import { NextResponse, type NextRequest } from 'next/server';
import { broadcast, dailyMessage, siteUrl, telegramConfigured, tgText, type DailySummary } from '@/lib/telegram';
import { serverSecret, telegramDb } from '@/lib/telegram-db';
import { turkeyDay } from '@/lib/order-report';

/**
 * Evening summary, run by Vercel Cron (vercel.json → 18:00 UTC = 21:00 in
 * Turkey). Vercel sends "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: NextRequest) {
  const cron = process.env.CRON_SECRET;
  if (!cron || req.headers.get('authorization') !== `Bearer ${cron}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!telegramConfigured() || !serverSecret()) return NextResponse.json({ skipped: true });

  const day = turkeyDay(new Date());
  const db = telegramDb();
  const { data, error } = await db.rpc('tg_daily_summary', { p_secret: serverSecret(), p_day: day });
  if (error || !data) {
    console.error('[telegram] daily summary failed:', error);
    return NextResponse.json({ error: 'summary failed' }, { status: 500 });
  }

  const summary = data as DailySummary;
  const sent = await broadcast(
    summary.chats,
    (lang) => ({
      text: dailyMessage(summary, day, lang),
      buttonText: tgText(lang).report,
      buttonUrl: `${siteUrl()}/admin/orders?range=today`,
    }),
    (chatId) => db.rpc('tg_unlink_chat', { p_secret: serverSecret(), p_chat_id: chatId })
  );
  return NextResponse.json({ sent });
}

/**
 * Telegram Bot API helpers (server only — uses TELEGRAM_BOT_TOKEN).
 *
 * Setup: create a bot with @BotFather, put its token in the
 * TELEGRAM_BOT_TOKEN env var, then press "Connect Telegram" in
 * Dashboard → Settings (that also registers the webhook).
 */

type Lang = 'tr' | 'en';

export function telegramConfigured() {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}

export async function tg<T = unknown>(method: string, body?: Record<string, unknown>): Promise<{ ok: boolean; result?: T; description?: string; error_code?: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not set' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      cache: 'no-store',
    });
    return await res.json();
  } catch (e) {
    return { ok: false, description: e instanceof Error ? e.message : 'Network error' };
  }
}

export const escapeHtml = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const money = (n: number) =>
  `${Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://cangdayperfume.com').replace(/\/$/, '');
}

const L = {
  tr: {
    newOrder: '🛍 <b>Yeni sipariş</b>',
    customer: 'Müşteri',
    phone: 'Telefon',
    address: 'Adres',
    items: 'Ürünler',
    subtotal: 'Ara toplam',
    discount: 'İndirim',
    shipping: 'Kargo',
    free: 'Ücretsiz',
    total: 'Toplam',
    open: 'Siparişi panelde aç',
    daily: '📊 <b>Günlük özet</b>',
    orders: 'Sipariş',
    revenue: 'Ciro',
    sold: 'Satılan ürün',
    cancelled: 'İptal',
    pending: 'Onay bekleyen (toplam)',
    best: 'En çok satanlar',
    noOrders: 'Bugün sipariş yok.',
    report: 'Raporu aç',
    test: '✅ <b>Test mesajı</b>\nCangday sipariş bildirimleri bu sohbete geliyor.',
    linked: '✅ Bağlandı! Yeni Cangday siparişleri ve günlük özet buraya gelecek.',
    needLink: 'Bu botu bağlamak için Cangday paneli → Ayarlar → Telegram bölümündeki bağlantıyı kullanın.',
  },
  en: {
    newOrder: '🛍 <b>New order</b>',
    customer: 'Customer',
    phone: 'Phone',
    address: 'Address',
    items: 'Items',
    subtotal: 'Subtotal',
    discount: 'Discount',
    shipping: 'Shipping',
    free: 'Free',
    total: 'Total',
    open: 'Open order in dashboard',
    daily: '📊 <b>Daily summary</b>',
    orders: 'Orders',
    revenue: 'Revenue',
    sold: 'Items sold',
    cancelled: 'Cancelled',
    pending: 'Pending (all)',
    best: 'Best sellers',
    noOrders: 'No orders today.',
    report: 'Open report',
    test: '✅ <b>Test message</b>\nCangday order notifications are arriving in this chat.',
    linked: "✅ Connected! New Cangday orders and the daily summary will arrive here.",
    needLink: 'To connect this bot, use the link in the Cangday dashboard → Settings → Telegram.',
  },
} satisfies Record<Lang, Record<string, string>>;

export const tgText = (lang: string) => L[lang === 'en' ? 'en' : 'tr'];

export interface ClaimedOrder {
  order: {
    id: string;
    created_at: string;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_address?: { line1?: string; city?: string; district?: string | null; country?: string; country_code?: string } | null;
    total_amount: number;
    shipping_cost?: number | null;
    discount_amount?: number | null;
    coupon_code?: string | null;
  };
  items: { name: string; quantity: number; unit_price: number }[];
  chats: { chat_id: number; lang: string }[];
}

export function orderMessage(p: ClaimedOrder, lang: string) {
  const t = tgText(lang);
  const o = p.order;
  const a = o.customer_address ?? {};
  const place = [a.district, a.city, a.country_code && a.country_code !== 'TR' ? a.country : null].filter(Boolean).join(', ');
  const subtotal = p.items.reduce((s, i) => s + i.quantity * Number(i.unit_price), 0);
  const ship = Number(o.shipping_cost || 0);
  const disc = Number(o.discount_amount || 0);
  const when = new Date(o.created_at).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul',
  });

  const lines = [
    `${t.newOrder} · #${escapeHtml(o.id.slice(0, 8).toUpperCase())}`,
    `<i>${escapeHtml(when)}</i>`,
    '',
    `👤 <b>${t.customer}:</b> ${escapeHtml(o.customer_name)}`,
    o.customer_phone ? `📞 <b>${t.phone}:</b> ${escapeHtml(o.customer_phone.startsWith('+') ? o.customer_phone : `+${o.customer_phone}`)}` : null,
    o.customer_email ? `✉️ ${escapeHtml(o.customer_email)}` : null,
    place ? `📍 <b>${t.address}:</b> ${escapeHtml(place)}` : null,
    a.line1 ? `    ${escapeHtml(a.line1)}` : null,
    '',
    `<b>${t.items}:</b>`,
    ...p.items.map((i) => `• ${escapeHtml(i.name)} × ${i.quantity} — ${money(i.quantity * Number(i.unit_price))}`),
    '',
    `${t.subtotal}: ${money(subtotal)}`,
    disc > 0 ? `${t.discount}${o.coupon_code ? ` (${escapeHtml(o.coupon_code)})` : ''}: −${money(disc)}` : null,
    `${t.shipping}: ${ship > 0 ? money(ship) : t.free}`,
    `<b>${t.total}: ${money(Number(o.total_amount))}</b>`,
  ];
  return lines.filter((l) => l !== null).join('\n');
}

export interface DailySummary {
  orders: number;
  cancelled: number;
  revenue: number;
  discounts: number;
  items: number;
  pending_total: number;
  top: { name: string; quantity: number }[];
  chats: { chat_id: number; lang: string }[];
}

export function dailyMessage(s: DailySummary, day: string, lang: string) {
  const t = tgText(lang);
  const date = new Date(`${day}T12:00:00Z`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (!s.orders) {
    return [`${t.daily} · ${escapeHtml(date)}`, '', t.noOrders, s.pending_total ? `${t.pending}: ${s.pending_total}` : null]
      .filter((l) => l !== null)
      .join('\n');
  }
  return [
    `${t.daily} · ${escapeHtml(date)}`,
    '',
    `🧾 ${t.orders}: <b>${s.orders}</b>${s.cancelled ? ` (${t.cancelled}: ${s.cancelled})` : ''}`,
    `💰 ${t.revenue}: <b>${money(Number(s.revenue))}</b>`,
    `📦 ${t.sold}: ${s.items}`,
    Number(s.discounts) > 0 ? `🏷 ${t.discount}: −${money(Number(s.discounts))}` : null,
    `⏳ ${t.pending}: ${s.pending_total}`,
    s.top.length ? '' : null,
    s.top.length ? `<b>${t.best}:</b>` : null,
    ...s.top.map((p, i) => `${i + 1}. ${escapeHtml(p.name)} × ${p.quantity}`),
  ]
    .filter((l) => l !== null)
    .join('\n');
}

/** Sends to every chat; drops chats that blocked the bot. Returns how many succeeded. */
export async function broadcast(
  chats: { chat_id: number; lang: string }[],
  build: (lang: string) => { text: string; buttonText?: string; buttonUrl?: string },
  onGone?: (chatId: number) => PromiseLike<unknown>
) {
  let sent = 0;
  await Promise.all(
    chats.map(async (c) => {
      const m = build(c.lang);
      const res = await tg('sendMessage', {
        chat_id: c.chat_id,
        text: m.text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        ...(m.buttonUrl ? { reply_markup: { inline_keyboard: [[{ text: m.buttonText, url: m.buttonUrl }]] } } : {}),
      });
      if (res.ok) sent++;
      else if (res.error_code === 403 && onGone) await Promise.resolve(onGone(c.chat_id)).catch(() => {});
      else console.error('[telegram] sendMessage failed:', c.chat_id, res.description);
    })
  );
  return sent;
}

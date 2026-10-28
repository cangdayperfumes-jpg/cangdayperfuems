/**
 * Automatic bag offers (Admin → Offers). Stored as system_settings.offers.
 *
 * - pair:    two perfumes each at or under `maxPrice` → the cheaper one is `percent`% off
 * - trio:    `count` perfumes each at or under `maxPrice` → all of them for `price`
 * - premium: every perfume over `minPrice` is `percent`% off
 *
 * A perfume gets at most one offer, and when several groupings are possible
 * the one that saves the customer the most wins. The checkout saves the
 * result on the order (offer_discount + offer_lines), and every later view —
 * admin, Telegram, invoice — reads those saved values, so the amounts match
 * everywhere even after the admin changes the offers.
 */

export interface OffersConfig {
  pair: { enabled: boolean; maxPrice: number; percent: number };
  trio: { enabled: boolean; maxPrice: number; count: number; price: number };
  premium: { enabled: boolean; minPrice: number; percent: number };
}

export const DEFAULT_OFFERS: OffersConfig = {
  pair: { enabled: true, maxPrice: 2500, percent: 30 },
  trio: { enabled: true, maxPrice: 2500, count: 3, price: 5999 },
  premium: { enabled: true, minPrice: 2750, percent: 20 },
};

export type OfferKind = keyof OffersConfig;

/** One applied offer as saved on the order — with the numbers it used, so the label never changes later. */
export interface OfferLine {
  offer: OfferKind;
  /** How many times it applied (pairs, sets, or discounted perfumes). */
  times: number;
  /** Total saved by this offer. */
  amount: number;
  percent?: number;
  price?: number;
  count?: number;
}

export interface OfferResult {
  lines: OfferLine[];
  discount: number;
}

const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Reads the stored JSON, filling anything missing or invalid with the defaults. */
export function parseOffers(raw: unknown): OffersConfig {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown> | undefined>;
  const d = DEFAULT_OFFERS;
  return {
    pair: {
      enabled: (r.pair?.enabled as boolean | undefined) ?? d.pair.enabled,
      maxPrice: num(r.pair?.maxPrice, d.pair.maxPrice),
      percent: Math.min(num(r.pair?.percent, d.pair.percent), 100),
    },
    trio: {
      enabled: (r.trio?.enabled as boolean | undefined) ?? d.trio.enabled,
      maxPrice: num(r.trio?.maxPrice, d.trio.maxPrice),
      count: Math.max(2, Math.round(num(r.trio?.count, d.trio.count))),
      price: num(r.trio?.price, d.trio.price),
    },
    premium: {
      enabled: (r.premium?.enabled as boolean | undefined) ?? d.premium.enabled,
      minPrice: num(r.premium?.minPrice, d.premium.minPrice),
      percent: Math.min(num(r.premium?.percent, d.premium.percent), 100),
    },
  };
}

export function hasActiveOffers(cfg: OffersConfig) {
  return cfg.pair.enabled || cfg.trio.enabled || cfg.premium.enabled;
}

/**
 * Best total saving for the bag. Each bottle is one unit; units are sorted
 * by price (high → low) and grouped in neighbouring runs — a pair saves on
 * its cheaper bottle, a set saves its price above the set price, a premium
 * bottle saves its own percentage — and a small DP picks the grouping that
 * saves the most.
 */
export function applyOffers(items: { price: number; quantity: number }[], cfg: OffersConfig): OfferResult {
  const units = items
    .flatMap((i) => Array.from({ length: Math.max(0, Math.floor(i.quantity)) }, () => Number(i.price) || 0))
    .filter((p) => p > 0)
    .sort((a, b) => b - a);
  const n = units.length;

  const pairOk = (p: number) => cfg.pair.enabled && p <= cfg.pair.maxPrice;
  const trioOk = (p: number) => cfg.trio.enabled && p <= cfg.trio.maxPrice;
  const premiumOk = (p: number) => cfg.premium.enabled && p > cfg.premium.minPrice;

  type Step = { kind: OfferKind | null; size: number; save: number };
  const best = new Array<number>(n + 1).fill(0);
  const choice = new Array<Step>(n + 1).fill({ kind: null, size: 1, save: 0 });

  for (let i = n - 1; i >= 0; i--) {
    let top: Step = { kind: null, size: 1, save: 0 };
    let topTotal = best[i + 1];
    const consider = (step: Step) => {
      const total = step.save + best[i + step.size];
      if (step.save > 0 && total > topTotal + 1e-9) {
        top = step;
        topTotal = total;
      }
    };

    if (premiumOk(units[i])) consider({ kind: 'premium', size: 1, save: round2((units[i] * cfg.premium.percent) / 100) });
    if (i + 1 < n && pairOk(units[i]) && pairOk(units[i + 1])) {
      consider({ kind: 'pair', size: 2, save: round2((units[i + 1] * cfg.pair.percent) / 100) });
    }
    const c = cfg.trio.count;
    if (i + c <= n && units.slice(i, i + c).every(trioOk)) {
      const sum = units.slice(i, i + c).reduce((s, p) => s + p, 0);
      consider({ kind: 'trio', size: c, save: round2(sum - cfg.trio.price) });
    }

    best[i] = topTotal;
    choice[i] = top;
  }

  const tally: Record<OfferKind, { times: number; amount: number }> = {
    pair: { times: 0, amount: 0 },
    trio: { times: 0, amount: 0 },
    premium: { times: 0, amount: 0 },
  };
  for (let i = 0; i < n; ) {
    const step = choice[i];
    if (step.kind) {
      tally[step.kind].times += 1;
      tally[step.kind].amount = round2(tally[step.kind].amount + step.save);
    }
    i += step.size;
  }

  const lines: OfferLine[] = [];
  if (tally.trio.times) lines.push({ offer: 'trio', ...tally.trio, count: cfg.trio.count, price: cfg.trio.price });
  if (tally.pair.times) lines.push({ offer: 'pair', ...tally.pair, percent: cfg.pair.percent });
  if (tally.premium.times) lines.push({ offer: 'premium', ...tally.premium, percent: cfg.premium.percent });

  return { lines, discount: round2(lines.reduce((s, l) => s + l.amount, 0)) };
}

const tl = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);

/** "3 for ₺5.999 ×2" — the line's label in the given language, from the numbers saved with it. */
export function offerLineLabel(line: OfferLine, locale: string) {
  const tr = locale !== 'en';
  const times = line.times > 1 ? ` ×${line.times}` : '';
  switch (line.offer) {
    case 'trio':
      return (tr ? `${line.count ?? 3}'lü set: ${tl(line.price ?? 0)}` : `${line.count ?? 3} for ${tl(line.price ?? 0)}`) + times;
    case 'pair':
      return (tr ? `İkinci parfüm %${line.percent} indirimli` : `2nd perfume ${line.percent}% off`) + times;
    case 'premium':
      return (tr ? `Premium parfüm %${line.percent} indirim` : `Premium perfume ${line.percent}% off`) + times;
  }
}

/** Saved order lines, tolerant of older orders (null) or malformed JSON. */
export function readOfferLines(raw: unknown): OfferLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((l): l is OfferLine => !!l && typeof l === 'object' && typeof (l as OfferLine).offer === 'string');
}

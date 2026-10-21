/**
 * Search/AI-answer readiness checks for one language version of a post —
 * the things that measurably matter: snippet lengths, a front-loaded answer,
 * scannable structure (H2s, question headings, FAQ), enough depth, an image
 * with alt text, and links into the shop.
 */
export interface SeoCheck {
  key: string;
  ok: boolean;
  /** Warnings are advice; failing "required" checks hurt the score more. */
  weight: 1 | 2;
  values?: Record<string, number>;
}

export interface SeoInput {
  title: string;
  seoTitle: string;
  excerpt: string;
  summary: string;
  content: string;
  coverImage: string | null;
  coverAlt: string;
  faqCount: number;
  relatedProducts: number;
}

export function wordCount(markdown: string) {
  return markdown.replace(/[#>*_`|[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

export function runSeoChecks(v: SeoInput): { checks: SeoCheck[]; score: number } {
  const title = (v.seoTitle || v.title).trim();
  const words = wordCount(v.content);
  const summaryWords = wordCount(v.summary);
  const h2 = (v.content.match(/^##\s+/gm) ?? []).length;
  const questionHeading = /^#{2,3}\s+.*\?\s*$/m.test(v.content);
  const internalLinks = (v.content.match(/\]\((\/|https?:\/\/(www\.)?cangdayperfume\.com)/g) ?? []).length + v.relatedProducts;

  const checks: SeoCheck[] = [
    { key: 'titleLength', ok: title.length >= 30 && title.length <= 60, weight: 2, values: { length: title.length } },
    { key: 'descriptionLength', ok: v.excerpt.trim().length >= 110 && v.excerpt.trim().length <= 160, weight: 2, values: { length: v.excerpt.trim().length } },
    { key: 'summary', ok: summaryWords >= 25 && summaryWords <= 80, weight: 2, values: { words: summaryWords } },
    { key: 'length', ok: words >= 600, weight: 2, values: { words } },
    { key: 'headings', ok: h2 >= 2, weight: 1, values: { count: h2 } },
    { key: 'questionHeading', ok: questionHeading, weight: 1 },
    { key: 'faq', ok: v.faqCount >= 2, weight: 1, values: { count: v.faqCount } },
    { key: 'image', ok: !!v.coverImage && v.coverAlt.trim().length >= 5, weight: 1 },
    { key: 'internalLinks', ok: internalLinks >= 1, weight: 1, values: { count: internalLinks } },
  ];

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  return { checks, score: Math.round((got / total) * 100) };
}

import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cangdayperfume.com').replace(/\/$/, '');
export const SITE_NAME = 'Cangday';

/** Absolute URL for a locale + path ("/shop/oud" → https://…/tr/shop/oud). */
export function localeUrl(locale: string, path = '') {
  return `${SITE_URL}/${locale}${path}`;
}

/**
 * Canonical + hreflang for a page that exists in every locale.
 *
 * Every page must set this. A page that doesn't inherits the [locale]
 * layout's, whose canonical is the *homepage*, which tells Google the page
 * is a duplicate of the homepage. A bare "/about" canonical is wrong too: it
 * redirects (locale prefix) and makes /en and /tr claim the same URL.
 */
export function localeAlternates(
  locale: string,
  path = '',
  locales: readonly string[] = routing.locales
): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, localeUrl(l, path)]));
  const fallback = locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0];
  if (fallback) languages['x-default'] = localeUrl(fallback, path);
  return { canonical: localeUrl(locale, path), languages };
}

/** og:locale values for Open Graph. */
export const OG_LOCALE: Record<string, string> = { tr: 'tr_TR', en: 'en_US' };

/** Serialises JSON-LD safely for a <script> tag (no "</script>" breakouts). */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}

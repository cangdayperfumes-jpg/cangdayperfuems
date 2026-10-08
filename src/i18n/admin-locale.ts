import { cookies } from 'next/headers';
import { createTranslator } from 'next-intl';
import { ADMIN_LOCALE_COOKIE, ADMIN_LOCALES, DEFAULT_ADMIN_LOCALE, type AdminLocale } from './admin-locale-constants';

export { ADMIN_LOCALE_COOKIE, ADMIN_LOCALES, DEFAULT_ADMIN_LOCALE };
export type { AdminLocale };

export async function getAdminLocale(): Promise<AdminLocale> {
  const store = await cookies();
  const value = store.get(ADMIN_LOCALE_COOKIE)?.value;
  return (ADMIN_LOCALES as readonly string[]).includes(value || '')
    ? (value as AdminLocale)
    : DEFAULT_ADMIN_LOCALE;
}

export async function getAdminMessages(locale: AdminLocale) {
  return (await import(`../../messages/admin-${locale}.json`)).default;
}

// Admin server components can't use next-intl's getTranslations() — that
// goes through the app-wide getRequestConfig (src/i18n/request.ts), which is
// wired to the storefront's messages/{locale}.json and knows nothing about
// the admin's cookie-based locale or its separate messages/admin-*.json
// catalog. createTranslator builds a translator directly from an explicit
// messages object, bypassing that pipeline entirely.
export async function getAdminT(locale: AdminLocale, namespace: string) {
  const messages = await getAdminMessages(locale);
  return createTranslator({ locale, messages, namespace });
}

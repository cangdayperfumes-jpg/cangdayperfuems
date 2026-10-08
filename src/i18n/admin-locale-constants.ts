// Client-safe constants for the admin locale cookie — split out from
// admin-locale.ts because that file imports next/headers (server-only); a
// client component importing ANY export from the same module would pull
// that import into the client bundle and fail to build.
export const ADMIN_LOCALE_COOKIE = 'ADMIN_LOCALE';
export const ADMIN_LOCALES = ['en', 'tr'] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];
export const DEFAULT_ADMIN_LOCALE: AdminLocale = 'en';

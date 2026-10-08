import { Fraunces, Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminLocale, getAdminMessages } from "@/i18n/admin-locale";

// Admin is its own root layout (see src/app/[locale]/layout.tsx for the
// storefront one) — it stays unprefixed (no /tr or /en URL), but is bilingual
// via a cookie-based locale (ADMIN_LOCALE) instead of routing, since admin
// URLs/bookmarks shouldn't change with language.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getAdminLocale();
  const messages = await getAdminMessages(locale);

  return (
    <html lang={locale}>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        manrope.variable,
        fraunces.variable
      )}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AdminShell>{children}</AdminShell>
        </NextIntlClientProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid black',
              color: 'black',
            },
          }}
        />
      </body>
    </html>
  );
}

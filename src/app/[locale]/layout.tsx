import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { preconnect } from "react-dom";
import { Fraunces, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import "./phone-input.css";
import { cn } from "@/lib/utils";
import { routing, type Locale } from "@/i18n/routing";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import ScrollToTop from "@/components/shared/ScrollToTop";
import SitePopup from "@/components/shared/SitePopup";
import OfferBar from "@/components/shared/OfferBar";
import CookieBanner from "@/components/shared/CookieBanner";
import AnnouncementBar from "@/components/shared/AnnouncementBar";
import AuthRecoveryRedirect from "@/components/shared/AuthRecoveryRedirect";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { createClient } from "@supabase/supabase-js";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import MotionProvider from "@/components/providers/MotionProvider";
import { unstable_cache } from "next/cache";
import StorefrontLayoutWrapper from "@/components/shared/StorefrontLayoutWrapper";
import { getSiteTheme, hexToRgbTriplet } from "@/lib/theme-data";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { PLACEHOLDER_SUPABASE_URL } from "@/utils/supabase/placeholder";

// Fraunces: an expressive, high-contrast "soft serif" with genuine optical-size
// character — carries the jewelry-editorial feel without reaching for the
// Playfair Display every other perfume site already uses.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});
// Manrope: a warm geometric sans that stays quiet next to Fraunces' curves.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cangday.com";

// Without this, phones have no layout-viewport hint and fall back to a
// ~980px desktop-width viewport (then zoom out to fit) — which also means
// every `md:` Tailwind breakpoint (768px) matches on a phone, silently
// serving the desktop layout there instead of the mobile one.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const OG_LOCALE: Record<Locale, string> = { tr: "tr_TR", en: "en_US" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${siteUrl}/${l}`])
  );
  languages["x-default"] = `${siteUrl}/${routing.defaultLocale}`;

  const title =
    locale === "tr" ? "Cangday | Modern Parfümeri" : "Cangday | Modern Perfumery";
  const description =
    locale === "tr"
      ? "Cangday, günlük kullanım için seçilmiş tasarımcı ve niş parfümlerden oluşan modern bir koku evidir. Orijinal şişeler, dünya çapında kargo, kolay iade."
      : "Cangday is a modern fragrance house — an edited collection of designer and niche perfumes for everyday wear. Original bottles, worldwide shipping, easy returns.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | Cangday`,
    },
    description,
    keywords: ["perfume", "fragrance", "eau de parfum", "niche perfume", "designer perfume", "buy perfume online", "parfüm", "koku"],
    authors: [{ name: "Cangday" }],
    creator: "Cangday",
    publisher: "Cangday",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}`,
      siteName: "Cangday",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Cangday - Modern Perfumery",
        },
      ],
      locale: OG_LOCALE[locale as Locale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  // Editorial/fallback photography (hero fallback, category tiles, promo
  // cards) is served from Unsplash's CDN — open that connection early so
  // those images don't wait on DNS + TLS after the HTML arrives.
  preconnect("https://images.unsplash.com");

  const supabaseConfigured = isSupabaseConfigured();

  // Cookie-free client: the storefront layout only reads public data (categories,
  // settings), so it must not pull in next/headers cookies() — doing so opts every
  // route under this layout into fully dynamic (uncached) rendering, overriding each
  // page's own `revalidate`/ISR config. Admin auth is handled separately by
  // proxy.ts, which is scoped to /admin only and is unaffected by this client.
  // Falls back to the placeholder URL (never an empty string) when unconfigured —
  // createClient throws synchronously on an empty URL (e.g. a Docker build with no
  // env vars supplied at all, not even the placeholder), and both call sites below
  // already no-op via the `supabaseConfigured` check before ever using this client.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );

  // Run all three in parallel + cache results for 60s
  const [rawCategories, settings, theme] = await Promise.all([
    unstable_cache(
      async () => {
        if (!supabaseConfigured) return null;
        const { data } = await supabase
          .from('categories')
          .select('*, products!inner(id)')
          .eq('products.is_active', true)
          .order('name');
        return data;
      },
      ['layout-categories'],
      { revalidate: 60 }
    )(),
    unstable_cache(
      async () => {
        if (!supabaseConfigured) return null;
        const { data } = await supabase
          .from('system_settings')
          .select('hide_prices, popup_enabled, popup_title, popup_message, popup_button_text, popup_button_link, popup_image_url, popup_show_on, popup_ends_at, popup_show_bar, popup_title_tr, popup_message_tr, popup_button_text_tr, new_badge_days')
          .eq('id', 'global')
          .single();
        return data;
      },
      ['layout-settings'],
      { revalidate: 60 }
    )(),
    getSiteTheme(),
  ]);

  const categories = rawCategories?.map((item: any) => {
    const { products, ...category } = item;
    return category;
  }) || [];

  const settingsData = settings as Record<string, any> | null;
  const hidePrices = settingsData?.hide_prices || false;
  const popupSettings = settingsData
    ? {
        popup_enabled: settingsData.popup_enabled || false,
        popup_title: settingsData.popup_title || '',
        popup_message: settingsData.popup_message || '',
        popup_button_text: settingsData.popup_button_text || '',
        popup_button_link: settingsData.popup_button_link || '',
        popup_image_url: settingsData.popup_image_url || '',
        popup_show_on: settingsData.popup_show_on || 'all',
        popup_ends_at: settingsData.popup_ends_at || null,
        popup_show_bar: settingsData.popup_show_bar ?? true,
        popup_title_tr: settingsData.popup_title_tr || '',
        popup_message_tr: settingsData.popup_message_tr || '',
        popup_button_text_tr: settingsData.popup_button_text_tr || '',
      }
    : null;
  const newBadgeDays: number = settingsData?.new_badge_days ?? 30;

  return (
    <html lang={locale}>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased flex flex-col overflow-x-hidden",
        manrope.variable,
        fraunces.variable
      )}>
        {/* Admin-managed brand colors (see /admin/settings → Theme) — overrides
            the --brand-* defaults from globals.css at runtime, so a color
            change takes effect without a rebuild/redeploy. Only the four
            primary tones are admin-editable; the elevated/line/soft tonal
            variants stay derived from globals.css to keep the form simple. */}
        <style>{`:root { --brand-gold: ${hexToRgbTriplet(theme.gold)}; --brand-gold-deep: ${hexToRgbTriplet(theme.goldDeep)}; --brand-ink: ${hexToRgbTriplet(theme.ink)}; --brand-ivory: ${hexToRgbTriplet(theme.ivory)}; }`}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Cangday",
              "legalName": "Cangday",
              "url": siteUrl,
              "description": "Cangday is a modern fragrance house offering an edited collection of designer and niche perfumes for everyday wear.",
              "slogan": "Wear What Lingers.",
            })
          }}
        />
        <NextTopLoader
          color="rgb(var(--brand-gold))"
          height={3}
          showSpinner={false}
          shadow="0 0 10px rgb(var(--brand-gold)),0 0 5px rgb(var(--brand-gold))"
        />
        <AuthRecoveryRedirect />
        <NextIntlClientProvider>
          <SettingsProvider hidePrices={hidePrices} popupSettings={popupSettings} newBadgeDays={newBadgeDays}>
          <MotionProvider>
            <Suspense fallback={null}>
              <StorefrontLayoutWrapper>
                <div className="sticky top-0 z-50 w-full">
                  <OfferBar />
                  <AnnouncementBar />
                  <Navbar categories={categories || []} />
                </div>
              </StorefrontLayoutWrapper>
            </Suspense>
            <main className="flex-1 w-full">
              {children}
            </main>
            <StorefrontLayoutWrapper>
              <BottomNav />
              <ScrollToTop />
            </StorefrontLayoutWrapper>
            <StorefrontLayoutWrapper hideOnCheckout>
              <Footer />
            </StorefrontLayoutWrapper>
            <SitePopup />
            <CookieBanner />
          </MotionProvider>
          </SettingsProvider>
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

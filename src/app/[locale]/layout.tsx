import type { Metadata, Viewport } from "next";
import { SITE_URL } from '@/lib/seo';
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
import GoogleAnalytics from "@/components/providers/GoogleAnalytics";
import { getAnalyticsSettings } from "@/lib/analytics-settings";
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

const siteUrl = SITE_URL;

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

  const title =
    locale === "tr" ? "Cangday | Modern Parfümeri" : "Cangday | Modern Perfumery";
  const description =
    locale === "tr"
      ? "Cangday, günlük kullanım için yüksek kaliteli ve kalıcı parfümler sunan modern bir koku evidir. Türkiye’ye hızlı kargo, dünya çapında gönderim ve 14 gün kolay iade."
      : "Cangday is a modern fragrance house offering high-quality, long-lasting perfumes for everyday wear. Fast shipping across Turkey, worldwide delivery and 14-day easy returns.";

  const { gscVerification } = await getAnalyticsSettings();

  return {
    metadataBase: new URL(siteUrl),
    ...(gscVerification ? { verification: { google: gscVerification } } : {}),
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
    // No canonical/hreflang here on purpose: every page sets its own via
    // localeAlternates() (src/lib/seo.ts). A layout-level canonical is
    // inherited by any page that forgets one, and it pointed at the homepage.
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
  const [rawCategories, settings, theme, analytics] = await Promise.all([
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
          .select('hide_prices, popup_enabled, popup_title, popup_message, popup_button_text, popup_button_link, popup_image_url, popup_show_on, popup_ends_at, popup_show_bar, popup_title_tr, popup_message_tr, popup_button_text_tr, new_badge_days, gift_enabled, gift_threshold')
          .eq('id', 'global')
          .single();
        return data;
      },
      ['layout-settings'],
      // Tagged so saving Settings refreshes it at once (admin/settings/actions.ts).
      { revalidate: 60, tags: ['site-settings'] }
    )(),
    getSiteTheme(),
    getAnalyticsSettings(),
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
  const gift = {
    enabled: settingsData?.gift_enabled ?? true,
    threshold: Number(settingsData?.gift_threshold ?? 750),
  };

  return (
    <html lang={locale}>
      <body className={cn(
        // Sideways overflow is clipped in globals.css (.storefront-body) with a
        // fallback for older iPhones that don't support overflow: clip.
        "storefront-body min-h-screen bg-background font-sans antialiased flex flex-col",
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
              "description": "Cangday is a modern fragrance house offering high-quality, long-lasting perfumes for everyday wear.",
              "slogan": "Wear What Lingers.",
              "logo": `${siteUrl}/images/cangday-logo-pdf.png`,
              "image": `${siteUrl}/images/cangday-logo.png`,
              "areaServed": "TR",
              "knowsAbout": ["Perfume", "Fragrance", "Niche perfume", "Designer perfume", "Eau de parfum"],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": `${siteUrl}/${locale}/contact`,
                "availableLanguage": ["Turkish", "English"],
              },
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
          <SettingsProvider hidePrices={hidePrices} popupSettings={popupSettings} newBadgeDays={newBadgeDays} gift={gift}>
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
            {analytics.gaId && (
              <Suspense fallback={null}>
                <GoogleAnalytics id={analytics.gaId} />
              </Suspense>
            )}
          </MotionProvider>
          </SettingsProvider>
        </NextIntlClientProvider>
        {/* Toasts in the storefront palette: espresso card, ivory text, a
            thin gold edge and gold icon (errors get a soft rose icon). */}
        <Toaster
          position="top-center"
          offset={16}
          mobileOffset={12}
          style={
            {
              '--normal-bg': 'rgb(var(--brand-ink-elevated))',
              '--normal-text': 'rgb(var(--brand-ivory))',
              '--normal-border': 'rgb(var(--brand-ink-line))',
              '--border-radius': '2px',
            } as React.CSSProperties
          }
          toastOptions={{
            classNames: {
              toast:
                'font-sans !gap-3 !px-4 !py-3.5 border-l-2 !border-l-gold shadow-[0_12px_32px_-12px_rgba(13,13,12,0.55)]',
              title: '!text-[13px] !font-medium tracking-wide',
              description: '!text-[12px] !text-ivory/65',
              icon: 'text-gold',
              error: '!border-l-rose-300 [&_[data-icon]]:!text-rose-300',
              actionButton: '!bg-gold !text-ink !rounded-sm !text-[11px] !font-semibold uppercase tracking-widest',
              cancelButton: '!bg-transparent !text-ivory/70',
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

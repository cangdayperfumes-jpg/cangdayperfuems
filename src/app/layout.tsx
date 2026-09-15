import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import "./phone-input.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import ScrollToTop from "@/components/shared/ScrollToTop";
import SitePopup from "@/components/shared/SitePopup";
import CookieBanner from "@/components/shared/CookieBanner";
import TrustBar from "@/components/shared/TrustBar";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { createClient } from "@supabase/supabase-js";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { unstable_cache } from "next/cache";
import StorefrontLayoutWrapper from "@/components/shared/StorefrontLayoutWrapper";

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cangday | Modern Perfumery",
    template: "%s | Cangday",
  },
  description: "Cangday is a modern fragrance house — an edited collection of designer and niche perfumes for everyday wear. Original bottles, worldwide shipping, easy returns.",
  keywords: ["perfume", "fragrance", "eau de parfum", "niche perfume", "designer perfume", "buy perfume online"],
  authors: [{ name: "Cangday" }],
  creator: "Cangday",
  publisher: "Cangday",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Cangday | Modern Perfumery",
    description: "An edited collection of designer and niche perfumes for everyday wear. Original bottles, worldwide shipping, easy returns.",
    url: siteUrl,
    siteName: "Cangday",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Cangday - Modern Perfumery",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cangday | Modern Perfumery",
    description: "An edited collection of designer and niche perfumes for everyday wear. Original bottles, worldwide shipping, easy returns.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Cookie-free client: the storefront layout only reads public data (categories,
  // settings), so it must not pull in next/headers cookies() — doing so opts every
  // route under this layout into fully dynamic (uncached) rendering, overriding each
  // page's own `revalidate`/ISR config. Admin auth is handled separately by
  // proxy.ts, which is scoped to /admin only and is unaffected by this client.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Run both queries in parallel + cache results for 60s
  const [rawCategories, settings] = await Promise.all([
    unstable_cache(
      async () => {
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
        const { data } = await supabase
          .from('system_settings')
          .select('hide_prices, popup_enabled, popup_title, popup_message, popup_button_text, popup_button_link, popup_image_url, popup_show_on')
          .eq('id', 'global')
          .single();
        return data;
      },
      ['layout-settings'],
      { revalidate: 60 }
    )(),
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
      }
    : null;

  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased flex flex-col overflow-x-hidden",
        manrope.variable,
        fraunces.variable
      )}>
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
          color="#C9A24B"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #C9A24B,0 0 5px #C9A24B"
        />
        <SettingsProvider hidePrices={hidePrices} popupSettings={popupSettings}>
          <Suspense fallback={null}>
            <StorefrontLayoutWrapper>
              <TrustBar />
              <Navbar categories={categories || []} />
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
        </SettingsProvider>
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

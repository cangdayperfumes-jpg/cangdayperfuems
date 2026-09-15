import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./phone-input.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import ScrollToTop from "@/components/shared/ScrollToTop";
import SitePopup from "@/components/shared/SitePopup";
import CookieBanner from "@/components/shared/CookieBanner";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { createClient } from "@supabase/supabase-js";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { unstable_cache } from "next/cache";
import StorefrontLayoutWrapper from "@/components/shared/StorefrontLayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.royalperfumes.company";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Royal Perfumes | Wholesale Fragrance Manufacturer, Istanbul",
    template: "%s | Royal Perfumes",
  },
  description: "Royal Perfumes is a wholesale fragrance manufacturer based in Istanbul, Türkiye — 1,300+ fragrance models supplied to businesses in 35+ countries. Manufacturing partner, not a retail storefront.",
  keywords: ["wholesale perfume", "fragrance manufacturer", "perfume supplier", "Istanbul perfume manufacturer", "bulk fragrance", "perfume wholesaler"],
  authors: [{ name: "Royal Perfumes" }],
  creator: "Royal Perfumes",
  publisher: "Royal Perfumes",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Royal Perfumes | Wholesale Fragrance Manufacturer, Istanbul",
    description: "Wholesale fragrance manufacturer based in Istanbul, Türkiye — 1,300+ fragrance models supplied to businesses in 35+ countries.",
    url: siteUrl,
    siteName: "Royal Perfumes",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Royal Perfumes - Wholesale Fragrance Manufacturer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Royal Perfumes | Wholesale Fragrance Manufacturer, Istanbul",
    description: "Wholesale fragrance manufacturer based in Istanbul, Türkiye — 1,300+ fragrance models supplied to businesses in 35+ countries.",
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
        inter.variable,
        playfair.variable
      )}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Royal Perfumes",
              "legalName": "Royal Perfumes",
              "url": "https://www.royalperfumes.company",
              "logo": "https://www.royalperfumes.company/images/royalLogo.png",
              "image": "https://www.royalperfumes.company/images/royalLogo.png",
              "description": "Royal Perfumes is a wholesale fragrance manufacturer based in Istanbul, Türkiye, with 10+ years of manufacturing experience, 1,300+ fragrance models, and wholesale partners across 35+ countries.",
              "slogan": "More Than a Supplier. Your Trusted Fragrance Manufacturing Partner.",
              "telephone": "+905411158571",
              "sameAs": [
                "https://wa.me/905411158571",
                "https://t.me/royalperfumess"
              ],
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Main Street",
                "addressLocality": "Istanbul",
                "addressRegion": "Marmara",
                "postalCode": "34000",
                "addressCountry": "TR"
              }
            })
          }}
        />
        <NextTopLoader
          color="#000000"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #000000,0 0 5px #000000"
        />
        <SettingsProvider hidePrices={hidePrices} popupSettings={popupSettings}>
          <Suspense fallback={null}>
            <StorefrontLayoutWrapper>
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

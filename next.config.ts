import path from "path";
import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  output: "standalone",
  // Pins the workspace root to this project — otherwise Turbopack walks up
  // and can latch onto an unrelated lockfile in a parent directory (e.g. a
  // stray package-lock.json in the user's home folder) and infer the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    loader: 'custom',
    loaderFile: './src/lib/supabase-image-loader.ts',
    // Derived from component `sizes` props and layout breakpoints (not arbitrary).
    // Product cards: 50vw mobile → 25vw desktop; gallery: 100vw → 33vw; thumbs/cart: 40–100px.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [40, 64, 80, 96, 100, 128, 160, 256, 384, 467, 480],
    // 30-day client-side cache — maximises CDN hit rate and reduces storage egress.
    minimumCacheTTL: 2592000,
    // Format hints for tooling; actual WebP negotiation is handled by Supabase transforms.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // Transparently proxy /images/* to Supabase Storage so raw *.supabase.co
    // URLs are never exposed to the browser. Pure server-side rewrite — no
    // redirect, no migration, works for every existing stored image URL.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return [];

    let host: string;
    try {
      host = new URL(supabaseUrl).host;
    } catch {
      return [];
    }

    return [
      {
        source: '/images/render/:path*',
        destination: `https://${host}/storage/v1/render/image/public/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `https://${host}/storage/v1/object/public/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

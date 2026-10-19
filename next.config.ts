import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// upgrade-insecure-requests rewrites every http:// subresource request (CSS, JS
// chunks, ...) to https:// before fetching it. localhost is exempt as an
// inherently trustworthy origin, but a LAN IP (e.g. testing from a phone) is
// not — the dev server has no TLS listener, so those upgraded requests just
// fail silently and the page renders unstyled. Only send it in production,
// where the site is actually served over HTTPS.
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
    ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
`;

const nextConfig: NextConfig = {
  output: "standalone",
  // The orders PDF report reads its fonts and logo from disk at runtime (see
  // src/lib/pdf-brand.ts). Nothing imports them, so tracing must be told to
  // ship them with that route — in the standalone build and on Vercel, where
  // public/ isn't otherwise on the function's filesystem.
  outputFileTracingIncludes: {
    '/admin/orders/export': ['./public/fonts/pdf/*.ttf', './public/images/cangday-logo-pdf.png'],
  },
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
  // /images/[...path] and /images/render/[...path] route handlers replace
  // the plain Supabase rewrite — they add server-side caching (Next's Data
  // Cache) so every visitor's first load of a gallery photo doesn't re-fetch
  // it from Supabase's transform pipeline from scratch.
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

export default withNextIntl(nextConfig);

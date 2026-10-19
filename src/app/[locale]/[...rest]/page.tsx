import { notFound } from 'next/navigation';

// Any /tr/... or /en/... URL that matches no page lands here, so it renders
// the branded [locale]/not-found.tsx (inside the storefront layout) instead
// of Next's bare black default 404 — which is what an unmatched route gets
// when the app has no root layout of its own.
export default function CatchAllNotFound() {
  notFound();
}

/**
 * Whether NEXT_PUBLIC_SUPABASE_URL points at a real project rather than a
 * placeholder. Every public-facing data fetcher checks this before calling
 * Supabase: without it, an unconfigured env still attempts the network
 * request every time, which fails via a slow DNS lookup (getaddrinfo
 * ENOTFOUND) instead of failing fast — multiplied by every parallel query a
 * page fires, that's several seconds of dead time added to every page load.
 * Short-circuiting here goes straight to each caller's existing empty/error
 * fallback, skipping the network round-trip entirely.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  try {
    return new URL(url).hostname !== 'placeholder.supabase.co';
  } catch {
    return false;
  }
}

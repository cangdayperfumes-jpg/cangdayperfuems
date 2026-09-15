// See .env.local — this is the placeholder Supabase URL used before the
// real Cangday project exists. Detecting it lets us skip real network calls
// (which would otherwise fail on DNS lookup) and return empty results instead.
export const PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co'

export function isPlaceholderSupabaseProject() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL === PLACEHOLDER_SUPABASE_URL
}

// A fetch replacement that stands in for the real Supabase project: every
// request resolves instantly with an empty PostgREST-shaped result instead
// of hitting the network and failing with ENOTFOUND.
export const placeholderFetch: typeof fetch = async () =>
  new Response('[]', {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-range': '*/0',
    },
  })

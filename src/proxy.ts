import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Supabase auth is only used by the admin dashboard — every other route is
// public storefront traffic. Only invoking this for /admin avoids a Supabase
// auth round-trip (and the multi-second delay it added) on every visitor's
// first page load.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/admin/:path*'],
}

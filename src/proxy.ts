import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/utils/supabase/middleware'

const handleI18nRouting = createMiddleware(routing)

// Supabase auth is only used by the admin dashboard, which is intentionally
// unprefixed (no /tr or /en) and English-only — everything else is public
// storefront traffic that needs locale detection/redirect instead.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return await updateSession(request)
  }
  return handleI18nRouting(request)
}

export const config = {
  matcher: ['/((?!_next|api|images|.*\\..*).*)'],
}

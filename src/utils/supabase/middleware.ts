import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isPlaceholderSupabaseProject } from './placeholder'

export async function updateSession(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // No real Supabase project configured yet (see .env.local) — let admin
  // routes through unauthenticated so the dashboard can be built without a
  // DB. This re-enables itself automatically once real project values are set.
  if (isAdminRoute && isPlaceholderSupabaseProject()) {
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/reset-password') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected Routes Logic
  if (request.nextUrl.pathname.startsWith('/admin')) {
      // Allow access to login page
      if (request.nextUrl.pathname === '/admin/login') {
          // If already logged in, redirect to dashboard
          if (user) {
              return NextResponse.redirect(new URL('/admin', request.url))
          }
          return response;
      }

      // Allow access to the password-recovery page even when signed out —
      // it authenticates itself client-side from the recovery link's token,
      // which lives in the URL hash and never reaches this server-side check.
      if (request.nextUrl.pathname === '/admin/reset-password') {
          return response;
      }

      // If not logged in, redirect to login
      if (!user) {
          return NextResponse.redirect(new URL('/admin/login', request.url))
      }
  }

  return response
}

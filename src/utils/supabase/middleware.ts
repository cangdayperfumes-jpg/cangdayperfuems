import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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

      // If not logged in, redirect to login
      if (!user) {
          return NextResponse.redirect(new URL('/admin/login', request.url))
      }
  }

  return response
}

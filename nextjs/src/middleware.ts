import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

//novi kod cash&carry

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // Pozovi Supabase updateSession logiku
    const response = await updateSession(request)

    // Ovdje možeš, ako želiš, dodati "auth guard" logiku za zaštićene rute:
    // primjer:
    const url = request.nextUrl
    const isAuthRoute = url.pathname.startsWith('/auth')
    const protectedRoutes = ['/dashboard', '/settings']

    if (
      protectedRoutes.some((route) => url.pathname.startsWith(route)) &&
      !request.cookies.get('sb-access-token') // korisnik nije prijavljen
    ) {
      const redirectUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('[Middleware error]', error)
    return NextResponse.next()
  }
}

// Matcher određuje na koje rute se middleware primjenjuje
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
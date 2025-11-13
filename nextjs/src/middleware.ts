// import { type NextRequest } from 'next/server'
// import { updateSession } from '@/lib/supabase/middleware'

// export async function middleware(request: NextRequest) {
//     return await updateSession(request)
// }

// export const config = {
//     matcher: [
//         '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//     ],
// }

// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // Pozovi Supabase updateSession logiku
    const response = await updateSession(request)

    const url = request.nextUrl
    const hasAuthToken = request.cookies.get('sb-access-token')
    
    // Lista public ruta
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/legal/privacy',
      '/legal/terms'
    ]

    // Preskoči auth provjeru za public rute
    if (publicRoutes.includes(url.pathname)) {
      return response
    }
    
    // Lista zaštićenih ruta
    const protectedRoutes = [
      '/dashboard',
      '/settings', 
      '/profile',
      '/billing',
      '/account'
    ]

    // Auth rute
    const authRoutes = [
      '/auth/login',
      '/auth/register'
    ]

    // Redirect na login ako pokušava pristupiti zaštićenoj ruti bez auth
    if (
      protectedRoutes.some((route) => url.pathname.startsWith(route)) &&
      !hasAuthToken
    ) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', url.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect na dashboard ako je prijavljen i pokušava pristupiti auth rutama
    if (
      authRoutes.some((route) => url.pathname.startsWith(route)) &&
      hasAuthToken
    ) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('[Middleware error]', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
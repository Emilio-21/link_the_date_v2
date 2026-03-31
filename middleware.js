// middleware.js — path-based multi-tenant
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── /u/[tenant]/dashboard → requiere auth ────────────────────────────
  const tenantDashboard = pathname.match(/^\/u\/([^/]+)\/dashboard/)
  if (tenantDashboard) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Verificar que el usuario es dueño de ese tenant
    const tenant = tenantDashboard[1]
    const { data } = await supabase
      .from('tenants')
      .select('owner_id')
      .eq('subdomain', tenant)
      .maybeSingle()

    if (!data || data.owner_id !== user.id) {
      // No es su tenant → redirigir a su propio dashboard
      const { data: myTenant } = await supabase
        .from('tenants')
        .select('subdomain')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (myTenant?.subdomain) {
        return NextResponse.redirect(
          new URL(`/u/${myTenant.subdomain}/dashboard`, request.url)
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // ── /login y /register → redirigir si ya tiene sesión ────────────────
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      // Buscar su tenant y mandarlo directo
      const { data: myTenant } = await supabase
        .from('tenants')
        .select('subdomain')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (myTenant?.subdomain) {
        return NextResponse.redirect(
          new URL(`/u/${myTenant.subdomain}/dashboard`, request.url)
        )
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // ── /dashboard legacy → redirigir a /u/[tenant]/dashboard ────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: myTenant } = await supabase
      .from('tenants')
      .select('subdomain')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (myTenant?.subdomain) {
      return NextResponse.redirect(
        new URL(`/u/${myTenant.subdomain}/dashboard`, request.url)
      )
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
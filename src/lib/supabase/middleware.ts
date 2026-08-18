import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './database.types'
import { createAdminClient } from './admin'
import { ADMIN_2FA_COOKIE_NAME, verify2faSessionTokenEdge } from '../admin/twoFactorToken'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error && data?.user) {
      user = data.user
    }
  } catch {
    user = null
  }

  const pathname = request.nextUrl.pathname

  // Proteção da rota administrativa /admin (retorna 404 se não for admin)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return new NextResponse(null, { status: 404 })
    }

    const adminSupabase = createAdminClient()
    const { data: adminRecord } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminRecord) {
      return new NextResponse(null, { status: 404 })
    }

    // Extrair IP do cliente
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '127.0.0.1'

    // Verificar se a sessão possui 2FA ativo no mesmo IP
    const twoFactorCookie = request.cookies.get(ADMIN_2FA_COOKIE_NAME)?.value
    const is2faValid = await verify2faSessionTokenEdge(twoFactorCookie, adminRecord.id, clientIp)

    // Se estiver na tela de verificação
    if (pathname === '/admin/verificar') {
      if (is2faValid) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      // Se não tiver 2FA ainda, permite acessar a tela de verificação
      return supabaseResponse
    }

    // Para todas as demais páginas de /admin, exige 2FA ativo
    if (!is2faValid) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/verificar'
      return NextResponse.redirect(url)
    }
  }

  // Proteção de rotas do painel / dashboard / perfil
  const isProtectedRoute =
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/servicos') ||
    pathname.startsWith('/agenda') ||
    pathname.startsWith('/clientes')

  const isAuthRoute = pathname === '/login' || pathname === '/cadastro'

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const adminSupabase = createAdminClient()
    const { data: adminRecord } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    const url = request.nextUrl.clone()

    if (adminRecord) {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '127.0.0.1'
      const twoFactorCookie = request.cookies.get(ADMIN_2FA_COOKIE_NAME)?.value
      const is2faValid = await verify2faSessionTokenEdge(twoFactorCookie, adminRecord.id, clientIp)
      url.pathname = is2faValid ? '/admin' : '/admin/verificar'
    } else {
      url.pathname = '/dashboard/geral'
    }

    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

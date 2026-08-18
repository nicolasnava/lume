import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptToken } from '@/lib/google-calendar'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const state = requestUrl.searchParams.get('state')

  const baseUrl = requestUrl.origin || 'http://localhost:3000'
  const cookieStore = await cookies()
  const storedState = cookieStore.get('google_oauth_state')?.value

  // Função helper para montar redirecionamento e garantir invalidação do cookie de state
  const createRedirectWithStateCleanup = (url: string) => {
    const res = NextResponse.redirect(url)
    res.cookies.delete('google_oauth_state')
    return res
  }

  // 1. Validação do parâmetro state contra OAuth CSRF
  if (!state || !storedState || state !== storedState) {
    console.error('[Google OAuth Callback] Falha de validação do state CSRF:', {
      hasReceivedState: Boolean(state),
      hasStoredState: Boolean(storedState),
    })
    return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=error&reason=invalid_state`)
  }

  if (error) {
    console.error('[Google OAuth Callback] Erro retornado pelo Google:', error)
    return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=error&reason=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=error&reason=no_code`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createRedirectWithStateCleanup(`${baseUrl}/login`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('[Google OAuth Callback] Credenciais ausentes no .env')
    return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=error&reason=config_missing`)
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('[Google OAuth Callback] Erro ao trocar código por token:', tokenData)
      return createRedirectWithStateCleanup(
        `${baseUrl}/perfil?google=error&reason=${encodeURIComponent(tokenData.error || 'token_error')}`
      )
    }

    const refreshToken = tokenData.refresh_token

    if (!refreshToken) {
      console.warn(
        '[Google OAuth Callback] Nenhum refresh_token retornado. O consentimento offline pode não ter sido forçado.'
      )
      return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=error&reason=no_refresh_token`)
    }

    const encryptedToken = encryptToken(refreshToken)

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (adminSupabase.from('profissionais') as any)
      .update({ google_calendar_token: encryptedToken })
      .eq('id', user.id)

    if (dbError) {
      console.error('[Google OAuth Callback] Erro ao salvar token no banco:', dbError)
      return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=error&reason=db_error`)
    }

    return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=success`)
  } catch (err) {
    console.error('[Google OAuth Callback] Exceção inesperada:', err)
    return createRedirectWithStateCleanup(`${baseUrl}/perfil?google=error&reason=exception`)
  }
}

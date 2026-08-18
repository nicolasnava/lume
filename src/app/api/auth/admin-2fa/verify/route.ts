import { NextResponse } from 'next/server'
import { verifyAdminLinkToken } from '@/lib/admin/twoFactor'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const baseUrl = requestUrl.origin || 'http://localhost:3000'

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/admin/verificar?error=no_token`)
  }

  const result = await verifyAdminLinkToken(token)

  if (!result.success) {
    return NextResponse.redirect(
      `${baseUrl}/admin/verificar?error=${encodeURIComponent(result.message || 'invalid_link')}`
    )
  }

  return NextResponse.redirect(`${baseUrl}/admin?verified=1click`)
}

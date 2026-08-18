import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_2FA_COOKIE_NAME } from '@/lib/admin/twoFactor'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const url = new URL('/login', request.url)
  const response = NextResponse.redirect(url, { status: 303 })
  response.cookies.delete(ADMIN_2FA_COOKIE_NAME)
  return response
}

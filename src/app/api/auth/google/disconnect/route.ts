import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const baseUrl = requestUrl.origin || 'http://localhost:3000'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase.from('profissionais') as any)
    .update({ google_calendar_token: null })
    .eq('id', user.id)

  return NextResponse.redirect(`${baseUrl}/perfil?google=disconnected`)
}

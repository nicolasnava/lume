import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { isAdmin2faVerified } from '@/lib/admin/twoFactor'
import Admin2faVerifyClient from '@/components/admin/Admin2faVerifyClient'
import { Loader2 } from 'lucide-react'

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'seu e-mail'
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
}

export const dynamic = 'force-dynamic'

export default async function AdminVerificarPage() {
  // Confirmar se o usuário é admin (sem exigir 2FA prévio)
  const admin = await getAuthenticatedAdmin(false)

  if (!admin) {
    notFound()
  }

  // Se já tiver verificado 2FA nesta sessão, vai direto para o admin
  const is2faActive = await isAdmin2faVerified(admin.id)
  if (is2faActive) {
    redirect('/admin')
  }

  const maskedEmail = maskEmail(admin.email)

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8C5383]" />
        </div>
      }
    >
      <Admin2faVerifyClient maskedEmail={maskedEmail} />
    </Suspense>
  )
}


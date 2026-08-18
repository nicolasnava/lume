'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateAndSendAdminOtp,
  verifyAdminOtp,
  isAdmin2faVerified,
} from '@/lib/admin/twoFactor'

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'seu e-mail'
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
}

/**
 * Avalia o perfil pós-login para definir o destino correto e acionar 2FA se for admin
 */
export async function getPostLoginRedirectAction(): Promise<{
  isAdmin: boolean
  needs2fa: boolean
  redirectUrl: string
  maskedEmail?: string
  message?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { isAdmin: false, needs2fa: false, redirectUrl: '/login' }
    }

    const adminSupabase = createAdminClient()
    const { data: adminRecord } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // Se o usuário NÃO for admin, segue fluxo normal da profissional
    if (!adminRecord) {
      return { isAdmin: false, needs2fa: false, redirectUrl: '/dashboard/geral' }
    }

    // Usuário é ADMIN: verificar se a sessão já possui 2FA ativo
    const is2faActive = await isAdmin2faVerified(adminRecord.id)

    if (is2faActive) {
      return { isAdmin: true, needs2fa: false, redirectUrl: '/admin' }
    }

    // Se não tiver 2FA ativo, dispara o código por e-mail e redireciona para verificação
    const sendResult = await generateAndSendAdminOtp(
      adminRecord.id,
      adminRecord.email || user.email!,
      adminRecord.nome
    )

    return {
      isAdmin: true,
      needs2fa: true,
      redirectUrl: '/admin/verificar',
      maskedEmail: maskEmail(adminRecord.email || user.email!),
      message: sendResult.message,
    }
  } catch (err) {
    console.error('[getPostLoginRedirectAction] Erro:', err)
    return { isAdmin: false, needs2fa: false, redirectUrl: '/dashboard/geral' }
  }
}

/**
 * Reenvia o código OTP de 2FA para o e-mail do admin logado
 */
export async function resendAdmin2faOtpAction(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const adminSupabase = createAdminClient()
    const { data: adminRecord } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminRecord) {
      return { success: false, message: 'Acesso restrito a administradores.' }
    }

    const sendResult = await generateAndSendAdminOtp(
      adminRecord.id,
      adminRecord.email || user.email!,
      adminRecord.nome
    )

    if (!sendResult.success) {
      return {
        success: false,
        message: sendResult.message || 'Erro ao reenviar código de segurança.',
      }
    }

    return {
      success: true,
      message: `Novo código enviado com sucesso para ${maskEmail(adminRecord.email || user.email!)}.`,
    }
  } catch (err) {
    console.error('[resendAdmin2faOtpAction] Erro:', err)
    return { success: false, message: 'Erro inesperado ao solicitar novo código.' }
  }
}

/**
 * Submete e valida o código de 6 dígitos inserido pelo admin
 */
export async function verifyAdmin2faAction(code: string): Promise<{
  success: boolean
  message?: string
  redirectUrl?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' }
    }

    const adminSupabase = createAdminClient()
    const { data: adminRecord } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminRecord) {
      return { success: false, message: 'Acesso não autorizado.' }
    }

    const verifyResult = await verifyAdminOtp(
      adminRecord.id,
      adminRecord.email || user.email!,
      code
    )

    if (!verifyResult.success) {
      return { success: false, message: verifyResult.message }
    }

    return {
      success: true,
      message: 'Autenticação de dois fatores confirmada com sucesso!',
      redirectUrl: '/admin',
    }
  } catch (err) {
    console.error('[verifyAdmin2faAction] Erro:', err)
    return { success: false, message: 'Erro inesperado ao validar código.' }
  }
}

/**
 * Obtém informações da sessão de 2FA para exibição na tela /admin/verificar
 */
export async function getAdmin2faVerificationInfoAction(): Promise<{
  isAdmin: boolean
  isVerified: boolean
  maskedEmail?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { isAdmin: false, isVerified: false }
    }

    const adminSupabase = createAdminClient()
    const { data: adminRecord } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminRecord) {
      return { isAdmin: false, isVerified: false }
    }

    const isVerified = await isAdmin2faVerified(adminRecord.id)

    return {
      isAdmin: true,
      isVerified,
      maskedEmail: maskEmail(adminRecord.email || user.email!),
    }
  } catch {
    return { isAdmin: false, isVerified: false }
  }
}

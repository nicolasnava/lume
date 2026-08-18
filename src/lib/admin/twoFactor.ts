import crypto from 'crypto'
import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

import {
  ADMIN_2FA_COOKIE_NAME,
  SESSION_EXPIRATION_HOURS,
  create2faSessionToken,
  verify2faSessionTokenEdge,
  normalizeIp,
} from './twoFactorToken'

export { ADMIN_2FA_COOKIE_NAME, SESSION_EXPIRATION_HOURS }
const OTP_EXPIRATION_MINUTES = 10
const MAX_REQUESTS_PER_WINDOW = 3
const RATE_LIMIT_WINDOW_MINUTES = 15

async function getClientIp(): Promise<string> {
  try {
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || '127.0.0.1'
    return normalizeIp(ip)
  } catch {
    return '127.0.0.1'
  }
}

// Segredo para hash de OTP e Token de Link
function get2faSigningSecret(): string {
  const secret = process.env.ADMIN_2FA_SECRET
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      '[CRITICAL_SECURITY_CONFIG] ADMIN_2FA_SECRET não está configurado ou é muito curto no ambiente (.env.local). Defina uma chave de pelo menos 32 caracteres.'
    )
  }
  return secret
}

/**
 * Gera o hash SHA-256 do código OTP de 6 dígitos
 */
export function hashOtpCode(code: string): string {
  const secret = get2faSigningSecret()
  return crypto.createHmac('sha256', secret).update(code.trim()).digest('hex')
}

/**
 * Gera o hash SHA-256 do token de link de 1 clique
 */
export function hashTokenLink(token: string): string {
  const secret = get2faSigningSecret()
  return crypto.createHmac('sha256', secret).update(token.trim()).digest('hex')
}

/**
 * Envia o código 2FA e link de 1 clique por e-mail utilizando a API REST do EmailJS no servidor
 */
export async function sendEmailJsOtp({
  toEmail,
  toName,
  codigo,
  linkVerificacao,
}: {
  toEmail: string
  toName: string
  codigo: string
  linkVerificacao: string
}): Promise<{ success: boolean; message?: string }> {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const privateKey = process.env.EMAILJS_PRIVATE_KEY
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || ''

  // Validação estrita das credenciais
  if (!serviceId || !templateId || !privateKey) {
    console.warn(
      '[2FA EmailJS] Variáveis de ambiente do EmailJS ausentes no servidor (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PRIVATE_KEY).'
    )
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[2FA DEV MODE] Código de verificação para ${toEmail}: >>> ${codigo} <<< | Link de 1 clique: ${linkVerificacao}`
      )
      return { success: true }
    }
    return {
      success: false,
      message: 'Configuração do serviço de e-mail (EmailJS) ausente no servidor de produção.',
    }
  }

  try {
    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey || undefined,
      accessToken: privateKey,
      template_params: {
        to_email: toEmail,
        codigo: codigo,
        link_verificacao: linkVerificacao,
        code: codigo,
        passcode: codigo,
        to_name: toName || 'Administrador',
        expires_in: `${OTP_EXPIRATION_MINUTES} minutos`,
      },
    }

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[2FA EmailJS] Falha no disparo do e-mail:', res.status, errorText)

      if (errorText.includes('non-browser') || res.status === 403) {
        console.warn(
          '[EmailJS Config] Para permitir disparos pelo servidor, ative a opção "Allow EmailJS API for non-browser applications" em https://dashboard.emailjs.com/admin/account/security'
        )
      }

      if (process.env.NODE_ENV !== 'production') {
        console.info(
          `[2FA DEV MODE - FALLBACK] Código de verificação para ${toEmail}: >>> ${codigo} <<< | Link de 1 clique: ${linkVerificacao}`
        )
      }

      return {
        success: false,
        message: errorText.includes('non-browser')
          ? 'EmailJS bloqueou o envio pelo servidor. Ative "Allow EmailJS API for non-browser applications" no painel do EmailJS (Account > Security).'
          : `Falha no envio do e-mail de verificação (${res.status}).`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[2FA EmailJS] Exceção inesperada ao disparar e-mail:', error)
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[2FA DEV MODE - FALLBACK] Código de verificação para ${toEmail}: >>> ${codigo} <<< | Link de 1 clique: ${linkVerificacao}`
      )
    }
    return {
      success: false,
      message: 'Erro de conexão ao enviar o código de verificação.',
    }
  }
}

/**
 * Gera e envia um novo código OTP e link de 1 clique para a conta de administrador
 */
export async function generateAndSendAdminOtp(
  adminId: string,
  email: string,
  name: string
): Promise<{ success: boolean; message?: string }> {
  const adminSupabase = createAdminClient()

  // 1. Rate Limiting: Máximo de 3 solicitações por 15 minutos
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()
  const { data: recentRequests, error: countError } = await adminSupabase
    .from('admin_otp_codes')
    .select('id')
    .eq('admin_id', adminId)
    .gte('created_at', windowStart)

  if (!countError && recentRequests && recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      success: false,
      message: `Limite de tentativas atingido. Por favor, aguarde ${RATE_LIMIT_WINDOW_MINUTES} minutos antes de solicitar um novo código.`,
    }
  }

  // 2. Gerar código numérico de 6 dígitos e token de 1 clique de 32 bytes
  const codigo = crypto.randomInt(100000, 999999).toString()
  const tokenLink = crypto.randomBytes(32).toString('hex')

  const codeHash = hashOtpCode(codigo)
  const tokenLinkHash = hashTokenLink(tokenLink)
  const expiraEm = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000).toISOString()

  // 3. Montar link de verificação de 1 clique
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const linkVerificacao = `${siteUrl}/api/auth/admin-2fa/verify?token=${tokenLink}`

  // 4. Inserir no banco
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (adminSupabase.from('admin_otp_codes') as any).insert([
    {
      admin_id: adminId,
      codigo_hash: codeHash,
      token_link_hash: tokenLinkHash,
      expira_em: expiraEm,
      usado: false,
    },
  ])

  if (insertError) {
    console.error('[2FA] Erro ao gravar código OTP:', insertError)
    return {
      success: false,
      message: 'Não foi possível registrar o código de segurança no momento.',
    }
  }

  // 5. Enviar por e-mail via EmailJS
  const emailResult = await sendEmailJsOtp({
    toEmail: email,
    toName: name,
    codigo,
    linkVerificacao,
  })

  if (!emailResult.success) {
    return emailResult
  }

  return { success: true }
}

/**
 * Valida o código OTP submetido e gera o cookie de sessão 2FA vinculado ao IP do dispositivo
 */
export async function verifyAdminOtp(
  adminId: string,
  email: string,
  inputCode: string
): Promise<{ success: boolean; message?: string }> {
  if (!inputCode || inputCode.trim().length !== 6) {
    return { success: false, message: 'O código deve conter exatamente 6 dígitos.' }
  }

  const codeHash = hashOtpCode(inputCode.trim())
  const adminSupabase = createAdminClient()
  const nowIso = new Date().toISOString()

  // Buscar código válido, não usado e não expirado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: validOtp, error: searchError } = await (adminSupabase.from('admin_otp_codes') as any)
    .select('id')
    .eq('admin_id', adminId)
    .eq('codigo_hash', codeHash)
    .eq('usado', false)
    .gt('expira_em', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (searchError || !validOtp) {
    return {
      success: false,
      message: 'Código incorreto ou expirado. Verifique os números ou solicite um novo código.',
    }
  }

  // Marcar código como usado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase.from('admin_otp_codes') as any)
    .update({ usado: true })
    .eq('id', validOtp.id)

  // Obter IP do dispositivo atual
  const clientIp = await getClientIp()

  // Criar token de sessão vinculado ao IP e gravar cookie
  const sessionToken = await create2faSessionToken(adminId, email, clientIp)
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_2FA_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRATION_HOURS * 60 * 60, // 12 horas
  })

  return { success: true }
}

/**
 * Valida o link de verificação de 1 clique e gera o cookie de sessão 2FA vinculado ao IP do dispositivo
 */
export async function verifyAdminLinkToken(
  tokenLink: string
): Promise<{ success: boolean; adminId?: string; message?: string }> {
  if (!tokenLink || tokenLink.trim().length < 16) {
    return { success: false, message: 'Link de verificação inválido.' }
  }

  const tokenLinkHash = hashTokenLink(tokenLink.trim())
  const adminSupabase = createAdminClient()
  const nowIso = new Date().toISOString()

  // Buscar registro correspondente válido, não usado e não expirado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: validRecord, error: searchError } = await (adminSupabase.from('admin_otp_codes') as any)
    .select('id, admin_id')
    .eq('token_link_hash', tokenLinkHash)
    .eq('usado', false)
    .gt('expira_em', nowIso)
    .limit(1)
    .maybeSingle()

  if (searchError || !validRecord) {
    return {
      success: false,
      message: 'Link de verificação expirado ou já utilizado.',
    }
  }

  // Buscar email do admin para gerar a sessão
  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('email')
    .eq('id', validRecord.admin_id)
    .single()

  if (!adminUser) {
    return { success: false, message: 'Administrador não encontrado.' }
  }

  // Marcar como usado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase.from('admin_otp_codes') as any)
    .update({ usado: true })
    .eq('id', validRecord.id)

  // Obter IP do dispositivo atual
  const clientIp = await getClientIp()

  // Criar token de sessão e gravar cookie
  const sessionToken = await create2faSessionToken(validRecord.admin_id, adminUser.email, clientIp)
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_2FA_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRATION_HOURS * 60 * 60, // 12 horas
  })

  return { success: true, adminId: validRecord.admin_id }
}

/**
 * Verifica se a sessão atual do admin possui 2FA verificado no IP atual
 */
export async function isAdmin2faVerified(adminId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_2FA_COOKIE_NAME)?.value
  const clientIp = await getClientIp()
  return verify2faSessionTokenEdge(token, adminId, clientIp)
}

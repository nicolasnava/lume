export const ADMIN_2FA_COOKIE_NAME = 'lume_admin_2fa'
export const SESSION_EXPIRATION_HOURS = 12

// Função auxiliar para base64url compatível com Edge e Node
function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64url')
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64url').toString('utf8')
  }
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

function getSecret(): string {
  const secret = process.env.ADMIN_2FA_SECRET
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      '[CRITICAL_SECURITY_CONFIG] ADMIN_2FA_SECRET não está configurado ou é muito curto no ambiente (.env.local). Defina uma chave de pelo menos 32 caracteres.'
    )
  }
  return secret
}

// Normaliza o IP do cliente para comparação confiável
export function normalizeIp(ip?: string | null): string {
  if (!ip) return ''
  const clean = ip.split(',')[0].trim()
  if (clean === '::1' || clean === '::ffff:127.0.0.1' || clean === 'localhost') {
    return '127.0.0.1'
  }
  return clean
}

// Cria assinatura HMAC-SHA256 usando Web Crypto API (suportada em Edge e Node)
async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(signatureBuffer))
  const binaryString = hashArray.map((byte) => String.fromCharCode(byte)).join('')
  return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Cria um token assinado de sessão 2FA vinculado ao IP do dispositivo (válido por 12 horas)
 */
export async function create2faSessionToken(
  adminId: string,
  email: string,
  clientIp?: string
): Promise<string> {
  const secret = getSecret()
  const payload = JSON.stringify({
    adminId,
    email,
    ip: normalizeIp(clientIp),
    exp: Date.now() + SESSION_EXPIRATION_HOURS * 60 * 60 * 1000,
  })
  const encodedPayload = base64UrlEncode(payload)
  const signature = await createHmacSignature(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

/**
 * Valida o token de sessão 2FA e confirma a vinculação estrita com o IP do cliente
 */
export async function verify2faSessionTokenEdge(
  token: string | undefined | null,
  expectedAdminId: string,
  currentClientIp?: string
): Promise<boolean> {
  if (!token || !token.includes('.')) return false

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  try {
    const secret = getSecret()
    const expectedSignature = await createHmacSignature(encodedPayload, secret)

    if (signature !== expectedSignature) return false

    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload.adminId || !payload.exp) return false
    if (payload.adminId !== expectedAdminId) return false
    if (Date.now() > payload.exp) return false

    // Validação estrita por IP do dispositivo
    if (payload.ip && currentClientIp) {
      const savedIp = normalizeIp(payload.ip)
      const currentIp = normalizeIp(currentClientIp)
      if (savedIp && currentIp && savedIp !== currentIp) {
        console.warn(`[2FA Security] Sessão bloqueada por divergência de IP: salvo=${savedIp}, atual=${currentIp}`)
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

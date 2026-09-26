import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export interface RateLimitOptions {
  chave: string
  acao: string
  limit: number
  windowSeconds?: number
  windowMinutes?: number
  failClosed?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  temporaryFailure?: boolean
  currentCount: number
  limit: number
  remaining: number
  resetInSeconds: number
}

/**
 * Obtém o IP do cliente de forma segura no servidor Next.js
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers()
    const vercelIp = h.get('x-vercel-forwarded-for')?.split(',')[0].trim()
    if (vercelIp && isIP(vercelIp)) return vercelIp

    const realIp = h.get('x-real-ip')?.trim()
    if (realIp && isIP(realIp)) return realIp

    const forwarded = h.get('x-forwarded-for')
    if (forwarded) {
      const forwardedIp = forwarded.split(',')[0].trim()
      if (isIP(forwardedIp)) return forwardedIp
    }
    return '127.0.0.1'
  } catch {
    return '127.0.0.1'
  }
}

/** HMAC keeps raw IP addresses out of the persistent attempt log. */
export function hashRateLimitSubject(subject: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Rate limiting requires the server-side Supabase secret.')
  return createHmac('sha256', secret).update(subject.trim().toLowerCase()).digest('hex')
}

/**
 * Rate Limiter persistente baseado no PostgreSQL.
 * Funciona de forma consistente e segura em arquitetura serverless (Vercel) e instâncias distribuídas.
 */
export async function checkRateLimitDb({
  chave,
  acao,
  limit,
  windowSeconds,
  windowMinutes = 1,
  failClosed = false,
}: RateLimitOptions): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.floor(windowSeconds ?? windowMinutes * 60))

  try {
    const adminSupabase = createAdminClient()

    // RPC mantém a checagem e a gravação na mesma transação e serializa a chave.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase as any).rpc('consume_rate_limit', {
      p_chave: chave,
      p_acao: acao,
      p_limit: limit,
      p_window_seconds: windowSec,
    })

    if (error || !data?.[0]) {
      console.warn('[RateLimitDb] Não foi possível executar o rate limit atômico:', error?.message || 'Resposta vazia')
      return {
        allowed: !failClosed,
        temporaryFailure: failClosed,
        currentCount: 1,
        limit,
        remaining: failClosed ? 0 : limit - 1,
        resetInSeconds: windowSec,
      }
    }

    const { allowed, current_count: currentCount, retry_after_seconds: retryAfter } = data[0] as {
      allowed: boolean
      current_count: number
      retry_after_seconds: number
    }

    if (!allowed) {
      return {
        allowed: false,
        currentCount,
        limit,
        remaining: 0,
        resetInSeconds: retryAfter,
      }
    }

    return {
      allowed: true,
      currentCount,
      limit,
      remaining: Math.max(0, limit - currentCount),
      resetInSeconds: windowSec,
    }
  } catch (err) {
    console.error('[RateLimitDb] Exceção inesperada no rate limiting:', err)
    return {
      allowed: !failClosed,
      temporaryFailure: failClosed,
      currentCount: 1,
      limit,
      remaining: failClosed ? 0 : limit - 1,
      resetInSeconds: windowSec,
    }
  }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export interface RateLimitOptions {
  chave: string
  acao: string
  limit: number
  windowSeconds?: number
  windowMinutes?: number
}

export interface RateLimitResult {
  allowed: boolean
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
    const forwarded = h.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    const realIp = h.get('x-real-ip')
    if (realIp) {
      return realIp.trim()
    }
    return '127.0.0.1'
  } catch {
    return '127.0.0.1'
  }
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
}: RateLimitOptions): Promise<RateLimitResult> {
  const windowSec = windowSeconds ?? windowMinutes * 60
  const now = Date.now()
  const windowStartIso = new Date(now - windowSec * 1000).toISOString()

  try {
    const adminSupabase = createAdminClient()

    // 1. Contar tentativas dentro da janela de tempo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentLogs, error: countError } = await (adminSupabase.from('rate_limit_log') as any)
      .select('id')
      .eq('chave', chave)
      .eq('acao', acao)
      .gte('created_at', windowStartIso)

    if (countError) {
      console.warn('[RateLimitDb] Erro ao consultar rate_limit_log (tabela pode estar pendente de migration):', countError.message)
      return {
        allowed: true,
        currentCount: 1,
        limit,
        remaining: limit - 1,
        resetInSeconds: windowSec,
      }
    }

    const currentCount = recentLogs ? recentLogs.length : 0

    // 2. Registrar a tentativa atual no banco (mesmo se bloqueada ou permitida)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase.from('rate_limit_log') as any).insert([
      {
        chave,
        acao,
      },
    ])

    if (currentCount >= limit) {
      return {
        allowed: false,
        currentCount: currentCount + 1,
        limit,
        remaining: 0,
        resetInSeconds: windowSec,
      }
    }

    return {
      allowed: true,
      currentCount: currentCount + 1,
      limit,
      remaining: Math.max(0, limit - (currentCount + 1)),
      resetInSeconds: windowSec,
    }
  } catch (err) {
    console.error('[RateLimitDb] Exceção inesperada no rate limiting:', err)
    return {
      allowed: true,
      currentCount: 1,
      limit,
      remaining: limit - 1,
      resetInSeconds: windowSec,
    }
  }
}

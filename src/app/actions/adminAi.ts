'use server'

import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { getAggregatedAdminContext, AggregatedAdminContext } from '@/lib/admin/aiContext'
import {
  generateAdminInsight,
  chatWithAdminAssistant,
  ChatMessageItem,
} from '@/lib/admin/geminiClient'

import { checkRateLimitDb } from '@/lib/rateLimit'

const MAX_MESSAGES_PER_HOUR = 20

/**
 * Server Action: Gera o insight consultivo inicial para exibição no /admin
 */
export async function getAdminAiInsightAction(): Promise<{
  insight: string
  context: AggregatedAdminContext
  error?: string
}> {
  const admin = await getAuthenticatedAdmin(true)
  if (!admin) {
    throw new Error('Acesso não autorizado ao assistente do painel administrativo.')
  }

  const context = await getAggregatedAdminContext()
  const result = await generateAdminInsight(context)

  return {
    insight: result.insight,
    context,
    error: result.error,
  }
}

/**
 * Server Action: Envia mensagem no chat consultivo de IA
 */
export async function sendAdminAiChatMessageAction(
  history: ChatMessageItem[],
  newMessage: string
): Promise<{
  reply: string
  remainingMessages: number
  error?: string
}> {
  const admin = await getAuthenticatedAdmin(true)
  if (!admin) {
    return {
      reply: 'Sessão administrativa expirada ou não autorizada.',
      remainingMessages: 0,
      error: 'unauthorized',
    }
  }

  if (!newMessage || !newMessage.trim()) {
    return {
      reply: 'Por favor, digite uma pergunta para a análise.',
      remainingMessages: 20,
    }
  }

  // Rate Limiting persistente no PostgreSQL (máx. 20 mensagens por hora por admin)
  const rate = await checkRateLimitDb({
    chave: `admin_ai_chat_${admin.id}`,
    acao: 'chat_ia',
    limit: MAX_MESSAGES_PER_HOUR,
    windowMinutes: 60,
  })

  if (!rate.allowed) {
    return {
      reply:
        'Você atingiu o limite de 20 perguntas por hora para o assistente de IA. Por favor, aguarde alguns minutos para enviar novas mensagens.',
      remainingMessages: 0,
      error: 'rate_limit_exceeded',
    }
  }

  try {
    const context = await getAggregatedAdminContext()
    const fullHistory: ChatMessageItem[] = [
      ...history.slice(-10), // Manter as últimas 10 mensagens para contexto de diálogo
      { role: 'user', content: newMessage.trim() },
    ]

    const res = await chatWithAdminAssistant({
      messages: fullHistory,
      context,
    })

    return {
      reply: res.response,
      remainingMessages: rate.remaining,
      error: res.error,
    }
  } catch (err) {
    console.error('[sendAdminAiChatMessageAction] Erro inesperado:', err)
    return {
      reply: 'Ocorreu um erro interno ao processar a resposta da IA. Tente novamente.',
      remainingMessages: rate.remaining,
      error: 'internal_error',
    }
  }
}

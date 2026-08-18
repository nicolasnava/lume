'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { avaliacaoSchema } from '@/lib/validations'
import { checkRateLimitDb, getClientIp } from '@/lib/rateLimit'
import { revalidatePath } from 'next/cache'

export const AVALIACAO_EXPIRACAO_DIAS = 60

export interface SubmitAvaliacaoInput {
  agendamentoId: string
  nota: number
  comentario?: string | null
}

export async function submitAvaliacaoAction(data: SubmitAvaliacaoInput) {
  try {
    // 1. Validação Zod
    const validation = avaliacaoSchema.safeParse(data)
    if (!validation.success) {
      const errorMsg = validation.error.errors.map((e) => e.message).join(', ')
      return { success: false, message: `Erro de validação: ${errorMsg}` }
    }

    const { agendamentoId, nota, comentario } = validation.data

    // Rate Limiting persistente no PostgreSQL (máx. 5 tentativas por minuto por IP/agendamento)
    const clientIp = await getClientIp()
    const rateKey = `submit_review_${agendamentoId}_${clientIp}`
    const rl = await checkRateLimitDb({
      chave: rateKey,
      acao: 'enviar_avaliacao',
      limit: 5,
      windowMinutes: 1,
    })

    if (!rl.allowed) {
      return {
        success: false,
        message: 'Muitas tentativas de avaliação em sequência. Por favor, aguarde 1 minuto antes de tentar novamente.',
      }
    }

    const adminSupabase = createAdminClient()

    // 2. Buscar agendamento e verificar se existe, se está concluído e se não está expirado
    const { data: agendamento, error: agendamentoError } = await adminSupabase
      .from('agendamentos')
      .select('id, profissional_id, status, data_hora_fim, data_hora_inicio')
      .eq('id', agendamentoId)
      .maybeSingle()

    if (agendamentoError || !agendamento) {
      return { success: false, message: 'Agendamento não encontrado.' }
    }

    if (agendamento.status !== 'concluido') {
      return {
        success: false,
        message: 'Apenas agendamentos concluídos podem ser avaliados.',
      }
    }

    // Validação de expiração (60 dias após a conclusão do serviço)
    const dataFimMs = new Date(agendamento.data_hora_fim || agendamento.data_hora_inicio).getTime()
    if (Date.now() - dataFimMs > AVALIACAO_EXPIRACAO_DIAS * 24 * 60 * 60 * 1000) {
      return {
        success: false,
        message: 'O prazo para avaliar este atendimento expirou (limite de 60 dias após o serviço).',
      }
    }

    // 3. Verificar se já existe uma avaliação registrada para este agendamento
    const { data: existingAvaliacao } = await adminSupabase
      .from('avaliacoes')
      .select('id')
      .eq('agendamento_id', agendamentoId)
      .maybeSingle()

    if (existingAvaliacao) {
      return {
        success: false,
        message: 'Este agendamento já foi avaliado anteriormente.',
      }
    }

    // 4. Inserir a nova avaliação no banco
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (adminSupabase.from('avaliacoes') as any).insert([
      {
        agendamento_id: agendamentoId,
        profissional_id: agendamento.profissional_id,
        nota,
        comentario: comentario || null,
      },
    ])

    if (insertError) {
      console.error('[submitAvaliacaoAction] Erro ao inserir avaliação:', insertError)
      return { success: false, message: 'Não foi possível registrar a avaliação no momento. Tente novamente mais tarde.' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/avaliacoes')
    revalidatePath('/p/[slug]', 'page')

    return { success: true, message: 'Avaliação enviada com sucesso! Obrigado pelo seu feedback.' }
  } catch (error: unknown) {
    console.error('[submitAvaliacaoAction] Exceção inesperada:', error)
    return {
      success: false,
      message: 'Ocorreu um erro ao enviar sua avaliação. Tente novamente mais tarde.',
    }
  }
}

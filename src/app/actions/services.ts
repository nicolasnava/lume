'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { servicoSchema } from '@/lib/validations'
import { getOrCreateProfissional } from '@/lib/profissionais/getOrCreateProfissional'
import { revalidatePath } from 'next/cache'

export interface ServiceFormData {
  nome: string
  descricao?: string | null
  duracao_minutos: number
  preco: number
  foto_url?: string | null
  intervalo_manutencao_dias?: number | null
}

export async function createServiceAction(formData: ServiceFormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    // 1. Validação de formato via Zod
    const validation = servicoSchema.safeParse(formData)
    if (!validation.success) {
      const errorMsg = validation.error.errors.map((e) => e.message).join(', ')
      return { success: false, message: `Erro de validação: ${errorMsg}` }
    }

    const validData = validation.data

    // 2. Garantir existência prévia do perfil profissional (evita erro FK no Supabase)
    const profissional = await getOrCreateProfissional(user.id, user.user_metadata?.nome)
    if (!profissional) {
      return {
        success: false,
        message: 'Erro de perfil: Não foi possível obter ou criar seu registro de profissional.',
      }
    }

    const adminSupabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('servicos') as any).insert([
      {
        profissional_id: user.id,
        nome: validData.nome,
        descricao: validData.descricao || null,
        duracao_minutos: Number(validData.duracao_minutos),
        preco: Number(validData.preco),
        foto_url: validData.foto_url || null,
        intervalo_manutencao_dias: validData.intervalo_manutencao_dias
          ? Number(validData.intervalo_manutencao_dias)
          : null,
        ativo: true,
      },
    ])

    if (error) {
      throw error
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')
    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao criar serviço:', error)
    
    const err = error as { code?: string; message?: string; details?: string; hint?: string }

    // Classificação de erros para respostas amigáveis sem vazamento de detalhes técnicos
    let message = 'Não foi possível salvar o serviço. Tente novamente em instantes.'
    if (err?.code === '42501' || err?.message?.includes('permission') || err?.message?.includes('policy')) {
      message = 'Você não tem permissão para cadastrar serviços.'
    } else if (err?.code === '23503' || err?.message?.includes('foreign key')) {
      message = 'Perfil profissional não encontrado.'
    }

    return {
      success: false,
      message,
    }
  }
}

export async function updateServiceAction(serviceId: string, formData: ServiceFormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    // 1. Validação de formato via Zod
    const validation = servicoSchema.safeParse(formData)
    if (!validation.success) {
      const errorMsg = validation.error.errors.map((e) => e.message).join(', ')
      return { success: false, message: `Erro de validação: ${errorMsg}` }
    }

    const validData = validation.data

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('servicos') as any)
      .update({
        nome: validData.nome,
        descricao: validData.descricao || null,
        duracao_minutos: Number(validData.duracao_minutos),
        preco: Number(validData.preco),
        foto_url: validData.foto_url || null,
        intervalo_manutencao_dias: validData.intervalo_manutencao_dias
          ? Number(validData.intervalo_manutencao_dias)
          : null,
      })
      .eq('id', serviceId)
      .eq('profissional_id', user.id)

    if (error) {
      throw error
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')
    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao atualizar serviço:', error)
    
    const err = error as { code?: string; message?: string; details?: string; hint?: string }

    let message = 'Não foi possível atualizar o serviço. Tente novamente em instantes.'
    if (err?.code === '42501' || err?.message?.includes('permission') || err?.message?.includes('policy')) {
      message = 'Você não tem permissão para alterar este serviço.'
    }

    return {
      success: false,
      message,
    }
  }
}

export async function deleteServiceAction(serviceId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const adminSupabase = createAdminClient()

    const { data: service } = await adminSupabase
      .from('servicos')
      .select('id')
      .eq('id', serviceId)
      .eq('profissional_id', user.id)
      .maybeSingle()

    if (!service) return { success: false, message: 'Serviço não encontrado.' }

    // Histórico de serviços pode estar no campo legado ou na tabela de detalhes (multi-serviço/pacote).
    const { data: legacyBookings, error: legacyError } = await adminSupabase
      .from('agendamentos')
      .select('id')
      .eq('servico_id', serviceId)
      .eq('profissional_id', user.id)

    if (legacyError) throw legacyError

    const { data: detailRows, error: detailError } = await adminSupabase
      .from('agendamento_servicos')
      .select('agendamento_id')
      .eq('servico_id', serviceId)

    if (detailError) throw detailError

    const candidateBookingIds = [...new Set([
      ...(legacyBookings || []).map((booking) => booking.id),
      ...(detailRows || []).map((row) => row.agendamento_id),
    ])]
    const { data: relatedBookings, error: relatedBookingsError } = candidateBookingIds.length > 0
      ? await adminSupabase.from('agendamentos')
        .select('id, status, data_hora_inicio')
        .eq('profissional_id', user.id)
        .in('id', candidateBookingIds)
      : { data: [], error: null }

    if (relatedBookingsError) throw relatedBookingsError
    const hasBookings = (relatedBookings || []).length > 0

    if (hasBookings) {
      // Serviços com atendimentos em aberto permanecem apenas desativados até a conclusão.
      const nowIso = new Date().toISOString()
      const pending = (relatedBookings || []).filter((booking) =>
        booking.status === 'confirmado' && booking.data_hora_inicio >= nowIso
      ).length

      if (pending === 0) {
        const { error: archiveError } = await adminSupabase
          .from('servicos')
          .update({ ativo: false, deletado_em: nowIso })
          .eq('id', serviceId)
          .eq('profissional_id', user.id)
        if (archiveError) throw archiveError

        revalidatePath('/dashboard/servicos')
        revalidatePath('/p/[slug]', 'page')
        return { success: true, isSoftDeleted: false, pendingCount: 0, message: 'Serviço removido da sua lista.' }
      }

      const { error: deactivateError } = await adminSupabase
        .from('servicos')
        .update({ ativo: false })
        .eq('id', serviceId)
        .eq('profissional_id', user.id)

      if (deactivateError) throw deactivateError

      revalidatePath('/dashboard/servicos')
      revalidatePath('/p/[slug]', 'page')
      return {
        success: true,
        isSoftDeleted: true,
        pendingCount: pending,
        message:
          `Serviço desativado para novas clientes! Você ainda possui ${pending} ${pending === 1 ? 'atendimento agendado' : 'atendimentos agendados'} para este procedimento.`,
      }
    } else {
      // Exclusão física se não houver agendamentos
      const { error: deleteError } = await adminSupabase
        .from('servicos')
        .delete()
        .eq('id', serviceId)
        .eq('profissional_id', user.id)

      if (deleteError) throw deleteError

      revalidatePath('/dashboard/servicos')
      revalidatePath('/p/[slug]', 'page')
      return { success: true, isSoftDeleted: false, message: 'Serviço excluído com sucesso!' }
    }
  } catch (error) {
    console.error('Erro ao excluir/desativar serviço:', error)
    return {
      success: false,
      message: 'Não foi possível processar a exclusão do serviço. Tente novamente em instantes.',
    }
  }
}

export async function toggleServiceStatusAction(serviceId: string, ativo: boolean) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('servicos') as any)
      .update({ ativo })
      .eq('id', serviceId)
      .eq('profissional_id', user.id)

    if (error) throw error

    let pending = 0
    if (!ativo) {
      // Contar agendamentos futuros pendentes ao desativar
      const nowIso = new Date().toISOString()
      const { count: pendingCount } = await adminSupabase
        .from('agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('servico_id', serviceId)
        .eq('status', 'confirmado')
        .gte('data_hora_inicio', nowIso)

      pending = pendingCount || 0
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')

    const message = ativo
      ? 'Serviço ativado com sucesso!'
      : pending > 0
      ? `Serviço desativado! Você ainda possui ${pending} ${pending === 1 ? 'atendimento agendado' : 'atendimentos agendados'} para este procedimento.`
      : 'Serviço desativado com sucesso!'

    return { success: true, pendingCount: pending, message }
  } catch (error) {
    console.error('Erro ao alterar status do serviço:', error)
    return {
      success: false,
      message: 'Não foi possível alterar o status do serviço. Tente novamente em instantes.',
    }
  }
}

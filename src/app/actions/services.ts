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

    // 1. Verificar se já existem agendamentos vinculados a este serviço
    const { count, error: countError } = await adminSupabase
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('servico_id', serviceId)

    if (countError) {
      throw countError
    }

    const hasBookings = count && count > 0

    if (hasBookings) {
      // Regra de negócio: Impedir exclusão física e desativar o serviço
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deactivateError } = await (adminSupabase.from('servicos') as any)
        .update({ ativo: false })
        .eq('id', serviceId)
        .eq('profissional_id', user.id)

      if (deactivateError) throw deactivateError

      // Contar agendamentos futuros pendentes
      const nowIso = new Date().toISOString()
      const { count: pendingCount } = await adminSupabase
        .from('agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('servico_id', serviceId)
        .eq('status', 'confirmado')
        .gte('data_hora_inicio', nowIso)

      const pending = pendingCount || 0

      revalidatePath('/dashboard/servicos')
      revalidatePath('/p/[slug]', 'page')
      return {
        success: true,
        isSoftDeleted: true,
        pendingCount: pending,
        message:
          pending > 0
            ? `Serviço desativado para novas clientes! Você ainda possui ${pending} ${pending === 1 ? 'atendimento agendado' : 'atendimentos agendados'} para este procedimento.`
            : 'Este serviço possui histórico e foi desativado para preservar seus relatórios.',
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

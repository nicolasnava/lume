'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface BloqueioDisponibilidadeRow {
  id: string
  profissional_id: string
  data: string
  data_fim?: string | null
  hora_inicio?: string | null
  hora_fim?: string | null
  motivo?: string | null
  created_at: string
}

/**
 * Server Action para buscar as datas bloqueadas de uma profissional.
 */
export async function fetchBlockedDatesAction(
  profissionalIdParam?: string
): Promise<BloqueioDisponibilidadeRow[]> {
  try {
    let targetProfId = profissionalIdParam

    if (!targetProfId) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return []
      targetProfId = user.id
    }

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('bloqueios_disponibilidade') as any)
      .select('*')
      .eq('profissional_id', targetProfId)
      .order('data', { ascending: true })

    if (error) {
      console.error('[fetchBlockedDatesAction] Erro:', error)
      return []
    }

    return (data || []) as BloqueioDisponibilidadeRow[]
  } catch (err) {
    console.error('[fetchBlockedDatesAction] Exceção:', err)
    return []
  }
}

/**
 * Server Action para adicionar um bloqueio de período e/ou horário.
 */
export async function addBlockDateAction(
  dataStr: string,
  dataFimStr?: string | null,
  horaInicioStr?: string | null,
  horaFimStr?: string | null,
  motivo?: string
): Promise<{ success: boolean; message?: string; block?: BloqueioDisponibilidadeRow }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    if (!dataStr) {
      return { success: false, message: 'Selecione uma data de início válida.' }
    }

    const adminSupabase = createAdminClient()

    const payload: Record<string, unknown> = {
      profissional_id: user.id,
      data: dataStr,
      data_fim: dataFimStr && dataFimStr >= dataStr ? dataFimStr : null,
      hora_inicio: horaInicioStr || null,
      hora_fim: horaFimStr || null,
      motivo: motivo?.trim() || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newBlock, error } = await (adminSupabase.from('bloqueios_disponibilidade') as any)
      .insert([payload])
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'Já existe um bloqueio cadastrado para esta data de início.' }
      }
      return { success: false, message: 'Não foi possível salvar o bloqueio de horário. Tente novamente.' }
    }

    revalidatePath('/dashboard/disponibilidade')
    revalidatePath('/p/[slug]/agendar')

    return {
      success: true,
      message: 'Bloqueio registrado com sucesso!',
      block: newBlock as BloqueioDisponibilidadeRow,
    }
  } catch (err) {
    console.error('[addBlockDateAction] Exceção:', err)
    return { success: false, message: 'Erro inesperado ao salvar bloqueio.' }
  }
}

/**
 * Server Action para remover um bloqueio de data.
 */
export async function removeBlockDateAction(
  blockId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    if (!blockId) {
      return { success: false, message: 'ID de bloqueio inválido.' }
    }

    const adminSupabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('bloqueios_disponibilidade') as any)
      .delete()
      .eq('id', blockId)
      .eq('profissional_id', user.id)

    if (error) {
      return { success: false, message: 'Não foi possível remover o bloqueio. Tente novamente.' }
    }

    revalidatePath('/dashboard/disponibilidade')
    revalidatePath('/p/[slug]/agendar')

    return { success: true, message: 'Bloqueio removido com sucesso!' }
  } catch (err) {
    console.error('[removeBlockDateAction] Exceção:', err)
    return { success: false, message: 'Erro inesperado ao remover bloqueio.' }
  }
}

/**
 * Item 21: Bloquear todo e qualquer agendamento (Bloqueio Geral da Agenda)
 */
export async function toggleLockAgendaAction(
  locked: boolean
): Promise<{ success: boolean; message?: string; isLocked: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.', isLocked: !locked }
    }

    const adminSupabase = createAdminClient()

    if (locked) {
      // Remove bloqueio geral prévio para evitar erro de duplicidade
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminSupabase.from('bloqueios_disponibilidade') as any)
        .delete()
        .eq('profissional_id', user.id)
        .eq('motivo', 'Bloqueio Geral da Agenda')

      // Insere bloqueio geral que cobre todo o calendário
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminSupabase.from('bloqueios_disponibilidade') as any)
        .insert([
          {
            profissional_id: user.id,
            data: '2020-01-01',
            data_fim: '2099-12-31',
            hora_inicio: null,
            hora_fim: null,
            motivo: 'Bloqueio Geral da Agenda',
          },
        ])

      if (error) {
        console.error('[toggleLockAgendaAction] Erro ao bloquear agenda:', error)
        return { success: false, message: 'Erro ao bloquear a agenda.', isLocked: false }
      }
    } else {
      // Desbloqueia excluindo o registro de bloqueio geral
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminSupabase.from('bloqueios_disponibilidade') as any)
        .delete()
        .eq('profissional_id', user.id)
        .eq('motivo', 'Bloqueio Geral da Agenda')

      if (error) {
        console.error('[toggleLockAgendaAction] Erro ao desbloquear agenda:', error)
        return { success: false, message: 'Erro ao desbloquear a agenda.', isLocked: true }
      }
    }

    revalidatePath('/dashboard/disponibilidade')
    revalidatePath('/p/[slug]/agendar')

    return {
      success: true,
      message: locked ? 'Agenda bloqueada para novos agendamentos.' : 'Agenda desbloqueada com sucesso!',
      isLocked: locked,
    }
  } catch (err) {
    console.error('[toggleLockAgendaAction] Exceção:', err)
    return { success: false, message: 'Erro inesperado ao alterar bloqueio da agenda.', isLocked: !locked }
  }
}

export async function checkIsAgendaLockedAction(profissionalIdParam?: string): Promise<boolean> {
  try {
    let targetProfId = profissionalIdParam

    if (!targetProfId) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return false
      targetProfId = user.id
    }

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('bloqueios_disponibilidade') as any)
      .select('id')
      .eq('profissional_id', targetProfId)
      .eq('motivo', 'Bloqueio Geral da Agenda')
      .limit(1)

    if (error || !data || data.length === 0) return false
    return true
  } catch {
    return false
  }
}


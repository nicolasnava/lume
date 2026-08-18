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

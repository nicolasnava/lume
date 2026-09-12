'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ComboItem {
  id: string
  profissional_id: string
  nome: string
  descricao: string | null
  preco_combo: number
  foto_url: string | null
  ativo: boolean
  created_at: string
  servicos: Array<{
    id: string
    nome: string
    duracao_minutos: number
    preco: number
    foto_url?: string | null
    ativo?: boolean
  }>
  duracaoTotalMinutos: number
  precoOriginalTotal: number
  descontoEconomia: number
}

export interface ComboFormData {
  nome: string
  descricao?: string | null
  preco_combo: number
  foto_url?: string | null
  servico_ids: string[]
  ativo?: boolean
}

/**
 * Busca todos os combos de uma profissional (ou da profissional autenticada) com os serviços inclusos
 */
export async function getCombosProfissionalAction(profissionalId?: string): Promise<ComboItem[]> {
  try {
    const supabase = await createClient()
    let targetProfissionalId = profissionalId

    if (!targetProfissionalId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []
      targetProfissionalId = user.id
    }

    const adminSupabase = createAdminClient()

    // 1. Buscar combos
    const { data: combosData, error: combosError } = await adminSupabase
      .from('combos')
      .select('*')
      .eq('profissional_id', targetProfissionalId)
      .order('created_at', { ascending: false })

    if (combosError || !combosData) {
      console.warn('[getCombosProfissionalAction] Erro ou nenhum combo:', combosError)
      return []
    }

    if (combosData.length === 0) {
      return []
    }

    const comboIds = combosData.map((c) => c.id)

    // 2. Buscar relações combo_servicos
    const { data: relData, error: relError } = await adminSupabase
      .from('combo_servicos')
      .select('combo_id, servico_id, servicos(id, nome, duracao_minutos, preco, foto_url, ativo)')
      .in('combo_id', comboIds)

    if (relError) {
      console.error('[getCombosProfissionalAction] Erro ao buscar itens de combos:', relError)
    }

    // 3. Montar mapa de serviços por combo
    const servicosPorCombo: Record<string, ComboItem['servicos']> = {}
    ;(relData || []).forEach((item: any) => {
      if (!item.servicos) return
      if (!servicosPorCombo[item.combo_id]) {
        servicosPorCombo[item.combo_id] = []
      }
      servicosPorCombo[item.combo_id].push({
        id: item.servicos.id,
        nome: item.servicos.nome,
        duracao_minutos: Number(item.servicos.duracao_minutos || 60),
        preco: Number(item.servicos.preco || 0),
        foto_url: item.servicos.foto_url,
        ativo: item.servicos.ativo !== false,
      })
    })

    return combosData.map((c) => {
      const servicos = servicosPorCombo[c.id] || []
      const duracaoTotalMinutos = servicos.reduce((acc, s) => acc + s.duracao_minutos, 0)
      const precoOriginalTotal = servicos.reduce((acc, s) => acc + s.preco, 0)
      const precoCombo = Number(c.preco_combo)
      const descontoEconomia = Math.max(0, precoOriginalTotal - precoCombo)

      return {
        id: c.id,
        profissional_id: c.profissional_id,
        nome: c.nome,
        descricao: c.descricao,
        preco_combo: precoCombo,
        foto_url: c.foto_url,
        ativo: c.ativo,
        created_at: c.created_at,
        servicos,
        duracaoTotalMinutos,
        precoOriginalTotal,
        descontoEconomia,
      }
    })
  } catch (err) {
    console.error('[getCombosProfissionalAction] Erro inesperado:', err)
    return []
  }
}

/**
 * Cria um novo combo com seus serviços associados
 */
export async function createComboAction(data: ComboFormData): Promise<{
  success: boolean
  message?: string
  combo?: ComboItem
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuária não autenticada.' }
    }

    if (!data.nome || !data.nome.trim()) {
      return { success: false, message: 'O nome do combo é obrigatório.' }
    }

    if (!data.servico_ids || data.servico_ids.length < 1) {
      return { success: false, message: 'Selecione ao menos 1 serviço para formar um pacote.' }
    }

    if (data.preco_combo === undefined || Number(data.preco_combo) <= 0) {
      return { success: false, message: 'Informe um preço válido para o combo.' }
    }

    const adminSupabase = createAdminClient()

    // 1. Inserir combo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCombo, error: insertError } = await (adminSupabase.from('combos') as any)
      .insert([
        {
          profissional_id: user.id,
          nome: data.nome.trim(),
          descricao: data.descricao?.trim() || null,
          preco_combo: Number(data.preco_combo),
          foto_url: data.foto_url || null,
          ativo: data.ativo !== undefined ? data.ativo : true,
        },
      ])
      .select('*')
      .single()

    if (insertError || !newCombo) {
      console.error('[createComboAction] Erro ao inserir combo:', insertError)
      return { success: false, message: 'Erro ao cadastrar combo no banco de dados.' }
    }

    // 2. Inserir relações em combo_servicos
    const relRows = data.servico_ids.map((servicoId) => ({
      combo_id: newCombo.id,
      servico_id: servicoId,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: relError } = await (adminSupabase.from('combo_servicos') as any).insert(relRows)

    if (relError) {
      console.error('[createComboAction] Erro ao associar serviços:', relError)
      // Tentar reverter criação do combo para não deixar órfão
      await adminSupabase.from('combos').delete().eq('id', newCombo.id)
      return { success: false, message: 'Erro ao associar serviços ao combo.' }
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'layout')
    revalidatePath('/studio/[slug]/[profissionalSlug]', 'layout')

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado ao criar combo.'
    console.error('[createComboAction] Exceção:', err)
    return { success: false, message: msg }
  }
}

/**
 * Atualiza um combo existente e redefine seus serviços associados
 */
export async function updateComboAction(
  comboId: string,
  data: ComboFormData
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuária não autenticada.' }
    }

    if (!data.nome || !data.nome.trim()) {
      return { success: false, message: 'O nome do combo é obrigatório.' }
    }

    if (!data.servico_ids || data.servico_ids.length < 1) {
      return { success: false, message: 'Selecione ao menos 1 serviço para formar um pacote.' }
    }

    const adminSupabase = createAdminClient()

    // 1. Atualizar combo garantindo posse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (adminSupabase.from('combos') as any)
      .update({
        nome: data.nome.trim(),
        descricao: data.descricao?.trim() || null,
        preco_combo: Number(data.preco_combo),
        foto_url: data.foto_url || null,
        ativo: data.ativo !== undefined ? data.ativo : true,
      })
      .eq('id', comboId)
      .eq('profissional_id', user.id)

    if (updateError) {
      console.error('[updateComboAction] Erro ao atualizar combo:', updateError)
      return { success: false, message: 'Erro ao atualizar dados do combo.' }
    }

    // 2. Sincronizar serviços associados (remover antigos e reinserir novos)
    await adminSupabase.from('combo_servicos').delete().eq('combo_id', comboId)

    const relRows = data.servico_ids.map((servicoId) => ({
      combo_id: comboId,
      servico_id: servicoId,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: relError } = await (adminSupabase.from('combo_servicos') as any).insert(relRows)

    if (relError) {
      console.error('[updateComboAction] Erro ao atualizar serviços associados:', relError)
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'layout')
    revalidatePath('/studio/[slug]/[profissionalSlug]', 'layout')

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado ao atualizar combo.'
    console.error('[updateComboAction] Exceção:', err)
    return { success: false, message: msg }
  }
}

/**
 * Exclui um combo
 */
export async function deleteComboAction(comboId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuária não autenticada.' }
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('combos')
      .delete()
      .eq('id', comboId)
      .eq('profissional_id', user.id)

    if (error) {
      console.error('[deleteComboAction] Erro ao excluir combo:', error)
      return { success: false, message: 'Erro ao excluir combo.' }
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'layout')
    revalidatePath('/studio/[slug]/[profissionalSlug]', 'layout')

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado ao excluir combo.'
    console.error('[deleteComboAction] Exceção:', err)
    return { success: false, message: msg }
  }
}

/**
 * Ativa ou desativa um combo
 */
export async function toggleComboStatusAction(
  comboId: string,
  ativo: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuária não autenticada.' }
    }

    const adminSupabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('combos') as any)
      .update({ ativo })
      .eq('id', comboId)
      .eq('profissional_id', user.id)

    if (error) {
      console.error('[toggleComboStatusAction] Erro:', error)
      return { success: false, message: 'Erro ao alterar status do combo.' }
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'layout')
    revalidatePath('/studio/[slug]/[profissionalSlug]', 'layout')

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.'
    console.error('[toggleComboStatusAction] Exceção:', err)
    return { success: false, message: msg }
  }
}

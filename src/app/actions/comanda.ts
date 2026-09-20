'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ComandaProduto {
  id: string
  profissional_id: string
  nome: string
  descricao: string | null
  preco: number
  foto_url: string | null
  ativo: boolean
  ordem: number
  created_at: string
}

export interface ComandaProdutoFormData {
  nome: string
  descricao?: string | null
  preco: number
  foto_url?: string | null
  ativo?: boolean
}

/**
 * Busca produtos da comanda digital de um profissional
 */
export async function getComandaProdutosAction(
  profissionalId?: string,
  apenasAtivos: boolean = false
): Promise<ComandaProduto[]> {
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

    let query = adminSupabase
      .from('comanda_produtos')
      .select('*')
      .eq('profissional_id', targetProfissionalId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })

    if (apenasAtivos) {
      query = query.eq('ativo', true)
    }

    const { data, error } = await query

    if (error) {
      // Se a tabela ainda não existir no banco, retornar lista vazia sem quebrar
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('[getComandaProdutosAction] Tabela comanda_produtos ainda não migrada.')
        return []
      }
      console.error('[getComandaProdutosAction] Erro ao buscar produtos da comanda:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      profissional_id: item.profissional_id,
      nome: item.nome,
      descricao: item.descricao,
      preco: Number(item.preco),
      foto_url: item.foto_url,
      ativo: item.ativo !== false,
      ordem: Number(item.ordem || 0),
      created_at: item.created_at,
    }))
  } catch (err) {
    console.error('[getComandaProdutosAction] Exceção inesperada:', err)
    return []
  }
}

/**
 * Cadastra um novo produto na comanda digital
 */
export async function createComandaProdutoAction(
  formData: ComandaProdutoFormData
): Promise<{ success: boolean; message?: string; data?: ComandaProduto }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    if (!formData.nome || !formData.nome.trim()) {
      return { success: false, message: 'O nome do produto é obrigatório.' }
    }

    if (formData.preco === undefined || isNaN(formData.preco) || formData.preco < 0) {
      return { success: false, message: 'Informe um valor válido para o produto.' }
    }

    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('comanda_produtos')
      .insert({
        profissional_id: user.id,
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || null,
        preco: Number(formData.preco),
        foto_url: formData.foto_url?.trim() || null,
        ativo: formData.ativo !== false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return {
          success: false,
          message:
            'A tabela de produtos da comanda precisa ser ativada no banco. Aplique a migration 00043 no Supabase.',
        }
      }
      console.error('[createComandaProdutoAction] Erro ao inserir produto:', error)
      return { success: false, message: `Erro ao cadastrar produto: ${error.message}` }
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')

    return {
      success: true,
      message: 'Item adicionado à comanda com sucesso!',
      data: {
        id: data.id,
        profissional_id: data.profissional_id,
        nome: data.nome,
        descricao: data.descricao,
        preco: Number(data.preco),
        foto_url: data.foto_url,
        ativo: data.ativo !== false,
        ordem: Number(data.ordem || 0),
        created_at: data.created_at,
      },
    }
  } catch (err: any) {
    console.error('[createComandaProdutoAction] Exceção:', err)
    return { success: false, message: err?.message || 'Erro inesperado ao salvar item da comanda.' }
  }
}

/**
 * Atualiza um produto da comanda digital
 */
export async function updateComandaProdutoAction(
  id: string,
  formData: Partial<ComandaProdutoFormData>
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const adminSupabase = createAdminClient()

    // Validar propriedade do produto
    const { data: existing, error: findError } = await adminSupabase
      .from('comanda_produtos')
      .select('id, profissional_id')
      .eq('id', id)
      .single()

    if (findError || !existing || existing.profissional_id !== user.id) {
      return { success: false, message: 'Produto não encontrado ou sem permissão.' }
    }

    const updatePayload: Record<string, any> = {}
    if (formData.nome !== undefined) updatePayload.nome = formData.nome.trim()
    if (formData.descricao !== undefined) updatePayload.descricao = formData.descricao?.trim() || null
    if (formData.preco !== undefined) updatePayload.preco = Number(formData.preco)
    if (formData.foto_url !== undefined) updatePayload.foto_url = formData.foto_url?.trim() || null
    if (formData.ativo !== undefined) updatePayload.ativo = formData.ativo

    const { error: updateError } = await adminSupabase
      .from('comanda_produtos')
      .update(updatePayload)
      .eq('id', id)

    if (updateError) {
      console.error('[updateComandaProdutoAction] Erro ao atualizar:', updateError)
      return { success: false, message: `Erro ao atualizar: ${updateError.message}` }
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')

    return { success: true, message: 'Item atualizado com sucesso!' }
  } catch (err: any) {
    console.error('[updateComandaProdutoAction] Exceção:', err)
    return { success: false, message: err?.message || 'Erro inesperado ao atualizar item.' }
  }
}

/**
 * Exclui um produto da comanda digital
 */
export async function deleteComandaProdutoAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const adminSupabase = createAdminClient()

    // Validar que o produto pertence ao usuário logado
    const { data: existing, error: findError } = await adminSupabase
      .from('comanda_produtos')
      .select('id, profissional_id')
      .eq('id', id)
      .single()

    if (findError || !existing || existing.profissional_id !== user.id) {
      return { success: false, message: 'Produto não encontrado ou sem permissão.' }
    }

    const { error: deleteError } = await adminSupabase
      .from('comanda_produtos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[deleteComandaProdutoAction] Erro ao excluir produto:', deleteError)
      return { success: false, message: `Erro ao excluir: ${deleteError.message}` }
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')

    return { success: true, message: 'Item removido da comanda!' }
  } catch (err: any) {
    console.error('[deleteComandaProdutoAction] Exceção:', err)
    return { success: false, message: err?.message || 'Erro inesperado ao excluir item.' }
  }
}

/**
 * Ativa ou pausa um produto da comanda digital
 */
export async function toggleComandaProdutoStatusAction(
  id: string,
  ativo: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('comanda_produtos')
      .update({ ativo })
      .eq('id', id)
      .eq('profissional_id', user.id)

    if (error) {
      console.error('[toggleComandaProdutoStatusAction] Erro ao alterar status:', error)
      return { success: false, message: 'Erro ao alterar status do produto.' }
    }

    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')

    return {
      success: true,
      message: `Item ${ativo ? 'ativado' : 'pausado'} com sucesso!`,
    }
  } catch (err: any) {
    console.error('[toggleComandaProdutoStatusAction] Exceção:', err)
    return { success: false, message: 'Erro inesperado ao atualizar status.' }
  }
}

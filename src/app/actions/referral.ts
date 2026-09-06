'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ReferralStats {
  codigoIndicacao: string
  referralUrl: string
  totalIndicadas: number
  indicadasAtivas: number
  descontoPercentual: number
  valorBase: number
  valorAtual: number
  metaIndicacoes: number
  indicacoesFaltantesParaMaximo: number
}

/**
 * Valida se um código de indicação é válido e pertence a uma profissional ativa.
 */
export async function validateReferralCodeAction(code: string): Promise<{
  valid: boolean
  indicador?: { id: string; nome: string; slug: string }
}> {
  if (!code || !code.trim()) {
    return { valid: false }
  }

  try {
    const adminSupabase = createAdminClient()
    const cleanCode = code.trim().toUpperCase()

    const { data: prof, error } = await adminSupabase
      .from('profissionais')
      .select('id, nome, slug, status_conta, is_demo')
      .ilike('codigo_indicacao', cleanCode)
      .is('deletado_em', null)
      .maybeSingle()

    if (error || !prof || (prof as any).is_demo) {
      return { valid: false }
    }

    return {
      valid: true,
      indicador: {
        id: prof.id,
        nome: prof.nome,
        slug: prof.slug,
      },
    }
  } catch (err) {
    console.error('[validateReferralCodeAction] Erro inesperado:', err)
    return { valid: false }
  }
}

/**
 * Recalcula o desconto da indicadora com base nas profissionais ativas que ela indicou.
 * Cada profissional indicada com status_conta === 'ativa' dá 10% de desconto até o teto de 30%.
 * Atualiza o campo valor_mensalidade na tabela profissionais a partir do valor base R$ 69,90.
 */
export async function recalcularDescontoIndicacao(indicadorId: string): Promise<{
  ativasCount: number
  descontoPct: number
  novoValor: number
}> {
  if (!indicadorId) {
    return { ativasCount: 0, descontoPct: 0, novoValor: 69.90 }
  }

  const adminSupabase = createAdminClient()

  try {
    // 1. Contar indicadas ativas (excluindo contas demo)
    const { data: indicadas, error: countError } = await adminSupabase
      .from('profissionais')
      .select('id, status_conta, is_demo')
      .eq('indicado_por', indicadorId)
      .eq('status_conta', 'ativa')
      .is('deletado_em', null)

    if (countError) {
      console.error('[recalcularDescontoIndicacao] Erro ao buscar indicadas:', countError)
    }

    const ativasCount = (indicadas || []).filter((p: any) => !p.is_demo).length

    // Desconto = min(ativas * 10%, 30%)
    const descontoPct = Math.min(ativasCount * 10, 30)
    const valorBase = 69.90
    const novoValor = Number((valorBase * (1.0 - descontoPct / 100.0)).toFixed(2))

    // 2. Atualizar valor_mensalidade da indicadora
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (adminSupabase.from('profissionais') as any)
      .update({ valor_mensalidade: novoValor })
      .eq('id', indicadorId)

    if (updateError) {
      console.error('[recalcularDescontoIndicacao] Erro ao atualizar valor_mensalidade:', updateError)
    }

    return {
      ativasCount,
      descontoPct,
      novoValor,
    }
  } catch (err) {
    console.error('[recalcularDescontoIndicacao] Exceção inesperada:', err)
    return { ativasCount: 0, descontoPct: 0, novoValor: 69.90 }
  }
}

/**
 * Busca estatísticas completas de indicação da profissional autenticada.
 */
export async function getReferralStatsAction(): Promise<ReferralStats | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const adminSupabase = createAdminClient()

  // Buscar dados da profissional
  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('id, codigo_indicacao, valor_mensalidade, slug, nome, is_demo')
    .eq('id', user.id)
    .single()

  if (!prof || (prof as any).is_demo) return null

  // Se não tiver código de indicação, gerar e salvar agora
  let codigo = prof.codigo_indicacao
  if (!codigo) {
    const baseCode = (prof.slug || prof.nome || 'LUME')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
    const rand = Math.floor(100 + Math.random() * 900)
    codigo = `${baseCode}${rand}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase.from('profissionais') as any)
      .update({ codigo_indicacao: codigo })
      .eq('id', user.id)
  }

  // Contar indicadas totais e ativas (excluindo contas demo)
  const { data: indicadas } = await adminSupabase
    .from('profissionais')
    .select('id, status_conta, is_demo')
    .eq('indicado_por', user.id)
    .is('deletado_em', null)

  const nonDemoIndicadas = (indicadas || []).filter((p: any) => !p.is_demo)
  const totalIndicadas = nonDemoIndicadas.length
  const indicadasAtivas = nonDemoIndicadas.filter((p) => p.status_conta === 'ativa').length

  const descontoPercentual = Math.min(indicadasAtivas * 10, 30)
  const valorBase = 69.90
  const valorAtual = Number((valorBase * (1.0 - descontoPercentual / 100.0)).toFixed(2))

  const metaIndicacoes = 3
  const indicacoesFaltantesParaMaximo = Math.max(0, metaIndicacoes - indicadasAtivas)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lume.com.br'
  const referralUrl = `${origin}/cadastro?ref=${codigo}`

  return {
    codigoIndicacao: codigo,
    referralUrl,
    totalIndicadas,
    indicadasAtivas,
    descontoPercentual,
    valorBase,
    valorAtual,
    metaIndicacoes,
    indicacoesFaltantesParaMaximo,
  }
}

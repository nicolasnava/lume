'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface SubscriptionData {
  statusConta: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
  planoTipo: 'mensal' | 'anual' | 'cortesia'
  valorMensalidade: number
  trialEndsAt: string | null
  proximoVencimento: string | null
  diasRestantesTrial: number
  planos: Array<{
    id: string
    nome: string
    slug: string
    preco: number
    intervalo: 'mensal' | 'anual'
    descricao: string | null
  }>
  faturas: Array<{
    id: string
    plano_slug: string
    valor: number
    status: 'pago' | 'pendente' | 'vencido' | 'cancelado' | 'reembolsado'
    forma_pagamento: string | null
    data_vencimento: string
    data_pagamento: string | null
    link_pagamento: string | null
    codigo_pix: string | null
  }>
  referral: {
    codigoIndicacao: string
    totalIndicadas: number
    indicadasAtivas: number
    descontoPercentual: number
  }
}

/**
 * Obtém todos os dados da assinatura, planos disponíveis e histórico de faturas da profissional autenticada
 */
export async function getProfissionalSubscriptionData(): Promise<SubscriptionData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuária não autenticada.')
  }

  const adminSupabase = createAdminClient()

  // 1. Buscar dados do perfil
  const { data: prof, error: profError } = await adminSupabase
    .from('profissionais')
    .select('status_conta, plano_tipo, valor_mensalidade, trial_ends_at, proximo_vencimento, codigo_indicacao, slug, nome')
    .eq('id', user.id)
    .single()

  if (profError || !prof) {
    throw new Error('Perfil da profissional não encontrado.')
  }

  // 2. Buscar planos ativos do SaaS
  const { data: planos } = await adminSupabase
    .from('saas_planos')
    .select('id, nome, slug, preco, intervalo, descricao')
    .eq('ativo', true)
    .order('preco', { ascending: true })

  // 3. Buscar histórico de faturas
  const { data: faturas } = await adminSupabase
    .from('saas_faturas')
    .select('*')
    .eq('profissional_id', user.id)
    .order('data_vencimento', { ascending: false })

  // Calcular dias restantes de trial
  let diasRestantesTrial = 0
  if (prof.trial_ends_at) {
    const trialEnd = new Date(prof.trial_ends_at).getTime()
    const now = Date.now()
    diasRestantesTrial = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
  }

  // 4. Buscar estatísticas de indicação
  let codigoIndicacao = (prof as any).codigo_indicacao || ''
  if (!codigoIndicacao) {
    const base = ((prof as any).slug || (prof as any).nome || 'LUME')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
    codigoIndicacao = `${base || 'LUME'}${Math.floor(100 + Math.random() * 900)}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase.from('profissionais') as any)
      .update({ codigo_indicacao: codigoIndicacao })
      .eq('id', user.id)
  }

  const { data: indicadas } = await adminSupabase
    .from('profissionais')
    .select('id, status_conta')
    .eq('indicado_por', user.id)
    .is('deletado_em', null)

  const totalIndicadas = (indicadas || []).length
  const indicadasAtivas = (indicadas || []).filter((p) => p.status_conta === 'ativa').length
  const descontoPercentual = Math.min(indicadasAtivas * 10, 30)

  return {
    statusConta: (prof.status_conta || 'trial') as SubscriptionData['statusConta'],
    planoTipo: (prof.plano_tipo || 'mensal') as SubscriptionData['planoTipo'],
    valorMensalidade: Number(prof.valor_mensalidade || 69.90),
    trialEndsAt: prof.trial_ends_at || null,
    proximoVencimento: prof.proximo_vencimento || null,
    diasRestantesTrial,
    referral: {
      codigoIndicacao,
      totalIndicadas,
      indicadasAtivas,
      descontoPercentual,
    },
    planos: (planos || []).map((p) => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      preco: Number(p.preco),
      intervalo: p.intervalo as 'mensal' | 'anual',
      descricao: p.descricao,
    })),
    faturas: (faturas || []).map((f) => ({
      id: f.id,
      plano_slug: f.plano_slug,
      valor: Number(f.valor),
      status: f.status as SubscriptionData['faturas'][0]['status'],
      forma_pagamento: f.forma_pagamento,
      data_vencimento: f.data_vencimento,
      data_pagamento: f.data_pagamento,
      link_pagamento: f.link_pagamento,
      codigo_pix: f.codigo_pix,
    })),
  }
}

/**
 * Altera o plano de assinatura da profissional (Mensal vs Anual)
 */
export async function changeProfissionalPlan(newPlanoSlug: 'mensal' | 'anual') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuária não autenticada.')
  }

  const adminSupabase = createAdminClient()

  // Buscar dados do plano selecionado
  const { data: plano, error: planoError } = await adminSupabase
    .from('saas_planos')
    .select('*')
    .eq('slug', newPlanoSlug)
    .single()

  if (planoError || !plano) {
    throw new Error('Plano não encontrado.')
  }

  const novoValor = Number(plano.preco)

  // Atualizar registro da profissional
  const { error: updateError } = await adminSupabase
    .from('profissionais')
    .update({
      plano_tipo: newPlanoSlug,
      valor_mensalidade: novoValor,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('[changeProfissionalPlan] Erro ao atualizar plano:', updateError)
    throw new Error('Não foi possível alterar o plano no momento.')
  }

  revalidatePath('/perfil')
  return { success: true, planoSlug: newPlanoSlug, valor: novoValor }
}

/**
 * Valida e aplica um cupom de desconto ou dias de teste extras na assinatura
 */
export async function applySubscriptionCoupon(codigo: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuária não autenticada.')
  }

  const codeClean = codigo.trim().toUpperCase()
  if (!codeClean) {
    throw new Error('Informe o código do cupom.')
  }

  const adminSupabase = createAdminClient()

  // 1. Buscar cupom
  const { data: cupom, error: cupomError } = await adminSupabase
    .from('saas_cupons')
    .select('*')
    .eq('codigo', codeClean)
    .single()

  if (cupomError || !cupom) {
    throw new Error('Cupom não encontrado ou inválido.')
  }

  if (!cupom.ativo) {
    throw new Error('Este cupom já foi desativado.')
  }

  if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date()) {
    throw new Error('Este cupom expirou.')
  }

  if (cupom.limite_usos && cupom.usado_count >= cupom.limite_usos) {
    throw new Error('Este cupom atingiu o limite máximo de utilizações.')
  }

  // 2. Aplicar benefício
  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('trial_ends_at, valor_mensalidade, status_conta')
    .eq('id', user.id)
    .single()

  let mensagemSucesso = 'Cupom aplicado com sucesso!'
  const updates: Record<string, unknown> = {}

  if (cupom.dias_trial_extra && cupom.dias_trial_extra > 0) {
    const baseDate = prof?.trial_ends_at ? new Date(prof.trial_ends_at) : new Date()
    const novaData = new Date(baseDate.getTime() + cupom.dias_trial_extra * 24 * 60 * 60 * 1000)
    updates.trial_ends_at = novaData.toISOString()
    mensagemSucesso = `🎉 Parabéns! Você ganhou +${cupom.dias_trial_extra} dias de teste gratuito!`
  }

  if (cupom.desconto_pct && cupom.desconto_pct > 0) {
    const valorAtual = Number(prof?.valor_mensalidade || 69.90)
    const novoValor = Math.max(0, valorAtual * (1 - cupom.desconto_pct / 100))
    updates.valor_mensalidade = Math.round(novoValor * 100) / 100
    mensagemSucesso = `🎉 Cupom de ${cupom.desconto_pct}% de desconto aplicado nas suas próximas mensalidades!`
  } else if (cupom.desconto_valor && cupom.desconto_valor > 0) {
    const valorAtual = Number(prof?.valor_mensalidade || 69.90)
    const novoValor = Math.max(0, valorAtual - Number(cupom.desconto_valor))
    updates.valor_mensalidade = Math.round(novoValor * 100) / 100
    mensagemSucesso = `🎉 Desconto de R$ ${Number(cupom.desconto_valor).toFixed(2)} aplicado na sua mensalidade!`
  }

  if (Object.keys(updates).length > 0) {
    await adminSupabase.from('profissionais').update(updates).eq('id', user.id)
  }

  // Incrementar contagem de usos do cupom
  await adminSupabase
    .from('saas_cupons')
    .update({ usado_count: (cupom.usado_count || 0) + 1 })
    .eq('id', cupom.id)

  revalidatePath('/perfil')
  return { success: true, message: mensagemSucesso }
}

/**
 * Retorna dados para pagamento de fatura (código PIX e link)
 */
export async function getInvoicePaymentDetails(faturaId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuária não autenticada.')
  }

  const adminSupabase = createAdminClient()

  const { data: fatura, error } = await adminSupabase
    .from('saas_faturas')
    .select('*')
    .eq('id', faturaId)
    .eq('profissional_id', user.id)
    .single()

  if (error || !fatura) {
    throw new Error('Fatura não encontrada.')
  }

  const pixCode =
    fatura.codigo_pix ||
    `00020126580014BR.GOV.BCB.PIX0136lume-pagamento-${fatura.id.slice(0, 8)}5204000053039865405${Number(fatura.valor).toFixed(2)}5802BR5915LUME TECNOLOGIA6009SAO PAULO62070503***6304${fatura.id.slice(-4).toUpperCase()}`

  return {
    id: fatura.id,
    valor: Number(fatura.valor),
    status: fatura.status,
    data_vencimento: fatura.data_vencimento,
    codigo_pix: pixCode,
    link_pagamento: fatura.link_pagamento || null,
  }
}

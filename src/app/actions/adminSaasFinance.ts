'use server'

import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SaaSPeriodFilter {
  period: 'hoje' | 'semana' | 'mes' | '30dias' | 'ano'
}

/**
 * Retorna dados estatísticos consolidados para o Dashboard Financeiro SaaS (/admin/financeiro)
 */
export async function getSaaSFinancialDashboardData() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado ao painel administrativo.')
  }

  const adminSupabase = createAdminClient()

  // 1. Buscar todas as profissionais com seus dados de plano e assinatura
  const { data: profs, error: profsError } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, status_conta, plano_tipo, valor_mensalidade, trial_ends_at, proximo_vencimento, created_at')

  if (profsError) {
    console.error('[getSaaSFinancialDashboardData] Erro ao buscar profissionais:', profsError)
  }

  const allProfs = profs || []
  const totalProfissionais = allProfs.length

  // Contagem por status
  const ativasCount = allProfs.filter((p) => p.status_conta === 'ativa').length
  const trialCount = allProfs.filter((p) => p.status_conta === 'trial').length
  const atrasadasCount = allProfs.filter((p) => p.status_conta === 'atrasada').length
  const suspensasCount = allProfs.filter((p) => p.status_conta === 'suspensa').length
  const cortesiaCount = allProfs.filter((p) => p.status_conta === 'cortesia').length
  const canceladasCount = allProfs.filter((p) => p.status_conta === 'cancelada').length

  // 2. Cálculo do MRR (Monthly Recurring Revenue)
  // MRR = Soma das mensalidades das contas ATIVAS (ou equivalente mensal para planos anuais)
  const mrr = allProfs.reduce((acc, p) => {
    if (p.status_conta === 'ativa') {
      const valor = Number(p.valor_mensalidade || 39.90)
      if (p.plano_tipo === 'anual') {
        // Se for anual, a mensalidade equivalente é o valor total dividido por 12
        return acc + valor / 12
      }
      return acc + valor
    }
    return acc
  }, 0)

  // ARR = MRR * 12
  const arr = mrr * 12

  // Taxa de conversão de trial (% de profissionais que já foram salvas e viraram ativas)
  const totalHistoricoNaoTrial = allProfs.filter((p) => p.status_conta !== 'trial').length
  const trialConversionPct = totalHistoricoNaoTrial > 0
    ? Math.round((ativasCount / totalHistoricoNaoTrial) * 100)
    : 0

  // Churn Rate (% de canceladas em relação ao total de pagantes ativas + canceladas)
  const totalBasePagante = ativasCount + canceladasCount
  const churnRatePct = totalBasePagante > 0
    ? Math.round((canceladasCount / totalBasePagante) * 100)
    : 0

  // 3. Buscar Faturas do SaaS
  const { data: faturas, error: faturasError } = await adminSupabase
    .from('saas_faturas')
    .select('*, profissionais(nome, slug)')
    .order('created_at', { ascending: false })

  if (faturasError) {
    console.warn('[getSaaSFinancialDashboardData] Aviso ao buscar faturas:', faturasError)
  }

  const allFaturas = faturas || []

  // Receita total arrecadada no SaaS (soma de faturas pagas)
  const receitaTotalArrecadada = allFaturas
    .filter((f) => f.status === 'pago')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  // Faturas pendentes e vencidas
  const faturasPendentesValor = allFaturas
    .filter((f) => f.status === 'pendente' || f.status === 'vencido')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  // Distribuição de formas de pagamento
  const formaPagamentoMap: Record<string, number> = {
    pix: 0,
    cartao_credito: 0,
    boleto: 0,
    manual: 0,
    cortesia: 0,
  }

  allFaturas.forEach((f) => {
    if (f.status === 'pago' && f.forma_pagamento) {
      formaPagamentoMap[f.forma_pagamento] = (formaPagamentoMap[f.forma_pagamento] || 0) + Number(f.valor)
    }
  })

  // 4. Cálculo do Faturamento Futuro Projetado (Forecast)
  // Projeção baseada em:
  // - Renovações ativas programadas para os próximos 30 / 90 dias
  // - Faturas pendentes a vencer
  // 1) Valor de renovações das profissionais ativas
  const renovacoes30d = allProfs
    .filter((p) => p.status_conta === 'ativa')
    .reduce((acc, p) => acc + Number(p.valor_mensalidade || 39.90), 0)

  const renovacoes90d = renovacoes30d * 3

  // 2) Projeção de receita dos trials ativos que devem converter
  const taxaConversaoDecimal = trialConversionPct > 0 ? trialConversionPct / 100 : 0.5
  const trialsPrevisto30d = trialCount * taxaConversaoDecimal * 39.90

  // Total Projetado
  const faturamentoFuturo30d = Math.round((renovacoes30d + trialsPrevisto30d + faturasPendentesValor) * 100) / 100
  const faturamentoFuturo90d = Math.round((renovacoes90d + (trialsPrevisto30d * 3) + faturasPendentesValor) * 100) / 100

  // 5. Dados para o Gráfico de Evolução Passada e Projeção Futura (12 meses: 6 passados, 6 futuros)
  const now = new Date()
  const mrrChartData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const mrrNoMes = allProfs
      .filter((p) => new Date(p.created_at) <= cutoffDate && (p.status_conta === 'ativa' || p.status_conta === 'trial'))
      .reduce((acc, p) => acc + (p.status_conta === 'ativa' ? Number(p.valor_mensalidade || 39.90) : 0), 0)

    mrrChartData.push({
      mes: monthLabel,
      mrr: Math.round(mrrNoMes * 100) / 100,
      tipo: 'Realizado',
    })
  }

  // Projeção Futura (próximos 6 meses)
  const forecastChartData = []
  let baseMrrFuturo = mrr > 0 ? mrr : 100
  for (let i = 1; i <= 6; i++) {
    const dFuturo = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthLabel = dFuturo.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    
    // Projeção conservadora considerando retenção e novos trials
    baseMrrFuturo = baseMrrFuturo * (1 - (churnRatePct > 0 ? churnRatePct / 100 : 0.05)) + (trialsPrevisto30d * 0.3)

    forecastChartData.push({
      mes: monthLabel,
      mrrProjetado: Math.round(baseMrrFuturo * 100) / 100,
      tipo: 'Projeção',
    })
  }

  return {
    totalProfissionais,
    ativasCount,
    trialCount,
    atrasadasCount,
    suspensasCount,
    cortesiaCount,
    canceladasCount,
    mrr,
    arr,
    trialConversionPct,
    churnRatePct,
    receitaTotalArrecadada,
    faturasPendentesValor,
    faturamentoFuturo30d,
    faturamentoFuturo90d,
    formaPagamentoMap,
    mrrChartData,
    forecastChartData,
    faturasRecentes: allFaturas.slice(0, 10),
  }
}

/**
 * Retorna todas as faturas do SaaS com busca e filtros
 */
export async function getSaaSInvoices(
  search: string = '',
  statusFilter: string = 'todos'
) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  let query = adminSupabase
    .from('saas_faturas')
    .select('*, profissionais(nome, slug)')
    .order('data_vencimento', { ascending: false })

  if (statusFilter && statusFilter !== 'todos') {
    query = query.eq('status', statusFilter as 'pago' | 'pendente' | 'vencido' | 'cancelado')
  }

  const { data: faturas, error } = await query

  if (error) {
    console.error('[getSaaSInvoices] Erro:', error)
    throw new Error('Erro ao carregar faturas.')
  }

  // Buscar e-mails das profissionais
  const emailMap = new Map<string, string>()
  try {
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    if (usersData?.users) {
      usersData.users.forEach((u) => {
        if (u.email) emailMap.set(u.id, u.email)
      })
    }
  } catch (err) {
    console.warn('[getSaaSInvoices] Aviso ao listar e-mails:', err)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result = (faturas || []).map((f: any) => ({
    id: f.id,
    profissional_id: f.profissional_id,
    profissional_nome: f.profissionais?.nome || 'Profissional',
    profissional_slug: f.profissionais?.slug || '',
    profissional_email: emailMap.get(f.profissional_id) || 'N/A',
    plano_slug: f.plano_slug,
    valor: Number(f.valor),
    status: f.status as 'pago' | 'pendente' | 'vencido' | 'cancelado' | 'reembolsado',
    forma_pagamento: f.forma_pagamento,
    data_vencimento: f.data_vencimento,
    data_pagamento: f.data_pagamento,
    link_pagamento: f.link_pagamento,
    codigo_pix: f.codigo_pix,
    created_at: f.created_at,
  }))

  if (search.trim()) {
    const term = search.toLowerCase().trim()
    result = result.filter(
      (f) =>
        f.profissional_nome.toLowerCase().includes(term) ||
        f.profissional_email.toLowerCase().includes(term) ||
        f.profissional_slug.toLowerCase().includes(term)
    )
  }

  return result
}

/**
 * Dar baixa manual em uma fatura do SaaS e renovar a assinatura da profissional
 */
export async function confirmInvoicePaymentManual(
  invoiceId: string,
  formaPagamento: 'pix' | 'cartao_credito' | 'boleto' | 'manual' = 'manual'
) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  // Buscar fatura
  const { data: fatura, error: fetchErr } = await adminSupabase
    .from('saas_faturas')
    .select('*, profissionais(nome, plano_tipo)')
    .eq('id', invoiceId)
    .single()

  if (fetchErr || !fatura) {
    throw new Error('Fatura não encontrada.')
  }

  const now = new Date()
  const proximoVencimento = new Date()
  if (fatura.plano_slug === 'anual' || fatura.profissionais?.plano_tipo === 'anual') {
    proximoVencimento.setFullYear(proximoVencimento.getFullYear() + 1)
  } else {
    proximoVencimento.setDate(proximoVencimento.getDate() + 30)
  }

  // 1. Atualizar fatura
  const { error: updateFatErr } = await adminSupabase
    .from('saas_faturas')
    .update({
      status: 'pago',
      forma_pagamento: formaPagamento,
      data_pagamento: now.toISOString(),
    })
    .eq('id', invoiceId)

  if (updateFatErr) {
    console.error('[confirmInvoicePaymentManual] Erro ao atualizar fatura:', updateFatErr)
    throw new Error('Erro ao confirmar pagamento da fatura.')
  }

  // 2. Atualizar status da profissional para ativa e definir próximo vencimento
  const { error: updateProfErr } = await adminSupabase
    .from('profissionais')
    .update({
      status_conta: 'ativa',
      proximo_vencimento: proximoVencimento.toISOString(),
    })
    .eq('id', fatura.profissional_id)

  if (updateProfErr) {
    console.error('[confirmInvoicePaymentManual] Erro ao renovar conta:', updateProfErr)
  }

  // 3. Gravar Log de Auditoria
  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: 'confirmou pagamento manual de fatura SaaS',
      profissional_id: fatura.profissional_id,
      detalhes: {
        fatura_id: invoiceId,
        valor: fatura.valor,
        forma_pagamento: formaPagamento,
        proximo_vencimento: proximoVencimento.toISOString(),
        profissional_nome: fatura.profissionais?.nome,
      },
    },
  ])

  return { success: true }
}

/**
 * Estender o período de trial gratuito de uma profissional por N dias
 */
export async function extendProfissionalTrial(profissionalId: string, days: number = 7) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  // Buscar profissional atual
  const { data: prof, error: profErr } = await adminSupabase
    .from('profissionais')
    .select('nome, trial_ends_at, status_conta')
    .eq('id', profissionalId)
    .single()

  if (profErr || !prof) {
    throw new Error('Profissional não encontrada.')
  }

  const currentTrialEnd = prof.trial_ends_at ? new Date(prof.trial_ends_at) : new Date()
  const baseDate = currentTrialEnd > new Date() ? currentTrialEnd : new Date()
  const newTrialEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

  // Atualizar data de término do trial e garantir status_conta = 'trial'
  const { error: updateErr } = await adminSupabase
    .from('profissionais')
    .update({
      trial_ends_at: newTrialEnd.toISOString(),
      status_conta: 'trial',
    })
    .eq('id', profissionalId)

  if (updateErr) {
    console.error('[extendProfissionalTrial] Erro ao estender trial:', updateErr)
    throw new Error('Não foi possível estender o trial.')
  }

  // Auditoria
  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: `estendeu trial em +${days} dias`,
      profissional_id: profissionalId,
      detalhes: {
        dias_adicionados: days,
        nova_data_fim: newTrialEnd.toISOString(),
        profissional_nome: prof.nome,
      },
    },
  ])

  return { success: true, newTrialEnd: newTrialEnd.toISOString() }
}

/**
 * Alternar status de Cortesia/Parceira para uma profissional
 */
export async function toggleProfissionalCortesia(profissionalId: string, setCortesia: boolean) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const newStatus = setCortesia ? 'cortesia' : 'ativa'
  const newPlano = setCortesia ? 'cortesia' : 'mensal'

  const { error } = await adminSupabase
    .from('profissionais')
    .update({
      status_conta: newStatus,
      plano_tipo: newPlano,
    })
    .eq('id', profissionalId)

  if (error) {
    console.error('[toggleProfissionalCortesia] Erro:', error)
    throw new Error('Não foi possível alterar o status de cortesia.')
  }

  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: setCortesia ? 'concedeu cortesia (conta grátis)' : 'removeu cortesia',
      profissional_id: profissionalId,
      detalhes: { setCortesia, newStatus },
    },
  ])

  return { success: true }
}

/**
 * Criar fatura avulsa ou manual para uma profissional
 */
export async function createManualInvoice(
  profissionalId: string,
  valor: number,
  diasVencimento: number = 5,
  planoSlug: string = 'mensal'
) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const vencimento = new Date(Date.now() + diasVencimento * 24 * 60 * 60 * 1000)

  const { data, error } = await adminSupabase
    .from('saas_faturas')
    .insert([
      {
        profissional_id: profissionalId,
        plano_slug: planoSlug,
        valor,
        status: 'pendente',
        data_vencimento: vencimento.toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('[createManualInvoice] Erro:', error)
    throw new Error('Erro ao gerar fatura manual.')
  }

  return data
}

/**
 * Retorna os planos e cupons ativos do SaaS
 */
export async function getSaaSPlansAndCoupons() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data: planos } = await adminSupabase
    .from('saas_planos')
    .select('*')
    .order('preco', { ascending: true })

  const { data: cupons } = await adminSupabase
    .from('saas_cupons')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    planos: planos || [],
    cupons: cupons || [],
  }
}

/**
 * Criar ou atualizar cupom de desconto
 */
export async function saveSaaSCoupon(couponData: {
  codigo: string
  desconto_pct?: number
  desconto_valor?: number
  dias_trial_extra?: number
  limite_usos?: number
  ativo?: boolean
}) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('saas_cupons')
    .upsert(
      [
        {
          codigo: couponData.codigo.toUpperCase().trim(),
          desconto_pct: couponData.desconto_pct || null,
          desconto_valor: couponData.desconto_valor || null,
          dias_trial_extra: couponData.dias_trial_extra || 0,
          limite_usos: couponData.limite_usos || null,
          ativo: couponData.ativo ?? true,
        },
      ],
      { onConflict: 'codigo' }
    )
    .select()
    .single()

  if (error) {
    console.error('[saveSaaSCoupon] Erro ao salvar cupom:', error)
    throw new Error('Não foi possível salvar o cupom.')
  }

  return data
}

/**
 * Excluir cupom de desconto pelo ID
 */
export async function deleteSaaSCoupon(couponId: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('saas_cupons')
    .delete()
    .eq('id', couponId)

  if (error) {
    console.error('[deleteSaaSCoupon] Erro ao excluir cupom:', error)
    throw new Error('Não foi possível excluir o cupom.')
  }

  return { success: true }
}

/**
 * Atualiza o valor oficial do plano SaaS (por exemplo: Mensal R$ 69,90)
 */
export async function updateSaaSPlanPrice(planSlug: string, novoPreco: number) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('saas_planos')
    .update({ preco: novoPreco })
    .eq('slug', planSlug)

  if (error) {
    console.warn('[updateSaaSPlanPrice] Upserting plano:', error)
    await adminSupabase.from('saas_planos').upsert(
      [
        {
          slug: planSlug,
          nome: 'Mensal',
          preco: novoPreco,
          intervalo: 'mensal',
          descricao: 'Acesso completo com agendamentos ilimitados',
          ativo: true,
        },
      ],
      { onConflict: 'slug' }
    )
  }

  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: 'atualizou valor do plano SaaS',
      detalhes: { planSlug, novoPreco },
    },
  ])

  return { success: true }
}

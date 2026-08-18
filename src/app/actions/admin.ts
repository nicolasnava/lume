'use server'

import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getInactiveProfissionais,
  getProfissionalEngagementMetrics,
  getProfissionalActivityTimeline,
} from './adminPrompt34'

export interface AdminPeriodFilter {
  period: 'hoje' | 'semana' | 'mes' | '30dias' | 'ano' | 'custom'
  startDate?: string
  endDate?: string
}

/**
 * Calcula os intervalos de data (atual e anterior) com base no filtro.
 */
function getDateRanges(filter: AdminPeriodFilter) {
  const now = new Date()
  let start = new Date()
  let end = new Date()

  switch (filter.period) {
    case 'hoje':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'semana': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Segunda-feira
      start = new Date(now.setDate(diff))
      start.setHours(0, 0, 0, 0)
      end = new Date()
      break
    }
    case 'mes':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date()
      break
    case '30dias':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      end = new Date()
      break
    case 'ano':
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date()
      break
    case 'custom':
      start = filter.startDate ? new Date(filter.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      end = filter.endDate ? new Date(filter.endDate) : new Date()
      break
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      end = new Date()
  }

  // Período anterior (mesma duração)
  const durationMs = Math.max(end.getTime() - start.getTime(), 86400000)
  const prevStart = new Date(start.getTime() - durationMs)
  const prevEnd = new Date(start.getTime())

  return { start, end, prevStart, prevEnd }
}

/**
 * Retorna dados consolidados para o Dashboard Geral Admin (/admin)
 */
export async function getAdminDashboardData(filter: AdminPeriodFilter) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado ao painel administrativo.')
  }

  const adminSupabase = createAdminClient()
  const { start, end, prevStart, prevEnd } = getDateRanges(filter)

  // 1. Buscar profissionais reais (excluindo desativadas por soft delete)
  const { data: allProfissionais } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, categoria, status_conta, plano_tipo, valor_mensalidade, created_at, deletado_em')
    .is('deletado_em', null)

  const activeProfs = allProfissionais || []
  const totalProfissionais = activeProfs.length

  const profsPeriodoAtual = activeProfs.filter((p) => {
    const d = new Date(p.created_at)
    return d >= start && d <= end
  }).length

  const profsPeriodoAnterior = activeProfs.filter((p) => {
    const d = new Date(p.created_at)
    return d >= prevStart && d < prevEnd
  }).length

  let profsVariacaoPct = 0
  if (profsPeriodoAnterior > 0) {
    profsVariacaoPct = Math.round(((profsPeriodoAtual - profsPeriodoAnterior) / profsPeriodoAnterior) * 100)
  } else if (profsPeriodoAtual > 0) {
    profsVariacaoPct = 100
  }

  // 2. Agendamentos totais e no período
  const { data: allAgendamentos } = await adminSupabase
    .from('agendamentos')
    .select('id, data_hora_inicio, status, valor_cobrado, pago, profissional_id')

  const totalAgendamentosGeral = allAgendamentos?.length || 0

  const agendamentosPeriodo = (allAgendamentos || []).filter((a) => {
    const d = new Date(a.data_hora_inicio)
    return d >= start && d <= end
  })

  const agendamentosPrev = (allAgendamentos || []).filter((a) => {
    const d = new Date(a.data_hora_inicio)
    return d >= prevStart && d < prevEnd
  })

  let agendamentosVariacaoPct = 0
  if (agendamentosPrev.length > 0) {
    agendamentosVariacaoPct = Math.round(
      ((agendamentosPeriodo.length - agendamentosPrev.length) / agendamentosPrev.length) * 100
    )
  } else if (agendamentosPeriodo.length > 0) {
    agendamentosVariacaoPct = 100
  }

  // 3. Faturamento de atendimentos no período
  const faturamentoPeriodo = agendamentosPeriodo.reduce((acc, curr) => {
    if (curr.status === 'concluido' || curr.status === 'confirmado') {
      return acc + Number(curr.valor_cobrado || 0)
    }
    return acc
  }, 0)

  const faturamentoTotalGeral = (allAgendamentos || []).reduce((acc, curr) => {
    if (curr.status === 'concluido' || curr.status === 'confirmado') {
      return acc + Number(curr.valor_cobrado || 0)
    }
    return acc
  }, 0)

  // 4. MRR Estimado (soma do valor de mensalidade das profissionais com status_conta === 'ativa')
  const mrrEstimado = activeProfs
    .filter((p) => p.status_conta === 'ativa')
    .reduce((sum, p) => {
      const val = Number(p.valor_mensalidade || 39.90)
      return sum + (p.plano_tipo === 'anual' ? val / 12 : val)
    }, 0)

  // 5. Profissionais ativas (com status_conta ativa ou agendamento recente)
  const ativasCount = activeProfs.filter((p) => p.status_conta === 'ativa').length
  const inativasCount = totalProfissionais - ativasCount

  // 6. Distribuição por Status de Conta (Saúde do SaaS & Funil)
  const statusDistributionMap: Record<string, number> = {
    ativa: 0,
    trial: 0,
    cortesia: 0,
    atrasada: 0,
    suspensa: 0,
    cancelada: 0,
  }

  activeProfs.forEach((p) => {
    const s = (p.status_conta || 'trial').toLowerCase()
    if (statusDistributionMap[s] !== undefined) {
      statusDistributionMap[s] += 1
    } else {
      statusDistributionMap.trial += 1
    }
  })

  const statusDistribution = [
    { name: 'Ativas', key: 'ativa', value: statusDistributionMap.ativa, color: '#2EB886' },
    { name: 'Trial (7D)', key: 'trial', value: statusDistributionMap.trial, color: '#B8A9D9' },
    { name: 'Cortesia', key: 'cortesia', value: statusDistributionMap.cortesia, color: '#8C5383' },
    { name: 'Atrasadas', key: 'atrasada', value: statusDistributionMap.atrasada, color: '#F59E0B' },
    { name: 'Suspensas', key: 'suspensa', value: statusDistributionMap.suspensa, color: '#F97316' },
    { name: 'Canceladas', key: 'cancelada', value: statusDistributionMap.cancelada, color: '#F43F5E' },
  ]

  // Distribuição por Plano (retrocompatibilidade)
  const planosDistributionMap = { Mensal: 0, Anual: 0, Cortesia: 0 }
  activeProfs.forEach((p) => {
    if (p.status_conta === 'cortesia') {
      planosDistributionMap.Cortesia += 1
    } else if (p.plano_tipo === 'anual') {
      planosDistributionMap.Anual += 1
    } else {
      planosDistributionMap.Mensal += 1
    }
  })

  const planosDistribution = [
    { plano: 'Mensal', esteMes: planosDistributionMap.Mensal },
    { plano: 'Anual', esteMes: planosDistributionMap.Anual },
    { plano: 'Cortesia', esteMes: planosDistributionMap.Cortesia },
  ]

  // 7. Timeline Real para Gráfico
  const timelineMap: Record<string, { dataLabel: string; cadastros: number; agendamentos: number }> = {}
  const isLongPeriod = (end.getTime() - start.getTime()) > 60 * 24 * 60 * 60 * 1000

  const currDate = new Date(start)
  while (currDate <= end) {
    const key = isLongPeriod
      ? `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}`
      : currDate.toISOString().split('T')[0]

    const dataLabel = isLongPeriod
      ? currDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      : currDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

    if (!timelineMap[key]) {
      timelineMap[key] = { dataLabel, cadastros: 0, agendamentos: 0 }
    }

    if (isLongPeriod) {
      currDate.setMonth(currDate.getMonth() + 1)
    } else {
      currDate.setDate(currDate.getDate() + 1)
    }
  }

  activeProfs.forEach((p) => {
    const d = new Date(p.created_at)
    if (d >= start && d <= end) {
      const key = isLongPeriod
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : d.toISOString().split('T')[0]
      if (timelineMap[key]) {
        timelineMap[key].cadastros += 1
      }
    }
  })

  agendamentosPeriodo.forEach((a) => {
    const d = new Date(a.data_hora_inicio)
    const key = isLongPeriod
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : d.toISOString().split('T')[0]
    if (timelineMap[key]) {
      timelineMap[key].agendamentos += 1
    }
  })

  const chartData = Object.values(timelineMap)

  // 8. Top Profissionais Reais
  const profAgendamentoMap: Record<string, { count: number; receita: number }> = {}
  ;(allAgendamentos || []).forEach((a) => {
    if (a.profissional_id) {
      if (!profAgendamentoMap[a.profissional_id]) {
        profAgendamentoMap[a.profissional_id] = { count: 0, receita: 0 }
      }
      profAgendamentoMap[a.profissional_id].count += 1
      if (a.status === 'concluido' || a.status === 'confirmado') {
        profAgendamentoMap[a.profissional_id].receita += Number(a.valor_cobrado || 0)
      }
    }
  })

  const topProfissionais = activeProfs
    .map((p) => {
      const cat = Array.isArray(p.categoria) ? p.categoria[0] : p.categoria || 'Geral'
      return {
        id: p.id,
        nome: p.nome,
        cat,
        agendamentos: profAgendamentoMap[p.id]?.count || 0,
        receitaNum: profAgendamentoMap[p.id]?.receita || 0,
      }
    })
    .sort((a, b) => b.agendamentos - a.agendamentos)
    .slice(0, 3)

  // 9. Atividade Recente Real
  const emailMap = new Map<string, string>()
  try {
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 100 })
    if (usersData?.users) {
      usersData.users.forEach((u) => {
        if (u.email) emailMap.set(u.id, u.email)
      })
    }
  } catch (err) {
    console.warn('[getAdminDashboardData] Erro ao buscar emails auth:', err)
  }

  const atividadeRecente = activeProfs
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((p) => {
      const mrrVal = p.status_conta === 'ativa' ? Number(p.valor_mensalidade || 39.90) : 0
      return {
        id: p.id,
        nome: p.nome,
        email: emailMap.get(p.id) || 'Email não localizado',
        plano: p.status_conta === 'cortesia' ? 'Cortesia' : p.plano_tipo === 'anual' ? 'Anual' : 'Mensal',
        mrr: mrrVal > 0 ? `R$ ${mrrVal.toFixed(2).replace('.', ',')}` : 'R$ 0,00',
        status: p.status_conta === 'ativa' ? 'Ativa' : p.status_conta === 'trial' ? 'Trial' : p.status_conta === 'cortesia' ? 'Cortesia' : 'Suspensa',
        entrada: new Date(p.created_at).toLocaleDateString('pt-BR'),
      }
    })

  // 10. Profissionais Inativas (>14 dias sem login)
  let inactiveProfissionais: Awaited<ReturnType<typeof getInactiveProfissionais>> = []
  try {
    inactiveProfissionais = await getInactiveProfissionais(14)
  } catch (err) {
    console.warn('[getAdminDashboardData] Erro ao buscar inativas:', err)
  }

  return {
    totalProfissionais,
    profsPeriodoAtual,
    profsVariacaoPct,
    totalAgendamentosGeral,
    agendamentosPeriodoTotal: agendamentosPeriodo.length,
    agendamentosVariacaoPct,
    faturamentoPeriodo,
    faturamentoTotalGeral,
    mrrEstimado,
    ativasCount,
    inativasCount,
    chartData,
    planosDistribution,
    statusDistribution,
    topProfissionais,
    atividadeRecente,
    inactiveProfissionais,
  }
}

/**
 * Retorna a listagem de profissionais com suporte a soft delete (includeDeactivated)
 */
export async function getAdminProfissionais(
  search: string = '',
  sortBy: 'created_at' | 'agendamentos_count' = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  includeDeactivated: boolean = false
) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  // Buscar profissionais (filtrando deletado_em a menos que solicitado)
  let query = adminSupabase
    .from('profissionais')
    .select('id, nome, slug, categoria, status_conta, created_at, foto_url, notas_internas, deletado_em')

  if (!includeDeactivated) {
    query = query.is('deletado_em', null)
  }

  const { data: profs, error } = await query.order('created_at', { ascending: sortOrder === 'asc' })

  if (error) {
    console.error('[getAdminProfissionais] Erro:', error)
    throw new Error('Erro ao carregar profissionais.')
  }

  // Buscar emails via Auth Admin
  const emailMap = new Map<string, string>()
  try {
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    if (usersData?.users) {
      usersData.users.forEach((u) => {
        if (u.email) {
          emailMap.set(u.id, u.email)
        }
      })
    }
  } catch (err) {
    console.warn('[getAdminProfissionais] Não foi possível listar emails de auth:', err)
  }

  // Buscar contagem de agendamentos por profissional
  const { data: agendamentosData } = await adminSupabase
    .from('agendamentos')
    .select('profissional_id')

  const agendamentosCountMap: Record<string, number> = {}
  ;(agendamentosData || []).forEach((a) => {
    agendamentosCountMap[a.profissional_id] = (agendamentosCountMap[a.profissional_id] || 0) + 1
  })

  // Mapear resultado completo
  let result = (profs || []).map((p) => {
    return {
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      categoria: p.categoria,
      status_conta: (p.status_conta || 'trial') as 'trial' | 'ativa' | 'suspensa',
      created_at: p.created_at,
      foto_url: p.foto_url,
      email: emailMap.get(p.id) || 'Email não localizado',
      total_agendamentos: agendamentosCountMap[p.id] || 0,
      notas_internas: p.notas_internas || null,
      deletado_em: p.deletado_em || null,
    }
  })

  // Aplicar busca (filtra por nome, email ou slug)
  if (search.trim()) {
    const term = search.toLowerCase().trim()
    result = result.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term)
    )
  }

  // Aplicar ordenação se for por agendamentos_count
  if (sortBy === 'agendamentos_count') {
    result.sort((a, b) =>
      sortOrder === 'asc' ? a.total_agendamentos - b.total_agendamentos : b.total_agendamentos - a.total_agendamentos
    )
  }

  return result
}

/**
 * Retorna os detalhes de uma profissional específica para o admin
 */
export async function getAdminProfissionalDetail(id: string, filterPeriod: AdminPeriodFilter) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  // 1. Registro da Profissional
  const { data: prof, error: profError } = await adminSupabase
    .from('profissionais')
    .select('*')
    .eq('id', id)
    .single()

  if (profError || !prof) {
    throw new Error('Profissional não encontrada.')
  }

  // 2. Email de Auth
  let email = 'Email não disponível'
  try {
    const { data: userData } = await adminSupabase.auth.admin.getUserById(id)
    if (userData?.user?.email) {
      email = userData.user.email
    }
  } catch (err) {
    console.warn('[getAdminProfissionalDetail] Erro ao buscar email auth:', err)
  }

  // 3. Lista de serviços
  const { data: servicos } = await adminSupabase
    .from('servicos')
    .select('*')
    .eq('profissional_id', id)
    .order('nome', { ascending: true })

  // 4. Histórico de agendamentos com dados de cliente e serviço
  const { data: agendamentosRaw } = await adminSupabase
    .from('agendamentos')
    .select('*, clientes(nome, telefone), servicos(nome)')
    .eq('profissional_id', id)
    .order('data_hora_inicio', { ascending: false })

  const { start, end } = getDateRanges(filterPeriod)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agendamentos = (agendamentosRaw || []).map((item: any) => ({
    id: item.id,
    data_hora_inicio: item.data_hora_inicio,
    data_hora_fim: item.data_hora_fim,
    status: item.status,
    valor_cobrado: item.valor_cobrado ? Number(item.valor_cobrado) : null,
    pago: item.pago,
    forma_pagamento: item.forma_pagamento,
    cliente_nome: item.clientes?.nome || 'Cliente não identificado',
    cliente_telefone: item.clientes?.telefone || '',
    servico_nome: item.servicos?.nome || 'Serviço',
  }))

  const agendamentosFiltrados = agendamentos.filter((a) => {
    const d = new Date(a.data_hora_inicio)
    return d >= start && d <= end
  })

  // 5. Resumo financeiro (total e por forma de pagamento)
  let faturamentoTotal = 0
  const faturamentoPorForma: Record<string, number> = {
    pix: 0,
    dinheiro: 0,
    cartao_credito: 0,
    cartao_debito: 0,
    outro: 0,
  }

  agendamentos.forEach((a) => {
    if (a.status === 'concluido' && a.pago && a.valor_cobrado) {
      const val = a.valor_cobrado
      faturamentoTotal += val

      const forma = a.forma_pagamento || 'outro'
      faturamentoPorForma[forma] = (faturamentoPorForma[forma] || 0) + val
    }
  })

  // 6. Métricas de engajamento e linha do tempo de atividade
  let engagementMetrics = null
  let activityTimeline: Awaited<ReturnType<typeof getProfissionalActivityTimeline>> = []
  try {
    engagementMetrics = await getProfissionalEngagementMetrics(id)
    activityTimeline = await getProfissionalActivityTimeline(id)
  } catch (err) {
    console.warn('[getAdminProfissionalDetail] Erro ao carregar engajamento/timeline:', err)
  }

  return {
    profissional: {
      ...prof,
      email,
      status_conta: (prof.status_conta || 'trial') as 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada',
    },
    servicos: servicos || [],
    agendamentos: agendamentosFiltrados,
    totalAgendamentosCount: agendamentos.length,
    faturamentoTotal,
    faturamentoPorForma,
    engagementMetrics,
    activityTimeline,
  }
}

/**
 * Atualiza o status da conta de uma profissional (trial, ativa, atrasada, suspensa, cortesia, cancelada) e grava no audit log
 */
export async function updateProfissionalStatus(
  id: string,
  newStatus: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  // Buscar status atual
  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('status_conta, nome')
    .eq('id', id)
    .single()

  const statusAnterior = prof?.status_conta || 'trial'

  // Atualizar status
  const { error } = await adminSupabase
    .from('profissionais')
    .update({ status_conta: newStatus })
    .eq('id', id)

  if (error) {
    console.error('[updateProfissionalStatus] Erro ao atualizar status:', error)
    throw new Error('Não foi possível atualizar o status da conta.')
  }

  // Mapear ação para log
  let acaoText = `alterou status para ${newStatus}`
  if (newStatus === 'suspensa') acaoText = 'suspendeu conta'
  else if (newStatus === 'ativa') acaoText = 'reativou conta'

  // Registrar no log de auditoria
  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: acaoText,
      profissional_id: id,
      detalhes: {
        status_anterior: statusAnterior,
        status_novo: newStatus,
        profissional_nome: prof?.nome,
      },
    },
  ])

  return { success: true }
}

/**
 * Atualiza as notas internas de uma profissional e grava no audit log
 */
export async function updateProfissionalNotas(id: string, notas: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('nome')
    .eq('id', id)
    .single()

  const { error } = await adminSupabase
    .from('profissionais')
    .update({ notas_internas: notas })
    .eq('id', id)

  if (error) {
    console.error('[updateProfissionalNotas] Erro ao salvar notas:', error)
    throw new Error('Não foi possível salvar as notas internas.')
  }

  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: 'editou notas internas',
      profissional_id: id,
      detalhes: {
        profissional_nome: prof?.nome,
        tamanho_notas: notas.length,
      },
    },
  ])

  return { success: true }
}

/**
 * Retorna os logs de auditoria dos administradores
 */
export async function getAdminLogs(adminFilter?: string, profissionalFilter?: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  let query = adminSupabase
    .from('admin_logs')
    .select('*, admin_users(nome, email), profissionais(nome, slug)')
    .order('created_at', { ascending: false })

  if (adminFilter && adminFilter !== 'todos') {
    query = query.eq('admin_id', adminFilter)
  }

  if (profissionalFilter && profissionalFilter !== 'todos') {
    query = query.eq('profissional_id', profissionalFilter)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error('[getAdminLogs] Erro ao buscar logs:', error)
    throw new Error('Erro ao carregar logs de auditoria.')
  }

  // Buscar todos os admins e profissionais para compor os selects de filtro
  const { data: adminsList } = await adminSupabase.from('admin_users').select('id, nome, email')
  const { data: profsList } = await adminSupabase.from('profissionais').select('id, nome, slug')

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logs: (logs || []).map((l: any) => ({
      id: l.id,
      admin_id: l.admin_id,
      admin_nome: l.admin_users?.nome || l.admin_users?.email || 'Admin',
      admin_email: l.admin_users?.email || '',
      acao: l.acao,
      profissional_id: l.profissional_id,
      profissional_nome: l.profissionais?.nome || null,
      profissional_slug: l.profissionais?.slug || null,
      detalhes: l.detalhes,
      created_at: l.created_at,
    })),
    adminsList: adminsList || [],
    profsList: profsList || [],
  }
}

/**
 * Atualiza o valor de mensalidade personalizada de uma profissional
 */
export async function updateProfissionalValorMensalidade(id: string, valorMensalidade: number) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('nome, valor_mensalidade')
    .eq('id', id)
    .single()

  const { error } = await adminSupabase
    .from('profissionais')
    .update({ valor_mensalidade: valorMensalidade })
    .eq('id', id)

  if (error) {
    console.error('[updateProfissionalValorMensalidade] Erro:', error)
    throw new Error('Não foi possível atualizar o valor da mensalidade.')
  }

  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: 'alterou valor de mensalidade',
      profissional_id: id,
      detalhes: {
        profissional_nome: prof?.nome,
        valor_anterior: prof?.valor_mensalidade,
        valor_novo: valorMensalidade,
      },
    },
  ])

  return { success: true }
}

/**
 * Desativa e oculta a conta de uma profissional (Soft Delete: deletado_em = now())
 * Preserva todo o histórico financeiro e de agendamentos no banco de dados.
 */
export async function deleteProfissionalAccount(id: string) {
  return deactivateProfissionalAccount(id)
}

export async function deactivateProfissionalAccount(id: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('nome')
    .eq('id', id)
    .single()

  // Soft Delete: marcar deletado_em com timestamp atual e status suspensa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profError } = await (adminSupabase.from('profissionais') as any)
    .update({
      deletado_em: new Date().toISOString(),
      status_conta: 'suspensa',
    })
    .eq('id', id)

  if (profError) {
    console.error('[deactivateProfissionalAccount] Erro ao desativar profissional:', profError)
    throw new Error('Erro ao desativar conta da profissional.')
  }

  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: 'desativou e ocultou conta (soft delete)',
      profissional_id: id,
      detalhes: {
        profissional_nome: prof?.nome,
      },
    },
  ])

  return { success: true }
}

/**
 * Restaura uma conta previamente desativada (Soft Delete rollback)
 */
export async function restoreProfissionalAccount(id: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('nome')
    .eq('id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profError } = await (adminSupabase.from('profissionais') as any)
    .update({
      deletado_em: null,
      status_conta: 'ativa',
    })
    .eq('id', id)

  if (profError) {
    console.error('[restoreProfissionalAccount] Erro ao restaurar profissional:', profError)
    throw new Error('Erro ao restaurar conta da profissional.')
  }

  await adminSupabase.from('admin_logs').insert([
    {
      admin_id: admin.id,
      acao: 'restaurou conta desativada',
      profissional_id: id,
      detalhes: {
        profissional_nome: prof?.nome,
      },
    },
  ])

  return { success: true }
}

/**
 * Retorna dados analíticos profundos e métricas comparativas para a página /admin/analises
 */
export async function getAdminAnalyticsData() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  // 1. Todas as profissionais
  const { data: profs } = await adminSupabase
    .from('profissionais')
    .select('id, nome, categoria, status_conta, created_at, valor_mensalidade')

  // 2. Todos os agendamentos
  const { data: agendamentos } = await adminSupabase
    .from('agendamentos')
    .select('id, status, valor_cobrado, data_hora_inicio, created_at')

  const totalProfs = profs?.length || 0
  const ativasCount = (profs || []).filter((p) => p.status_conta === 'ativa').length
  const trialCount = (profs || []).filter((p) => p.status_conta === 'trial').length
  const suspensasCount = (profs || []).filter((p) => p.status_conta === 'suspensa' || p.status_conta === 'cancelada').length

  // Categorias
  const categoriaMap: Record<string, number> = {}
  ;(profs || []).forEach((p) => {
    const cats = Array.isArray(p.categoria) ? p.categoria : [p.categoria || 'Geral']
    cats.forEach((c) => {
      const name = c || 'Outros'
      categoriaMap[name] = (categoriaMap[name] || 0) + 1
    })
  })

  const categoriasData = Object.entries(categoriaMap).map(([name, count]) => ({
    name,
    value: count,
  }))

  // Agendamentos por Dia da Semana
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const agendamentosPorDiaMap: Record<string, number> = {
    Dom: 0,
    Seg: 0,
    Ter: 0,
    Qua: 0,
    Qui: 0,
    Sex: 0,
    Sáb: 0,
  }

  ;(agendamentos || []).forEach((a) => {
    const d = new Date(a.data_hora_inicio)
    const diaNome = diasSemana[d.getDay()]
    if (agendamentosPorDiaMap[diaNome] !== undefined) {
      agendamentosPorDiaMap[diaNome] += 1
    }
  })

  const agendamentosPorDiaData = diasSemana.map((dia) => ({
    dia,
    volume: agendamentosPorDiaMap[dia] || 0,
  }))

  // Faturamento e MRR Histórico (12 Meses)
  const now = new Date()
  const mrrEvolucaoData = []
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    // Assinantes ativas acumuladas até o mês
    const profsAtivasMes = (profs || []).filter(
      (p) => new Date(p.created_at) <= monthEnd && p.status_conta === 'ativa'
    )
    const mrrMes = profsAtivasMes.reduce((sum, p) => sum + Number(p.valor_mensalidade || 39.90), 0)

    // Agendamentos concluídos no mês
    const agendamentosMes = (agendamentos || []).filter((a) => {
      const d = new Date(a.data_hora_inicio)
      return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear()
    })
    const receitaAtendimentosMes = agendamentosMes
      .filter((a) => a.status === 'concluido' || a.status === 'confirmado')
      .reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0)

    mrrEvolucaoData.push({
      mes: label,
      mrr: Math.round(mrrMes * 100) / 100,
      atendimentos: agendamentosMes.length,
      receitaAtendimentos: Math.round(receitaAtendimentosMes * 100) / 100,
    })
  }

  return {
    totalProfs,
    ativasCount,
    trialCount,
    suspensasCount,
    totalAgendamentos: agendamentos?.length || 0,
    categoriasData,
    agendamentosPorDiaData,
    mrrEvolucaoData,
  }
}

/**
 * Gera um diagnóstico de inteligência artificial sobre o perfil da profissional
 */
export async function getProfissionalAIDiagnostic(profissionalId: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('*, servicos(*)')
    .eq('id', profissionalId)
    .single()

  if (!prof) {
    throw new Error('Profissional não encontrada.')
  }

  const missingItems: string[] = []
  let score = 100

  if (!prof.foto_url) {
    missingItems.push('Sem foto de perfil cadastrada (-20%)')
    score -= 20
  }
  if (!prof.bio || prof.bio.trim().length < 10) {
    missingItems.push('Apresentação / Bio ausente ou muito curta (-20%)')
    score -= 20
  }
  if (!prof.whatsapp) {
    missingItems.push('WhatsApp não configurado (-20%)')
    score -= 20
  }
  if (!prof.instagram) {
    missingItems.push('Instagram não informado (-10%)')
    score -= 10
  }
  if (!prof.servicos || prof.servicos.length === 0) {
    missingItems.push('Nenhum serviço cadastrado na tabela (-30%)')
    score -= 30
  }

  score = Math.max(0, score)

  const recomendacaoText =
    score >= 80
      ? 'Perfil excelente! Pronto para alta conversão de agendamentos.'
      : score >= 50
      ? 'Perfil mediano. Faltam informações chave para inspirar confiança nas clientes.'
      : 'Perfil incompleto! Risco alto de perda de clientes por falta de informações básicas.'

  const whatsappMessage = encodeURIComponent(
    `Olá ${prof.nome}! Notamos que seu perfil no Lumê está ${score}% completo. ${
      missingItems.length > 0 ? `Para encantar mais clientes, recomendamos adicionar: ${missingItems.join(', ')}.` : ''
    } Acesse seu painel no Lumê para atualizar em 2 minutinhos!`
  )

  return {
    score,
    missingItems,
    recomendacaoText,
    whatsappUrl: prof.whatsapp ? `https://wa.me/${prof.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}` : `https://wa.me/?text=${whatsappMessage}`,
  }
}

/**
 * Retorna as Top Profissionais com maior volume de agendamentos (Leaderboard)
 */
export async function getTopProfissionaisLeaderboard() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()

  const { data: profs } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, categoria, status_conta, foto_url')

  const { data: agendamentos } = await adminSupabase
    .from('agendamentos')
    .select('profissional_id, valor_cobrado, status')

  const countMap: Record<string, { count: number; receita: number }> = {}

  ;(agendamentos || []).forEach((a) => {
    if (a.profissional_id) {
      if (!countMap[a.profissional_id]) {
        countMap[a.profissional_id] = { count: 0, receita: 0 }
      }
      countMap[a.profissional_id].count += 1
      if (a.status === 'concluido' || a.status === 'confirmado') {
        countMap[a.profissional_id].receita += Number(a.valor_cobrado || 0)
      }
    }
  })

  const leaderboard = (profs || [])
    .map((p) => ({
      ...p,
      agendamentosCount: countMap[p.id]?.count || 0,
      receitaTotal: countMap[p.id]?.receita || 0,
    }))
    .sort((a, b) => b.agendamentosCount - a.agendamentosCount)
    .slice(0, 5)

  return leaderboard
}

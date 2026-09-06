import { createAdminClient } from '@/lib/supabase/admin'

/**
 * ============================================================================
 * AUDITORIA DE PRIVACIDADE E DADOS ENVIADOS AO MODELO GEMINI
 * ============================================================================
 * Este arquivo agrega EXCLUSIVAMENTE métricas estatísticas consolidadas e
 * anonimizadas do ecossistema Lumê para alimentar o assistente de IA consultivo.
 * 
 * - CAMPOS NUNCA ENVIADOS AO MODELO (GARANTIA DE PRIVACIDADE):
 * - Nomes completos de clientes finais (apenas contagens numéricas).
 * - Telefones, WhatsApp e contatos pessoais.
 * - Endereços de e-mail e CPFs.
 * - Senhas, hashes de tokens e credenciais.
 * - Conteúdo de notas internas confidenciais.
 * 
 * - CAMPOS CONSOLIDADOS ENVIADOS AO MODELO (AUDITÁVEIS):
 * 1. Métricas de Profissionais:
 *    - total_cadastradas: Total geral de profissionais ativas na base
 *    - por_status: Contagem agrupada por status (ativa, trial, atrasada, suspensa)
 *    - novas_ultimos_7_dias: Total de cadastros nos últimos 7 dias
 *    - novas_ultimos_30_dias: Total de cadastros nos últimos 30 dias
 *    - inativas_mais_14_dias_qtd: Quantidade de profissionais sem login há > 14 dias
 *    - studios_inativos_amostra: Nome público dos studios inativos (apenas nome fantasia comercial, ex: "Studio Bela")
 * 
 * 2. Métricas Financeiras Agregadas:
 *    - faturamento_semana_atual_brl: Soma de agendamentos concluídos na semana corrente
 *    - faturamento_semana_anterior_brl: Soma de agendamentos concluídos na semana passada
 *    - faturamento_semana_variacao_pct: Variação percentual entre semanas
 *    - faturamento_mes_atual_brl: Soma de agendamentos concluídos no mês corrente
 *    - faturamento_mes_anterior_brl: Soma no mês anterior
 *    - faturamento_mes_variacao_pct: Variação percentual entre meses
 *    - ticket_medio_geral_brl: Ticket médio dos agendamentos concluídos
 * 
 * 3. Métricas Operacionais de Agendamentos (Últimos 30 Dias):
 *    - total_agendamentos: Quantidade total no período
 *    - concluidos: Quantidade e percentual (%) de concluídos com sucesso
 *    - cancelados: Quantidade e percentual (%) de cancelados
 *    - no_show: Quantidade e percentual (%) de não comparecimento
 *    - pendentes: Quantidade de agendamentos futuros/pendentes
 * 
 * 4. Satisfação e Qualidade (NPS):
 *    - nps_media: Média geral das notas de NPS (escala 0 a 10)
 *    - total_respostas_nps: Volume de avaliações coletadas
 *    - distribuicao: Promotores (9-10), Neutros (7-8) e Detratores (0-6)
 * 
 * 5. Feedbacks da Plataforma:
 *    - feedbacks_novos_nao_analisados: Quantidade de feedbacks pendentes de triagem
 *    - por_tipo: Contagem de bugs, sugestões, elogios e outros
 * 
 * 6. Alertas do Sistema:
 *    - contas_em_risco_inatividade: Flag e contagem de churn potencial
 *    - cancelamentos_elevados: Flag caso taxa de cancelamento > 20%
 * ============================================================================
 */

export interface AggregatedAdminContext {
  gerado_em: string
  profissionais: {
    total_cadastradas: number
    por_status: {
      ativas: number
      trial: number
      atrasadas: number
      suspensas_ou_bloqueadas: number
      outras: number
    }
    novas_ultimos_7_dias: number
    novas_ultimos_30_dias: number
    inativas_mais_14_dias: {
      quantidade: number
      studios_amostra: string[]
    }
  }
  financeiro: {
    faturamento_semana_atual_brl: number
    faturamento_semana_anterior_brl: number
    faturamento_semana_variacao_pct: number
    faturamento_mes_atual_brl: number
    faturamento_mes_anterior_brl: number
    faturamento_mes_variacao_pct: number
    ticket_medio_geral_brl: number
  }
  agendamentos_30_dias: {
    total: number
    concluidos_qtd: number
    concluidos_taxa_pct: number
    cancelados_qtd: number
    cancelados_taxa_pct: number
    no_show_qtd: number
    no_show_taxa_pct: number
    pendentes_qtd: number
  }
  satisfacao_nps: {
    nps_media: number
    total_respostas: number
    promotores_qtd: number
    neutros_qtd: number
    detratores_qtd: number
  }
  feedbacks_plataforma: {
    total_recebidos: number
    novos_nao_analisados: number
    por_tipo: {
      bugs: number
      sugestoes: number
      elogios: number
      outros: number
    }
  }
  alertas_sistema: string[]
}

/**
 * Coleta e consolida as métricas do banco de dados para alimentar a IA
 */
export async function getAggregatedAdminContext(): Promise<AggregatedAdminContext> {
  const adminSupabase = createAdminClient()
  const now = new Date()

  // 1. INTERVALOS DE DATAS
  const seteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const catorzeDiasAtras = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Semana atual (últimos 7 dias) vs Semana anterior (dias 8 a 14)
  const semanaAtualInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const semanaAnteriorInicio = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const semanaAnteriorFim = semanaAtualInicio

  // Mês atual (últimos 30 dias) vs Mês anterior (dias 31 a 60)
  const mesAtualInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const mesAnteriorInicio = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const mesAnteriorFim = mesAtualInicio

  // 2. BUSCA DE PROFISSIONAIS (Excluindo contas demo)
  const { data: rawProfissionais } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, status_conta, plano_tipo, created_at, deletado_em, is_demo')
    .is('deletado_em', null)

  const profissionais = (rawProfissionais || []).filter((p: any) => !p.is_demo)
  const totalProfissionais = profissionais.length

  const porStatus = {
    ativas: 0,
    trial: 0,
    atrasadas: 0,
    suspensas_ou_bloqueadas: 0,
    outras: 0,
  }

  let novas7d = 0
  let novas30d = 0

  profissionais.forEach((p) => {
    const st = (p.status_conta || '').toLowerCase()
    if (st === 'ativo' || st === 'ativa') porStatus.ativas++
    else if (st === 'trial' || st === 'gratis') porStatus.trial++
    else if (st === 'atrasado' || st === 'inadimplente') porStatus.atrasadas++
    else if (st === 'bloqueado' || st === 'suspenso' || st === 'cancelado') porStatus.suspensas_ou_bloqueadas++
    else porStatus.outras++

    if (p.created_at >= seteDiasAtras) novas7d++
    if (p.created_at >= trintaDiasAtras) novas30d++
  })

  // 3. INATIVIDADE (> 14 dias sem login)
  const { data: recentLogins } = await adminSupabase
    .from('login_logs')
    .select('profissional_id, created_at')
    .gte('created_at', catorzeDiasAtras)

  const activeProfIdsSet = new Set((recentLogins || []).map((l) => l.profissional_id))

  const inativasList = profissionais.filter((p) => !activeProfIdsSet.has(p.id))
  const inativasQtd = inativasList.length
  const studiosInativosAmostra = inativasList
    .slice(0, 5)
    .map((p) => p.nome || p.slug || 'Profissional')

  // 4. AGENDAMENTOS E FATURAMENTO (Excluindo contas demo)
  const nonDemoProfIds = new Set(profissionais.map((p) => p.id))
  const { data: rawAgendamentos } = await adminSupabase
    .from('agendamentos')
    .select('id, status, valor_cobrado, created_at, profissional_id')
    .gte('created_at', mesAnteriorInicio)

  const allAgendamentos = (rawAgendamentos || []).filter((a: any) => nonDemoProfIds.has(a.profissional_id))

  // Agendamentos dos últimos 30 dias
  const agendamentos30d = allAgendamentos.filter((a) => a.created_at >= mesAtualInicio)
  const totalAgendamentos30d = agendamentos30d.length

  let concluidos30dQtd = 0
  let cancelados30dQtd = 0
  let noShow30dQtd = 0
  let pendentes30dQtd = 0
  let somaValorConcluidos30d = 0

  agendamentos30d.forEach((a) => {
    const st = (a.status || '').toLowerCase()
    const val = Number(a.valor_cobrado) || 0

    if (st === 'concluido' || st === 'confirmado') {
      concluidos30dQtd++
      somaValorConcluidos30d += val
    } else if (st === 'cancelado') {
      cancelados30dQtd++
    } else if (st === 'no_show') {
      noShow30dQtd++
    } else {
      pendentes30dQtd++
    }
  })

  const concluidosTaxaPct = totalAgendamentos30d > 0 ? Math.round((concluidos30dQtd / totalAgendamentos30d) * 100) : 0
  const canceladosTaxaPct = totalAgendamentos30d > 0 ? Math.round((cancelados30dQtd / totalAgendamentos30d) * 100) : 0
  const noShowTaxaPct = totalAgendamentos30d > 0 ? Math.round((noShow30dQtd / totalAgendamentos30d) * 100) : 0
  const ticketMedio = concluidos30dQtd > 0 ? Math.round(somaValorConcluidos30d / concluidos30dQtd) : 0

  // Comparação Semana Atual vs Semana Anterior
  let fatSemanaAtual = 0
  let fatSemanaAnterior = 0

  allAgendamentos.forEach((a) => {
    const st = (a.status || '').toLowerCase()
    const val = Number(a.valor_cobrado) || 0
    const isDone = st === 'concluido' || st === 'confirmado'

    if (isDone) {
      if (a.created_at >= semanaAtualInicio) {
        fatSemanaAtual += val
      } else if (a.created_at >= semanaAnteriorInicio && a.created_at < semanaAnteriorFim) {
        fatSemanaAnterior += val
      }
    }
  })

  const fatSemanaVarPct =
    fatSemanaAnterior > 0
      ? Math.round(((fatSemanaAtual - fatSemanaAnterior) / fatSemanaAnterior) * 100)
      : fatSemanaAtual > 0
      ? 100
      : 0

  // Comparação Mês Atual vs Mês Anterior
  let fatMesAnterior = 0
  allAgendamentos.forEach((a) => {
    const st = (a.status || '').toLowerCase()
    const val = Number(a.valor_cobrado) || 0
    const isDone = st === 'concluido' || st === 'confirmado'

    if (isDone && a.created_at >= mesAnteriorInicio && a.created_at < mesAnteriorFim) {
      fatMesAnterior += val
    }
  })

  const fatMesVarPct =
    fatMesAnterior > 0
      ? Math.round(((somaValorConcluidos30d - fatMesAnterior) / fatMesAnterior) * 100)
      : somaValorConcluidos30d > 0
      ? 100
      : 0

  // 5. SATISFAÇÃO / NPS
  let npsMedia = 0
  let totalNps = 0
  let promotores = 0
  let neutros = 0
  let detratores = 0

  try {
    const { data: npsRows } = await adminSupabase
      .from('nps_respostas')
      .select('nota')
      .gte('created_at', trintaDiasAtras)

    if (npsRows && npsRows.length > 0) {
      totalNps = npsRows.length
      const somaNotas = npsRows.reduce((acc, row) => acc + (Number(row.nota) || 0), 0)
      npsMedia = Math.round((somaNotas / totalNps) * 10) / 10

      npsRows.forEach((r) => {
        const n = Number(r.nota) || 0
        if (n >= 9) promotores++
        else if (n >= 7) neutros++
        else detratores++
      })
    }
  } catch {
    // Tabela NPS pode estar vazia
  }

  // 6. FEEDBACKS
  let totalFeedbacks = 0
  let novosFeedbacks = 0
  const feedbacksPorTipo = { bugs: 0, sugestoes: 0, elogios: 0, outros: 0 }

  try {
    const { data: feedbackRows } = await adminSupabase
      .from('feedbacks')
      .select('tipo, status')

    if (feedbackRows && feedbackRows.length > 0) {
      totalFeedbacks = feedbackRows.length
      feedbackRows.forEach((f) => {
        if (f.status === 'novo') novosFeedbacks++
        const tp = (f.tipo || '').toLowerCase()
        if (tp === 'bug') feedbacksPorTipo.bugs++
        else if (tp === 'sugestao') feedbacksPorTipo.sugestoes++
        else if (tp === 'elogio') feedbacksPorTipo.elogios++
        else feedbacksPorTipo.outros++
      })
    }
  } catch {
    // Tabela de feedbacks pode estar vazia
  }

  // 7. ALERTAS DO SISTEMA
  const alertas: string[] = []
  if (inativasQtd > 0) {
    alertas.push(`${inativasQtd} profissional(is) sem login registrado há mais de 14 dias.`)
  }
  if (porStatus.atrasadas > 0) {
    alertas.push(`${porStatus.atrasadas} conta(s) com mensalidade ou plano atrasado.`)
  }
  if (canceladosTaxaPct > 20) {
    alertas.push(`Taxa de cancelamento elevada nos últimos 30 dias (${canceladosTaxaPct}%).`)
  }
  if (novosFeedbacks > 0) {
    alertas.push(`${novosFeedbacks} feedback(s) novo(s) aguardando análise da equipe.`)
  }

  return {
    gerado_em: now.toISOString(),
    profissionais: {
      total_cadastradas: totalProfissionais,
      por_status: porStatus,
      novas_ultimos_7_dias: novas7d,
      novas_ultimos_30_dias: novas30d,
      inativas_mais_14_dias: {
        quantidade: inativasQtd,
        studios_amostra: studiosInativosAmostra,
      },
    },
    financeiro: {
      faturamento_semana_atual_brl: fatSemanaAtual,
      faturamento_semana_anterior_brl: fatSemanaAnterior,
      faturamento_semana_variacao_pct: fatSemanaVarPct,
      faturamento_mes_atual_brl: somaValorConcluidos30d,
      faturamento_mes_anterior_brl: fatMesAnterior,
      faturamento_mes_variacao_pct: fatMesVarPct,
      ticket_medio_geral_brl: ticketMedio,
    },
    agendamentos_30_dias: {
      total: totalAgendamentos30d,
      concluidos_qtd: concluidos30dQtd,
      concluidos_taxa_pct: concluidosTaxaPct,
      cancelados_qtd: cancelados30dQtd,
      cancelados_taxa_pct: canceladosTaxaPct,
      no_show_qtd: noShow30dQtd,
      no_show_taxa_pct: noShowTaxaPct,
      pendentes_qtd: pendentes30dQtd,
    },
    satisfacao_nps: {
      nps_media: npsMedia,
      total_respostas: totalNps,
      promotores_qtd: promotores,
      neutros_qtd: neutros,
      detratores_qtd: detratores,
    },
    feedbacks_plataforma: {
      total_recebidos: totalFeedbacks,
      novos_nao_analisados: novosFeedbacks,
      por_tipo: feedbacksPorTipo,
    },
    alertas_sistema: alertas,
  }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface MetaMensalData {
  id: string
  mesReferencia: string // YYYY-MM-DD
  tipoMeta: 'faturamento' | 'atendimentos' | 'novos_clientes' | 'ocupacao'
  valorMeta: number
}

export interface RelatorioMesAtualData {
  mesReferencia: string // YYYY-MM-DD
  nomeMes: string // ex: "Setembro de 2026"
  faturamentoAtual: number
  atendimentosConcluidos: number
  servicoMaisVendido: {
    nome: string
    quantidade: number
  } | null
  comparativoMesAnteriorPct: number | null // vs mesmo período proporcional
  faturamentoMesAnteriorProporcional: number
  diaAtualDoMes: number
  diasNoMes: number
  diasRestantes: number
  meta: {
    definida: boolean
    valor: number
    tipo: 'faturamento' | 'atendimentos' | 'novos_clientes' | 'ocupacao'
    progressoPct: number
    faltam: number
    ritmoDiarioNecessario: number
    status: 'sem_meta' | 'batida' | 'no_caminho' | 'atrasada'
  }
  destaqueNarrativo: string
  metaMesAnteriorSugerida: number | null
  dadosGrafico?: {
    id: string
    data_hora_inicio: string
    valor_cobrado: number
  }[]
}

export interface RelatorioMesFechadoData {
  id: string
  mesReferencia: string
  nomeMes: string
  faturamentoTotal: number
  atendimentosConcluidos: number
  servicoMaisVendidoNome: string | null
  metaValor: number | null
  metaBatida: boolean | null
  comparativoMesAnteriorPct: number | null
  destaqueNarrativo: string | null
  congeladoEm: string
}

export interface RelatoriosEMetasResponse {
  success: boolean
  message?: string
  mesAtual?: RelatorioMesAtualData
  historicoMesesFechados?: RelatorioMesFechadoData[]
}

function getPrimeiroDiaDoMes(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

function formatNomeMes(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export async function getRelatoriosEMetasAction(
  mesReferenciaParam?: string
): Promise<RelatoriosEMetasResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const admin = createAdminClient()
    const now = new Date()

    let anoAlvo = now.getFullYear()
    let mesAlvoIndex = now.getMonth()

    if (mesReferenciaParam) {
      const parts = mesReferenciaParam.split('-')
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10) - 1
        if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
          anoAlvo = y
          mesAlvoIndex = m
        }
      }
    }

    const isCurrentMonth = anoAlvo === now.getFullYear() && mesAlvoIndex === now.getMonth()
    const isPastMonth =
      anoAlvo < now.getFullYear() ||
      (anoAlvo === now.getFullYear() && mesAlvoIndex < now.getMonth())

    // Data de início do mês selecionado
    const mesAlvoDate = new Date(anoAlvo, mesAlvoIndex, 1)
    const mesAlvoStr = getPrimeiroDiaDoMes(mesAlvoDate)
    const totalDiasNoMes = new Date(anoAlvo, mesAlvoIndex + 1, 0).getDate()
    const diaAtual = isCurrentMonth ? now.getDate() : isPastMonth ? totalDiasNoMes : 0
    const diasRestantes = isCurrentMonth ? Math.max(1, totalDiasNoMes - now.getDate() + 1) : 0

    // Data de início do mês anterior
    const mesAnteriorDate = new Date(anoAlvo, mesAlvoIndex - 1, 1)
    const mesAnteriorStr = getPrimeiroDiaDoMes(mesAnteriorDate)
    const totalDiasMesAnterior = new Date(anoAlvo, mesAlvoIndex, 0).getDate()
    const diaLimiteProporcionalAnterior = isCurrentMonth
      ? Math.min(now.getDate(), totalDiasMesAnterior)
      : totalDiasMesAnterior

    // Limites de datas ISO
    const mesAlvoInicioIso = new Date(anoAlvo, mesAlvoIndex, 1, 0, 0, 0).toISOString()
    const mesAlvoFimIso = new Date(anoAlvo, mesAlvoIndex + 1, 0, 23, 59, 59, 999).toISOString()

    const mesAnteriorInicioIso = new Date(anoAlvo, mesAlvoIndex - 1, 1, 0, 0, 0).toISOString()
    const mesAnteriorLimiteIso = new Date(
      anoAlvo,
      mesAlvoIndex - 1,
      diaLimiteProporcionalAnterior,
      23,
      59,
      59,
      999
    ).toISOString()

    // 1. Buscar Meta do Mês Selecionado
    let valorMetaAtual: number | null = null
    let tipoMetaAtual: 'faturamento' | 'atendimentos' | 'novos_clientes' | 'ocupacao' = 'faturamento'

    try {
      const { data: metaAtualRaw } = await (admin.from('metas_mensais') as any)
        .select('*')
        .eq('profissional_id', user.id)
        .eq('mes_referencia', mesAlvoStr)
        .maybeSingle()

      if (metaAtualRaw?.valor_meta) {
        valorMetaAtual = Number(metaAtualRaw.valor_meta)
        tipoMetaAtual = metaAtualRaw.tipo_meta || 'faturamento'
      }
    } catch {
      // Tabela pode ainda não ter sido migrada no banco
    }

    // Fallback resiliente para user_metadata
    if (valorMetaAtual === null) {
      const userMetaObj = user.user_metadata?.metas_mensais?.[mesAlvoStr]
      if (userMetaObj?.valor_meta) {
        valorMetaAtual = Number(userMetaObj.valor_meta)
        tipoMetaAtual = userMetaObj.tipo_meta || 'faturamento'
      }
    }

    // 2. Buscar Meta do Mês Anterior (para sugestão)
    let metaAnteriorSugerida: number | null = null
    try {
      const { data: metaAnteriorRaw } = await (admin.from('metas_mensais') as any)
        .select('valor_meta')
        .eq('profissional_id', user.id)
        .eq('mes_referencia', mesAnteriorStr)
        .maybeSingle()

      if (metaAnteriorRaw?.valor_meta) {
        metaAnteriorSugerida = Number(metaAnteriorRaw.valor_meta)
      }
    } catch {
      // Ignora erro
    }

    if (metaAnteriorSugerida === null) {
      const userMetaAntObj = user.user_metadata?.metas_mensais?.[mesAnteriorStr]
      if (userMetaAntObj?.valor_meta) {
        metaAnteriorSugerida = Number(userMetaAntObj.valor_meta)
      }
    }

    // 3. Buscar Agendamentos Concluídos do Mês Selecionado
    const { data: agendamentosMesAtual } = await admin
      .from('agendamentos')
      .select('id, data_hora_inicio, valor_cobrado, servico_id, servicos(nome)')
      .eq('profissional_id', user.id)
      .eq('status', 'concluido')
      .gte('data_hora_inicio', mesAlvoInicioIso)
      .lte('data_hora_inicio', mesAlvoFimIso)

    const bookingsAtual = (agendamentosMesAtual || []) as any[]
    const faturamentoAtual = bookingsAtual.reduce((acc, b) => acc + Number(b.valor_cobrado || 0), 0)
    const atendimentosConcluidosAtual = bookingsAtual.length

    // Identificar Serviço Mais Vendido do Mês Selecionado
    const servicoContagem: Record<string, { nome: string; count: number }> = {}
    for (const b of bookingsAtual) {
      const servicoNome = (b.servicos as any)?.nome || 'Serviço Personalizado'
      if (!servicoContagem[servicoNome]) {
        servicoContagem[servicoNome] = { nome: servicoNome, count: 0 }
      }
      servicoContagem[servicoNome].count += 1
    }

    let servicoMaisVendido: { nome: string; quantidade: number } | null = null
    for (const s of Object.values(servicoContagem)) {
      if (!servicoMaisVendido || s.count > servicoMaisVendido.quantidade) {
        servicoMaisVendido = { nome: s.nome, quantidade: s.count }
      }
    }

    // 4. Comparativo com o Mês Anterior (Até o mesmo dia proporcional se mês atual, ou mês completo se passado)
    const { data: agendamentosMesAnteriorProp } = await admin
      .from('agendamentos')
      .select('valor_cobrado')
      .eq('profissional_id', user.id)
      .eq('status', 'concluido')
      .gte('data_hora_inicio', mesAnteriorInicioIso)
      .lte('data_hora_inicio', mesAnteriorLimiteIso)

    const faturamentoMesAnteriorProp = ((agendamentosMesAnteriorProp as any[]) || []).reduce(
      (acc, b) => acc + Number(b.valor_cobrado || 0),
      0
    )

    let comparativoMesAnteriorPct: number | null = null
    if (faturamentoMesAnteriorProp > 0) {
      comparativoMesAnteriorPct = Math.round(
        ((faturamentoAtual - faturamentoMesAnteriorProp) / faturamentoMesAnteriorProp) * 100
      )
    } else if (faturamentoAtual > 0) {
      comparativoMesAnteriorPct = 100
    }

    // 5. Cálculos da Meta
    const valorMeta = valorMetaAtual || 0
    const metaDefinida = valorMeta > 0
    const progressoPct = metaDefinida ? Math.min(100, Math.round((faturamentoAtual / valorMeta) * 100)) : 0
    const faltam = metaDefinida ? Math.max(0, valorMeta - faturamentoAtual) : 0
    const ritmoDiario =
      metaDefinida && faltam > 0 && diasRestantes > 0 ? Math.round(faltam / diasRestantes) : 0

    let statusMeta: 'sem_meta' | 'batida' | 'no_caminho' | 'atrasada' = 'sem_meta'
    if (metaDefinida) {
      if (faturamentoAtual >= valorMeta) {
        statusMeta = 'batida'
      } else if (isPastMonth) {
        statusMeta = 'atrasada'
      } else if (isCurrentMonth) {
        // Se a média diária realizada até agora mantiver no ritmo para bater a meta
        const mediaDiariaRealizada = diaAtual > 0 ? faturamentoAtual / diaAtual : 0
        const previsaoFinal = faturamentoAtual + mediaDiariaRealizada * (totalDiasNoMes - diaAtual)
        statusMeta = previsaoFinal >= valorMeta * 0.9 ? 'no_caminho' : 'atrasada'
      } else {
        statusMeta = 'no_caminho'
      }
    }

    // 6. Destaque Narrativo Inteligente (Sem emojis)
    let destaqueNarrativo = ''
    if (isPastMonth) {
      if (statusMeta === 'batida') {
        destaqueNarrativo = 'Parabéns! A meta foi atingida com sucesso neste mês.'
      } else if (metaDefinida) {
        destaqueNarrativo = `Mês finalizado com ${progressoPct}% da meta atingida (R$ ${faturamentoAtual.toFixed(2)} de R$ ${valorMeta.toFixed(2)}).`
      } else if (comparativoMesAnteriorPct !== null && comparativoMesAnteriorPct >= 0) {
        destaqueNarrativo = `Neste mês o faturamento foi ${comparativoMesAnteriorPct}% superior ao mês anterior.`
      } else if (comparativoMesAnteriorPct !== null) {
        destaqueNarrativo = `Neste mês o faturamento foi ${Math.abs(comparativoMesAnteriorPct)}% inferior ao mês anterior.`
      } else {
        destaqueNarrativo = `Mês finalizado com ${atendimentosConcluidosAtual} atendimentos concluídos.`
      }
    } else if (!isCurrentMonth) {
      if (metaDefinida) {
        destaqueNarrativo = `Meta de R$ ${valorMeta.toFixed(2)} planejada para este mês.`
      } else {
        destaqueNarrativo = 'Defina uma meta para planejar o faturamento deste mês futuro.'
      }
    } else {
      if (statusMeta === 'batida') {
        destaqueNarrativo = 'Incrível! Você atingiu 100% da sua meta antes do final do mês!'
      } else if (comparativoMesAnteriorPct !== null && comparativoMesAnteriorPct >= 15) {
        destaqueNarrativo = `Excelente ritmo! Você está faturando ${comparativoMesAnteriorPct}% a mais que no mesmo período do mês passado.`
      } else if (comparativoMesAnteriorPct !== null && comparativoMesAnteriorPct <= -15) {
        destaqueNarrativo = `Faturamento ${Math.abs(comparativoMesAnteriorPct)}% abaixo do mês anterior. Sugestão: Crie um cupom exclusivo para reativar clientes inativas!`
      } else if (metaDefinida && progressoPct >= 70) {
        destaqueNarrativo = `Reta final! Você já conquistou ${progressoPct}% da sua meta. Faltam apenas R$ ${faltam.toFixed(2)}.`
      } else if (metaDefinida) {
        destaqueNarrativo = `Mantenha o foco: você precisa de uma média de R$ ${ritmoDiario}/dia nos próximos ${diasRestantes} dias para bater sua meta.`
      } else {
        destaqueNarrativo = 'Defina uma meta mensal para acompanhar seu ritmo de faturamento em tempo real.'
      }
    }

    // 7. Histórico de Meses Fechados
    let historicoMesesFechados: RelatorioMesFechadoData[] = []
    try {
      const { data: fechadosRaw } = await (admin.from('relatorios_mensais_fechados') as any)
        .select('*')
        .eq('profissional_id', user.id)
        .order('mes_referencia', { ascending: false })
        .limit(12)

      if (fechadosRaw) {
        historicoMesesFechados = fechadosRaw.map((f: any) => {
          const parts = f.mes_referencia.split('-')
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
          return {
            id: f.id,
            mesReferencia: f.mes_referencia,
            nomeMes: formatNomeMes(d),
            faturamentoTotal: Number(f.faturamento_total),
            atendimentosConcluidos: f.atendimentos_concluidos,
            servicoMaisVendidoNome: f.servico_mais_vendido_nome,
            metaValor: f.meta_valor ? Number(f.meta_valor) : null,
            metaBatida: f.meta_batida,
            comparativoMesAnteriorPct: f.comparativo_mes_anterior_pct ? Number(f.comparativo_mes_anterior_pct) : null,
            destaqueNarrativo: f.destaque_narrativo,
            congeladoEm: f.congelado_em,
          }
        })
      }
    } catch {
      // Ignora erro de tabela não existente
    }

    // 8. Buscar Agendamentos para o Gráfico de Evolução do Faturamento
    let dadosGrafico: { id: string; data_hora_inicio: string; valor_cobrado: number }[] = []
    try {
      const anoInicioIso = new Date(anoAlvo - 2, 0, 1, 0, 0, 0).toISOString()
      const anoFimIso = new Date(anoAlvo + 1, 11, 31, 23, 59, 59, 999).toISOString()

      const { data: agendamentosGraficoRaw } = await admin
        .from('agendamentos')
        .select('id, data_hora_inicio, valor_cobrado')
        .eq('profissional_id', user.id)
        .eq('status', 'concluido')
        .gte('data_hora_inicio', anoInicioIso)
        .lte('data_hora_inicio', anoFimIso)

      if (agendamentosGraficoRaw) {
        dadosGrafico = agendamentosGraficoRaw.map((b: any) => ({
          id: b.id,
          data_hora_inicio: b.data_hora_inicio,
          valor_cobrado: Number(b.valor_cobrado || 0),
        }))
      }
    } catch {
      // Ignora erro
    }

    return {
      success: true,
      mesAtual: {
        mesReferencia: mesAlvoStr,
        nomeMes: formatNomeMes(mesAlvoDate),
        faturamentoAtual,
        atendimentosConcluidos: atendimentosConcluidosAtual,
        servicoMaisVendido,
        comparativoMesAnteriorPct,
        faturamentoMesAnteriorProporcional: faturamentoMesAnteriorProp,
        diaAtualDoMes: diaAtual,
        diasNoMes: totalDiasNoMes,
        diasRestantes,
        meta: {
          definida: metaDefinida,
          valor: valorMeta,
          tipo: tipoMetaAtual,
          progressoPct,
          faltam,
          ritmoDiarioNecessario: ritmoDiario,
          status: statusMeta,
        },
        destaqueNarrativo,
        metaMesAnteriorSugerida: metaAnteriorSugerida,
        dadosGrafico,
      },
      historicoMesesFechados,
    }
  } catch (err: unknown) {
    console.error('Erro ao buscar relatórios e metas:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro ao processar dados de relatórios.',
    }
  }
}

export async function salvarMetaMensalAction(params: {
  mesReferencia: string
  tipoMeta?: 'faturamento' | 'atendimentos' | 'novos_clientes' | 'ocupacao'
  valorMeta: number
}): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    if (!params.valorMeta || params.valorMeta <= 0) {
      return { success: false, message: 'Informe um valor válido para a meta.' }
    }

    const admin = createAdminClient()
    const tipoMeta = params.tipoMeta || 'faturamento'

    // 1. Tentar salvar na tabela metas_mensais caso exista
    try {
      await (admin.from('metas_mensais') as any).upsert(
        {
          profissional_id: user.id,
          mes_referencia: params.mesReferencia,
          tipo_meta: tipoMeta,
          valor_meta: params.valorMeta,
        },
        { onConflict: 'profissional_id,mes_referencia,tipo_meta' }
      )
    } catch (tableErr) {
      console.warn('[salvarMetaMensalAction] Aviso: tabela metas_mensais não disponível:', tableErr)
    }

    // 2. Persistência garantida em user_metadata (funciona 100% das vezes)
    const currentMetaMap = (user.user_metadata?.metas_mensais as Record<string, any>) || {}
    const updatedMetaMap = {
      ...currentMetaMap,
      [params.mesReferencia]: {
        valor_meta: params.valorMeta,
        tipo_meta: tipoMeta,
        updated_at: new Date().toISOString(),
      },
    }

    const { error: metaUpdateError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        metas_mensais: updatedMetaMap,
      },
    })

    if (metaUpdateError) {
      console.error('[salvarMetaMensalAction] Erro ao salvar meta nos metadados:', metaUpdateError)
      return { success: false, message: 'Não foi possível salvar a meta no momento.' }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard/relatorios')
    revalidatePath('/dashboard')

    return { success: true, message: 'Meta definida com sucesso!' }
  } catch (err: unknown) {
    console.error('Erro ao salvar meta:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro interno ao salvar meta.',
    }
  }
}

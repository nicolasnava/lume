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

export async function getRelatoriosEMetasAction(): Promise<RelatoriosEMetasResponse> {
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
    const anoAtual = now.getFullYear()
    const mesAtualIndex = now.getMonth() // 0-indexed
    const diaAtual = now.getDate()

    // Data de início do mês atual
    const mesAtualDate = new Date(anoAtual, mesAtualIndex, 1)
    const mesAtualStr = getPrimeiroDiaDoMes(mesAtualDate)
    const totalDiasNoMes = new Date(anoAtual, mesAtualIndex + 1, 0).getDate()
    const diasRestantes = Math.max(1, totalDiasNoMes - diaAtual + 1)

    // Data de início do mês anterior
    const mesAnteriorDate = new Date(anoAtual, mesAtualIndex - 1, 1)
    const mesAnteriorStr = getPrimeiroDiaDoMes(mesAnteriorDate)
    const totalDiasMesAnterior = new Date(anoAtual, mesAtualIndex, 0).getDate()
    const diaLimiteProporcionalAnterior = Math.min(diaAtual, totalDiasMesAnterior)

    // Limites de datas ISO
    const mesAtualInicioIso = new Date(anoAtual, mesAtualIndex, 1, 0, 0, 0).toISOString()
    const mesAtualFimIso = new Date(anoAtual, mesAtualIndex + 1, 0, 23, 59, 59, 999).toISOString()

    const mesAnteriorInicioIso = new Date(anoAtual, mesAtualIndex - 1, 1, 0, 0, 0).toISOString()
    const mesAnteriorLimiteIso = new Date(
      anoAtual,
      mesAtualIndex - 1,
      diaLimiteProporcionalAnterior,
      23,
      59,
      59,
      999
    ).toISOString()

    // 1. Buscar Meta do Mês Atual
    const { data: metaAtualRaw } = await (admin.from('metas_mensais') as any)
      .select('*')
      .eq('profissional_id', user.id)
      .eq('mes_referencia', mesAtualStr)
      .maybeSingle()

    // 2. Buscar Meta do Mês Anterior (para sugestão)
    const { data: metaAnteriorRaw } = await (admin.from('metas_mensais') as any)
      .select('valor_meta')
      .eq('profissional_id', user.id)
      .eq('mes_referencia', mesAnteriorStr)
      .maybeSingle()

    // 3. Buscar Agendamentos Concluídos do Mês Atual
    const { data: agendamentosMesAtual } = await admin
      .from('agendamentos')
      .select('id, data_hora_inicio, valor_cobrado, servico_id, servicos(nome)')
      .eq('profissional_id', user.id)
      .eq('status', 'concluido')
      .gte('data_hora_inicio', mesAtualInicioIso)
      .lte('data_hora_inicio', mesAtualFimIso)

    const bookingsAtual = (agendamentosMesAtual || []) as any[]
    const faturamentoAtual = bookingsAtual.reduce((acc, b) => acc + Number(b.valor_cobrado || 0), 0)
    const atendimentosConcluidosAtual = bookingsAtual.length

    // Identificar Serviço Mais Vendido do Mês Atual
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

    // 4. Comparativo com o Mês Anterior (Até o mesmo dia proporcional)
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
    const valorMeta = metaAtualRaw?.valor_meta ? Number(metaAtualRaw.valor_meta) : 0
    const metaDefinida = valorMeta > 0
    const progressoPct = metaDefinida ? Math.min(100, Math.round((faturamentoAtual / valorMeta) * 100)) : 0
    const faltam = metaDefinida ? Math.max(0, valorMeta - faturamentoAtual) : 0
    const ritmoDiario = metaDefinida && faltam > 0 ? Math.round(faltam / diasRestantes) : 0

    let statusMeta: 'sem_meta' | 'batida' | 'no_caminho' | 'atrasada' = 'sem_meta'
    if (metaDefinida) {
      if (faturamentoAtual >= valorMeta) {
        statusMeta = 'batida'
      } else {
        // Se a média diária realizada até agora mantiver no ritmo para bater a meta
        const mediaDiariaRealizada = diaAtual > 0 ? faturamentoAtual / diaAtual : 0
        const previsaoFinal = faturamentoAtual + mediaDiariaRealizada * (totalDiasNoMes - diaAtual)
        statusMeta = previsaoFinal >= valorMeta * 0.9 ? 'no_caminho' : 'atrasada'
      }
    }

    // 6. Destaque Narrativo Inteligente
    let destaqueNarrativo = ''
    if (statusMeta === 'batida') {
      destaqueNarrativo = '🎉 Incrível! Você atingiu 100% da sua meta antes do final do mês!'
    } else if (comparativoMesAnteriorPct !== null && comparativoMesAnteriorPct >= 15) {
      destaqueNarrativo = `🚀 Excelente ritmo! Você está faturando ${comparativoMesAnteriorPct}% a mais que no mesmo período do mês passado.`
    } else if (comparativoMesAnteriorPct !== null && comparativoMesAnteriorPct <= -15) {
      destaqueNarrativo = `📉 Faturamento ${Math.abs(comparativoMesAnteriorPct)}% abaixo do mês anterior. Sugestão: Crie um cupom exclusivo para reativar clientes inativas!`
    } else if (metaDefinida && progressoPct >= 70) {
      destaqueNarrativo = `💪 Reta final! Você já conquistou ${progressoPct}% da sua meta. Faltam apenas R$ ${faltam.toFixed(2)}.`
    } else if (metaDefinida) {
      destaqueNarrativo = `🎯 Mantenha o foco: você precisa de uma média de R$ ${ritmoDiario}/dia nos próximos ${diasRestantes} dias para bater sua meta.`
    } else {
      destaqueNarrativo = 'Defina uma meta mensal para acompanhar seu ritmo de faturamento em tempo real.'
    }

    // 7. Histórico de Meses Fechados
    const { data: fechadosRaw } = await (admin.from('relatorios_mensais_fechados') as any)
      .select('*')
      .eq('profissional_id', user.id)
      .order('mes_referencia', { ascending: false })
      .limit(12)

    const historicoMesesFechados: RelatorioMesFechadoData[] = (fechadosRaw || []).map((f: any) => {
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

    return {
      success: true,
      mesAtual: {
        mesReferencia: mesAtualStr,
        nomeMes: formatNomeMes(mesAtualDate),
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
          tipo: metaAtualRaw?.tipo_meta || 'faturamento',
          progressoPct,
          faltam,
          ritmoDiarioNecessario: ritmoDiario,
          status: statusMeta,
        },
        destaqueNarrativo,
        metaMesAnteriorSugerida: metaAnteriorRaw?.valor_meta ? Number(metaAnteriorRaw.valor_meta) : null,
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

    const { error } = await (admin.from('metas_mensais') as any).upsert(
      {
        profissional_id: user.id,
        mes_referencia: params.mesReferencia,
        tipo_meta: tipoMeta,
        valor_meta: params.valorMeta,
      },
      { onConflict: 'profissional_id,mes_referencia,tipo_meta' }
    )

    if (error) {
      console.error('Erro ao salvar meta mensal:', error)
      return { success: false, message: 'Erro ao salvar meta no banco de dados.' }
    }

    return { success: true, message: 'Meta definida com sucesso!' }
  } catch (err: unknown) {
    console.error('Erro ao salvar meta:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro interno ao salvar meta.',
    }
  }
}

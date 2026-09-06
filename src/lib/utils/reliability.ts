/**
 * Módulo de Confiabilidade de Comparecimento da Cliente (Prompt 60)
 * 
 * Lógica de classificação baseada no histórico de comparecimento dos últimos 6 meses.
 * Este score é puramente informativo para apoio à decisão da profissional no painel
 * e NUNCA bloqueia agendamentos automáticos na vitrine pública.
 */

export type ClientReliabilityTier = 'confiavel' | 'atencao' | 'risco_falta' | 'sem_historico'

export interface ReliabilityAppointment {
  id?: string
  data_hora_inicio: string
  status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show' | string
}

export interface ClientReliabilityResult {
  tier: ClientReliabilityTier
  label: string
  reason: string
  metrics: {
    totalUltimos6Meses: number
    concluidos: number
    noShow: number
    canceladosAntecedencia: number
    canceladosUltimaHora: number
    score: number
    scoreRatio: number
  }
}

/**
 * Pesos da fórmula de confiabilidade:
 * - Concluído: +1.0 ponto
 * - Cancelamento com antecedência razoável: -0.2 ponto (cancelar direito penaliza quase nada)
 * - Cancelamento de última hora: -1.0 ponto
 * - No-show (falta sem aviso): -3.0 pontos (pesa muito mais que cancelamento avisado)
 */
export const RELIABILITY_WEIGHTS = {
  CONCLUIDO: 1.0,
  CANCELADO_ANTECEDENCIA: -0.2,
  CANCELADO_ULTIMA_HORA: -1.0,
  NO_SHOW: -3.0,
}

/**
 * Limiares de classificação (ajustáveis conforme calibração do negócio):
 * - Período considerado: 180 dias (6 meses)
 * - Mínimo de atendimentos para 'Confiável': 3 atendimentos
 * - Ratio mínimo para 'Confiável': 0.65 (65% do score máximo possível)
 * - Ratio limiar para 'Atenção': entre 0.20 e 0.65, ou 1 no-show recente
 * - Limiar para 'Risco de Falta': 2+ no-shows recentes OU ratio abaixo de 0.20
 */
export const RELIABILITY_THRESHOLDS = {
  DAYS_WINDOW: 180,
  MIN_APPOINTMENTS_FOR_RELIABLE: 3,
  RATIO_RELIABLE_MIN: 0.65,
  RATIO_RISK_MAX: 0.2,
}

export function calculateClientReliability(
  agendamentos: ReliabilityAppointment[] | null | undefined,
  referenceDate: Date = new Date()
): ClientReliabilityResult {
  if (!agendamentos || agendamentos.length === 0) {
    return {
      tier: 'sem_historico',
      label: 'Sem histórico suficiente',
      reason: 'Nenhum agendamento registrado nos últimos 6 meses.',
      metrics: {
        totalUltimos6Meses: 0,
        concluidos: 0,
        noShow: 0,
        canceladosAntecedencia: 0,
        canceladosUltimaHora: 0,
        score: 0,
        scoreRatio: 0,
      },
    }
  }

  const windowMs = RELIABILITY_THRESHOLDS.DAYS_WINDOW * 24 * 60 * 60 * 1000
  const cutoffDate = new Date(referenceDate.getTime() - windowMs)

  // 1. Filtrar agendamentos concluídos, faltas ou cancelados nos últimos 6 meses
  // Agendamentos futuros com status 'confirmado' ainda não ocorreram, portanto não penalizam nem pontuam
  let concluidos = 0
  let noShow = 0
  let canceladosAntecedencia = 0
  let canceladosUltimaHora = 0

  agendamentos.forEach((agendamento) => {
    const dataAgendamento = new Date(agendamento.data_hora_inicio)

    // Considerar apenas os últimos 6 meses
    if (dataAgendamento < cutoffDate) {
      return
    }

    if (agendamento.status === 'concluido') {
      concluidos++
    } else if (agendamento.status === 'no_show') {
      noShow++
    } else if (agendamento.status === 'cancelado') {
      // Regra: se o agendamento foi cancelado, consideramos que seguiu o fluxo com antecedência
      // (a menos que sinalizado como cancelamento de última hora).
      canceladosAntecedencia++
    }
  })

  const totalUltimos6Meses = concluidos + noShow + canceladosAntecedencia + canceladosUltimaHora

  // Calcular pontuação bruta
  const score =
    concluidos * RELIABILITY_WEIGHTS.CONCLUIDO +
    canceladosAntecedencia * RELIABILITY_WEIGHTS.CANCELADO_ANTECEDENCIA +
    canceladosUltimaHora * RELIABILITY_WEIGHTS.CANCELADO_ULTIMA_HORA +
    noShow * RELIABILITY_WEIGHTS.NO_SHOW

  // Normalização da pontuação (em relação ao total de agendamentos considerados)
  // Ratio varia tipicamente de -3 a 1.0. Para análise, usamos score / total.
  const scoreRatio = totalUltimos6Meses > 0 ? score / totalUltimos6Meses : 0

  const metrics = {
    totalUltimos6Meses,
    concluidos,
    noShow,
    canceladosAntecedencia,
    canceladosUltimaHora,
    score: Math.round(score * 10) / 10,
    scoreRatio: Math.round(scoreRatio * 100) / 100,
  }

  // Regra 1: 2 ou mais no-shows nos últimos 6 meses -> Risco de Falta imediato
  if (noShow >= 2) {
    return {
      tier: 'risco_falta',
      label: 'Risco de Falta',
      reason: `${noShow} faltas sem aviso nos últimos 6 meses.`,
      metrics,
    }
  }

  // Regra 2: Menos de 3 atendimentos no período considerado
  // Se não teve faltas, não é justo classificar como risco nem confiável
  if (totalUltimos6Meses < RELIABILITY_THRESHOLDS.MIN_APPOINTMENTS_FOR_RELIABLE) {
    if (noShow === 1) {
      return {
        tier: 'atencao',
        label: 'Atenção',
        reason: '1 falta sem aviso registrada nos últimos 6 meses.',
        metrics,
      }
    }

    return {
      tier: 'sem_historico',
      label: 'Sem histórico suficiente',
      reason: 'Menos de 3 agendamentos nos últimos 6 meses para avaliar confiabilidade.',
      metrics,
    }
  }

  // Regra 3: Cliente com 1 falta sem aviso
  if (noShow === 1) {
    return {
      tier: 'atencao',
      label: 'Atenção',
      reason: '1 falta sem aviso registrada nos últimos 6 meses.',
      metrics,
    }
  }

  // Regra 4: Pontuação normalizada muito baixa devido a múltiplos cancelamentos
  if (scoreRatio < RELIABILITY_THRESHOLDS.RATIO_RISK_MAX) {
    return {
      tier: 'risco_falta',
      label: 'Risco de Falta',
      reason: 'Histórico com frequência elevada de cancelamentos nos últimos 6 meses.',
      metrics,
    }
  }

  // Regra 5: Pontuação intermediária
  if (scoreRatio < RELIABILITY_THRESHOLDS.RATIO_RELIABLE_MIN) {
    return {
      tier: 'atencao',
      label: 'Atenção',
      reason: 'Pontuação reduzida por cancelamentos recentes nos últimos 6 meses.',
      metrics,
    }
  }

  // Regra 6: Confiável (Pelo menos 3 atendimentos, 0 faltas e pontuação alta)
  return {
    tier: 'confiavel',
    label: 'Confiável',
    reason: 'Excelente histórico de comparecimento nos últimos 6 meses.',
    metrics,
  }
}

import { createAdminClient } from '@/lib/supabase/admin'

export interface WorkingDayInfo {
  dateStr: string // YYYY-MM-DD
  displayDay: string // Seg, Ter...
  displayDate: string // 24/08
  fullDisplay: string // Segunda-feira, 24 de Agosto
  isWorkingDay: boolean
  dayOfWeek: number
}

export interface TimeSlot {
  timeStr: string // Ex: "09:00"
  dataHoraInicio: string // ISO string
  dataHoraFim: string // ISO string
}

export interface DayAvailability {
  dateStr: string
  dayOfWeek: number
  isWorkingDay: boolean
  availableSlots: TimeSlot[]
}

interface BloqueioDbItem {
  data: string
  data_fim: string | null
  hora_inicio: string | null
  hora_fim: string | null
}

/**
 * Retorna a lista de dias úteis com base na janela de agendamento da profissional e bloqueios cadastrados.
 */
export async function getWorkingDaysInNextNDays(
  profissionalId: string,
  daysCountParam?: number
): Promise<WorkingDayInfo[]> {
  const supabase = createAdminClient()

  // 1. Buscar a janela de agendamento em dias da profissional
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prof } = await (supabase.from('profissionais_publico') as any)
    .select('janela_agendamento_dias')
    .eq('id', profissionalId)
    .single()

  const janelaDias = daysCountParam ?? (prof?.janela_agendamento_dias || 90)

  // 2. Buscar todos os dias de atendimento recorrente
  const { data: disponibilidades } = await supabase
    .from('disponibilidade')
    .select('dia_semana')
    .eq('profissional_id', profissionalId)

  const workingDaysSet = new Set((disponibilidades || []).map((d) => d.dia_semana))

  // 3. Buscar datas bloqueadas especificamente (suporte a intervalo data/data_fim e hora_inicio)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bloqueios } = await (supabase.from('bloqueios_disponibilidade') as any)
    .select('data, data_fim, hora_inicio, hora_fim')
    .eq('profissional_id', profissionalId)

  const rawBloqueios = (bloqueios || []) as BloqueioDbItem[]

  const today = new Date()
  const result: WorkingDayInfo[] = []

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  for (let i = 0; i < janelaDias; i++) {
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const day = String(current.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const dayOfWeek = current.getDay()

    // Verificar se o dia está bloqueado por inteiro (sem hora_inicio)
    const isFullDayBlocked = rawBloqueios.some((b) => {
      if (b.hora_inicio) return false // Bloqueio parcial não desativa a data do calendário
      const start = b.data
      const end = b.data_fim || b.data
      return dateStr >= start && dateStr <= end
    })

    const isWorkingDay = workingDaysSet.has(dayOfWeek) && !isFullDayBlocked

    result.push({
      dateStr,
      displayDay: dayNames[dayOfWeek],
      displayDate: `${day}/${month}`,
      fullDisplay: `${dayNames[dayOfWeek]}, ${day} de ${monthNames[current.getMonth()]}`,
      isWorkingDay,
      dayOfWeek,
    })
  }

  return result
}

function getTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Calcula os horários livres para um determinado serviço (ou duração total acumulada em minutos) e data.
 */
export async function calculateAvailableSlots(
  profissionalId: string,
  servicoIdOrDuracaoMinutos: string | number,
  dateStr: string,
  allowPastSlots = false
): Promise<DayAvailability> {
  const supabase = createAdminClient()
  const targetDate = new Date(`${dateStr}T12:00:00-03:00`)
  const dayOfWeek = targetDate.getDay()

  // 0. Buscar bloqueios específicos para esta data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bloqueios } = await (supabase.from('bloqueios_disponibilidade') as any)
    .select('data, data_fim, hora_inicio, hora_fim')
    .eq('profissional_id', profissionalId)

  const rawBloqueios = (bloqueios || []) as BloqueioDbItem[]

  // Filtrar bloqueios que afetam esta data específica
  const matchingBlocks = rawBloqueios.filter((b) => {
    const start = b.data
    const end = b.data_fim || b.data
    return dateStr >= start && dateStr <= end
  })

  // Se houver qualquer bloqueio de dia inteiro, retorna sem horários
  if (matchingBlocks.some((b) => !b.hora_inicio)) {
    return {
      dateStr,
      dayOfWeek,
      isWorkingDay: false,
      availableSlots: [],
    }
  }

  // Extrair faixas de horários bloqueados parcialmente no dia (fuso Brasil -03:00)
  const partialBlockedRanges: { startMs: number; endMs: number }[] = []
  matchingBlocks.forEach((b) => {
    if (b.hora_inicio && b.hora_fim) {
      const startMs = new Date(`${dateStr}T${b.hora_inicio.slice(0, 5)}:00-03:00`).getTime()
      const endMs = new Date(`${dateStr}T${b.hora_fim.slice(0, 5)}:00-03:00`).getTime()
      partialBlockedRanges.push({ startMs, endMs })
    }
  })

  // 1. Buscar a disponibilidade da profissional para o dia da semana
  const { data: disponibilidades } = await supabase
    .from('disponibilidade')
    .select('*')
    .eq('profissional_id', profissionalId)
    .eq('dia_semana', dayOfWeek)

  if (!disponibilidades || disponibilidades.length === 0) {
    return {
      dateStr,
      dayOfWeek,
      isWorkingDay: false,
      availableSlots: [],
    }
  }

  // 2. Determinar a duração total em minutos
  let duracaoMinutos = 60
  if (typeof servicoIdOrDuracaoMinutos === 'number') {
    duracaoMinutos = servicoIdOrDuracaoMinutos
  } else if (typeof servicoIdOrDuracaoMinutos === 'string') {
    const { data: servico } = await supabase
      .from('servicos')
      .select('duracao_minutos')
      .eq('id', servicoIdOrDuracaoMinutos)
      .single()

    if (servico?.duracao_minutos) {
      duracaoMinutos = servico.duracao_minutos
    }
  }

  const duracaoMs = duracaoMinutos * 60 * 1000

  // 3. Buscar agendamentos já ocupados no dia (fuso Brasil -03:00)
  const startOfDayIso = new Date(`${dateStr}T00:00:00-03:00`).toISOString()
  const endOfDayIso = new Date(`${dateStr}T23:59:59.999-03:00`).toISOString()

  const { data: agendamentosExistentes } = await supabase
    .from('agendamentos')
    .select('data_hora_inicio, data_hora_fim')
    .eq('profissional_id', profissionalId)
    .neq('status', 'cancelado')
    .gte('data_hora_inicio', startOfDayIso)
    .lte('data_hora_inicio', endOfDayIso)

  const ocupadosMs = (agendamentosExistentes || []).map((a) => ({
    start: new Date(a.data_hora_inicio).getTime(),
    end: new Date(a.data_hora_fim).getTime(),
  }))

  // 4. Gerar slots possíveis com base nos blocos e pausas
  const availableSlotsMap = new Map<string, TimeSlot>()
  const todayStr = getTodayDateString()

  for (const disp of disponibilidades) {
    const [hInicio, mInicio] = disp.hora_inicio.split(':').map(Number)
    const [hFim, mFim] = disp.hora_fim.split(':').map(Number)

    // Pausas cadastradas no dia (fuso Brasil -03:00)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pausas = (((disp as any).pausas as unknown) || []) as { pausa_inicio: string; pausa_fim: string }[]
    const pausasMs = pausas.map((p) => ({
      start: new Date(`${dateStr}T${p.pausa_inicio.slice(0, 5)}:00-03:00`).getTime(),
      end: new Date(`${dateStr}T${p.pausa_fim.slice(0, 5)}:00-03:00`).getTime(),
    }))

    const startMinTotal = hInicio * 60 + mInicio
    const endMinTotal = hFim * 60 + mFim

    // Geração aritmética precisa de slots a cada 30 minutos
    for (let curMin = startMinTotal; curMin + duracaoMinutos <= endMinTotal; curMin += 30) {
      const curH = Math.floor(curMin / 60)
      const curM = curMin % 60
      const timeStr = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`

      const slotStartMs = new Date(`${dateStr}T${timeStr}:00-03:00`).getTime()
      const slotEndMs = slotStartMs + duracaoMs

      // A. Não permitir horários no passado se for a data de hoje (apenas para agendamentos públicos)
      if (!allowPastSlots && dateStr === todayStr && slotStartMs <= Date.now()) {
        continue
      }

      // B. Verificar conflito com agendamentos existentes
      const temConflitoAgendamento = ocupadosMs.some((occ) => {
        return slotStartMs < occ.end && slotEndMs > occ.start
      })
      if (temConflitoAgendamento) continue

      // C. Verificar conflito com pausas de almoço/descanso
      const temConflitoPausa = pausasMs.some((p) => {
        return slotStartMs < p.end && slotEndMs > p.start
      })
      if (temConflitoPausa) continue

      // D. Verificar conflito com bloqueios parciais de horário
      const temConflitoBloqueioParcial = partialBlockedRanges.some((b) => {
        return slotStartMs < b.endMs && slotEndMs > b.startMs
      })
      if (temConflitoBloqueioParcial) continue

      if (!availableSlotsMap.has(timeStr)) {
        availableSlotsMap.set(timeStr, {
          timeStr,
          dataHoraInicio: new Date(`${dateStr}T${timeStr}:00-03:00`).toISOString(),
          dataHoraFim: new Date(slotEndMs).toISOString(),
        })
      }
    }
  }

  const availableSlots = Array.from(availableSlotsMap.values()).sort((a, b) =>
    a.timeStr.localeCompare(b.timeStr)
  )

  return {
    dateStr,
    dayOfWeek,
    isWorkingDay: true,
    availableSlots,
  }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { calculateSlotsForDate } from './availability-utils'

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

/** Calcula horários de uma única data, preservando o formato usado pelo wizard. */
export async function calculateAvailableSlots(
  profissionalId: string,
  servicoIdOrDuracaoMinutos: string | number,
  dateStr: string,
  allowPastSlots = false
): Promise<DayAvailability> {
  const supabase = createAdminClient()
  const dayOfWeek = new Date(`${dateStr}T12:00:00-03:00`).getDay()
  let durationMinutes = typeof servicoIdOrDuracaoMinutos === 'number' ? servicoIdOrDuracaoMinutos : 60
  if (typeof servicoIdOrDuracaoMinutos === 'string') {
    const { data: service } = await supabase.from('servicos').select('duracao_minutos').eq('id', servicoIdOrDuracaoMinutos).single()
    if (service?.duracao_minutos) durationMinutes = service.duracao_minutos
  }

  const startOfDayIso = new Date(`${dateStr}T00:00:00-03:00`).toISOString()
  const endOfDayIso = new Date(`${dateStr}T23:59:59.999-03:00`).toISOString()
  const [blocksResult, availabilityResult, bookingsResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('bloqueios_disponibilidade') as any).select('data, data_fim, hora_inicio, hora_fim').eq('profissional_id', profissionalId),
    supabase.from('disponibilidade').select('*').eq('profissional_id', profissionalId).eq('dia_semana', dayOfWeek),
    supabase.from('agendamentos').select('data_hora_inicio, data_hora_fim').eq('profissional_id', profissionalId).neq('status', 'cancelado').gte('data_hora_inicio', startOfDayIso).lte('data_hora_inicio', endOfDayIso),
  ])
  const blocks = (blocksResult.data || []) as BloqueioDbItem[]
  const availability = (availabilityResult.data || []) as unknown as import('./availability-utils').RecurringAvailabilityWindow[]
  const bookings = (bookingsResult.data || []) as import('./availability-utils').BusyBookingWindow[]
  const matchingBlocks = blocks.filter((block) => dateStr >= block.data && dateStr <= (block.data_fim || block.data))
  const isWorkingDay = availability.length > 0 && !matchingBlocks.some((block) => !block.hora_inicio)
  const availableSlots = calculateSlotsForDate({
    dateStr,
    durationMinutes,
    disponibilidades: availability,
    bloqueios: blocks,
    agendamentos: bookings,
    nowMs: Date.now(),
    allowPastSlots,
  }) as TimeSlot[]

  return { dateStr, dayOfWeek, isWorkingDay, availableSlots }
}

/**
 * Busca disponibilidade de uma semana em consultas agrupadas e retorna apenas
 * se cada dia tem pelo menos um horário compatível com a duração selecionada.
 */
export async function calculateDateAvailability(
  profissionalId: string,
  dateStrings: readonly string[],
  durationMinutes: number
): Promise<Record<string, boolean>> {
  if (dateStrings.length === 0) return {}
  const sortedDates = [...new Set(dateStrings)].sort()
  const startDate = sortedDates[0]
  const endDate = sortedDates[sortedDates.length - 1]
  const startIso = new Date(`${startDate}T00:00:00-03:00`).toISOString()
  const endIso = new Date(`${endDate}T23:59:59.999-03:00`).toISOString()
  const supabase = createAdminClient()
  const [blocksResult, availabilityResult, bookingsResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('bloqueios_disponibilidade') as any).select('data, data_fim, hora_inicio, hora_fim').eq('profissional_id', profissionalId),
    supabase.from('disponibilidade').select('*').eq('profissional_id', profissionalId),
    supabase.from('agendamentos').select('data_hora_inicio, data_hora_fim').eq('profissional_id', profissionalId).neq('status', 'cancelado').gte('data_hora_inicio', startIso).lte('data_hora_inicio', endIso),
  ])
  const blocks = (blocksResult.data || []) as BloqueioDbItem[]
  const availability = (availabilityResult.data || []) as unknown as import('./availability-utils').RecurringAvailabilityWindow[]
  const bookings = (bookingsResult.data || []) as import('./availability-utils').BusyBookingWindow[]
  const nowMs = Date.now()

  return Object.fromEntries(sortedDates.map((dateStr) => [dateStr, calculateSlotsForDate({
    dateStr,
    durationMinutes,
    disponibilidades: availability,
    bloqueios: blocks,
    agendamentos: bookings,
    nowMs,
  }).length > 0]))
}

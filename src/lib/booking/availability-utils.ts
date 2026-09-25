export interface AvailabilityPause {
  pausa_inicio: string
  pausa_fim: string
}

export interface RecurringAvailabilityWindow {
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  pausas?: AvailabilityPause[] | null
}

export interface AvailabilityBlockWindow {
  data: string
  data_fim: string | null
  hora_inicio: string | null
  hora_fim: string | null
}

export interface BusyBookingWindow {
  data_hora_inicio: string
  data_hora_fim: string
}

export interface DaySlotInput {
  dateStr: string
  durationMinutes: number
  disponibilidades: readonly RecurringAvailabilityWindow[]
  bloqueios: readonly AvailabilityBlockWindow[]
  agendamentos: readonly BusyBookingWindow[]
  nowMs?: number
  allowPastSlots?: boolean
}

export interface CalculatedTimeSlot {
  timeStr: string
  dataHoraInicio: string
  dataHoraFim: string
}

export function getSaoPauloDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function calculateSlotsForDate(input: DaySlotInput): CalculatedTimeSlot[] {
  const { dateStr, durationMinutes, disponibilidades, bloqueios, agendamentos } = input
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return []

  const targetDate = new Date(`${dateStr}T12:00:00-03:00`)
  const dayOfWeek = targetDate.getDay()
  const matchingBlocks = bloqueios.filter((block) => {
    const end = block.data_fim || block.data
    return dateStr >= block.data && dateStr <= end
  })
  if (matchingBlocks.some((block) => !block.hora_inicio)) return []

  const dailyAvailability = disponibilidades.filter((availability) => availability.dia_semana === dayOfWeek)
  if (dailyAvailability.length === 0) return []

  const durationMs = durationMinutes * 60_000
  const nowMs = input.nowMs ?? Date.now()
  const isToday = dateStr === getSaoPauloDateString(new Date(nowMs))
  const occupiedRanges = agendamentos.map((booking) => ({
    start: new Date(booking.data_hora_inicio).getTime(),
    end: new Date(booking.data_hora_fim).getTime(),
  }))
  const partialBlockedRanges = matchingBlocks.flatMap((block) => {
    if (!block.hora_inicio || !block.hora_fim) return []
    return [{
      start: new Date(`${dateStr}T${block.hora_inicio.slice(0, 5)}:00-03:00`).getTime(),
      end: new Date(`${dateStr}T${block.hora_fim.slice(0, 5)}:00-03:00`).getTime(),
    }]
  })
  const slots = new Map<string, CalculatedTimeSlot>()

  for (const availability of dailyAvailability) {
    const [startHour, startMinute] = availability.hora_inicio.split(':').map(Number)
    const [endHour, endMinute] = availability.hora_fim.split(':').map(Number)
    const startMinuteOfDay = startHour * 60 + startMinute
    const endMinuteOfDay = endHour * 60 + endMinute
    const pauses = (availability.pausas || []).map((pause) => ({
      start: new Date(`${dateStr}T${pause.pausa_inicio.slice(0, 5)}:00-03:00`).getTime(),
      end: new Date(`${dateStr}T${pause.pausa_fim.slice(0, 5)}:00-03:00`).getTime(),
    }))

    for (let minuteOfDay = startMinuteOfDay; minuteOfDay + durationMinutes <= endMinuteOfDay; minuteOfDay += 30) {
      const timeStr = `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`
      const startMs = new Date(`${dateStr}T${timeStr}:00-03:00`).getTime()
      const endMs = startMs + durationMs
      if (!input.allowPastSlots && isToday && startMs <= nowMs) continue
      if (occupiedRanges.some((range) => startMs < range.end && endMs > range.start)) continue
      if (pauses.some((range) => startMs < range.end && endMs > range.start)) continue
      if (partialBlockedRanges.some((range) => startMs < range.end && endMs > range.start)) continue

      if (!slots.has(timeStr)) {
        slots.set(timeStr, {
          timeStr,
          dataHoraInicio: new Date(startMs).toISOString(),
          dataHoraFim: new Date(endMs).toISOString(),
        })
      }
    }
  }

  return [...slots.values()].sort((a, b) => a.timeStr.localeCompare(b.timeStr))
}

export function hasAvailableSlotsForDate(input: DaySlotInput): boolean {
  return calculateSlotsForDate(input).length > 0
}

export function isCurrentSlotResponse(input: {
  requestId: number
  latestRequestId: number
  requestedDate: string
  selectedDate: string | null
  requestedDurationMinutes: number
  currentDurationMinutes: number
  requestedContext?: string
  currentContext?: string
}): boolean {
  return input.requestId === input.latestRequestId &&
    input.requestedDate === input.selectedDate &&
    input.requestedDurationMinutes === input.currentDurationMinutes &&
    (input.requestedContext === undefined || input.requestedContext === input.currentContext)
}

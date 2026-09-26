export interface ScheduleWindow {
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function getLocalWeekdayAndTime(
  instant: Date,
  timeZone: string
): { dayOfWeek: number; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    dayOfWeek: WEEKDAY_INDEX[values.weekday] ?? -1,
    time: `${values.hour}:${values.minute}`,
  }
}

export function isScheduleOpenAt(
  schedule: readonly ScheduleWindow[],
  instant: Date,
  timeZone = 'America/Sao_Paulo'
): boolean {
  if (!schedule.length || !Number.isFinite(instant.getTime())) return false
  const { dayOfWeek, time } = getLocalWeekdayAndTime(instant, timeZone)
  return schedule.some((slot) => {
    return slot.dia_semana === dayOfWeek &&
      time >= slot.hora_inicio.slice(0, 5) &&
      time <= slot.hora_fim.slice(0, 5)
  })
}

export function getLocalDayOfWeek(instant: Date, timeZone = 'America/Sao_Paulo'): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).formatToParts(instant)
  const weekday = parts.find((part) => part.type === 'weekday')?.value
  return WEEKDAY_INDEX[weekday ?? ''] ?? -1
}

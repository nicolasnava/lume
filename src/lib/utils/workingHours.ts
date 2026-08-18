import { Database } from '@/lib/supabase/database.types'

type DisponibilidadeRow = Database['public']['Tables']['disponibilidade']['Row']

const FULL_DAY_NAMES = [
  { dayIndex: 1, name: 'Segunda-feira' },
  { dayIndex: 2, name: 'Terça-feira' },
  { dayIndex: 3, name: 'Quarta-feira' },
  { dayIndex: 4, name: 'Quinta-feira' },
  { dayIndex: 5, name: 'Sexta-feira' },
  { dayIndex: 6, name: 'Sábado' },
  { dayIndex: 0, name: 'Domingo' },
]

/**
 * Verifica se o estabelecimento está aberto agora.
 */
export function isStudioOpenNow(disponibilidades: DisponibilidadeRow[]): boolean {
  if (!disponibilidades || disponibilidades.length === 0) return false

  const now = new Date()
  const currentDay = now.getDay() // 0 = Dom, 1 = Seg, ...
  const currentHours = String(now.getHours()).padStart(2, '0')
  const currentMinutes = String(now.getMinutes()).padStart(2, '0')
  const currentTime = `${currentHours}:${currentMinutes}`

  const todaySlots = disponibilidades.filter((d) => d.dia_semana === currentDay)

  return todaySlots.some((slot) => {
    const start = slot.hora_inicio.slice(0, 5)
    const end = slot.hora_fim.slice(0, 5)
    return currentTime >= start && currentTime <= end
  })
}

/**
 * Retorna a tabela de horários de funcionamento (Seg a Dom), mostrando apenas o intervalo geral
 * de abertura e fechamento de cada dia (Item 10: sem detalhar pausas).
 */
export function getDetailedWorkingHoursTable(disponibilidades: DisponibilidadeRow[]) {
  const now = new Date()
  const todayDayIndex = now.getDay()

  const dayBoundsMap = new Map<number, { minStart: string; maxEnd: string }>()

  for (const disp of disponibilidades || []) {
    const start = disp.hora_inicio.slice(0, 5)
    const end = disp.hora_fim.slice(0, 5)

    if (!dayBoundsMap.has(disp.dia_semana)) {
      dayBoundsMap.set(disp.dia_semana, { minStart: start, maxEnd: end })
    } else {
      const current = dayBoundsMap.get(disp.dia_semana)!
      if (start < current.minStart) current.minStart = start
      if (end > current.maxEnd) current.maxEnd = end
    }
  }

  return FULL_DAY_NAMES.map(({ dayIndex, name }) => {
    const bounds = dayBoundsMap.get(dayIndex)
    const horariosStr = bounds ? `${bounds.minStart} - ${bounds.maxEnd}` : 'Fechado'
    const isToday = dayIndex === todayDayIndex

    return {
      dayIndex,
      dayName: name,
      horariosStr,
      isOpen: horariosStr !== 'Fechado',
      isToday,
    }
  })
}

/**
 * Agrupa os horários de atendimento por janelas idênticas para resumo rápido.
 */
export function formatWorkingHoursSummary(disponibilidades: DisponibilidadeRow[]): string {
  if (!disponibilidades || disponibilidades.length === 0) {
    return 'Horários sob consulta'
  }

  const dayMap = new Map<number, string[]>()

  for (const disp of disponibilidades) {
    const timeRange = `${disp.hora_inicio.slice(0, 5)} - ${disp.hora_fim.slice(0, 5)}`
    if (!dayMap.has(disp.dia_semana)) {
      dayMap.set(disp.dia_semana, [])
    }
    dayMap.get(disp.dia_semana)!.push(timeRange)
  }

  const orderedDays = [1, 2, 3, 4, 5, 6, 0] // Seg a Dom
  const groups: { days: number[]; times: string }[] = []

  for (const dayOfWeek of orderedDays) {
    if (!dayMap.has(dayOfWeek)) continue

    const timesStr = dayMap.get(dayOfWeek)!.join(', ')
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && lastGroup.times === timesStr) {
      lastGroup.days.push(dayOfWeek)
    } else {
      groups.push({ days: [dayOfWeek], times: timesStr })
    }
  }

  return groups
    .map((g) => {
      const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      if (g.days.length === 1) {
        return `${dayNamesShort[g.days[0]]}: ${g.times}`
      }
      const first = dayNamesShort[g.days[0]]
      const last = dayNamesShort[g.days[g.days.length - 1]]
      return `${first} a ${last}: ${g.times}`
    })
    .join(' • ')
}

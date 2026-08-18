'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getContrastingTextColor } from '@/lib/utils/contrast'

interface WeekStripCalendarProps {
  selectedDateStr: string
  onSelectDate: (dateStr: string) => void
  minDateStr?: string
  availableDaysMap?: Record<string, boolean> // dateStr -> boolean (is available)
  corPrimaria?: string
}

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = [
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

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getMondayOfDate(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // ajusta para segunda-feira
  return new Date(date.setDate(diff))
}

export default function WeekStripCalendar({
  selectedDateStr,
  onSelectDate,
  minDateStr,
  availableDaysMap = {},
  corPrimaria = '#B8A9D9',
}: WeekStripCalendarProps) {
  const todayDateStr = formatDateStr(new Date())
  const minDate = minDateStr || todayDateStr

  // Data base inicial para a semana exibida
  const initialDate = selectedDateStr ? parseLocalDate(selectedDateStr) : new Date()
  const [weekMonday, setWeekMonday] = useState<Date>(getMondayOfDate(initialDate))

  // Gerar os 7 dias da semana atual
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekMonday)
    d.setDate(weekMonday.getDate() + i)
    return d
  })

  const handlePrevWeek = () => {
    const prev = new Date(weekMonday)
    prev.setDate(weekMonday.getDate() - 7)
    setWeekMonday(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(weekMonday)
    next.setDate(weekMonday.getDate() + 7)
    setWeekMonday(next)
  }

  // Título do cabeçalho da semana
  const firstDay = weekDays[0]
  const lastDay = weekDays[6]
  const headerMonth =
    firstDay.getMonth() === lastDay.getMonth()
      ? `${MONTH_NAMES[firstDay.getMonth()]} ${firstDay.getFullYear()}`
      : `${MONTH_NAMES[firstDay.getMonth()].slice(0, 3)} - ${MONTH_NAMES[lastDay.getMonth()].slice(0, 3)} ${lastDay.getFullYear()}`

  const textColorOnPrimary = getContrastingTextColor(corPrimaria)

  return (
    <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      {/* Controles da Semana */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={handlePrevWeek}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer flex items-center justify-center"
          title="Semana anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="text-xs sm:text-sm font-semibold text-[#4A3F5C]">
          {headerMonth}
        </span>

        <button
          type="button"
          onClick={handleNextWeek}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer flex items-center justify-center"
          title="Próxima semana"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Tira Horizontal de 7 Dias */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((d) => {
          const dateStr = formatDateStr(d)
          const isSelected = dateStr === selectedDateStr
          const isPast = dateStr < minDate
          const isToday = dateStr === todayDateStr
          const isAvailable = availableDaysMap[dateStr] ?? true
          const isDisabled = isPast || !isAvailable

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center justify-between py-2.5 px-1 rounded-2xl transition border cursor-pointer ${
                isSelected
                  ? 'border-transparent shadow-md scale-105'
                  : isDisabled
                  ? 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'
                  : isToday
                  ? 'bg-purple-50/70 border-purple-200 hover:border-[#B8A9D9]'
                  : 'bg-white border-gray-200 hover:border-[#B8A9D9] hover:bg-purple-50/30'
              }`}
              style={{
                backgroundColor: isSelected ? corPrimaria : undefined,
                color: isSelected ? textColorOnPrimary : undefined,
              }}
            >
              {/* Nome do Dia da Semana */}
              <span
                className={`text-[10px] sm:text-xs uppercase tracking-wider font-semibold ${
                  isSelected ? 'opacity-90' : 'text-gray-500'
                }`}
              >
                {WEEKDAY_NAMES[d.getDay()]}
              </span>

              {/* Número do Dia */}
              <span
                className={`text-sm sm:text-base font-medium my-1 ${
                  isSelected
                    ? 'font-bold'
                    : isToday
                    ? 'font-semibold text-[#4A3F5C]'
                    : 'text-[#4A3F5C]'
                }`}
              >
                {d.getDate()}
              </span>

              {/* Ponto Indicador de Disponibilidade */}
              <div className="flex items-center justify-center h-2">
                {isDisabled ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                ) : isSelected ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-2xs" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

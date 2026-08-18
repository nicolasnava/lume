'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, CalendarX } from 'lucide-react'
import { WorkingDayInfo } from '@/lib/booking/availability'

interface VerticalDayListProps {
  workingDays: WorkingDayInfo[]
  selectedDateStr: string | null
  onSelectDate: (dateStr: string) => void
  corPrimaria?: string
}

export default function VerticalDayList({
  workingDays,
  selectedDateStr,
  onSelectDate,
  corPrimaria = '#B8A9D9',
}: VerticalDayListProps) {
  const [weekIndex, setWeekIndex] = useState(0)

  const todayStr = new Date().toISOString().split('T')[0]

  // Dividir o array de dias em semanas (7 dias por bloco)
  const daysPerWeek = 7
  const totalWeeks = Math.ceil(workingDays.length / daysPerWeek) || 1

  const startIndex = weekIndex * daysPerWeek
  const currentWeekDays = workingDays.slice(startIndex, startIndex + daysPerWeek)

  const firstDay = currentWeekDays[0]
  const lastDay = currentWeekDays[currentWeekDays.length - 1]

  const handlePrevWeek = () => {
    if (weekIndex > 0) {
      setWeekIndex((prev) => prev - 1)
    }
  }

  const handleNextWeek = () => {
    if (weekIndex < totalWeeks - 1) {
      setWeekIndex((prev) => prev + 1)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Navegação entre Semanas (Item 28: sem 'Semana X de Y') */}
      <div className="flex items-center justify-between bg-[#FAF7F5] p-3 rounded-2xl border border-gray-200/80">
        <button
          type="button"
          disabled={weekIndex === 0}
          onClick={handlePrevWeek}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="text-center">
          {/* Item 28: Aumentar fonte do intervalo de datas */}
          <span className="text-xs sm:text-sm font-bold text-[#4A3F5C] block">
            {firstDay && lastDay
              ? `${firstDay.displayDate} até ${lastDay.displayDate}`
              : 'Selecione uma semana'}
          </span>
        </div>

        <button
          type="button"
          disabled={weekIndex >= totalWeeks - 1}
          onClick={handleNextWeek}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Lista Empilhada Vertical de Dias (Item 28, Item 29) */}
      <div className="space-y-2.5">
        {currentWeekDays.map((day) => {
          const isToday = day.dateStr === todayStr
          const isSelected = day.dateStr === selectedDateStr
          const dayNum = day.dateStr.split('-')[2]
          const isPast = day.dateStr < todayStr
          const isAvailable = day.isWorkingDay && !isPast

          return (
            <button
              key={day.dateStr}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectDate(day.dateStr)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                isSelected
                  ? 'bg-purple-50/80 border-[#B8A9D9] shadow-xs'
                  : isAvailable
                  ? 'bg-white border-gray-200 hover:border-[#B8A9D9] hover:bg-purple-50/30'
                  : 'bg-gray-50/60 border-gray-200/60 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Círculo do Número do Dia + Texto de Data */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    isSelected
                      ? 'text-white'
                      : isAvailable
                      ? 'bg-[#B8A9D9]/20 text-[#4A3F5C]'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                  style={isSelected ? { backgroundColor: corPrimaria } : undefined}
                >
                  {dayNum}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    {/* Item 28: Aumentar tamanho da fonte da data */}
                    <span className="text-sm sm:text-base font-bold text-[#4A3F5C] truncate">
                      {day.fullDisplay}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#B8A9D9] text-white shrink-0">
                        Hoje
                      </span>
                    )}
                  </div>
                  {/* Item 29: Simplificar texto para 'Indisponível' */}
                  <span className="text-[11px] text-gray-500 font-medium block truncate">
                    {isAvailable
                      ? 'Horários disponíveis'
                      : isPast
                      ? 'Data passada'
                      : 'Indisponível'}
                  </span>
                </div>
              </div>

              {/* Ícone de Seleção ou Estado */}
              <div className="shrink-0 ml-2">
                {isSelected ? (
                  <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                ) : isAvailable ? (
                  <span className="text-xs font-semibold text-[#4A3F5C]/70 group-hover:text-[#4A3F5C]">
                    Selecionar
                  </span>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                    <CalendarX className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

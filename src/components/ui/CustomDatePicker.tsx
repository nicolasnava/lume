'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface CustomDatePickerProps {
  value: string // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void
  label?: string
  minDate?: string // 'YYYY-MM-DD'
  placeholder?: string
  disabled?: boolean
  className?: string
  dateFormat?: 'short' | 'full'
  showAlterarButton?: boolean
}

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

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CustomDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Selecione uma data...',
  disabled = false,
  className = '',
  dateFormat = 'full',
  showAlterarButton = true,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Inicializar o mês/ano de visualização baseado no valor selecionado ou na data de hoje
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date()
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())

  // Quando o valor externo mudar e abrir, foca no mês correspondente
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const formatted = `${viewYear}-${mm}-${dd}`
    onChange(formatted)
    setIsOpen(false)
  }

  const handleSelectShortcut = (offsetDays: number) => {
    const target = new Date()
    target.setDate(target.getDate() + offsetDays)
    const yyyy = target.getFullYear()
    const mm = String(target.getMonth() + 1).padStart(2, '0')
    const dd = String(target.getDate()).padStart(2, '0')
    const formatted = `${yyyy}-${mm}-${dd}`
    onChange(formatted)
    setViewYear(yyyy)
    setViewMonth(target.getMonth())
    setIsOpen(false)
  }

  // Cálculos do calendário do mês atual
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Dias do mês anterior para preencher a primeira semana
  const prevMonthDaysCount = new Date(viewYear, viewMonth, 0).getDate()
  const prevMonthDays = Array.from(
    { length: firstDayOfWeek },
    (_, i) => prevMonthDaysCount - firstDayOfWeek + 1 + i
  )

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Formatação do botão de exibição
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`

  let displayLabel = placeholder
  if (value) {
    const selectedDate = new Date(value + 'T12:00:00')
    if (dateFormat === 'short') {
      const dayNum = String(selectedDate.getDate()).padStart(2, '0')
      const monthNum = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const yearNum = selectedDate.getFullYear()
      displayLabel = `${dayNum}/${monthNum}/${yearNum}`
    } else {
      const dayOfWeek = WEEKDAY_NAMES[selectedDate.getDay()]
      const dayNum = selectedDate.getDate()
      const monthStr = MONTH_NAMES[selectedDate.getMonth()].slice(0, 3)
      const isToday = value === todayStr

      displayLabel = `${dayOfWeek}, ${dayNum} de ${monthStr} ${isToday ? '· Hoje' : ''}`
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">
          <CalendarIcon className="h-3.5 w-3.5 text-[#B8A9D9]" />
          {label}
        </label>
      )}

      {/* Botão de Disparo do Calendário */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-[#FAF7F5] px-3 py-2 text-xs font-semibold text-[#4A3F5C] hover:border-[#B8A9D9] hover:bg-white focus:border-[#B8A9D9] focus:bg-white focus:outline-none transition cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-4 w-4 text-[#8675A9] shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>
        {showAlterarButton && (
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
            Alterar
          </span>
        )}
      </button>

      {/* Modal Centralizado do Calendário Personalizado (Nunca Corta na Tela) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop que fecha ao clicar fora */}
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Card Centralizado com Design Lumê */}
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-[#B8A9D9]/40 space-y-4 animate-in fade-in zoom-in-95 duration-200 z-10">
            {/* Topo do Modal: Título e Botão Fechar */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B8A9D9]/25 text-[#4A3F5C]">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-[#4A3F5C]">Selecionar Data</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-[#4A3F5C] hover:bg-gray-100 transition cursor-pointer"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cabeçalho do Mês / Ano com Setas de Navegação */}
            <div className="flex items-center justify-between bg-[#FAF7F5] p-2 rounded-2xl border border-gray-100">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-gray-600 hover:text-[#4A3F5C] hover:bg-white transition cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-extrabold text-[#4A3F5C]">
                {MONTH_NAMES[viewMonth]} de {viewYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-gray-600 hover:text-[#4A3F5C] hover:bg-white transition cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_NAMES.map((d) => (
                <span key={d} className="text-[10px] font-extrabold uppercase text-gray-400 py-0.5">
                  {d}
                </span>
              ))}
            </div>

            {/* Grade de Dias do Mês */}
            <div className="grid grid-cols-7 gap-1.5 place-items-center">
              {/* Dias anteriores esmaecidos */}
              {prevMonthDays.map((d) => (
                <span
                  key={`prev-${d}`}
                  className="h-9 w-9 flex items-center justify-center text-xs text-gray-300 font-normal select-none"
                >
                  {d}
                </span>
              ))}

              {/* Dias do mês atual */}
              {currentMonthDays.map((d) => {
                const mm = String(viewMonth + 1).padStart(2, '0')
                const dd = String(d).padStart(2, '0')
                const dayIso = `${viewYear}-${mm}-${dd}`
                const isSelected = value === dayIso
                const isToday = dayIso === todayStr

                return (
                  <button
                    key={`day-${d}`}
                    type="button"
                    onClick={() => handleSelectDay(d)}
                    className={`h-9 w-9 rounded-2xl flex flex-col items-center justify-center text-xs font-bold transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#4A3F5C] text-white shadow-md scale-105 font-extrabold'
                        : isToday
                        ? 'bg-[#B8A9D9]/35 text-[#4A3F5C] hover:bg-[#B8A9D9]/50 font-extrabold'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-[#4A3F5C]'
                    }`}
                  >
                    <span>{d}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#8675A9]" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Atalhos Rápidos no Rodapé */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectShortcut(0)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-[#B8A9D9]/30 text-gray-700 hover:text-[#4A3F5C] font-bold text-[11px] transition cursor-pointer text-center"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => handleSelectShortcut(1)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-[#B8A9D9]/30 text-gray-700 hover:text-[#4A3F5C] font-bold text-[11px] transition cursor-pointer text-center"
              >
                Amanhã
              </button>
              <button
                type="button"
                onClick={() => handleSelectShortcut(7)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-[#B8A9D9]/30 text-gray-700 hover:text-[#4A3F5C] font-bold text-[11px] transition cursor-pointer text-center"
              >
                +7 Dias
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

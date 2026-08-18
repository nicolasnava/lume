'use client'

import { X, Clock, Calendar } from 'lucide-react'
import { Database } from '@/lib/supabase/database.types'
import { getDetailedWorkingHoursTable, isStudioOpenNow } from '@/lib/utils/workingHours'

type DisponibilidadeRow = Database['public']['Tables']['disponibilidade']['Row']

interface WorkingHoursModalProps {
  isOpen: boolean
  onClose: () => void
  disponibilidades: DisponibilidadeRow[]
  studioNome?: string
}

export default function WorkingHoursModal({
  isOpen,
  onClose,
  disponibilidades,
  studioNome,
}: WorkingHoursModalProps) {
  if (!isOpen) return null

  const scheduleTable = getDetailedWorkingHoursTable(disponibilidades)
  const isOpenNow = isStudioOpenNow(disponibilidades)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-5 shadow-2xl border border-gray-100 space-y-4">
        {/* Header (Item 8: mais compacto) */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C] shrink-0">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#4A3F5C] leading-snug truncate">
                Horários de Atendimento
              </h3>
              {studioNome && <p className="text-xs text-gray-500 font-medium truncate">{studioNome}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Aberto / Fechado (Item 9: textos "Aberto" e "Fechado" curtos) */}
        <div className="flex items-center justify-between bg-[#FAF7F5] px-3.5 py-2 rounded-2xl border border-gray-200/80">
          <span className="text-xs font-semibold text-[#4A3F5C]/80">Status atual:</span>
          {isOpenNow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Aberto
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Fechado
            </span>
          )}
        </div>

        {/* Tabela de Horários (Item 8 e 10: compacta, sem pausas poluidas) */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#B8A9D9]" />
            <span>Programação Semanal</span>
          </h4>

          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white">
            <div className="divide-y divide-gray-100 text-xs">
              {scheduleTable.map((row) => (
                <div
                  key={row.dayIndex}
                  className={`flex items-center justify-between px-3.5 py-2 transition ${
                    row.isToday ? 'bg-[#B8A9D9]/15 font-semibold' : 'hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        row.isToday ? 'font-bold text-[#4A3F5C]' : 'text-gray-700 font-medium'
                      }`}
                    >
                      {row.dayName}
                    </span>
                    {row.isToday && (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#4A3F5C] bg-[#B8A9D9]/30 px-1.5 py-0.5 rounded-md">
                        Hoje
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs ${
                      row.isOpen ? 'text-[#4A3F5C] font-semibold' : 'text-gray-400 italic font-normal'
                    }`}
                  >
                    {row.horariosStr}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão Fechar */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#4A3F5C] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4A3F5C]/90 transition cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

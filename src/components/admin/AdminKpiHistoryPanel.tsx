'use client'

import { X } from 'lucide-react'

export type AdminKpiHistoryItem = {
  mes: string
  valor: string
  delta: string
  sub: string
}

interface AdminKpiHistoryPanelProps {
  title: string
  subtitle: string
  color: string
  history: AdminKpiHistoryItem[]
  invertDelta?: boolean
  onClose: () => void
}

export default function AdminKpiHistoryPanel({
  title,
  subtitle,
  color,
  history,
  invertDelta = false,
  onClose,
}: AdminKpiHistoryPanelProps) {
  return (
    <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/40 shadow-lg relative overflow-hidden -mt-1 origin-top">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
          <div>
          <h4 className="text-sm font-bold text-[#F8F5FA]">{title}</h4>
            <p className="text-[11px] text-[#A9A1B5]">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#A9A1B5] hover:text-[#F8F5FA] transition-colors duration-150 ease-out active:scale-[0.95] cursor-pointer"
          title="Fechar histórico"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {history.map((item, idx) => {
          const isPositive = item.delta.startsWith('+')
          const deltaColor = invertDelta
            ? isPositive
              ? '#F87171'
              : '#34D399'
            : isPositive
              ? '#34D399'
              : '#F5B84B'

          return (
            <div
              key={item.mes}
              className={`p-3 rounded-xl border ${
                idx === history.length - 1
                  ? 'bg-[#15111F] border-[#B8A9D9]/40 shadow-xs'
                  : 'bg-[#15111F]/70 border-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#A9A1B5] uppercase">{item.mes}</span>
                <span className="text-[10px] font-semibold" style={{ color: deltaColor }}>
                  {item.delta}
                </span>
              </div>
              <div className="text-base font-extrabold text-[#F8F5FA]">{item.valor}</div>
              <div className="text-[10px] text-[#A9A1B5] mt-0.5 truncate">{item.sub}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

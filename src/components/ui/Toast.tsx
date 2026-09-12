'use client'

import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react'

export interface ToastProps {
  show: boolean
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({
  show,
  message,
  type = 'success',
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!show) return

    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [show, duration, onClose])

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] flex items-center justify-between gap-3.5 rounded-3xl bg-[#FAF7F5]/95 backdrop-blur-md p-3.5 shadow-xl shadow-[#4A3F5C]/12 border border-[#B8A9D9]/40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {type === 'success' && (
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-700 border border-emerald-200 shrink-0 shadow-2xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
        {type === 'error' && (
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-700 border border-rose-200 shrink-0 shadow-2xs">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
        {type === 'info' && (
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#B8A9D9]/25 text-[#4A3F5C] border border-[#B8A9D9]/40 shrink-0 shadow-2xs">
            <Sparkles className="h-4 w-4 text-[#8675A9]" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8675A9] block leading-none mb-1">
            {type === 'success' ? 'Sucesso' : type === 'error' ? 'Atenção' : 'Lumê'}
          </span>
          <p className="text-xs font-bold text-[#4A3F5C] leading-snug break-words">
            {message}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1.5 text-gray-400 hover:text-[#4A3F5C] hover:bg-gray-200/50 transition shrink-0 cursor-pointer"
        title="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

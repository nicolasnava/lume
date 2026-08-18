'use client'

import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

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
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-[100] flex items-center justify-between gap-3 rounded-2xl bg-[#4A3F5C] px-5 py-4 text-xs font-semibold text-white shadow-2xl border border-white/10 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3">
        {type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
        {type === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
        {type === 'info' && <Info className="h-4 w-4 text-[#B8A9D9] shrink-0" />}
        <span className="leading-snug">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 rounded-full p-1 text-white/60 hover:text-white transition shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

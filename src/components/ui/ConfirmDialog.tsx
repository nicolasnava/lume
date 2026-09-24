'use client'

import { AlertTriangle, Check, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  inlineIcon?: ReactNode
  checkbox?: { label: string; checked: boolean; onChange: (checked: boolean) => void }
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  inlineIcon,
  checkbox,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#241C2E]/45 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative w-full max-w-sm origin-center rounded-3xl border border-white/70 bg-white p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition-[transform,color,background-color] duration-150 ease-out hover:bg-gray-100 hover:text-[#4A3F5C] active:scale-[0.97]">
          <X className="h-4 w-4" />
        </button>
        <h3 className="flex items-center gap-2.5 pr-6 text-base font-extrabold text-[#4A3F5C]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8A9D9]/20 text-[#8675A9]">
            {inlineIcon || <AlertTriangle className="h-5 w-5" />}
          </span>
          <span>{title}</span>
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{description}</p>
        {checkbox && <button type="button" role="checkbox" aria-checked={checkbox.checked} onClick={() => checkbox.onChange(!checkbox.checked)} className="mt-4 flex w-full items-center gap-2.5 rounded-xl text-left text-xs font-medium text-[#4A3F5C]">
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${checkbox.checked ? 'border-[#6D5C89] bg-[#6D5C89] text-white' : 'border-[#B8A9D9] bg-white text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
          <span>{checkbox.label}</span>
        </button>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition-[transform,background-color] duration-150 ease-out hover:bg-gray-50 active:scale-[0.97] disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 ${destructive ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#4A3F5C] hover:bg-[#393047]'}`}>
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, X } from 'lucide-react'

interface PaymentReminderBannerProps {
  payment: { id: string; dataVencimento: string; valor: number; linkPagamento: string | null } | null
}

function getDaysUntil(date: string) {
  const due = new Date(date)
  const today = new Date()
  const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((dueDay - currentDay) / 86400000)
}

export default function PaymentReminderBanner({ payment }: PaymentReminderBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!payment || getDaysUntil(payment.dataVencimento) !== 3) return
    const key = `lume_payment_reminder_seen_${payment.id}`
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'true')
      setVisible(true)
    }
  }, [payment])

  if (!payment || !visible) return null
  const dismiss = () => setVisible(false)

  return (
    <div className="pointer-events-none fixed inset-x-3 top-20 z-[70] flex justify-center md:left-72 md:right-8 md:top-4">
      <section role="status" className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border border-[#B8A9D9]/40 bg-[#FAF7F5] px-4 py-3 text-[#4A3F5C] shadow-[0_18px_50px_-24px_rgba(74,63,92,.55)] animate-in fade-in slide-in-from-top-2 duration-200">
        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1"><p className="text-xs font-bold">Sua mensalidade vence em 3 dias</p><p className="mt-0.5 text-[11px] text-[#6B5E7A]">R$ {payment.valor.toFixed(2)} · vence em {new Date(payment.dataVencimento).toLocaleDateString('pt-BR')}</p><Link href={payment.linkPagamento || '/perfil'} onClick={dismiss} className="mt-2 inline-flex min-h-8 items-center rounded-full bg-[#4A3F5C] px-3 text-[11px] font-bold text-white transition-transform duration-150 ease-out active:scale-[.98]">Ver pagamento</Link></div>
        <button type="button" onClick={dismiss} className="rounded-full p-1 text-[#4A3F5C]/60 transition-transform duration-150 ease-out active:scale-[.97]" aria-label="Fechar aviso de pagamento"><X className="h-4 w-4" /></button>
      </section>
    </div>
  )
}

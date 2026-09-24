'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, X, Megaphone, ShieldAlert, CreditCard, Info } from 'lucide-react'

interface MobileNotificationBellProps {
  aviso: {
    id: string
    mensagem: string
    tipo: 'info' | 'alerta' | 'manutencao'
  } | null
  statusConta?: string
  payment?: { id: string; dataVencimento: string; valor: number; linkPagamento: string | null } | null
}

function daysUntil(date: string) {
  const due = new Date(date)
  const today = new Date()
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
  return Math.round((dueLocal - todayLocal) / 86400000)
}

export default function MobileNotificationBell({ aviso, statusConta, payment }: MobileNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('lume_dismissed_notifications')
    setDismissed(stored ? JSON.parse(stored) as string[] : [])
  }, [])

  const dismiss = (id: string) => {
    const next = [...new Set([...dismissed, id])]
    setDismissed(next)
    localStorage.setItem('lume_dismissed_notifications', JSON.stringify(next))
  }

  const paymentDays = payment ? daysUntil(payment.dataVencimento) : null
  const paymentId = payment ? `fatura-${payment.id}` : null
  const hasImportantNotice = (!!aviso && !dismissed.includes(`aviso-${aviso.id}`)) || (statusConta === 'suspensa' && !dismissed.includes('conta-suspensa')) || (paymentDays !== null && paymentDays <= 3 && paymentDays >= 0 && !!paymentId && !dismissed.includes(paymentId))

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAF7F5] text-[#4A3F5C] border border-[#B8A9D9]/40 hover:bg-[#B8A9D9]/15 transition cursor-pointer"
        title="Avisos e Notificações"
        aria-label="Avisos e Notificações"
      >
        <Bell className="h-4 w-4 text-[#4A3F5C]" />
        {hasImportantNotice && (
          <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${paymentDays !== null && paymentDays <= 1 && paymentDays >= 0 && paymentId && !dismissed.includes(paymentId) ? 'bg-amber-600' : 'bg-[#B8A9D9]'}`} />
        )}
      </button>

      {/* Painel de avisos em folha, confortável no celular */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#241C2E]/45 p-3 pt-16 backdrop-blur-[2px] animate-in fade-in duration-150" onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="main-notices-title" className="w-full max-w-sm rounded-3xl border border-[#B8A9D9]/25 bg-white p-5 text-[#4A3F5C] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-[#4A3F5C] flex items-center justify-center">
                  <Bell className="h-4 w-4 text-[#B8A9D9]" />
                </div>
                <div>
                  <h3 id="main-notices-title" className="text-sm font-bold text-[#4A3F5C]">Principais avisos</h3>
                  <p className="text-[10px] text-gray-500 font-medium">O que precisa da sua atenção</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              {aviso && !dismissed.includes(`aviso-${aviso.id}`) && (
                <article className="flex items-start gap-3 border-t border-[#4A3F5C]/10 py-3.5 first:border-t-0">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[#8675A9]" />
                  <div className="min-w-0 flex-1"><h4 className="text-xs font-bold">{aviso.tipo === 'manutencao' ? 'Manutenção programada' : aviso.tipo === 'alerta' ? 'Alerta importante' : 'Comunicado oficial'}</h4><p className="mt-1 text-[11px] leading-relaxed text-[#6B5E7A]">{aviso.mensagem}</p></div>
                  <button type="button" onClick={() => dismiss(`aviso-${aviso.id}`)} className="rounded-full p-1 text-[#8675A9] active:scale-[.97]" aria-label="Dispensar aviso"><X className="h-4 w-4" /></button>
                </article>
              )}
              {payment && paymentDays !== null && paymentDays <= 3 && paymentDays >= 0 && !dismissed.includes(`fatura-${payment.id}`) && (
                <article className="flex items-start gap-3 border-t border-[#4A3F5C]/10 py-3.5">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div className="min-w-0 flex-1"><h4 className="text-xs font-bold">Pagamento {paymentDays === 0 ? 'vence hoje' : paymentDays === 1 ? 'vence amanhã' : `vence em ${paymentDays} dias`}</h4><p className="mt-1 text-[11px] leading-relaxed text-[#6B5E7A]">Mensalidade de R$ {payment.valor.toFixed(2)} · vencimento {new Date(payment.dataVencimento).toLocaleDateString('pt-BR')}</p><Link href={payment.linkPagamento || '/perfil'} onClick={() => setIsOpen(false)} className="mt-2 inline-flex text-xs font-bold text-[#4A3F5C] underline underline-offset-4">Ver pagamento</Link></div>
                  <button type="button" onClick={() => dismiss(`fatura-${payment.id}`)} className="rounded-full p-1 text-[#8675A9] active:scale-[.97]" aria-label="Dispensar aviso de pagamento"><X className="h-4 w-4" /></button>
                </article>
              )}
              {statusConta === 'suspensa' && !dismissed.includes('conta-suspensa') && <article className="flex items-start gap-3 border-t border-[#4A3F5C]/10 py-3.5"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" /><div className="min-w-0 flex-1"><h4 className="text-xs font-bold">Conta suspensa</h4><p className="mt-1 text-[11px] leading-relaxed text-[#6B5E7A]">Sua vitrine está pausada. Fale com o suporte para reativá-la.</p></div><button type="button" onClick={() => dismiss('conta-suspensa')} className="rounded-full p-1 text-[#8675A9] active:scale-[.97]" aria-label="Dispensar aviso de conta"><X className="h-4 w-4" /></button></article>}
              {!dismissed.includes('dica-divulgacao') && <article className="flex items-start gap-3 border-t border-[#4A3F5C]/10 py-3.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8675A9]" /><div className="min-w-0 flex-1"><h4 className="text-xs font-bold">Dica de divulgação</h4><p className="mt-1 text-[11px] leading-relaxed text-[#6B5E7A]">Use o Story Oficial do seu perfil para compartilhar o QR Code da vitrine.</p></div><button type="button" onClick={() => dismiss('dica-divulgacao')} className="rounded-full p-1 text-[#8675A9] active:scale-[.97]" aria-label="Dispensar dica"><X className="h-4 w-4" /></button>
              </article>
              }
              {!aviso && !payment && statusConta !== 'suspensa' && <p className="py-3 text-[11px] text-[#6B5E7A]">Você está em dia. Nenhum aviso pendente.</p>}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold transition-transform duration-150 ease-out active:scale-[.98] cursor-pointer shadow-xs"
              >
                Entendido
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

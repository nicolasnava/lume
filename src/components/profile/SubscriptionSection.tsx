'use client'

import { useState, useTransition } from 'react'
import {
  SubscriptionData,
  changeProfissionalPlan,
  applySubscriptionCoupon,
  getInvoicePaymentDetails,
} from '@/app/actions/subscription'
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gift,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  QrCode,
  FileText,
  MessageCircle,
  Tag,
  Loader2,
  X,
  DollarSign,
} from 'lucide-react'

interface SubscriptionSectionProps {
  initialData: SubscriptionData
}

export default function SubscriptionSection({ initialData }: SubscriptionSectionProps) {
  const [data, setData] = useState<SubscriptionData>(initialData)
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'anual'>(
    (initialData.planoTipo === 'anual' ? 'anual' : 'mensal')
  )
  const [couponInput, setCouponInput] = useState('')
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [isPendingPlan, startTransitionPlan] = useTransition()
  const [isPendingCoupon, startTransitionCoupon] = useTransition()
  const [isPendingInvoice, setIsPendingInvoice] = useState(false)

  // Modal de Pagamento PIX da Fatura
  const [activeInvoicePayment, setActiveInvoicePayment] = useState<{
    id: string
    valor: number
    data_vencimento: string
    codigo_pix: string
    copied: boolean
  } | null>(null)

  // Status visual formatado
  const getStatusBadge = (status: SubscriptionData['statusConta']) => {
    switch (status) {
      case 'ativa':
        return {
          label: 'Plano Ativo',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
        }
      case 'trial':
        return {
          label: 'Período de Testes (Trial)',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        }
      case 'cortesia':
        return {
          label: 'Cortesia VIP Lumê',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Gift,
        }
      case 'atrasada':
        return {
          label: 'Fatura em Aberto',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
        }
      case 'suspensa':
        return {
          label: 'Assinatura Suspensa',
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertTriangle,
        }
      default:
        return {
          label: 'Trial',
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: Clock,
        }
    }
  }

  const badge = getStatusBadge(data.statusConta)
  const BadgeIcon = badge.icon

  // Trocar Plano
  const handleChangePlan = (newPlan: 'mensal' | 'anual') => {
    if (newPlan === data.planoTipo || isPendingPlan) return

    setSelectedPlan(newPlan)
    startTransitionPlan(async () => {
      try {
        const res = await changeProfissionalPlan(newPlan)
        if (res.success) {
          setData((prev) => ({
            ...prev,
            planoTipo: newPlan,
            valorMensalidade: res.valor,
          }))
          setCouponFeedback({
            type: 'success',
            message: `Plano alterado para ${newPlan === 'anual' ? 'Plano Anual' : 'Plano Mensal'} com sucesso!`,
          })
          setTimeout(() => setCouponFeedback(null), 4000)
        }
      } catch (err) {
        setCouponFeedback({
          type: 'error',
          message: err instanceof Error ? err.message : 'Erro ao alterar plano.',
        })
      }
    })
  }

  // Aplicar Cupom
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return

    setCouponFeedback(null)
    startTransitionCoupon(async () => {
      try {
        const res = await applySubscriptionCoupon(couponInput)
        if (res.success) {
          setCouponFeedback({
            type: 'success',
            message: res.message,
          })
          setCouponInput('')
        }
      } catch (err) {
        setCouponFeedback({
          type: 'error',
          message: err instanceof Error ? err.message : 'Erro ao aplicar cupom.',
        })
      }
    })
  }

  // Abrir Modal de Pagamento PIX
  const handleOpenPayment = async (faturaId: string) => {
    setIsPendingInvoice(true)
    try {
      const details = await getInvoicePaymentDetails(faturaId)
      setActiveInvoicePayment({
        id: details.id,
        valor: details.valor,
        data_vencimento: details.data_vencimento,
        codigo_pix: details.codigo_pix,
        copied: false,
      })
    } catch (err) {
      console.error('Erro ao buscar pagamento da fatura:', err)
    } finally {
      setIsPendingInvoice(false)
    }
  }

  const handleCopyPix = () => {
    if (!activeInvoicePayment) return
    navigator.clipboard.writeText(activeInvoicePayment.codigo_pix)
    setActiveInvoicePayment((prev) => (prev ? { ...prev, copied: true } : null))
    setTimeout(() => {
      setActiveInvoicePayment((prev) => (prev ? { ...prev, copied: false } : null))
    }, 3000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Card do Plano Lumê - Estilo Elegante com Borda Roxa */}
      <div className="max-w-2xl">
        <div className="rounded-3xl p-6 sm:p-7 border-2 border-purple-600 bg-white shadow-md relative flex flex-col justify-between space-y-6">
          <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
            {data.statusConta === 'ativa'
              ? 'Seu Plano Ativo'
              : data.statusConta === 'trial'
              ? 'Período de Avaliação (Trial)'
              : data.statusConta === 'cortesia'
              ? 'Acesso Cortesia VIP'
              : 'Plano Lumê'}
          </span>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#4A3F5C]">
                  {data.statusConta === 'cortesia'
                    ? 'Acesso Cortesia VIP'
                    : 'Plano Mensal Lumê'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.statusConta === 'ativa'
                    ? 'Sua assinatura está ativa e com todos os recursos premium liberados.'
                    : data.statusConta === 'trial'
                    ? 'Aproveite todos os recursos do Lumê durante seu período de avaliação.'
                    : data.statusConta === 'cortesia'
                    ? 'Acesso concedido pela equipe Lumê.'
                    : 'Acesso completo com cobrança recorrente mensal'}
                </p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#4A3F5C]">
                  R$ {data.valorMensalidade.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-gray-500 font-medium">/mês</span>
              </div>
            </div>

            {/* Status de Renovação ou Dias Restantes do Trial */}
            {data.statusConta === 'trial' && data.diasRestantesTrial > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span>{data.diasRestantesTrial} dias restantes de avaliação grátis</span>
              </div>
            ) : data.proximoVencimento ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>
                  Próxima renovação:{' '}
                  {new Date(data.proximoVencimento).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ) : null}

            <ul className="space-y-2.5 pt-3 border-t border-gray-100 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Agendamentos e clientes ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Página pública exclusiva e personalizada com suas cores</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Lembretes e confirmações no WhatsApp com 1 clique</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Controle financeiro e métricas em tempo real</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Suporte prioritário via WhatsApp</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Resgate de Cupons de Desconto */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Tag className="h-5 w-5 text-purple-600" />
          <h3 className="text-sm font-bold text-[#4A3F5C]">Possui um Cupom de Desconto?</h3>
        </div>

        <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder="Digite o código do cupom"
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-800 placeholder:text-gray-400 placeholder:normal-case focus:bg-white focus:border-purple-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!couponInput.trim() || isPendingCoupon}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            {isPendingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Aplicar Cupom</span>}
          </button>
        </form>

        {couponFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              couponFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {couponFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{couponFeedback.message}</span>
          </div>
        )}
      </div>

      {/* 4. Histórico Completo de Faturas */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-[#4A3F5C]">Histórico de Faturas & Mensalidades</h3>
              <p className="text-xs text-gray-500">Consulte o status e comprovantes dos seus pagamentos.</p>
            </div>
          </div>
        </div>

        {data.faturas.length === 0 ? (
          <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-1">
            <p className="text-xs font-bold text-gray-600">Nenhuma fatura emitida até o momento.</p>
            <p className="text-[11px] text-gray-400">
              Suas faturas aparecerão aqui automaticamente quando o ciclo de cobrança iniciar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden">
            {data.faturas.map((fatura) => {
              const isPago = fatura.status === 'pago'
              const isPendente = fatura.status === 'pendente'
              const isVencido = fatura.status === 'vencido'

              return (
                <div
                  key={fatura.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 rounded-xl px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPago
                          ? 'bg-emerald-50 text-emerald-600'
                          : isPendente
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-800">Plano Mensal Lumê</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isPago
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPendente
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPago ? 'Paga' : isPendente ? 'Pendente' : 'Vencida'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Vencimento:{' '}
                        {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {fatura.data_pagamento && (
                          <span>
                            {' '}
                            • Pago em{' '}
                            {new Date(fatura.data_pagamento).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        )}
                        {fatura.forma_pagamento && (
                          <span> • Via {fatura.forma_pagamento.toUpperCase()}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                    <span className="text-sm font-black text-[#4A3F5C]">
                      R$ {fatura.valor.toFixed(2)}
                    </span>

                    {isPendente || isVencido ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(fatura.id)}
                        disabled={isPendingInvoice}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Pagar via PIX</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        <span>Quitada</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. Suporte via WhatsApp Direto */}
      <div className="flex justify-center pt-2">
        <a
          href={`https://wa.me/5511965758459?text=${encodeURIComponent(
            'Olá! Gostaria de tirar uma dúvida sobre a assinatura do Lumê.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-xs sm:text-sm font-bold transition shadow-xs hover:shadow-md cursor-pointer"
        >
          <MessageCircle className="h-4.5 w-4.5" />
          <span>Falar com o Suporte no WhatsApp</span>
        </a>
      </div>

      {/* Modal de Pagamento PIX */}
      {activeInvoicePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-bold text-[#4A3F5C]">Pagamento via PIX</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveInvoicePayment(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                <QrCode className="h-8 w-8" />
              </div>

              <div>
                <span className="text-xs text-gray-500 font-medium">Valor da Fatura</span>
                <p className="text-2xl font-black text-[#4A3F5C]">
                  R$ {activeInvoicePayment.valor.toFixed(2)}
                </p>
              </div>

              <p className="text-xs text-gray-500">
                Abra o app do seu banco, selecione a opção <strong>PIX Copia e Cola</strong> e cole o código abaixo:
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-600 block">Código PIX (Copia e Cola):</label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-700 break-all select-all max-h-24 overflow-y-auto">
                {activeInvoicePayment.codigo_pix}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyPix}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                {activeInvoicePayment.copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-300" />
                    <span>Código PIX Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar Código PIX</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveInvoicePayment(null)}
                className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

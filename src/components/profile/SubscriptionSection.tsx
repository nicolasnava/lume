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
  Instagram,
  Users,
} from 'lucide-react'
import { copyToClipboard } from '@/lib/utils/clipboard'
import StoriesShareModal from '@/components/profile/StoriesShareModal'

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

  // Mini Card de Detalhes da Fatura
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<SubscriptionData['faturas'][0] | null>(null)

  // Indique e Ganhe
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [showReferralStoriesModal, setShowReferralStoriesModal] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lume.com.br'
  const referralCode = data.referral?.codigoIndicacao || ''
  const referralLink = `${origin}/cadastro?ref=${referralCode}`
  const indicadasAtivas = data.referral?.indicadasAtivas || 0
  const descontoPct = data.referral?.descontoPercentual || 0
  const progressoPct = Math.min(100, Math.round((indicadasAtivas / 3) * 100))

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

      {/* 3. Indique e Ganhe — Até 30% de Desconto na Mensalidade */}
      <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-b from-purple-50/40 via-white to-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-[#4A3F5C] shadow-2xs shrink-0">
              <Gift className="h-6 w-6 text-[#8675A9]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
                <span>Indique e Ganhe</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Até 30% OFF
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Cada profissional ativa indicada garante 10% de desconto na sua mensalidade.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-white p-2.5 rounded-2xl border border-gray-200/80 shrink-0">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Sua Mensalidade</span>
            <span className="text-base font-bold text-[#4A3F5C]">
              R$ {data.valorMensalidade.toFixed(2).replace('.', ',')}
              <span className="text-xs font-normal text-gray-400">/mês</span>
            </span>
          </div>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#4A3F5C]">
              {indicadasAtivas >= 3
                ? '🎉 Você atingiu o desconto máximo de 30%!'
                : `${indicadasAtivas} de 3 indicações ativas para o desconto máximo`}
            </span>
            <span className="font-bold text-emerald-600 font-mono">
              {descontoPct}% de desconto aplicado
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-100 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#B8A9D9] to-emerald-500 transition-all duration-500"
              style={{ width: `${progressoPct}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-gray-400 font-medium pt-1">
            <span>0% (0 ativas)</span>
            <span>10% (1 ativa)</span>
            <span>20% (2 ativas)</span>
            <span>30% (3+ ativas)</span>
          </div>
        </div>

        {/* Link de Indicação & Compartilhamento */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-[#4A3F5C]">
            Seu Link Exclusivo de Indicação:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-xs font-bold text-[#4A3F5C] focus:outline-none cursor-default font-mono"
              />
            </div>

            <button
              type="button"
              onClick={async () => {
                const ok = await copyToClipboard(referralLink)
                if (ok) {
                  setCopiedReferral(true)
                  setTimeout(() => setCopiedReferral(false), 2500)
                }
              }}
              className="px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-[#4A3F5C] text-xs font-bold transition shrink-0 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copiedReferral ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#B8A9D9]" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowReferralStoriesModal(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#4A3F5C] to-purple-900 hover:opacity-95 text-white text-xs font-bold transition shrink-0 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Instagram className="h-4 w-4 text-pink-300" />
              <span>Divulgar nos Stories</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Resgate de Cupons de Desconto */}
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
                  onClick={() => setSelectedInvoiceDetail(fatura)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-purple-50/40 rounded-xl px-2.5 transition cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedInvoiceDetail(fatura)
                    }
                  }}
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
                        {!isPago && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isPendente
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPendente ? 'Pendente' : 'Vencida'}
                          </span>
                        )}
                      </div>
                      {isPago ? (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {fatura.data_pagamento
                            ? `Pago em ${new Date(fatura.data_pagamento).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}`
                            : 'Pago'}{' '}
                          • R$ {fatura.valor.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Vencimento:{' '}
                          {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {fatura.forma_pagamento && (
                            <span> • Via {fatura.forma_pagamento.toUpperCase()}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                    <span className="text-sm font-black text-[#4A3F5C]">
                      R$ {fatura.valor.toFixed(2)}
                    </span>

                    {isPendente || isVencido ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenPayment(fatura.id)
                        }}
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

      {/* Mini Card / Modal de Detalhes da Fatura */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#4A3F5C]" />
                <h3 className="text-sm font-bold text-[#4A3F5C]">Detalhes da Fatura</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceDetail(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between py-1 border-b border-gray-50 text-xs">
                <span className="text-gray-500">Status</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${
                    selectedInvoiceDetail.status === 'pago'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedInvoiceDetail.status === 'pendente'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedInvoiceDetail.status === 'pago'
                    ? 'Quitada'
                    : selectedInvoiceDetail.status === 'pendente'
                    ? 'Pendente'
                    : 'Vencida'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-50 text-xs">
                <span className="text-gray-500">Plano</span>
                <span className="font-bold text-gray-800">
                  {selectedInvoiceDetail.plano_slug === 'anual'
                    ? 'Plano Anual Lumê'
                    : 'Plano Mensal Lumê'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-50 text-xs">
                <span className="text-gray-500">Valor</span>
                <span className="font-black text-sm text-[#4A3F5C]">
                  R$ {selectedInvoiceDetail.valor.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-50 text-xs">
                <span className="text-gray-500">Vencimento</span>
                <span className="font-semibold text-gray-700">
                  {new Date(selectedInvoiceDetail.data_vencimento).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {selectedInvoiceDetail.data_pagamento && (
                <div className="flex items-center justify-between py-1 border-b border-gray-50 text-xs">
                  <span className="text-gray-500">Data do Pagamento</span>
                  <span className="font-semibold text-emerald-700">
                    {new Date(selectedInvoiceDetail.data_pagamento).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {selectedInvoiceDetail.forma_pagamento && (
                <div className="flex items-center justify-between py-1 border-b border-gray-50 text-xs">
                  <span className="text-gray-500">Forma de Pagamento</span>
                  <span className="font-semibold text-gray-700 uppercase">
                    {selectedInvoiceDetail.forma_pagamento}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 text-[11px] text-gray-400">
                <span>Identificador</span>
                <span className="font-mono text-[10px]">
                  {selectedInvoiceDetail.id.slice(0, 12)}...
                </span>
              </div>
            </div>

            <div className="pt-2">
              {(selectedInvoiceDetail.status === 'pendente' ||
                selectedInvoiceDetail.status === 'vencido') && (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedInvoiceDetail.id
                    setSelectedInvoiceDetail(null)
                    handleOpenPayment(id)
                  }}
                  className="w-full mb-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Pagar via PIX Agora</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedInvoiceDetail(null)}
                className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Divulgação de Indicação nos Stories */}
      {showReferralStoriesModal && (
        <StoriesShareModal
          isOpen={showReferralStoriesModal}
          onClose={() => setShowReferralStoriesModal(false)}
          mode="indicacao"
          url={referralLink}
          nomeProfissional="Lumê — Programa de Indicação"
          fotoUrl={null}
        />
      )}
    </div>
  )
}

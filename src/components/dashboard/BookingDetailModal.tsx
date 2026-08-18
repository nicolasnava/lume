'use client'

import { useState } from 'react'
import {
  cancelBookingAction,
  rescheduleBookingAction,
  completeBookingAction,
  markNoShowBookingAction,
} from '@/app/actions/booking'
import Toast from '@/components/ui/Toast'
import CustomSelect from '@/components/ui/CustomSelect'
import { copyToClipboard } from '@/lib/utils/clipboard'
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  DollarSign,
  MessageCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Check,
  CreditCard,
  Ban,
  AlertTriangle,
} from 'lucide-react'

export interface BookingDetail {
  id: string
  profissional_id: string
  cliente_id: string
  servico_id: string | null
  data_hora_inicio: string
  data_hora_fim: string
  status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
  google_event_id: string | null
  forma_pagamento?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'outro' | null
  forma_pagamento_preferida?: string | null
  valor_cobrado?: number | null
  pago?: boolean | null
  observacao_pagamento?: string | null
  clientes?: {
    nome: string
    telefone: string
  } | null
  servicos?: {
    nome: string
    duracao_minutos: number
    preco: number
    ativo?: boolean | null
  } | null
}

interface BookingDetailModalProps {
  booking: BookingDetail | null
  onClose: () => void
  onRefresh: () => void
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  cartao_credito: 'Cartão',
  cartao_debito: 'Cartão',
  outro: 'Outro',
}

export default function BookingDetailModal({
  booking,
  onClose,
  onRefresh,
}: BookingDetailModalProps) {
  const [canceling, setCanceling] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [markingNoShow, setMarkingNoShow] = useState(false)

  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [showCompleteForm, setShowCompleteForm] = useState(false)

  const [newDateTime, setNewDateTime] = useState('')

  // Form de Pagamento ao Concluir
  const [formaPagamento, setFormaPagamento] = useState<
    'pix' | 'dinheiro' | 'cartao' | 'outro'
  >('pix')
  const [valorCobrado, setValorCobrado] = useState(
    booking?.servicos?.preco ? String(booking.servicos.preco) : '0'
  )
  const [pago, setPago] = useState(true)
  const [observacaoPagamento, setObservacaoPagamento] = useState('')

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  if (!booking) return null

  const inicioDate = new Date(booking.data_hora_inicio)
  const fimDate = new Date(booking.data_hora_fim)

  const dataFormatada = inicioDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const horaInicioStr = inicioDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const horaFimStr = fimDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const clienteNome = booking.clientes?.nome || 'Cliente sem nome'
  const clienteTelefone = booking.clientes?.telefone || ''
  const servicoNome = booking.servicos?.nome || 'Serviço'
  const servicoPreco = booking.servicos?.preco ? `R$ ${booking.servicos.preco.toFixed(2)}` : 'R$ 0,00'
  const servicoDuracao = booking.servicos?.duracao_minutos ? `${booking.servicos.duracao_minutos} min` : ''

  // Link direto para o WhatsApp Web
  const cleanPhone = clienteTelefone.replace(/\D/g, '')
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá, ${clienteNome}! Tudo bem? Gostaria de falar sobre seu agendamento de ${servicoNome} no dia ${inicioDate.toLocaleDateString(
          'pt-BR'
        )} às ${horaInicioStr}.`
      )}`
    : null

  const handleCancel = async () => {
    if (!confirm('Tem certeza de que deseja cancelar este agendamento?')) return

    setCanceling(true)
    setToast(null)

    const res = await cancelBookingAction(booking.id)
    setCanceling(false)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao cancelar o agendamento.', type: 'error' })
    } else {
      setToast({ show: true, message: 'Agendamento cancelado com sucesso!', type: 'success' })
      setTimeout(() => {
        onRefresh()
        onClose()
      }, 1000)
    }
  }

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDateTime) return

    setRescheduling(true)
    setToast(null)

    const res = await rescheduleBookingAction(booking.id, new Date(newDateTime).toISOString())
    setRescheduling(false)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao remarcar o agendamento.', type: 'error' })
    } else {
      setToast({ show: true, message: 'Agendamento remarcado com sucesso!', type: 'success' })
      setTimeout(() => {
        onRefresh()
        onClose()
      }, 1000)
    }
  }

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setCompleting(true)
    setToast(null)

    const res = await completeBookingAction(booking.id, {
      forma_pagamento: formaPagamento,
      valor_cobrado: Number(valorCobrado),
      pago,
      observacao_pagamento: observacaoPagamento || null,
    })
    setCompleting(false)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao concluir o atendimento.', type: 'error' })
    } else {
      setToast({ show: true, message: 'Atendimento concluído e pagamento registrado com sucesso!', type: 'success' })
      setTimeout(() => {
        onRefresh()
        onClose()
      }, 1000)
    }
  }

  const handleMarkNoShow = async () => {
    if (!confirm('Confirmar que o cliente não compareceu (No-Show)?')) return

    setMarkingNoShow(true)
    setToast(null)

    const res = await markNoShowBookingAction(booking.id)
    setMarkingNoShow(false)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao registrar falta.', type: 'error' })
    } else {
      setToast({ show: true, message: 'Status atualizado para cliente não compareceu (No-Show).', type: 'success' })
      setTimeout(() => {
        onRefresh()
        onClose()
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/60">
              Detalhes do Agendamento
            </span>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <h3 className="text-xl font-bold text-[#4A3F5C]">{servicoNome}</h3>
              {booking.servicos?.ativo === false && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  Serviço desativado
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between bg-[#FAF7F5] p-3.5 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-500">Status atual:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              booking.status === 'confirmado'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : booking.status === 'concluido'
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : booking.status === 'cancelado'
                ? 'bg-red-100 text-red-800 border border-red-200 line-through'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {booking.status === 'confirmado' && <CheckCircle className="h-3.5 w-3.5" />}
            {booking.status === 'cancelado' && <XCircle className="h-3.5 w-3.5" />}
            {booking.status === 'concluido' && <Check className="h-3.5 w-3.5" />}
            {booking.status === 'no_show' && <Ban className="h-3.5 w-3.5" />}
            <span className="capitalize">
              {booking.status === 'no_show' ? 'Faltou (No-Show)' : booking.status}
            </span>
          </span>
        </div>

        {/* Detalhes do Pagamento se Concluído */}
        {booking.status === 'concluido' && (
          <div className="rounded-xl bg-emerald-50/60 p-4 border border-emerald-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                Dados do Pagamento
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  booking.pago !== false
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {booking.pago !== false ? 'Pago' : 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-gray-500 block">Forma:</span>
                <span className="font-semibold text-gray-800">
                  {PAYMENT_METHOD_LABELS[booking.forma_pagamento || ''] || 'Não especificado'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Valor Cobrado:</span>
                <span className="font-extrabold text-emerald-800">
                  R${' '}
                  {booking.valor_cobrado !== null && booking.valor_cobrado !== undefined
                    ? Number(booking.valor_cobrado).toFixed(2)
                    : booking.servicos?.preco
                    ? Number(booking.servicos.preco).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </div>
            {booking.observacao_pagamento && (
              <p className="text-xs text-gray-600 pt-1 italic">
                Obs: &quot;{booking.observacao_pagamento}&quot;
              </p>
            )}
          </div>
        )}

        {/* Informações da Data, Hora e Cliente */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-[#4A3F5C]">
            <Calendar className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <span className="capitalize font-medium">{dataFormatada}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#4A3F5C]">
            <Clock className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <span className="font-semibold">
              {horaInicioStr} - {horaFimStr} ({servicoDuracao})
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#4A3F5C]">
            <User className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <span className="font-bold">{clienteNome}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-[#4A3F5C]">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              <span>{clienteTelefone || 'Telefone não cadastrado'}</span>
            </div>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {booking.forma_pagamento_preferida && (
            <div className="flex items-center gap-2 text-xs text-[#4A3F5C] bg-purple-50/60 p-3 rounded-xl border border-purple-100">
              <CreditCard className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              <span>
                Preferência de Pagamento da Cliente:{' '}
                <strong className="font-bold text-purple-900">
                  {PAYMENT_METHOD_LABELS[booking.forma_pagamento_preferida] || booking.forma_pagamento_preferida}
                </strong>
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 text-sm text-[#4A3F5C] pt-3 border-t border-gray-100">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <Scissors className="h-4 w-4 text-[#B8A9D9] shrink-0 mt-0.5" />
              <span className="font-semibold text-[#4A3F5C] leading-relaxed line-clamp-2 pr-1">
                {servicoNome}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-base sm:text-lg text-[#4A3F5C] shrink-0 text-right whitespace-nowrap bg-gray-50/80 px-2.5 py-1 rounded-xl border border-gray-100">
              <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">{servicoPreco}</span>
            </div>
          </div>
        </div>

        {/* Formulário de Conclusão e Registro de Pagamento */}
        {showCompleteForm ? (
          <form
            onSubmit={handleCompleteSubmit}
            className="space-y-4 pt-4 border-t border-gray-100 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Concluir Atendimento & Pagamento
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Forma de Pagamento *
                </label>
                <CustomSelect
                  options={[
                    { value: 'pix', label: 'Pix' },
                    { value: 'cartao', label: 'Cartão' },
                    { value: 'dinheiro', label: 'Dinheiro' },
                    { value: 'outro', label: 'Outro' },
                  ]}
                  value={formaPagamento}
                  onChange={(val) =>
                    setFormaPagamento(
                      val as 'pix' | 'dinheiro' | 'cartao' | 'outro'
                    )
                  }
                  size="sm"
                  buttonClassName="font-medium bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Valor Cobrado (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={valorCobrado}
                  onChange={(e) => setValorCobrado(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-bold text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pago-checkbox"
                checked={pago}
                onChange={(e) => setPago(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="pago-checkbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                Pagamento já recebido (Pago)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Observação do Pagamento (Opcional)
              </label>
              <textarea
                rows={2}
                value={observacaoPagamento}
                onChange={(e) => setObservacaoPagamento(e.target.value)}
                placeholder="Ex: Pagou 50% no Pix e 50% em dinheiro"
                className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={completing}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Salvar e Marcar Concluído</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCompleteForm(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : showRescheduleForm ? (
          /* Formulário de Remarcação */
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-4 border-t border-gray-100 bg-gray-50/70 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A3F5C]">
              Selecione a Nova Data e Hora
            </h4>
            <input
              type="datetime-local"
              required
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={rescheduling}
                className="flex-1 rounded-xl bg-[#4A3F5C] py-2.5 text-xs font-semibold text-white hover:bg-[#393047] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rescheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Remarcação'}
              </button>
              <button
                type="button"
                onClick={() => setShowRescheduleForm(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          /* Ações do Modal */
          booking.status !== 'cancelado' && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              {/* Botão de Destaque: Marcar como Concluído */}
              {booking.status === 'confirmado' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValorCobrado(
                        booking.servicos?.preco ? String(booking.servicos.preco) : '0'
                      )
                      setShowCompleteForm(true)
                    }}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Marcar como Concluído</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkNoShow}
                    disabled={markingNoShow}
                    className="w-full rounded-xl border border-amber-300 bg-amber-50 py-3 text-xs font-bold text-amber-800 hover:bg-amber-100 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {markingNoShow ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Ban className="h-4 w-4 text-amber-600" />
                        <span>Faltou (No-Show)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Botões Secundários: Remarcar e Cancelar */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRescheduleForm(true)}
                  className="flex-1 rounded-xl border border-[#B8A9D9] bg-white py-2.5 text-xs font-bold text-[#4A3F5C] hover:bg-[#B8A9D9]/20 transition"
                >
                  Remarcar Agendamento
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {canceling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar Agendamento'}
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

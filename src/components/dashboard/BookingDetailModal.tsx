'use client'

import { useState } from 'react'
import {
  cancelBookingAction,
  completeBookingAction,
  markNoShowBookingAction,
  updateBookingStatusAction,
} from '@/app/actions/booking'
import Toast from '@/components/ui/Toast'
import CustomSelect from '@/components/ui/CustomSelect'
import WhatsAppIcon from '@/components/ui/WhatsAppIcon'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { formatPhoneNumber } from '@/lib/utils/phone'
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle,
  Check,
  CreditCard,
  Ban,
  AlertTriangle,
  Pencil,
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
  forma_pagamento?: 'dinheiro' | 'pix' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'outro' | null
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
  agendamento_servicos?: {
    id: string
    preco_no_momento: number
    duracao_no_momento_minutos: number
    servicos?: {
      id?: string
      nome: string
      duracao_minutos: number
      preco: number
      ativo?: boolean | null
    } | null
  }[] | null
}

interface BookingDetailModalProps {
  booking: BookingDetail | null
  onClose: () => void
  onRefresh: () => void
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'DINHEIRO',
  cartao: 'CARTÃO',
  cartao_credito: 'CARTÃO DE CRÉDITO',
  cartao_debito: 'CARTÃO DE DÉBITO',
  outro: 'OUTRO',
}

export default function BookingDetailModal({
  booking,
  onClose,
  onRefresh,
}: BookingDetailModalProps) {
  const [canceling, setCanceling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [markingNoShow, setMarkingNoShow] = useState(false)

  const [showCompleteForm, setShowCompleteForm] = useState(false)

  const hasMultipleServices = !!(booking?.agendamento_servicos && booking.agendamento_servicos.length > 1)
  const servicoNome = booking?.agendamento_servicos && booking.agendamento_servicos.length > 0
    ? booking.agendamento_servicos.map((as) => as.servicos?.nome || 'Serviço').filter(Boolean).join(' + ')
    : (booking?.servicos?.nome || 'Serviço')

  const totalAgendamentoServicosValor = booking?.agendamento_servicos && booking.agendamento_servicos.length > 0
    ? booking.agendamento_servicos.reduce((acc, as) => acc + Number(as.preco_no_momento || as.servicos?.preco || 0), 0)
    : (booking?.servicos?.preco ? Number(booking.servicos.preco) : 0)

  const totalDuracaoMinutos = booking?.agendamento_servicos && booking.agendamento_servicos.length > 0
    ? booking.agendamento_servicos.reduce((acc, as) => acc + (as.duracao_no_momento_minutos || as.servicos?.duracao_minutos || 0), 0)
    : (booking?.servicos?.duracao_minutos || 0)

  // Form de Pagamento ao Concluir
  const [formaPagamento, setFormaPagamento] = useState<
    'pix' | 'dinheiro' | 'cartao' | 'outro'
  >('pix')
  const [valorCobrado, setValorCobrado] = useState(
    booking?.valor_cobrado !== null && booking?.valor_cobrado !== undefined
      ? String(booking.valor_cobrado)
      : totalAgendamentoServicosValor > 0
      ? String(totalAgendamentoServicosValor)
      : '0'
  )
  const [pago, setPago] = useState(true)
  const [observacaoPagamento, setObservacaoPagamento] = useState('')

  // Edição Direta de Status (Item 4)
  const [currentStatus, setCurrentStatus] = useState<string>(booking?.status || 'confirmado')
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  const handleUpdateStatus = async (newStatus: 'confirmado' | 'concluido' | 'cancelado' | 'no_show') => {
    if (!booking) return
    setSavingStatus(true)
    const res = await updateBookingStatusAction(booking.id, newStatus)
    setSavingStatus(false)
    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao alterar status.', type: 'error' })
    } else {
      setCurrentStatus(newStatus)
      setIsEditingStatus(false)
      setToast({ show: true, message: 'Status atualizado com sucesso!', type: 'success' })
      onRefresh()
    }
  }

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
    timeZone: 'America/Sao_Paulo',
  })

  const horaInicioStr = inicioDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  const horaFimStr = fimDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  const clienteNome = booking.clientes?.nome || 'Cliente sem nome'
  const clienteTelefone = booking.clientes?.telefone || ''
  const servicoPreco = `R$ ${totalAgendamentoServicosValor.toFixed(2)}`
  const servicoDuracao = totalDuracaoMinutos ? `${totalDuracaoMinutos} min` : ''

  // Link direto para o WhatsApp Web
  const cleanPhone = clienteTelefone.replace(/\D/g, '')
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá, ${clienteNome}! Tudo bem? Gostaria de falar sobre seu agendamento de ${servicoNome} no dia ${inicioDate.toLocaleDateString(
          'pt-BR',
          { timeZone: 'America/Sao_Paulo' }
        )} às ${horaInicioStr}.`
      )}`
    : null

  const handleConfirmCancel = async () => {
    setCanceling(true)
    setToast(null)

    const res = await cancelBookingAction(booking.id)
    setCanceling(false)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao cancelar o agendamento.', type: 'error' })
      setShowCancelConfirm(false)
    } else {
      setToast({ show: true, message: 'Agendamento cancelado com sucesso!', type: 'success' })
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
              <h3 className="text-xl font-bold text-[#4A3F5C]">
                {hasMultipleServices
                  ? `${booking.agendamento_servicos?.length || 0} Serviços Agendados`
                  : servicoNome}
              </h3>
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

        {/* 1. Informações da Data, Hora e Cliente */}
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
              <span>{formatPhoneNumber(clienteTelefone) || 'Telefone não cadastrado'}</span>
            </div>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer shrink-0"
                title="Conversar no WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Preferência de Pagamento da Cliente padronizada como as outras infos */}
          {booking.forma_pagamento_preferida && (
            <div className="flex items-center gap-3 text-sm text-[#4A3F5C]">
              <CreditCard className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              <span>
                {PAYMENT_METHOD_LABELS[booking.forma_pagamento_preferida] || booking.forma_pagamento_preferida}
              </span>
            </div>
          )}
        </div>

        {/* 2. Dados do Pagamento se Concluído */}
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

        {/* 3. Status Atual com botão de edição estilo meta financeira (Item 4) */}
        <div className="bg-[#FAF7F5] p-3.5 rounded-xl border border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Status atual:</span>
              <button
                type="button"
                onClick={() => setIsEditingStatus((prev) => !prev)}
                className="p-1 text-gray-400 hover:text-[#4A3F5C] hover:bg-gray-200/60 rounded-lg transition cursor-pointer"
                title="Editar status atual"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                currentStatus === 'confirmado'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentStatus === 'concluido'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : currentStatus === 'cancelado'
                  ? 'bg-red-100 text-red-800 border border-red-200 line-through'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {currentStatus === 'confirmado' && <CheckCircle className="h-3.5 w-3.5" />}
              {currentStatus === 'cancelado' && <XCircle className="h-3.5 w-3.5" />}
              {currentStatus === 'concluido' && <Check className="h-3.5 w-3.5" />}
              {currentStatus === 'no_show' && <Ban className="h-3.5 w-3.5" />}
              <span className="capitalize">
                {currentStatus === 'no_show' ? 'Faltou (No-Show)' : currentStatus}
              </span>
            </span>
          </div>

          {isEditingStatus && (
            <div className="pt-2 border-t border-gray-200/60 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#4A3F5C] block w-full">
                Alterar status para:
              </span>
              {(
                [
                  { val: 'confirmado', label: 'Confirmado' },
                  { val: 'concluido', label: 'Concluído' },
                  { val: 'cancelado', label: 'Cancelado' },
                  { val: 'no_show', label: 'Falta (No-Show)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  disabled={savingStatus}
                  onClick={() => handleUpdateStatus(opt.val)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-50 ${
                    currentStatus === opt.val
                      ? 'bg-[#4A3F5C] text-white border-[#4A3F5C]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {savingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4A3F5C]" />}
            </div>
          )}
        </div>

        {/* 4. Card de Serviços Selecionados e Valor Total */}
        {hasMultipleServices && booking.agendamento_servicos && booking.agendamento_servicos.length > 0 ? (
          <div className="rounded-2xl bg-[#FAF7F5] p-4 border border-purple-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100/80 pb-2.5">
              <span className="flex items-center gap-2 text-xs font-bold text-[#4A3F5C]">
                <Scissors className="h-4 w-4 text-[#B8A9D9]" />
                <span>Serviços Inclusos ({booking.agendamento_servicos.length})</span>
              </span>
              <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                {totalDuracaoMinutos} min total
              </span>
            </div>

            <div className="space-y-2.5 py-0.5">
              {booking.agendamento_servicos.map((as, idx) => (
                <div
                  key={as.id || idx}
                  className="flex items-start justify-between gap-3 pt-2.5 first:pt-0 border-t first:border-0 border-purple-100/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs sm:text-sm font-semibold text-[#4A3F5C] leading-snug">
                        {as.servicos?.nome || 'Serviço'}
                      </p>
                      {/* Item 5: Ícone/badge no card do serviço desativado */}
                      {as.servicos?.ativo === false && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                          title="Este serviço foi desativado no catálogo"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                          <span>Desativado</span>
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[11px] text-gray-400 font-medium mt-0.5 whitespace-nowrap">
                      {as.duracao_no_momento_minutos || as.servicos?.duracao_minutos || 0} min
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 shrink-0 whitespace-nowrap pt-0.5">
                    R$ {Number(as.preco_no_momento || as.servicos?.preco || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <span className="text-xs font-bold text-[#4A3F5C]/80">Valor Total</span>
              </div>
              <span className="font-extrabold text-lg text-emerald-700">
                {servicoPreco}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#FAF7F5] p-4 border border-purple-200/70 space-y-3">
            <div className="flex items-start gap-3">
              <Scissors className="h-4 w-4 text-[#B8A9D9] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs sm:text-sm text-[#4A3F5C] leading-snug">
                  {servicoNome}
                </p>
                {servicoDuracao && (
                  <span className="inline-block text-[11px] text-gray-400 font-medium mt-0.5 whitespace-nowrap">
                    {servicoDuracao}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <span className="text-xs font-bold text-[#4A3F5C]/80">Valor Total</span>
              </div>
              <span className="font-extrabold text-lg text-emerald-700">
                {servicoPreco}
              </span>
            </div>
          </div>
        )}

        {/* Formulário de Conclusão e Registro de Pagamento */}
        {showCompleteForm ? (
          <form
            onSubmit={handleCompleteSubmit}
            className="space-y-4 pt-4 border-t border-gray-100 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Concluir Atendimento
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
                    <span>Concluir</span>
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
        ) : (
          /* Ações do Modal: Apenas para agendamentos CONFIRMADOS (não concluídos, nem cancelados) */
          booking.status === 'confirmado' && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              {/* Botões de Ação Principal: Concluir Atendimento / Faltou */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValorCobrado(
                      booking.valor_cobrado !== null && booking.valor_cobrado !== undefined
                        ? String(booking.valor_cobrado)
                        : totalAgendamentoServicosValor > 0
                        ? String(totalAgendamentoServicosValor)
                        : booking.servicos?.preco
                        ? String(booking.servicos.preco)
                        : '0'
                    )
                    setShowCompleteForm(true)
                  }}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Concluir Atendimento</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkNoShow}
                  disabled={markingNoShow}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 py-3 text-xs font-bold text-amber-800 hover:bg-amber-100 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

              {/* Linha ultra fina divisória */}
              <div className="border-t border-gray-100 my-1" />

              {/* Botão e Confirmação de Cancelamento Personalizado (Item 3) */}
              {showCancelConfirm ? (
                <div className="rounded-2xl bg-rose-50/90 border border-rose-200 p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900">Confirmar cancelamento deste agendamento?</h4>
                      <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                        O horário será liberado na sua agenda e o status será alterado para cancelado.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={canceling}
                      className="w-full py-2 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCancel}
                      disabled={canceling}
                      className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {canceling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      <span>Sim, Cancelar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full rounded-xl border border-rose-200 bg-rose-50/60 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <span>Cancelar Agendamento</span>
                  </button>
                </div>
              )}
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

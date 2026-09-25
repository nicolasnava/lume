'use client'

import { useState, useEffect, useRef } from 'react'
import {
  cancelBookingAction,
  completeBookingAction,
  markNoShowBookingAction,
  updateBookingStatusAction,
  getProfissionalServicesAndClientsAction,
  updateBookingItemsAction,
} from '@/app/actions/booking'
import Toast from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CustomSelect from '@/components/ui/CustomSelect'
import WhatsAppIcon from '@/components/ui/WhatsAppIcon'
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
  Circle,
  XCircle,
  Check,
  CreditCard,
  Ban,
  AlertTriangle,
  Pencil,
  ChevronDown,
  Banknote,
  Wallet,
  Plus,
  Trash2,
} from 'lucide-react'
import { PixIcon } from '@/components/common/PaymentIcon'
import Image from 'next/image'
import { getCombosProfissionalAction } from '@/app/actions/combos'
import { getComandaProdutosAction } from '@/app/actions/comanda'
import { toggleBookingEditSection, type BookingEditSection } from '@/lib/booking-detail-ui'
import { mergeEditableServices } from '@/lib/booking-editable-services'
import { bookingStatusLabel, canEditBookingItems, normalizeBookingStatus } from '@/lib/booking-detail-state'
import { serviceChangePreferenceKey, shouldConfirmItemChange } from '@/lib/service-management'

export interface BookingDetail {
  id: string
  profissional_id: string
  cliente_id: string
  servico_id: string | null
  data_hora_inicio: string
  data_hora_fim: string
  status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
  google_event_id: string | null
  combo_id?: string | null
  combos?: { nome?: string; preco_combo?: number; duracao_minutos?: number | null; foto_url?: string | null } | null
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
      id?: string
      nome: string
      duracao_minutos: number
      preco: number
      foto_url?: string | null
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
      foto_url?: string | null
      ativo?: boolean | null
    } | null
  }[] | null
  agendamento_comanda_produtos?: { id: string; produto_id: string | null; nome_no_momento: string; preco_no_momento: number; comanda_produtos?: { nome?: string; foto_url?: string | null } | null }[] | null
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
  const [editingServices, setEditingServices] = useState(false)
  const [openEditSection, setOpenEditSection] = useState<BookingEditSection | null>(null)
  const [savingServices, setSavingServices] = useState(false)
  const [availableServices, setAvailableServices] = useState<Array<{ id: string; nome: string; preco: number; duracao_minutos: number; foto_url: string | null; ativo?: boolean | null }>>([])
  const [availablePackages, setAvailablePackages] = useState<Array<{ id: string; nome: string; preco_combo: number; duracaoTotalMinutos: number; foto_url: string | null; servicos: Array<{ id: string }> }>>([])
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; nome: string; preco: number; foto_url: string | null }>>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedComboId, setSelectedComboId] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [pendingServiceChange, setPendingServiceChange] = useState<{ type: 'add' | 'remove'; kind: 'service' | 'package' | 'product'; id: string; nome: string } | null>(null)
  const [skipItemChangeConfirmation, setSkipItemChangeConfirmation] = useState(false)
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const professionalId = booking?.profissional_id
  const [currentStatus, setCurrentStatus] = useState<string>(normalizeBookingStatus(booking?.status))

  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [isServicesExpanded, setIsServicesExpanded] = useState(false)

  // Preços individuais editáveis de cada serviço em agendamento_servicos
  const [servicosPrecos, setServicosPrecos] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    if (booking?.agendamento_servicos) {
      booking.agendamento_servicos.forEach((as) => {
        initial[as.id] = Number(as.preco_no_momento ?? as.servicos?.preco ?? 0)
      })
    }
    return initial
  })

  // Sincronizar preços individuais e valor cobrado total quando os dados do agendamento mudarem
  useEffect(() => {
    if (!professionalId || typeof window === 'undefined') return
    setSkipItemChangeConfirmation(window.sessionStorage.getItem(serviceChangePreferenceKey(professionalId)) === 'true')
  }, [professionalId])

  useEffect(() => {
    if (!booking) return
    const initial: Record<string, number> = {}
    let sumServicos = 0
    if (booking.agendamento_servicos && booking.agendamento_servicos.length > 0) {
      booking.agendamento_servicos.forEach((as) => {
        const val = Number(as.preco_no_momento ?? as.servicos?.preco ?? 0)
        initial[as.id] = val
        sumServicos += val
      })
    } else if (booking.servicos?.preco) {
      sumServicos = Number(booking.servicos.preco)
    }
    setServicosPrecos(initial)

    const precoFinal =
      booking.valor_cobrado !== null &&
      booking.valor_cobrado !== undefined &&
      Number(booking.valor_cobrado) > 0
        ? Number(booking.valor_cobrado)
        : sumServicos

    setValorCobrado(precoFinal > 0 ? precoFinal.toFixed(2) : '0.00')
    setFormaPagamento(
      booking.forma_pagamento
        ? (booking.forma_pagamento === 'cartao_credito' || booking.forma_pagamento === 'cartao_debito' ? 'cartao' : booking.forma_pagamento)
        : 'pix'
    )
    setPago(booking.pago !== false)
    setObservacaoPagamento(booking.observacao_pagamento || '')
    setShowCompleteForm(false)
  }, [booking])

  useEffect(() => {
    if (!booking) return
    const ids = booking.agendamento_servicos?.map((item) => item.servicos?.id).filter((id): id is string => !!id)
      || []
    setSelectedServiceIds(ids.length > 0 ? ids : booking.servico_id ? [booking.servico_id] : [])
    setSelectedComboId(booking.combo_id || '')
    setSelectedProductIds((booking.agendamento_comanda_produtos || []).map((item) => item.produto_id).filter((id): id is string => !!id))
    setEditingServices(false)
    setOpenEditSection(null)
    setPendingServiceChange(null)
    setDontAskAgain(false)

    setCurrentStatus(normalizeBookingStatus(booking.status))
    setIsEditingStatus(false)

    if (canEditBookingItems(booking.status)) {
      Promise.all([getProfissionalServicesAndClientsAction(), getCombosProfissionalAction(), getComandaProdutosAction(undefined, true)]).then(([result, packages, products]) => {
        if (result.success) {
          const bookedServiceSnapshots = (booking.agendamento_servicos || []).flatMap((item) => {
            const service = item.servicos
            if (!service?.id) return []
            return [{
              id: service.id,
              nome: service.nome,
              preco: Number(item.preco_no_momento ?? service.preco),
              duracao_minutos: Number(item.duracao_no_momento_minutos ?? service.duracao_minutos),
              foto_url: service.foto_url || null,
              ativo: service.ativo ?? false,
            }]
          })
          if (booking.servicos?.id && !bookedServiceSnapshots.some((service) => service.id === booking.servicos?.id)) {
            bookedServiceSnapshots.push({
              id: booking.servicos.id,
              nome: booking.servicos.nome,
              preco: Number(booking.servicos.preco),
              duracao_minutos: Number(booking.servicos.duracao_minutos),
              foto_url: booking.servicos.foto_url || null,
              ativo: booking.servicos.ativo ?? false,
            })
          }
          setAvailableServices(mergeEditableServices(result.services, bookedServiceSnapshots))
        }
        const activePackages = packages.filter((item) => item.ativo).map(({ id, nome, preco_combo, foto_url, duracaoTotalMinutos, servicos }) => ({ id, nome, preco_combo, foto_url, duracaoTotalMinutos, servicos }))
        setAvailablePackages(activePackages)
        setAvailableProducts(products.filter((item) => item.ativo).map(({ id, nome, preco, foto_url }) => ({ id, nome, preco, foto_url })))
      })
    }
  }, [booking])

  const hasMultipleServices = !!(booking?.agendamento_servicos && booking.agendamento_servicos.length > 1)
  const servicoNome = booking?.agendamento_servicos && booking.agendamento_servicos.length > 0
    ? booking.agendamento_servicos.map((as) => as.servicos?.nome || 'Serviço').filter(Boolean).join(' + ')
    : (booking?.servicos?.nome || 'Serviço')

  const totalAgendamentoServicosValor = booking?.agendamento_servicos && booking.agendamento_servicos.length > 0
    ? booking.agendamento_servicos.reduce((acc, as) => {
        const p = servicosPrecos[as.id] !== undefined ? servicosPrecos[as.id] : Number(as.preco_no_momento || as.servicos?.preco || 0)
        return acc + (isNaN(p) ? 0 : p)
      }, 0)
    : (booking?.servicos?.preco ? Number(booking.servicos.preco) : 0)

  const totalDuracaoMinutos = booking?.agendamento_servicos && booking.agendamento_servicos.length > 0
    ? booking.agendamento_servicos.reduce((acc, as) => acc + (as.duracao_no_momento_minutos || as.servicos?.duracao_minutos || 0), 0)
    : (booking?.servicos?.duracao_minutos || 0)

  // Form de Pagamento ao Concluir
  const [formaPagamento, setFormaPagamento] = useState<
    'pix' | 'dinheiro' | 'cartao' | 'outro'
  >(booking?.forma_pagamento ? (booking.forma_pagamento === 'cartao_credito' || booking.forma_pagamento === 'cartao_debito' ? 'cartao' : booking.forma_pagamento) : 'pix')
  const [valorCobrado, setValorCobrado] = useState(() => {
    const calc =
      booking?.agendamento_servicos && booking.agendamento_servicos.length > 0
        ? booking.agendamento_servicos.reduce(
            (acc, as) => acc + Number(as.preco_no_momento ?? as.servicos?.preco ?? 0),
            0
          )
        : (booking?.servicos?.preco ? Number(booking.servicos.preco) : 0)

    if (booking?.valor_cobrado !== null && booking?.valor_cobrado !== undefined && Number(booking.valor_cobrado) > 0) {
      return Number(booking.valor_cobrado).toFixed(2)
    }
    return calc > 0 ? calc.toFixed(2) : '0.00'
  })
  const [pago, setPago] = useState(booking?.pago !== false)
  const [observacaoPagamento, setObservacaoPagamento] = useState(booking?.observacao_pagamento || '')

  // Alterar valor individual de um serviço e recalcular valor cobrado total
  const handleServicePriceChange = (id: string, newPrice: number) => {
    setServicosPrecos((prev) => {
      const next = { ...prev, [id]: newPrice }
      if (booking?.agendamento_servicos && booking.agendamento_servicos.length > 0) {
        const sum = booking.agendamento_servicos.reduce((acc, as) => {
          const val = as.id === id ? newPrice : (next[as.id] ?? Number(as.preco_no_momento ?? as.servicos?.preco ?? 0))
          return acc + (isNaN(val) ? 0 : val)
        }, 0)
        setValorCobrado(sum.toFixed(2))
      }
      return next
    })
  }

  // Abrir edição de dados do pagamento (expande serviços selecionados e ativa inputs individuais)
  const handleOpenEditPayment = () => {
    setIsServicesExpanded(true)
    setShowCompleteForm(true)

    if (booking?.agendamento_servicos && booking.agendamento_servicos.length > 0) {
      const initial: Record<string, number> = {}
      let sum = 0
      booking.agendamento_servicos.forEach((as) => {
        const p = servicosPrecos[as.id] !== undefined
          ? servicosPrecos[as.id]
          : Number(as.preco_no_momento ?? as.servicos?.preco ?? 0)
        initial[as.id] = p
        sum += p
      })
      setServicosPrecos(initial)
      setValorCobrado(
        booking.valor_cobrado !== null && booking.valor_cobrado !== undefined
          ? String(booking.valor_cobrado)
          : sum > 0
          ? String(sum)
          : '0'
      )
    } else {
      setValorCobrado(
        booking?.valor_cobrado !== null && booking?.valor_cobrado !== undefined
          ? String(booking.valor_cobrado)
          : booking?.servicos?.preco
          ? String(booking.servicos.preco)
          : '0'
      )
    }

    if (booking?.forma_pagamento) {
      const normPay =
        booking.forma_pagamento === 'cartao_credito' || booking.forma_pagamento === 'cartao_debito'
          ? 'cartao'
          : booking.forma_pagamento
      setFormaPagamento(normPay as 'pix' | 'dinheiro' | 'cartao' | 'outro')
    }
    // Pré-assinalar automaticamente como pago ao concluir atendimento, permitindo desmarcar se desejado
    if (booking?.status === 'concluido' && booking?.pago !== undefined && booking?.pago !== null) {
      setPago(booking.pago)
    } else {
      setPago(true)
    }
    if (booking?.observacao_pagamento) {
      setObservacaoPagamento(booking.observacao_pagamento)
    }
  }

  // Edição Direta de Status (Item 4)
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isEditingStatus) return
    const closeIfOutside = (event: MouseEvent | TouchEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) setIsEditingStatus(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsEditingStatus(false)
    }
    document.addEventListener('mousedown', closeIfOutside)
    document.addEventListener('touchstart', closeIfOutside)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      document.removeEventListener('touchstart', closeIfOutside)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isEditingStatus])

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

    const servicosPrecosList =
      booking.agendamento_servicos && booking.agendamento_servicos.length > 0
        ? booking.agendamento_servicos.map((as) => ({
            id: as.id,
            preco:
              servicosPrecos[as.id] !== undefined
                ? servicosPrecos[as.id]
                : Number(as.preco_no_momento ?? as.servicos?.preco ?? 0),
          }))
        : undefined

    const res = await completeBookingAction(booking.id, {
      forma_pagamento: formaPagamento,
      valor_cobrado: Number(valorCobrado),
      pago,
      observacao_pagamento: observacaoPagamento || null,
      servicos_precos: servicosPrecosList,
    })
    setCompleting(false)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao concluir o atendimento.', type: 'error' })
    } else {
      setToast({
        show: true,
        message:
          currentStatus === 'concluido'
            ? 'Dados de pagamento e valores atualizados com sucesso!'
            : 'Atendimento concluído e pagamento registrado com sucesso!',
        type: 'success',
      })
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

  const applyServiceChange = async (change: NonNullable<typeof pendingServiceChange>, rememberPreference = false) => {
    if (!booking) return
    let nextIds = selectedServiceIds
    let nextComboId = selectedComboId
    let nextProductIds = selectedProductIds
    if (change.kind === 'service') {
      nextIds = change.type === 'add' ? [...new Set([...selectedServiceIds, change.id])] : selectedServiceIds.filter((id) => id !== change.id)
    } else if (change.kind === 'package') {
      nextComboId = change.type === 'add' ? change.id : ''
    } else {
      nextProductIds = change.type === 'add' ? [...new Set([...selectedProductIds, change.id])] : selectedProductIds.filter((id) => id !== change.id)
    }
    const hasItems = nextIds.length > 0 || !!nextComboId || nextProductIds.length > 0
    if (!hasItems) {
      setToast({ show: true, message: 'Mantenha ao menos um serviço, pacote ou item da comanda.', type: 'error' })
      setPendingServiceChange(null)
      setDontAskAgain(false)
      return
    }

    setSavingServices(true)
    const result = await updateBookingItemsAction(booking.id, nextIds, nextComboId || null, nextProductIds)
    setSavingServices(false)
    if (!result.success) {
      setToast({ show: true, message: result.message || 'Não foi possível editar os procedimentos.', type: 'error' })
      return
    }

    setSelectedServiceIds(nextIds)
    setSelectedComboId(nextComboId)
    setSelectedProductIds(nextProductIds)
    setPendingServiceChange(null)
    if (rememberPreference && booking.profissional_id) {
      window.sessionStorage.setItem(serviceChangePreferenceKey(booking.profissional_id), 'true')
      setSkipItemChangeConfirmation(true)
    }
    setDontAskAgain(false)
    setToast({ show: true, message: result.message || 'Procedimentos atualizados.', type: 'success' })
    onRefresh()
  }

  const requestServiceChange = (change: NonNullable<typeof pendingServiceChange>) => {
    const storedPreference = professionalId && typeof window !== 'undefined'
      ? window.sessionStorage.getItem(serviceChangePreferenceKey(professionalId)) === 'true'
      : skipItemChangeConfirmation
    if (!shouldConfirmItemChange(storedPreference)) {
      setSkipItemChangeConfirmation(true)
      void applyServiceChange(change)
      return
    }
    setDontAskAgain(false)
    setPendingServiceChange(change)
  }

  const confirmServiceChange = async () => {
    if (!pendingServiceChange) return
    await applyServiceChange(pendingServiceChange, dontAskAgain)
  }

  const effectiveHeaderPaymentMethod =
    currentStatus === 'concluido'
      ? (formaPagamento || booking.forma_pagamento)
      : (booking.forma_pagamento_preferida || booking.forma_pagamento)

  const isConcluidoPix =
    (currentStatus === 'concluido' || booking.status === 'concluido') &&
    (booking.forma_pagamento?.toLowerCase() === 'pix' || formaPagamento?.toLowerCase() === 'pix')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-3 sm:p-6 shadow-2xl space-y-5 sm:space-y-6 relative max-h-[92dvh] overflow-y-auto">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  <AlertTriangle className="h-3 w-3 text-rose-600" />
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

          {/* Preferência ou Forma de Pagamento no cabeçalho */}
          {effectiveHeaderPaymentMethod && (
            <div className="flex items-center gap-3 text-sm text-[#4A3F5C]">
              {effectiveHeaderPaymentMethod.toLowerCase() === 'pix' ? (
                <PixIcon className="h-4 w-4 shrink-0" />
              ) : effectiveHeaderPaymentMethod.toLowerCase() === 'dinheiro' ? (
                <Banknote className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              ) : effectiveHeaderPaymentMethod.toLowerCase() === 'outro' ? (
                <Wallet className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              ) : (
                <CreditCard className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              )}
              <span>
                {PAYMENT_METHOD_LABELS[effectiveHeaderPaymentMethod] || effectiveHeaderPaymentMethod}
                {currentStatus !== 'concluido' && booking.forma_pagamento_preferida && ' (Preferência)'}
              </span>
            </div>
          )}
        </div>

        {/* 2. Dados do Pagamento se Concluído */}
        {(currentStatus === 'concluido' || booking.status === 'concluido') && (
          <div className="rounded-xl bg-emerald-50/60 p-4 border border-emerald-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                {isConcluidoPix ? (
                  <PixIcon className="h-4 w-4 shrink-0" />
                ) : (booking.forma_pagamento === 'dinheiro' || formaPagamento === 'dinheiro') ? (
                  <Banknote className="h-4 w-4 text-emerald-700 shrink-0" />
                ) : (
                  <CreditCard className="h-4 w-4 text-emerald-700 shrink-0" />
                )}
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
                <span className="font-semibold text-gray-800 inline-flex items-center gap-1.5">
                  {isConcluidoPix ? (
                    <PixIcon className="h-3.5 w-3.5 shrink-0" />
                  ) : (booking.forma_pagamento === 'dinheiro' || formaPagamento === 'dinheiro') ? (
                    <Banknote className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                  )}
                  {PAYMENT_METHOD_LABELS[booking.forma_pagamento || formaPagamento || ''] || 'Não especificado'}
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

        {/* 3. Status Atual com botão de edição estilo meta financeira (Item 4 e Item 27) */}
        <div ref={statusMenuRef} className="relative bg-[#FAF7F5] p-3.5 rounded-xl border border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Status atual:</span>

            <div className="flex items-center gap-1.5">
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
                {currentStatus === 'confirmado' && <Circle className="h-3.5 w-3.5 shrink-0" />}
                {currentStatus === 'cancelado' && <XCircle className="h-3.5 w-3.5" />}
                {currentStatus === 'concluido' && <CheckCircle className="h-3.5 w-3.5" />}
                {currentStatus === 'no_show' && <Ban className="h-3.5 w-3.5" />}
                <span>{bookingStatusLabel(currentStatus)}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingStatus((prev) => !prev)}
                aria-label="Editar status do agendamento"
                aria-expanded={isEditingStatus}
                className="p-1 text-gray-400 hover:text-[#4A3F5C] hover:bg-gray-200/60 rounded-lg transition cursor-pointer"
                title="Editar status atual"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {isEditingStatus && (
            <div role="menu" aria-label="Novo status" className="absolute right-2 top-full z-[80] mt-2 w-56 origin-top-right rounded-xl border border-[#B8A9D9]/35 bg-white p-1.5 shadow-lg shadow-[#4A3F5C]/10 animate-in fade-in slide-in-from-top-1 duration-150">
              {([
                { value: 'confirmado', label: 'Confirmado', icon: <Circle className="h-4 w-4" />, colors: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200/90' },
                { value: 'concluido', label: 'Concluído', icon: <CheckCircle className="h-4 w-4" />, colors: 'bg-[#E8E0F5] text-[#4A3F5C] hover:bg-[#DDD2EF]' },
                { value: 'no_show', label: 'Faltou (No-Show)', icon: <Ban className="h-4 w-4" />, colors: 'bg-amber-100 text-amber-900 hover:bg-amber-200/90' },
                { value: 'cancelado', label: 'Cancelado', icon: <XCircle className="h-4 w-4" />, colors: 'bg-rose-100 text-rose-900 hover:bg-rose-200/90' },
              ] as const).map((option) => (
                <button key={option.value} type="button" role="menuitemradio" aria-checked={currentStatus === option.value} disabled={savingStatus} onClick={() => handleUpdateStatus(option.value)} className={`mb-1 flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold transition-colors duration-150 ease-out disabled:opacity-50 active:scale-[.98] ${option.colors} ${currentStatus === option.value ? 'ring-1 ring-inset ring-current/20' : ''}`}>
                  {option.icon}
                  <span className="flex-1">{option.label}</span>
                  {!savingStatus && currentStatus === option.value ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              ))}
              {savingStatus && <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-[#6D6478]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Salvando status...</div>}
            </div>
          )}
        </div>

        {/* 4. Card de Serviços Selecionados e Valor Total (Itens 2, 3 e 4) */}
        {((booking.agendamento_servicos?.length || 0) > 0 || !!booking.combos || !!booking.combo_id || (booking.agendamento_comanda_produtos?.length || 0) > 0) ? (
          <div className="rounded-2xl bg-[#FAF7F5] p-4 border border-purple-200/70 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-purple-100/80 pb-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <Scissors className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <button type="button" onClick={() => setIsServicesExpanded((prev) => !prev)} className="min-w-0 truncate text-left text-xs font-bold text-[#4A3F5C] transition-colors duration-150 ease-out hover:text-[#6D5C89]">
                  Serviços ({booking.agendamento_servicos?.length || selectedServiceIds.length})
                </button>
                {canEditBookingItems(currentStatus) && <button type="button" aria-label={editingServices ? 'Fechar edição de serviços' : 'Editar serviços'} title={editingServices ? 'Fechar edição' : 'Editar serviços'} aria-expanded={editingServices} onClick={() => { const willOpen = !editingServices; setEditingServices(willOpen); setOpenEditSection(willOpen ? 'services' : null) }} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#4A3F5C] transition-colors duration-150 ease-out hover:bg-white active:scale-[.97]"><Pencil className="h-3.5 w-3.5" /></button>}
                <button type="button" aria-label={isServicesExpanded ? 'Recolher serviços' : 'Expandir serviços'} aria-expanded={isServicesExpanded} onClick={() => setIsServicesExpanded((prev) => !prev)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#4A3F5C] transition-colors duration-150 ease-out hover:bg-white active:scale-[.97]"><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isServicesExpanded ? 'rotate-180' : ''}`} /></button>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 whitespace-nowrap shrink-0">{totalDuracaoMinutos} min total</span>
              </div>
            </div>

            {isServicesExpanded && (
              <div className="space-y-2.5 py-0.5 animate-in fade-in duration-200">
                {booking.combo_id && (booking.combos?.nome || availablePackages.find((item) => item.id === booking.combo_id)?.nome) && <div className="flex items-center gap-3 rounded-xl bg-white px-2.5 py-2"><div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">{(booking.combos?.foto_url || availablePackages.find((item) => item.id === booking.combo_id)?.foto_url) && <Image src={(booking.combos?.foto_url || availablePackages.find((item) => item.id === booking.combo_id)?.foto_url) || ''} alt="" fill className="object-cover" unoptimized />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#4A3F5C]">{booking.combos?.nome || availablePackages.find((item) => item.id === booking.combo_id)?.nome}</p><p className="text-[10px] text-[#6B5E7A]">Pacote · R$ {Number(booking.combos?.preco_combo || availablePackages.find((item) => item.id === booking.combo_id)?.preco_combo || 0).toFixed(2)}</p></div></div>}
                {(booking.agendamento_servicos || []).map((as, idx) => (
                  <div
                    key={as.id || idx}
                    className="flex items-start justify-between gap-3 pt-2.5 first:pt-0 border-t first:border-0 border-purple-100/60"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">{as.servicos?.foto_url && <Image src={as.servicos.foto_url} alt="" fill className="object-cover" unoptimized />}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-[#4A3F5C] leading-snug">{as.servicos?.nome || 'Serviço'}</p>
                        <span className="inline-block text-[11px] text-gray-400 font-medium mt-0.5 whitespace-nowrap">{as.duracao_no_momento_minutos || as.servicos?.duracao_minutos || 0} min</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      {showCompleteForm ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-gray-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              servicosPrecos[as.id] !== undefined
                                ? servicosPrecos[as.id]
                                : Number(as.preco_no_momento || as.servicos?.preco || 0)
                            }
                            onChange={(e) => handleServicePriceChange(as.id, parseFloat(e.target.value) || 0)}
                            style={{
                              width: `${Math.max(
                                3.5,
                                String(
                                  servicosPrecos[as.id] !== undefined
                                    ? servicosPrecos[as.id]
                                    : Number(as.preco_no_momento || as.servicos?.preco || 0)
                                ).length + 0.5
                              )}ch`,
                            }}
                            className="min-w-[34px] bg-transparent border-b border-[#B8A9D9] px-0.5 py-0.5 text-right text-xs font-bold text-emerald-700 focus:outline-none focus:border-[#4A3F5C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-150"
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-emerald-700 whitespace-nowrap pt-0.5">
                          R$ {Number(servicosPrecos[as.id] !== undefined ? servicosPrecos[as.id] : (as.preco_no_momento || as.servicos?.preco || 0)).toFixed(2)}
                        </span>
                      )}
                      {as.servicos?.ativo === false && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse mt-1"
                          title="Este serviço foi desativado no catálogo"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                          <span>Desativado</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(booking.agendamento_comanda_produtos || []).map((item) => <div key={item.id} className="flex items-center gap-2 border-t border-purple-100/60 pt-2"><div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">{item.comanda_produtos?.foto_url && <Image src={item.comanda_produtos.foto_url} alt="" fill className="object-cover" unoptimized />}</div><p className="min-w-0 flex-1 truncate text-xs font-semibold text-[#4A3F5C]">{item.nome_no_momento}</p><span className="text-xs font-bold text-emerald-700">R$ {Number(item.preco_no_momento).toFixed(2)}</span></div>)}
              </div>
            )}

            <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <span className="text-xs font-bold text-[#4A3F5C]/80">Valor Total</span>
              </div>
              <span className="font-extrabold text-lg text-emerald-700">
                R${' '}
                {(showCompleteForm
                  ? Number(valorCobrado) || totalAgendamentoServicosValor || 0
                  : booking?.valor_cobrado && Number(booking.valor_cobrado) > 0
                  ? Number(booking.valor_cobrado)
                  : totalAgendamentoServicosValor
                ).toFixed(2)}
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
              {showCompleteForm && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold text-gray-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorCobrado}
                    onChange={(e) => setValorCobrado(e.target.value)}
                    style={{
                      width: `${Math.max(3.5, String(valorCobrado || '').length + 0.5)}ch`,
                    }}
                    className="min-w-[34px] bg-transparent border-b border-[#B8A9D9] px-0.5 py-0.5 text-right text-xs font-bold text-emerald-700 focus:outline-none focus:border-[#4A3F5C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-150"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <span className="text-xs font-bold text-[#4A3F5C]/80">Valor Total</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-extrabold text-lg text-emerald-700">
                  R${' '}
                  {(showCompleteForm
                    ? Number(valorCobrado) || (booking?.servicos?.preco ? Number(booking.servicos.preco) : 0)
                    : booking?.valor_cobrado && Number(booking.valor_cobrado) > 0
                    ? Number(booking.valor_cobrado)
                    : (booking?.servicos?.preco ? Number(booking.servicos.preco) : 0)
                  ).toFixed(2)}
                </span>
                {booking.servicos?.ativo === false && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse mt-0.5"
                    title="Este serviço foi desativado no catálogo"
                  >
                    <AlertTriangle className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                    <span>Desativado</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {canEditBookingItems(currentStatus) && editingServices && (
          <div className="mt-3 divide-y divide-[#B8A9D9]/25 border-t border-[#B8A9D9]/25 animate-in fade-in duration-150">
            <section>
              <button type="button" aria-expanded={openEditSection === 'services'} onClick={() => setOpenEditSection((current) => toggleBookingEditSection(current, 'services'))} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6D5C89] transition-colors duration-150 ease-out hover:text-[#4A3F5C]">
                <span>Serviços</span><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openEditSection === 'services' ? 'rotate-180' : ''}`} />
              </button>
              {openEditSection === 'services' && (
                <div className="pb-2">
                  {availableServices.map((service) => {
                    const selected = selectedServiceIds.includes(service.id)
                    return (
                    <div key={service.id} className="flex items-center gap-2 border-t border-[#B8A9D9]/15 py-2">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">{service.foto_url && <Image src={service.foto_url} alt="" fill className="object-cover" unoptimized />}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#4A3F5C]">{service.nome}</p><p className="text-[10px] text-gray-500">{service.ativo === false ? 'Desativado · ' : ''}{service.duracao_minutos} min · R$ {Number(service.preco).toFixed(2)}</p></div>
                      <button type="button" role="checkbox" aria-checked={selected} disabled={savingServices} onClick={() => requestServiceChange({ type: selected ? 'remove' : 'add', kind: 'service', id: service.id, nome: service.nome })} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 disabled:opacity-50 ${selected ? 'border-[#6D5C89] bg-[#6D5C89] text-white' : 'border-[#B8A9D9] bg-white text-transparent hover:bg-[#FAF7F5]'}`} aria-label={`${selected ? 'Desmarcar' : 'Selecionar'} ${service.nome}`}><Check className="h-4 w-4" /></button>
                    </div>
                  )})}
                  {availableServices.length === 0 && <p className="border-t border-[#B8A9D9]/15 py-3 text-xs text-gray-500">Nenhum serviço disponível.</p>}
                </div>
              )}
            </section>

            <section>
              <button type="button" aria-expanded={openEditSection === 'packages'} onClick={() => setOpenEditSection((current) => toggleBookingEditSection(current, 'packages'))} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6D5C89] transition-colors duration-150 ease-out hover:text-[#4A3F5C]">
                <span>Pacotes</span><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openEditSection === 'packages' ? 'rotate-180' : ''}`} />
              </button>
              {openEditSection === 'packages' && <div className="pb-2">{availablePackages.map((item) => { const selected = selectedComboId === item.id; return <button key={item.id} type="button" onClick={() => requestServiceChange({ type: selected ? 'remove' : 'add', kind: 'package', id: item.id, nome: item.nome })} className="flex w-full items-center gap-2 border-t border-[#B8A9D9]/15 py-2 text-left transition-colors duration-150 ease-out hover:bg-white/70 active:scale-[.99]">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">{item.foto_url && <Image src={item.foto_url} alt="" fill className="object-cover" unoptimized />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#4A3F5C]">{item.nome}</p><p className="text-[10px] text-gray-500">Pacote · {item.duracaoTotalMinutos} min · R$ {Number(item.preco_combo).toFixed(2)}</p></div>{selected ? <Trash2 className="h-4 w-4 text-rose-600" /> : <Plus className="h-4 w-4 text-[#8675A9]" />}
              </button>})}{availablePackages.length === 0 && <p className="border-t border-[#B8A9D9]/15 py-3 text-xs text-gray-500">Nenhum pacote disponível.</p>}</div>}
            </section>

            <section>
              <button type="button" aria-expanded={openEditSection === 'products'} onClick={() => setOpenEditSection((current) => toggleBookingEditSection(current, 'products'))} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6D5C89] transition-colors duration-150 ease-out hover:text-[#4A3F5C]">
                <span>Comanda</span><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openEditSection === 'products' ? 'rotate-180' : ''}`} />
              </button>
              {openEditSection === 'products' && <div className="pb-2">{availableProducts.map((item) => { const selected = selectedProductIds.includes(item.id); return <button key={item.id} type="button" onClick={() => requestServiceChange({ type: selected ? 'remove' : 'add', kind: 'product', id: item.id, nome: item.nome })} className="flex w-full items-center gap-2 border-t border-[#B8A9D9]/15 py-2 text-left transition-colors duration-150 ease-out hover:bg-white/70 active:scale-[.99]">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">{item.foto_url && <Image src={item.foto_url} alt="" fill className="object-cover" unoptimized />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#4A3F5C]">{item.nome}</p><p className="text-[10px] text-gray-500">R$ {Number(item.preco).toFixed(2)}</p></div>{selected ? <Trash2 className="h-4 w-4 text-rose-600" /> : <Plus className="h-4 w-4 text-[#8675A9]" />}
              </button>})}{availableProducts.length === 0 && <p className="border-t border-[#B8A9D9]/15 py-3 text-xs text-gray-500">Nenhum item disponível.</p>}</div>}
            </section>
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
                {currentStatus === 'concluido' ? 'Editar Dados do Pagamento' : 'Concluir Atendimento'}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Forma de Pagamento *
                </label>
                <CustomSelect
                  options={[
                    { value: 'pix', label: 'Pix', icon: <PixIcon className="h-4 w-4 shrink-0" /> },
                    { value: 'cartao', label: 'Cartão', icon: <CreditCard className="h-4 w-4 text-gray-600 shrink-0" /> },
                    { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-4 w-4 text-emerald-600 shrink-0" /> },
                    { value: 'outro', label: 'Outro', icon: <Wallet className="h-4 w-4 text-[#8675A9] shrink-0" /> },
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
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{currentStatus === 'concluido' ? 'Salvar Pagamento' : 'Concluir'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCompleteForm(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          /* Ações do Modal: Adaptadas dinamicamente ao status atual (Item 1) */
          currentStatus === 'confirmado' ? (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              {/* Botões de Ação Principal: Concluir Atendimento / Faltou */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenEditPayment}
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

              {/* Botão e Confirmação de Cancelamento Personalizado */}
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
          ) : currentStatus === 'concluido' ? (
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700 whitespace-nowrap shrink-0">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Serviço Concluído</span>
              </span>
              <button
                type="button"
                onClick={handleOpenEditPayment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-xs font-bold text-[#4A3F5C] transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              >
                <Pencil className="h-3 w-3 text-[#8675A9]" />
                <span>Editar Pagamento</span>
              </button>
            </div>
          ) : currentStatus === 'cancelado' ? (
            <div className="pt-4 border-t border-gray-100 text-center text-xs text-rose-600 font-semibold py-2">
              Agendamento cancelado. Horário liberado na agenda.
            </div>
          ) : currentStatus === 'no_show' ? (
            <div className="pt-4 border-t border-gray-100 text-center text-xs text-amber-700 font-semibold py-2">
              Cliente marcado como não compareceu (No-Show).
            </div>
          ) : null
        )}
      </div>

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <ConfirmDialog
        open={!!pendingServiceChange}
        title={pendingServiceChange?.type === 'add' ? `Adicionar ${pendingServiceChange.kind === 'package' ? 'pacote' : pendingServiceChange.kind === 'product' ? 'item' : 'serviço'}?` : `Remover ${pendingServiceChange?.kind === 'package' ? 'pacote' : pendingServiceChange?.kind === 'product' ? 'item' : 'serviço'}?`}
        inlineIcon={pendingServiceChange?.type === 'add' && ((pendingServiceChange.kind === 'package' && availablePackages.find((item) => item.id === pendingServiceChange.id)?.servicos.some((service) => selectedServiceIds.includes(service.id))) || (pendingServiceChange.kind === 'service' && availablePackages.find((item) => item.id === selectedComboId)?.servicos.some((service) => service.id === pendingServiceChange.id))) ? <AlertTriangle className="h-5 w-5" /> : undefined}
        description={pendingServiceChange ? pendingServiceChange.type === 'add' && ((pendingServiceChange.kind === 'package' && availablePackages.find((item) => item.id === pendingServiceChange.id)?.servicos.some((service) => selectedServiceIds.includes(service.id))) || (pendingServiceChange.kind === 'service' && availablePackages.find((item) => item.id === selectedComboId)?.servicos.some((service) => service.id === pendingServiceChange.id))) ? `Este atendimento já contém um serviço incluído no pacote. Ele continuará visível junto aos demais itens, sem cobrança duplicada. Deseja adicionar ${pendingServiceChange.nome}?` : `Deseja ${pendingServiceChange.type === 'add' ? 'adicionar' : 'remover'} ${pendingServiceChange.nome} deste atendimento? A duração e o valor serão recalculados.` : ''}
        confirmLabel={pendingServiceChange?.type === 'add' ? 'Adicionar' : 'Remover'}
        destructive={pendingServiceChange?.type === 'remove'}
        loading={savingServices}
        checkbox={{ label: 'Não perguntar novamente nesta sessão', checked: dontAskAgain, onChange: setDontAskAgain }}
        onClose={() => setPendingServiceChange(null)}
        onConfirm={confirmServiceChange}
      />
    </div>
  )
}

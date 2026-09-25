'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Database } from '@/lib/supabase/database.types'
import {
  fetchAvailableSlotsAction,
  fetchWorkingDaysAction,
  fetchDateAvailabilityAction,
  createBookingAction,
} from '@/app/actions/booking'
import { TimeSlot, WorkingDayInfo } from '@/lib/booking/availability'
import Toast from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import VerticalDayList from './VerticalDayList'
import ComandaProductCard from './ComandaProductCard'
import { isCurrentSlotResponse } from '@/lib/booking/availability-utils'
import PaymentIcon from '@/components/common/PaymentIcon'
import { getContrastingTextColor } from '@/lib/utils/contrast'
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  Loader2,
  AlertCircle,
  Scissors,
  User,
  ArrowLeft,
  Calendar,
  Zap,
  Package,
  Tag,
  AlertTriangle,
  X,
} from 'lucide-react'
import { ComboItem } from '@/app/actions/combos'
import { ComandaProduto } from '@/app/actions/comanda'
import { validarCupomAgendamentoAction } from '@/app/actions/coupons'

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']

interface BookingWizardPageClientProps {
  profissional: ProfissionalRow
  allServicos: ServicoRow[]
  allCombos?: ComboItem[]
  initialServicoId?: string
  initialComboId?: string
  allComandaProdutos?: ComandaProduto[]
  initialProdutoId?: string
  studioContext?: {
    nome: string
    slug: string
  }
}

const PAYMENT_OPTIONS = [
  { id: 'pix', label: 'Pix' },
  { id: 'cartao', label: 'Cartão' },
  { id: 'dinheiro', label: 'Dinheiro' },
]

export default function BookingWizardPageClient({
  profissional,
  allServicos,
  allCombos = [],
  initialServicoId,
  initialComboId,
  allComandaProdutos = [],
  initialProdutoId,
  studioContext,
}: BookingWizardPageClientProps) {
  const initialServico = allServicos.find((s) => s.id === initialServicoId && s.ativo !== false) || null
  const initialCombo = allCombos.find((combo) => combo.id === initialComboId && combo.ativo) || null
  const initialProduto = allComandaProdutos.find((produto) => produto.id === initialProdutoId && produto.ativo) || null

  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => (initialServico && !initialCombo && !initialProduto ? 2 : 1))

  const vitrineUrl = studioContext
    ? `/studio/${studioContext.slug}/${profissional.slug}`
    : `/p/${profissional.slug}`

  const [selectedServicos, setSelectedServicos] = useState<ServicoRow[]>(() => initialServico ? [initialServico] : [])

  const [selectedCombo, setSelectedCombo] = useState<ComboItem | null>(initialCombo)
  const [selectedProdutos, setSelectedProdutos] = useState<ComandaProduto[]>(() => initialProduto ? [initialProduto] : [])
  const [pendingCombo, setPendingCombo] = useState<ComboItem | null>(null)
  const [isSelectedComboExpanded, setIsSelectedComboExpanded] = useState(false)
  const [detailInfo, setDetailInfo] = useState<{
    title: string
    image: string | null
    duration: string
    price: number
    description: string
    included?: string[]
  } | null>(null)

  useEffect(() => {
    if (!detailInfo) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetailInfo(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [detailInfo])

  // Estados para expansão de pacotes e serviços
  const [expandedComboIds, setExpandedComboIds] = useState<Record<string, boolean>>({})
  const [isStep2ServicesExpanded, setIsStep2ServicesExpanded] = useState(false)
  const [isStep4ServicesExpanded, setIsStep4ServicesExpanded] = useState(false)

  const toggleComboExpanded = (comboId: string) => {
    setExpandedComboIds((prev) => ({
      ...prev,
      [comboId]: !prev[comboId],
    }))
  }

  const [workingDays, setWorkingDays] = useState<WorkingDayInfo[]>([])
  const [dateAvailability, setDateAvailability] = useState<Record<string, boolean>>({})
  const [loadingDays, setLoadingDays] = useState(false)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)
  const latestSelectedDate = useRef<string | null>(selectedDateStr)
  latestSelectedDate.current = selectedDateStr

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [paraOutraPessoa, setParaOutraPessoa] = useState(false)
  const [nomePessoaAtendida, setNomePessoaAtendida] = useState('')

  const initialPaymentAccepted = (profissional.formas_pagamento_aceitas || ['pix', 'dinheiro', 'cartao']).map(
    (item) => (item === 'cartao_credito' || item === 'cartao_debito' ? 'cartao' : item)
  )

  const [formaPagamentoPreferida, setFormaPagamentoPreferida] = useState<string>(
    initialPaymentAccepted[0] || 'pix'
  )

  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  // Prompt 62: Cupons de desconto no wizard
  const [cupomCodigoInput, setCupomCodigoInput] = useState('')
  const [validatingCupom, setValidatingCupom] = useState(false)
  const [cupomAplicado, setCupomAplicado] = useState<{
    cupomId: string
    codigo: string
    descontoCalculado: number
    valorFinal: number
  } | null>(null)
  const [cupomError, setCupomError] = useState<string | null>(null)

  const corPrimaria = profissional.cor_primaria || '#B8A9D9'
  const textColorOnPrimary = getContrastingTextColor(corPrimaria)

  const calculatedDuration = selectedCombo
    ? selectedCombo.duracaoTotalMinutos + selectedServicos
        .filter((service) => !selectedCombo.servicos.some((comboService) => comboService.id === service.id))
        .reduce((sum, service) => sum + service.duracao_minutos, 0)
    : selectedServicos.reduce((sum, service) => sum + service.duracao_minutos, 0)
  const totalDuracaoMinutos = calculatedDuration || (selectedProdutos.length > 0 ? 30 : 0)
  // Se houver combo selecionado, usa o preço promocional do combo mais eventuais avulsos extras
  const totalPreco = selectedCombo
    ? Number(selectedCombo.preco_combo) +
      selectedServicos
        .filter((s) => !selectedCombo.servicos.some((cs) => cs.id === s.id))
        .reduce((sum, s) => sum + Number(s.preco), 0)
    : selectedServicos.reduce((sum, s) => sum + Number(s.preco), 0)
  const produtosTotal = selectedProdutos.reduce((sum, produto) => sum + Number(produto.preco), 0)
  const totalGeral = totalPreco + produtosTotal
  const latestAvailabilityDuration = useRef(totalDuracaoMinutos)
  const availabilityRequestId = useRef(0)
  const slotRequestId = useRef(0)
  latestAvailabilityDuration.current = totalDuracaoMinutos

  const loadVisibleWeekAvailability = useCallback(async (dateStrings: string[]) => {
    if (dateStrings.length === 0 || totalDuracaoMinutos <= 0) return
    const requestId = ++availabilityRequestId.current
    const requestedDuration = totalDuracaoMinutos
    const result = await fetchDateAvailabilityAction(profissional.id, dateStrings, totalDuracaoMinutos)
    if (requestId !== availabilityRequestId.current || requestedDuration !== latestAvailabilityDuration.current) return
    setDateAvailability((current) => ({ ...current, ...result }))
  }, [profissional.id, totalDuracaoMinutos])

  useEffect(() => {
    setDateAvailability({})
  }, [totalDuracaoMinutos])

  // Item 17: Carregar dias considerando a janela configurada da profissional
  useEffect(() => {
    if (step === 2) {
      setLoadingDays(true)
      const janela = profissional.janela_agendamento_dias || 90
      fetchWorkingDaysAction(profissional.id, janela)
        .then((days) => {
          setWorkingDays(days)
          setLoadingDays(false)
        })
        .catch((err) => {
          console.error('Erro ao carregar dias via Server Action:', err)
          setLoadingDays(false)
        })
    }
  }, [step, profissional.id, profissional.janela_agendamento_dias])

  const handleAddServico = (servico: ServicoRow) => {
    if (servico.ativo === false) return
    if (!selectedServicos.some((s) => s.id === servico.id)) {
      setSelectedServicos((prev) => [...prev, servico])
    }
  }

  const handleRemoveServico = (servicoId: string) => {
    setSelectedServicos((prev) => prev.filter((s) => s.id !== servicoId))
  }

  // Prompt 61: Adicionar combo completo ao atendimento
  const applyCombo = (combo: ComboItem) => {
    const hasInactive = combo.servicos.some(
      (s) => s.ativo === false || allServicos.some((as) => as.id === s.id && as.ativo === false)
    )
    if (hasInactive) {
      setToast({
        show: true,
        message: 'Este pacote contém serviços desativados e não pode ser selecionado.',
        type: 'error',
      })
      return
    }

    setSelectedCombo(combo)
  }

  const handleAddCombo = (combo: ComboItem) => {
    const duplicated = selectedServicos.some((service) => combo.servicos.some((comboService) => comboService.id === service.id))
    if (duplicated && selectedCombo?.id !== combo.id) {
      setPendingCombo(combo)
      return
    }
    applyCombo(combo)
  }

  const handleRemoveCombo = () => {
    setSelectedCombo(null)
  }

  const handleSelectDate = async (dateStr: string) => {
    if (dateAvailability[dateStr] !== true) return
    const requestId = ++slotRequestId.current
    const requestedDuration = totalDuracaoMinutos
    latestSelectedDate.current = dateStr
    setSelectedDateStr(dateStr)
    setSelectedSlot(null)
    setAvailableSlots([])
    setLoadingSlots(true)
    setErrorMsg(null)
    setStep(3)

    try {
      const result = await fetchAvailableSlotsAction(profissional.id, requestedDuration, dateStr)
      if (!isCurrentSlotResponse({
        requestId,
        latestRequestId: slotRequestId.current,
        requestedDate: dateStr,
        selectedDate: latestSelectedDate.current,
        requestedDurationMinutes: requestedDuration,
        currentDurationMinutes: latestAvailabilityDuration.current,
      })) return
      setAvailableSlots(result.availableSlots)
    } catch (error) {
      if (requestId === slotRequestId.current) {
        console.error('Erro ao carregar horários disponíveis:', error)
        setAvailableSlots([])
      }
    } finally {
      if (requestId === slotRequestId.current && latestSelectedDate.current === dateStr) setLoadingSlots(false)
    }
  }

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep(4)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)

    let formatted = val
    if (val.length > 2) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`
    }
    if (val.length > 7) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`
    }
    setClienteTelefone(formatted)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !selectedDateStr || (selectedServicos.length === 0 && !selectedCombo && selectedProdutos.length === 0)) return

    setSubmitting(true)
    setErrorMsg(null)

    const servicoIdsList = selectedServicos.map((s) => s.id)

    const res = await createBookingAction({
      profissional_id: profissional.id,
      servico_id: servicoIdsList[0] || null,
      servico_ids: servicoIdsList,
      combo_id: selectedCombo?.id || null,
      produto_ids: selectedProdutos.map((produto) => produto.id),
      cupom_id: cupomAplicado?.cupomId || null,
      desconto_cupom: cupomAplicado?.descontoCalculado || null,
      data_hora_inicio: selectedSlot.dataHoraInicio,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      para_outra_pessoa: paraOutraPessoa,
      nome_pessoa_atendida: paraOutraPessoa ? nomePessoaAtendida : undefined,
      forma_pagamento_preferida: formaPagamentoPreferida,
    })

    setSubmitting(false)

    if (res.success) {
      setBookingSuccess(true)
    } else {
      setErrorMsg(res.message || 'Ocorreu um erro ao realizar o agendamento.')
    }
  }

  const servicosSugeridos = allServicos.filter(
    (s) => s.ativo !== false && !selectedServicos.some((sel) => sel.id === s.id)
  )

  const formatDuracaoTotal = (mins: number) => {
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    const restMins = mins % 60
    return restMins > 0 ? `${hrs}h ${restMins}min` : `${hrs}h`
  }

  const handleAplicarCupom = async () => {
    if (!cupomCodigoInput.trim()) return
    setValidatingCupom(true)
    setCupomError(null)

    const res = await validarCupomAgendamentoAction({
      profissionalId: profissional.id,
      codigo: cupomCodigoInput,
      clienteTelefone: clienteTelefone || null,
      valorTotal: totalGeral,
    })

    setValidatingCupom(false)

    if (res.success && res.cupomId && res.descontoCalculado !== undefined) {
      setCupomAplicado({
        cupomId: res.cupomId,
        codigo: res.codigo || cupomCodigoInput.toUpperCase(),
        descontoCalculado: res.descontoCalculado,
        valorFinal: res.valorFinal ?? (totalGeral - res.descontoCalculado),
      })
      setToast({
        show: true,
        type: 'success',
        message: `Cupom ${res.codigo} aplicado com sucesso! Desconto de R$ ${res.descontoCalculado.toFixed(2)}`,
      })
    } else {
      setCupomError(res.message || 'Cupom inválido ou não aplicável.')
    }
  }

  const handleRemoverCupom = () => {
    setCupomAplicado(null)
    setCupomCodigoInput('')
    setCupomError(null)
  }

  return (
    <div className="min-h-screen bg-white text-[#4A3F5C] transition-colors duration-300 pb-16">
      {/* Topo / Cabeçalho de Contexto da Profissional */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <Link
            href={vitrineUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#4A3F5C] transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a Vitrine</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-full border border-gray-200 bg-gray-100 shrink-0">
              {profissional.foto_url ? (
                <Image
                  src={profissional.foto_url}
                  alt={profissional.nome}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                >
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-[#4A3F5C] truncate max-w-[150px]">
              {profissional.nome}
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Wizard em Tela Cheia */}
      <main className="mx-auto max-w-2xl px-4 pt-6 space-y-6">
        {/* Indicador de Etapa e Barra de Progresso */}
        <div className="space-y-3 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold uppercase tracking-wider transition-colors duration-300"
              style={{ color: corPrimaria }}
            >
              Etapa {step} de 4
            </span>
            <span className="text-xs font-semibold text-[#4A3F5C]">
              {step === 1 && 'Monte seu atendimento'}
              {step === 2 && 'Escolha a data'}
              {step === 3 && 'Escolha o horário'}
              {step === 4 && 'Confirme seus dados'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i <= step ? corPrimaria : '#E5E7EB',
                }}
              />
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sucesso de Agendamento */}
        {bookingSuccess ? (
          <div className="py-6 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#4A3F5C]">Agendamento Confirmado!</h3>
              <p className="text-xs text-gray-500 font-medium">
                Seu horário foi reservado com sucesso com{' '}
                <strong className="text-[#4A3F5C]">{profissional.nome}</strong>.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAF7F5] p-4 text-left border border-gray-100 space-y-2 text-xs font-medium">
              {selectedCombo && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold text-xs mb-1">
                  <Package className="h-3.5 w-3.5 text-purple-600" />
                  <span>Combo Especial: {selectedCombo.nome}</span>
                </div>
              )}
              <p>
                Serviços:{' '}
                <strong className="text-[#4A3F5C]">
                  {selectedServicos.map((s) => s.nome).join(' + ')}
                </strong>
              </p>
              <p>
                Data:{' '}
                <strong className="text-[#4A3F5C]">
                  {selectedDateStr &&
                    new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                </strong>
              </p>
              <p>
                Horário: <strong className="text-[#4A3F5C]">{selectedSlot?.timeStr}</strong>
              </p>
              <p>
                Valor Total:{' '}
                <strong className="text-emerald-700 font-semibold">
                  R$ {totalGeral.toFixed(2)}
                </strong>
              </p>
            </div>

            <Link
              href={vitrineUrl}
              className="w-full py-3 rounded-xl font-semibold text-xs text-white shadow-md transition hover:opacity-90 block text-center cursor-pointer"
              style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
            >
              Voltar para a Vitrine
            </Link>
          </div>
        ) : (
          <>
            {/* ETAPA 1 — MONTE SEU ATENDIMENTO */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#4A3F5C] flex items-center gap-1.5">
                    <Scissors className="h-5 w-5 text-[#B8A9D9]" />
                    <span>Monte seu atendimento ({selectedServicos.length + selectedProdutos.length + (selectedCombo ? 1 : 0)})</span>
                  </h3>

                  {selectedCombo && (
                    <div className="overflow-hidden rounded-2xl border border-[#B8A9D9]/45 bg-white shadow-2xs">
                      <div className="flex items-center gap-3 p-3.5">
                        <button type="button" onClick={() => setDetailInfo({ title: selectedCombo.nome, image: selectedCombo.foto_url || null, duration: `${selectedCombo.duracaoTotalMinutos} min`, price: Number(selectedCombo.preco_combo), description: 'Pacote de serviços', included: selectedCombo.servicos.map((service) => service.nome) })} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-colors hover:bg-[#FAF7F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8675A9]">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#FAF7F5]">{selectedCombo.foto_url ? <Image src={selectedCombo.foto_url} alt={selectedCombo.nome} fill className="object-cover" unoptimized /> : <Package className="m-5 h-6 w-6 text-[#8675A9]" />}</div>
                          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8675A9]">Pacote selecionado</p><h4 className="truncate text-sm font-extrabold text-[#4A3F5C]">{selectedCombo.nome}</h4><div className="mt-1 flex gap-3 text-[11px] font-semibold"><span className="whitespace-nowrap text-emerald-700">R$ {Number(selectedCombo.preco_combo).toFixed(2)}</span><span className="text-gray-500">{selectedCombo.duracaoTotalMinutos} min</span></div></div>
                        </button>
                        <button type="button" onClick={() => setIsSelectedComboExpanded((current) => !current)} className="rounded-full p-2 text-[#4A3F5C] transition-transform duration-150 ease-out active:scale-[0.97]" aria-label="Mostrar serviços do pacote"><ChevronDown className={`h-4 w-4 transition-transform duration-200 ease-out ${isSelectedComboExpanded ? 'rotate-180' : ''}`} /></button>
                        <button type="button" onClick={handleRemoveCombo} className="rounded-full p-2 text-rose-600 transition-transform duration-150 ease-out active:scale-[0.97]" aria-label="Remover pacote"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      {isSelectedComboExpanded && selectedCombo.servicos.length > 0 && <div className="space-y-2 border-t border-gray-100 px-3.5 py-3 animate-in fade-in duration-150">{selectedCombo.servicos.map((service) => <div key={service.id} className="flex items-center gap-2.5"><div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">{service.foto_url ? <Image src={service.foto_url} alt={service.nome} fill className="object-cover" unoptimized /> : <Scissors className="m-2 h-5 w-5 text-[#B8A9D9]" />}</div><div><p className="text-xs font-bold text-[#4A3F5C]">{service.nome}</p><p className="text-[10px] text-gray-500">{service.duracao_minutos} min · R$ {Number(service.preco).toFixed(2)}</p></div></div>)}</div>}
                    </div>
                  )}

                  {selectedServicos.length === 0 && !selectedCombo ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400 font-medium">
                      Nenhum serviço selecionado. Escolha um serviço abaixo.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedServicos.map((servico) => (
                        <div
                          key={servico.id}
                          className="flex items-center justify-between bg-purple-50/50 p-3.5 rounded-2xl border border-[#B8A9D9]/40 gap-3.5"
                        >
                          <button type="button" onClick={() => setDetailInfo({ title: servico.nome, image: servico.foto_url || null, duration: `${servico.duracao_minutos} min`, price: Number(servico.preco), description: servico.descricao || 'Detalhes do serviço' })} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8675A9]">
                            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-purple-200 bg-purple-100 shadow-2xs">
                              {servico.foto_url ? <Image src={servico.foto_url} alt={servico.nome} fill className="object-cover" unoptimized /> : <div className="flex h-full w-full items-center justify-center text-[#4A3F5C]"><Scissors className="h-6 w-6 sm:h-7 sm:w-7" /></div>}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="line-clamp-2 text-left text-xs font-semibold text-[#4A3F5C] sm:text-sm">{servico.nome}</h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 shrink-0" style={{ color: corPrimaria }} />{servico.duracao_minutos} min</span>
                                <span className="whitespace-nowrap font-semibold text-emerald-700">R$ {Number(servico.preco).toFixed(2)}</span>
                              </div>
                            </div>
                          </button>

                          {/* Item 10: Ícone de lixeira sempre visível independentemente de ter 1 ou mais serviços */}
                          <button
                            type="button"
                            onClick={() => handleRemoveServico(servico.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                            title="Remover este serviço"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedProdutos.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8675A9]">Comanda digital</p>
                      {selectedProdutos.map((produto) => (
                        <div key={produto.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3">
                          <button type="button" onClick={() => setDetailInfo({ title: produto.nome, image: produto.foto_url || null, duration: 'Comanda digital', price: Number(produto.preco), description: produto.descricao || 'Item da comanda digital' })} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-colors hover:bg-[#FAF7F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8675A9]">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#FAF7F5]">{produto.foto_url ? <Image src={produto.foto_url} alt={produto.nome} fill className="object-cover" unoptimized /> : <Package className="m-4 h-6 w-6 text-[#B8A9D9]" />}</div>
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#4A3F5C]">{produto.nome}</p><p className="text-xs font-bold text-emerald-700">R$ {Number(produto.preco).toFixed(2)}</p></div>
                          </button>
                          <button type="button" onClick={() => setSelectedProdutos((items) => items.filter((item) => item.id !== produto.id))} className="rounded-xl p-2 text-rose-600 transition-transform duration-150 ease-out active:scale-[0.97]" aria-label={`Remover ${produto.nome}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item 1: Cards Quadrados Visuais para Serviços Sugeridos */}
                {servicosSugeridos.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A3F5C]">
                      Adicione também ao mesmo horário:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {servicosSugeridos.map((s) => (
                        <div
                          key={s.id}
                          className="flex flex-col justify-between bg-white p-3 rounded-2xl border border-gray-200 hover:border-[#B8A9D9] transition space-y-2.5 group shadow-2xs"
                        >
                          <button type="button" onClick={() => setDetailInfo({ title: s.nome, image: s.foto_url || null, duration: `${s.duracao_minutos} min`, price: Number(s.preco), description: s.descricao || 'Detalhes do serviço' })} className="block w-full rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8675A9]">
                          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-purple-50 border border-gray-100">
                            {s.foto_url ? (
                              <Image
                                src={s.foto_url}
                                alt={s.nome}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-300"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#4A3F5C]/60">
                                <Scissors className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0 pt-2">
                            <h5 className="text-xs font-bold text-[#4A3F5C] leading-snug line-clamp-2">
                              {s.nome}
                            </h5>
                            <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
                              <span>{s.duracao_minutos} min</span>
                              <span className="font-bold text-emerald-700">
                                R$ {Number(s.preco).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddServico(s)}
                            className="w-full py-1.5 px-2 rounded-xl bg-[#B8A9D9]/20 text-xs font-bold text-[#4A3F5C] border border-[#B8A9D9]/40 hover:bg-[#B8A9D9]/30 transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Adicionar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Pacotes (só aparece se houver pelo menos 1 combo ativo) */}
                {allCombos && allCombos.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A3F5C] flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-[#8675A9]" />
                        <span>Pacotes</span>
                      </h4>
                    </div>

                    <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
                      {allCombos.filter((combo) => combo.id !== selectedCombo?.id).map((combo) => {
                        const hasInactiveService = combo.servicos.some(
                          (s) => s.ativo === false || allServicos.some((as) => as.id === s.id && as.ativo === false)
                        )
                        const isExpanded = !!expandedComboIds[combo.id]

                        return (
                          <div
                            key={combo.id}
                            className={`w-[84%] shrink-0 snap-start flex flex-col justify-between bg-white p-4 rounded-2xl border transition space-y-3 group shadow-2xs sm:w-auto ${
                              hasInactiveService
                                ? 'opacity-60 border-gray-200 bg-gray-50/50'
                                : 'border-gray-200 hover:border-[#B8A9D9]'
                            }`}
                          >
                            <div className="space-y-2.5">
                              <button type="button" onClick={() => setDetailInfo({ title: combo.nome, image: combo.foto_url || null, duration: `${combo.duracaoTotalMinutos} min`, price: Number(combo.preco_combo), description: combo.descricao || 'Pacote de serviços', included: combo.servicos.map((service) => service.nome) })} className="block w-full rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8675A9]">
                                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-100 bg-purple-50">
                                  {combo.foto_url ? <Image src={combo.foto_url} alt={combo.nome} fill className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]" unoptimized /> : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-[#B8A9D9]" /></div>}
                                </div>
                                <h5 className="mt-2 text-left text-sm font-bold leading-snug text-[#4A3F5C]">{combo.nome}</h5>
                              </button>
                              {combo.descricao && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{combo.descricao}</p>}

                              {/* Lista de serviços inclusos com expansão e mini-cards */}
                              <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => toggleComboExpanded(combo.id)}
                                  className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-[#4A3F5C] transition cursor-pointer"
                                >
                                  <span>Serviços inclusos ({combo.servicos.length})</span>
                                  <ChevronDown
                                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                {isExpanded && (
                                  <div className="space-y-1.5 pt-1">
                                    {combo.servicos.map((s) => (
                                      <div
                                        key={s.id}
                                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-200/80 shadow-3xs"
                                      >
                                        <div className="relative h-10 w-10 rounded-lg bg-purple-50 border border-purple-100 overflow-hidden shrink-0 flex items-center justify-center">
                                          {s.foto_url ? (
                                            <Image
                                              src={s.foto_url}
                                              alt={s.nome}
                                              fill
                                              className="object-cover"
                                              unoptimized
                                            />
                                          ) : (
                                            <Scissors className="h-4 w-4 text-[#8675A9]" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold text-[#4A3F5C] truncate">{s.nome}</p>
                                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 font-medium">
                                            <span className="font-bold text-emerald-700">
                                              R$ {Number(s.preco).toFixed(2)}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                              <Clock className="h-3 w-3" />
                                              {s.duracao_minutos} min
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                  <Clock className="h-3 w-3" />
                                  <span>{combo.duracaoTotalMinutos} min</span>
                                </div>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="whitespace-nowrap text-base font-extrabold text-emerald-700">
                                    R$ {Number(combo.preco_combo).toFixed(2)}
                                  </span>
                                  {combo.precoOriginalTotal > combo.preco_combo && (
                                    <span className="whitespace-nowrap text-xs text-gray-400 line-through">
                                      R$ {combo.precoOriginalTotal.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {hasInactiveService ? (
                                <button
                                  type="button"
                                  disabled
                                  className="py-2 px-3.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center gap-1.5 shrink-0"
                                >
                                  <AlertCircle className="h-3.5 w-3.5 text-gray-400" />
                                  <span>Indisponível</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddCombo(combo)}
                                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#B8A9D9]/40 bg-[#B8A9D9]/20 px-3.5 py-2 text-xs font-bold text-[#4A3F5C] transition-transform duration-150 ease-out active:scale-[.98] hover:bg-[#B8A9D9]/30"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Adicionar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {allComandaProdutos.some((produto) => produto.ativo && !selectedProdutos.some((selected) => selected.id === produto.id)) && (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4A3F5C]"><Package className="h-4 w-4 text-[#8675A9]" /><span>Comanda digital</span></h4>
                    <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
                      {allComandaProdutos.filter((produto) => produto.ativo && !selectedProdutos.some((selected) => selected.id === produto.id)).map((produto) => (
                        <ComandaProductCard
                          key={produto.id}
                          produto={produto}
                          onOpenDetails={() => setDetailInfo({ title: produto.nome, image: produto.foto_url || null, duration: 'Comanda digital', price: Number(produto.preco), description: produto.descricao || 'Item da comanda digital' })}
                          onAdd={() => setSelectedProdutos((items) => [...items, produto])}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Barra de Resumo de Acumulados */}
                <div className="bg-[#FAF7F5] p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                      Duração e Valor Total
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#4A3F5C] flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: corPrimaria }} />
                        <span>{formatDuracaoTotal(totalDuracaoMinutos)}</span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm font-bold text-emerald-700">
                        R$ {totalGeral.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={selectedServicos.length === 0 && !selectedCombo && selectedProdutos.length === 0}
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white shadow-md transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2 — ESCOLHA A DATA (Item 2: Lista Empilhada Vertical) */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Voltar para Serviços</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#4A3F5C]">Escolha o dia do atendimento</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Selecione uma data disponível na lista abaixo
                  </p>
                </div>

                {(selectedServicos.length > 0 || selectedCombo || selectedProdutos.length > 0) && (
                  <div className="bg-purple-50/70 rounded-2xl border border-[#B8A9D9]/40 text-xs shadow-2xs overflow-hidden transition">
                    <button
                      type="button"
                      onClick={() => setIsStep2ServicesExpanded(!isStep2ServicesExpanded)}
                      className="w-full flex items-center justify-between p-3 hover:bg-purple-100/40 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedCombo ? (
                          <Package className="h-4 w-4 text-[#8675A9] shrink-0" />
                        ) : (
                          <Scissors className="h-4 w-4 text-[#4A3F5C] shrink-0" />
                        )}
                        <span className="font-bold text-[#4A3F5C] truncate">
                          {selectedCombo ? `Pacote + serviços (${selectedServicos.length})` : selectedProdutos.length > 0 && selectedServicos.length === 0 ? `Comanda digital (${selectedProdutos.length})` : `Serviços (${selectedServicos.length})`}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-[#4A3F5C] shrink-0 transition-transform duration-200 ${
                            isStep2ServicesExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      <span className="font-black text-emerald-700 shrink-0 ml-2">
                        R$ {totalGeral.toFixed(2)}
                      </span>
                    </button>

                    {isStep2ServicesExpanded && (
                      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[#B8A9D9]/30">
                        {selectedCombo && <div className="flex items-center gap-2.5 rounded-xl bg-white p-2"><div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">{selectedCombo.foto_url && <Image src={selectedCombo.foto_url} alt={selectedCombo.nome} fill className="object-cover" unoptimized />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#4A3F5C]">{selectedCombo.nome}</p><p className="text-[10px] text-gray-500">Pacote · {selectedCombo.duracaoTotalMinutos} min · R$ {Number(selectedCombo.preco_combo).toFixed(2)}</p></div></div>}
                        {selectedServicos.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-200/80 shadow-3xs"
                          >
                            <div className="relative h-10 w-10 rounded-lg bg-purple-50 border border-purple-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {s.foto_url ? (
                                <Image
                                  src={s.foto_url}
                                  alt={s.nome}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Scissors className="h-4 w-4 text-[#8675A9]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#4A3F5C] truncate">{s.nome}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 font-medium">
                                <span className="font-bold text-emerald-700">
                                  R$ {Number(s.preco).toFixed(2)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  {s.duracao_minutos} min
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedProdutos.map((produto) => <div key={produto.id} className="flex items-center gap-2.5 rounded-xl bg-white p-2"><div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">{produto.foto_url && <Image src={produto.foto_url} alt={produto.nome} fill className="object-cover" unoptimized />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#4A3F5C]">{produto.nome}</p><p className="text-[10px] text-emerald-700">Comanda · R$ {Number(produto.preco).toFixed(2)}</p></div></div>)}
                      </div>
                    )}
                  </div>
                )}

                {loadingDays ? (
                  <div className="flex h-36 w-full items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                    <Loader2 className="h-6 w-6 animate-spin text-[#B8A9D9]" />
                  </div>
                ) : (
                  <VerticalDayList
                    workingDays={workingDays}
                    selectedDateStr={selectedDateStr}
                    onSelectDate={handleSelectDate}
                    availabilityByDate={dateAvailability}
                    onVisibleWeekChange={loadVisibleWeekAvailability}
                    corPrimaria={corPrimaria}
                  />
                )}
              </div>
            )}

            {/* ETAPA 3 — ESCOLHA O HORÁRIO */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Alterar Data</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#4A3F5C]">Escolha o horário</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Horários livres para{' '}
                    <strong>
                      {selectedDateStr &&
                        new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                        })}
                    </strong>
                  </p>
                </div>

                {loadingSlots ? (
                  <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                    <Loader2 className="h-6 w-6 animate-spin text-[#B8A9D9]" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
                    <p className="text-xs font-semibold text-amber-900">
                      Não há horários disponíveis para esta data.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-bold text-[#4A3F5C] underline"
                    >
                      Escolher outra data
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.dataHoraInicio}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className="py-3.5 px-4 rounded-2xl text-sm font-bold border transition cursor-pointer text-center hover:border-[#B8A9D9] hover:bg-purple-50/40 bg-white border-gray-200 text-[#4A3F5C] shadow-2xs active:scale-98"
                      >
                        {slot.timeStr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 4 — CONFIRME SEUS DADOS (Item 3: Redesenho Completo) */}
            {step === 4 && (
              <form onSubmit={handleSubmitBooking} className="space-y-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Alterar Horário</span>
                  </button>
                </div>

                {/* Card de Resumo Completo no Topo (Item 11: Textos importantes ampliados) */}
                <div className="rounded-3xl bg-[#FAF7F5] p-5 sm:p-6 border border-[#B8A9D9]/40 space-y-5 shadow-xs">
                  {/* Cabeçalho: Avatar + Nome Studio + Tagline */}
                  <div className="flex items-center gap-3.5 border-b border-gray-200/60 pb-4">
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white shadow-2xs">
                      {profissional.foto_url ? (
                        <Image
                          src={profissional.foto_url}
                          alt={profissional.nome}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                        >
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base sm:text-lg font-extrabold text-[#4A3F5C] truncate">{profissional.nome}</h4>
                      {profissional.tagline && (
                        <p className="text-xs sm:text-sm text-gray-500 italic truncate">{profissional.tagline}</p>
                      )}
                    </div>
                  </div>

                  {/* Linhas de Detalhes: Serviços e Data */}
                  <div className="space-y-3 text-xs sm:text-sm font-medium">
                    <div className="flex items-start gap-3">
                      {selectedCombo ? (
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-[#8675A9] shrink-0 mt-0.5" />
                      ) : (
                        <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-[#B8A9D9] shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            {selectedCombo ? 'Pacote:' : 'Serviços:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsStep4ServicesExpanded(!isStep4ServicesExpanded)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8675A9] hover:text-[#4A3F5C] transition cursor-pointer"
                          >
                            <span>{isStep4ServicesExpanded ? 'Recolher' : 'Ver serviços'}</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                isStep4ServicesExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                        <strong className="text-sm sm:text-base font-extrabold text-[#4A3F5C] block leading-tight mt-0.5">
                          {[selectedCombo?.nome, ...selectedServicos.map((s) => s.nome), ...selectedProdutos.map((produto) => produto.nome)].filter(Boolean).join(' + ')}
                        </strong>
                        <span className="text-xs text-gray-500 block mt-1 font-semibold">
                          Duração: {formatDuracaoTotal(totalDuracaoMinutos)}
                        </span>

                        {isStep4ServicesExpanded && (
                          <div className="mt-2.5 space-y-2 pt-2 border-t border-gray-200/60">
                            {selectedServicos.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-200/80 shadow-3xs"
                              >
                                <div className="relative h-10 w-10 rounded-lg bg-purple-50 border border-purple-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {s.foto_url ? (
                                    <Image
                                      src={s.foto_url}
                                      alt={s.nome}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <Scissors className="h-4 w-4 text-[#8675A9]" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#4A3F5C] truncate">{s.nome}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 font-medium">
                                    <span className="font-bold text-emerald-700">
                                      R$ {Number(s.preco).toFixed(2)}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                      <Clock className="h-3 w-3" />
                                      {s.duracao_minutos} min
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-gray-200/60">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#B8A9D9] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Data e Horário:</span>
                        <strong className="text-sm sm:text-base font-extrabold text-[#4A3F5C] block capitalize mt-0.5">
                          {selectedDateStr &&
                            new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                            })}{' '}
                          às {selectedSlot?.timeStr}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Totais & Cupom de Desconto */}
                  {cupomAplicado && (
                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500 font-semibold">Subtotal:</span>
                      <span className="line-through text-gray-400 font-bold">
                        R$ {totalGeral.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {cupomAplicado && (
                    <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-700 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Cupom {cupomAplicado.codigo}:</span>
                      </span>
                      <span>- R$ {cupomAplicado.descontoCalculado.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Valor Total:</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                      R${' '}
                      {(cupomAplicado
                        ? Math.max(0, totalGeral - cupomAplicado.descontoCalculado)
                        : totalGeral
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Campo Opcional: Cupom de Desconto (Prompt 62) */}
                <div className="rounded-2xl bg-white p-4 border border-gray-200/80 shadow-2xs space-y-2">
                  <label className="block text-xs font-bold text-[#4A3F5C]">
                    Tem um cupom de desconto?
                  </label>

                  {cupomAplicado ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          Cupom <strong>{cupomAplicado.codigo}</strong> aplicado (economia de R$ {cupomAplicado.descontoCalculado.toFixed(2)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoverCupom}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer ml-2"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cupomCodigoInput}
                          onChange={(e) => setCupomCodigoInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                          placeholder="Digite seu cupom"
                          className="flex-1 uppercase font-mono tracking-wider rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-[#4A3F5C] font-bold focus:border-[#B8A9D9] focus:bg-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          disabled={validatingCupom || !cupomCodigoInput.trim()}
                          onClick={handleAplicarCupom}
                          className="px-4 py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] disabled:opacity-40 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          {validatingCupom ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Aplicar'}
                        </button>
                      </div>

                      {cupomError && (
                        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{cupomError}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Banner Informativo */}
                <div className="rounded-2xl bg-purple-50 p-4 border border-[#B8A9D9]/40 flex items-start gap-3 text-xs sm:text-sm text-[#4A3F5C]">
                  <div className="h-8 w-8 rounded-full bg-[#B8A9D9]/30 flex items-center justify-center shrink-0 text-[#4A3F5C]">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-[#4A3F5C]">Agendamento Automático Ativo</h5>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      Seu horário será confirmado na hora! Você receberá o comprovante imediatamente.
                    </p>
                  </div>
                </div>

                {/* Campos de Nome e WhatsApp + Nota Informativa */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#4A3F5C] mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      placeholder="Ex: Maria Oliveira"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-xs sm:text-sm text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#4A3F5C] mb-1">
                      Seu WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clienteTelefone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-xs sm:text-sm text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:bg-white focus:outline-hidden"
                    />
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      A confirmação do agendamento e os lembretes chegarão diretamente por este WhatsApp.
                    </p>
                  </div>

                  {/* Agendamento para outra pessoa */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paraOutraPessoa}
                        onChange={(e) => setParaOutraPessoa(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#4A3F5C] focus:ring-[#B8A9D9]"
                      />
                      <span>Estou agendando para outra pessoa</span>
                    </label>

                    {paraOutraPessoa && (
                      <input
                        type="text"
                        required
                        value={nomePessoaAtendida}
                        onChange={(e) => setNomePessoaAtendida(e.target.value)}
                        placeholder="Nome da pessoa que será atendida"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-xs sm:text-sm text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:bg-white focus:outline-hidden"
                      />
                    )}
                  </div>

                  {/* Seção de Forma de Pagamento */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs sm:text-sm font-bold text-[#4A3F5C]">
                      Como você prefere pagar no local? <span className="font-normal text-gray-500">(Agilidade no atendimento)</span>
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      {PAYMENT_OPTIONS.map((opt) => {
                        const isSelected = formaPagamentoPreferida === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFormaPagamentoPreferida(opt.id)}
                            className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer gap-2 text-center ${
                              isSelected
                                ? 'bg-purple-50/80 border-[#B8A9D9] text-[#4A3F5C] shadow-2xs font-bold'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 font-semibold'
                            }`}
                          >
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
                                isSelected ? 'bg-[#B8A9D9]/30 text-[#4A3F5C]' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              <PaymentIcon method={opt.id} className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl font-extrabold text-sm sm:text-base text-white shadow-md transition hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Confirmando...</span>
                      </>
                    ) : (
                      <span>Finalizar Agendamento</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </main>

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <ConfirmDialog
        open={!!pendingCombo}
        title="Serviço já selecionado"
        inlineIcon={<AlertTriangle className="h-5 w-5" />}
        description={pendingCombo ? `O pacote ${pendingCombo.nome} inclui um serviço que você já escolheu. Se continuar, o serviço ficará listado junto ao pacote, sem cobrança duplicada. Deseja manter os dois?` : ''}
        confirmLabel="Adicionar pacote"
        cancelLabel="Voltar"
        onClose={() => setPendingCombo(null)}
        onConfirm={() => {
          if (pendingCombo) applyCombo(pendingCombo)
          setPendingCombo(null)
        }}
      />
      {detailInfo && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#211B2A]/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailInfo(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="booking-item-detail-title" className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-[clamp(7rem,24dvh,12rem)] w-full shrink-0 overflow-hidden bg-[#FAF7F5]">
              {detailInfo.image ? <Image src={detailInfo.image} alt={detailInfo.title} fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-[#B8A9D9]"><Scissors className="h-14 w-14" /></div>}
              <button type="button" onClick={() => setDetailInfo(null)} aria-label="Fechar detalhes" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#4A3F5C] shadow-md transition-transform duration-150 ease-out active:scale-[0.97]"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-5">
              <div className="min-h-0">
                <h2 id="booking-item-detail-title" className="line-clamp-2 text-lg font-bold text-[#4A3F5C] sm:text-xl">{detailInfo.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[#6D6478]">{detailInfo.description}</p>
              </div>
              <div className="flex shrink-0 items-center justify-between border-y border-[#4A3F5C]/10 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-[#6D6478]"><Clock className="h-4 w-4 text-[#8675A9]" />{detailInfo.duration}</span>
                <span className="whitespace-nowrap font-bold text-emerald-700">R$ {detailInfo.price.toFixed(2)}</span>
              </div>
              {detailInfo.included && detailInfo.included.length > 0 && (
                <div className="min-h-0">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4A3F5C]">Serviços incluídos</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6D6478]" title={detailInfo.included.join(', ')}>{detailInfo.included.join(' · ')}</p>
                </div>
              )}
              <button type="button" onClick={() => setDetailInfo(null)} className="mt-auto w-full shrink-0 rounded-full bg-[#4A3F5C] px-5 py-2.5 text-sm font-semibold text-white transition duration-200 ease-out hover:bg-[#392F49] active:scale-[0.98]">Voltar ao atendimento</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

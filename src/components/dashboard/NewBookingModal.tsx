'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Calendar, Clock, User, Phone, Scissors, Loader2, AlertTriangle, ChevronDown, Check, CreditCard, ChevronRight } from 'lucide-react'
import { createBookingAction } from '@/app/actions/booking'
import PaymentIcon from '@/components/common/PaymentIcon'
import CustomSelect from '@/components/ui/CustomSelect'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toggleSelectionPanel, type ManualBookingSelectionPanel } from '@/lib/manual-booking-selection'
import { buildBookingReview } from '@/lib/booking-review'
import { transitionBookingConfirmation, type BookingConfirmationStage } from '@/lib/manual-booking-confirmation'

interface NewBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface ServicoOption {
  id: string
  nome: string
  preco: number
  duracao_minutos: number
  foto_url?: string | null
}

interface PackageOption {
  id: string
  nome: string
  preco_combo: number
  foto_url: string | null
  duracaoTotalMinutos: number
  servicos: ServicoOption[]
}

interface ProductOption { id: string; nome: string; preco: number; foto_url: string | null }

interface ClientOption {
  id: string
  nome: string
  telefone: string
}

const PAYMENT_OPTIONS = [
  { id: 'pix', label: 'Pix' },
  { id: 'cartao', label: 'Cartão' },
  { id: 'dinheiro', label: 'Dinheiro' },
]

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

const TIME_OPTIONS = (() => {
  const list: { value: string; label: string }[] = []
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      list.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
    }
  }
  return list
})()

export default function NewBookingModal({ isOpen, onClose, onSuccess }: NewBookingModalProps) {
  const [servicos, setServicos] = useState<ServicoOption[]>([])
  const [pacotes, setPacotes] = useState<PackageOption[]>([])
  const [produtos, setProdutos] = useState<ProductOption[]>([])
  const [clientes, setClientes] = useState<ClientOption[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [profissionalId, setProfissionalId] = useState<string | null>(null)

  // Form states
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [selectedServicoId, setSelectedServicoId] = useState('')
  const [selectedServicoIds, setSelectedServicoIds] = useState<string[]>([])
  const [isMultiSelect, setIsMultiSelect] = useState(true)
  const [selectedComboId, setSelectedComboId] = useState('')
  const [pendingCombo, setPendingCombo] = useState<PackageOption | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [openSelectionPanel, setOpenSelectionPanel] = useState<ManualBookingSelectionPanel | null>(null)
  const selectionDropdownRef = useRef<HTMLDivElement>(null)

  const [dataStr, setDataStr] = useState('')
  const [horaStr, setHoraStr] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('pix')

  // Dynamic slots based on real availability, pauses, blocks and appointments
  const [availableSlots, setAvailableSlots] = useState<{ timeStr: string; dataHoraInicio: string; dataHoraFim: string }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  const [allowCustomSlot, setAllowCustomSlot] = useState(false)

  // Autocomplete states
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)

  const [confirmationStage, setConfirmationStage] = useState<BookingConfirmationStage>('editing')
  const submitting = confirmationStage === 'saving'
  const isReviewOpen = confirmationStage === 'reviewing' || submitting
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fecha o seletor ativo ao tocar fora do conjunto de seletores.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (selectionDropdownRef.current && !selectionDropdownRef.current.contains(event.target as Node)) {
        setOpenSelectionPanel(null)
      }
    }

    if (openSelectionPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [openSelectionPanel])

  useEffect(() => {
    if (isOpen) {
      // Set default date to today YYYY-MM-DD in local time
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      setDataStr(`${yyyy}-${mm}-${dd}`)
      setClienteNome('')
      setClienteTelefone('')
      setShowClientSuggestions(false)
      setErrorMsg(null)
      setConfirmationStage('editing')
      setAllowCustomSlot(false)
      setIsMultiSelect(true)
      setSelectedServicoIds([])
      setSelectedServicoId('')
      setSelectedComboId('')
      setPendingCombo(null)
      setSelectedProductIds([])
      setOpenSelectionPanel(null)

      // Fetch user profile, services and registered clients via server action
      const loadInitialData = async () => {
        setLoadingData(true)
        const [{ getProfissionalServicesAndClientsAction }, { getCombosProfissionalAction }, { getComandaProdutosAction }] = await Promise.all([
          import('@/app/actions/booking'), import('@/app/actions/combos'), import('@/app/actions/comanda'),
        ])
        const [res, combos, items] = await Promise.all([
          getProfissionalServicesAndClientsAction(), getCombosProfissionalAction(), getComandaProdutosAction(undefined, true),
        ])

        if (res.success && res.profissionalId) {
          setProfissionalId(res.profissionalId)
          setServicos(res.services)
          setClientes(res.clients || [])
          setPacotes(combos.filter((combo) => combo.ativo).map((combo) => ({ ...combo, duracaoTotalMinutos: combo.duracaoTotalMinutos || 0 })))
          setProdutos(items.filter((item) => item.ativo).map(({ id, nome, preco, foto_url }) => ({ id, nome, preco, foto_url })))
        }
        setLoadingData(false)
      }

      loadInitialData()
    }
  }, [isOpen])

  // Serviços selecionados e cálculos dinâmicos de tempo e valor total
  const explicitlySelectedServices = isMultiSelect
    ? servicos.filter((s) => selectedServicoIds.includes(s.id))
    : servicos.filter((s) => s.id === selectedServicoId)

  const selectedCombo = pacotes.find((combo) => combo.id === selectedComboId)
  const packageServiceIds = new Set(selectedCombo?.servicos.map((service) => service.id) || [])
  const activeServices = [...(selectedCombo?.servicos || []), ...explicitlySelectedServices.filter((service) => !packageServiceIds.has(service.id))]
  const selectedServicesDuration = (selectedCombo?.duracaoTotalMinutos || 0) + explicitlySelectedServices.filter((service) => !packageServiceIds.has(service.id)).reduce((acc, s) => acc + s.duracao_minutos, 0)
  const totalDuracaoMinutos = selectedServicesDuration || (selectedProductIds.length > 0 ? 30 : 0)
  const totalPreco = (selectedCombo?.preco_combo || 0) + explicitlySelectedServices.filter((service) => !packageServiceIds.has(service.id)).reduce((acc, s) => acc + Number(s.preco), 0) + produtos.filter((item) => selectedProductIds.includes(item.id)).reduce((sum, item) => sum + Number(item.preco), 0)
  const hasSelectedItems = activeServices.length > 0 || Boolean(selectedCombo) || selectedProductIds.length > 0

  // Calcular horários disponíveis reais com base na agenda cadastrada
  useEffect(() => {
    if (!isOpen || !profissionalId || !dataStr) return
    const durationOrId = totalDuracaoMinutos || 30

    let isMounted = true
    const loadSlots = async () => {
      setLoadingSlots(true)
      const { fetchAvailableSlotsAction } = await import('@/app/actions/booking')
      // Passa allowPastSlots = true para permitir agendamentos manuais em qualquer horário do dia
      const res = await fetchAvailableSlotsAction(profissionalId, durationOrId, dataStr, true)
      if (!isMounted) return

      setIsWorkingDay(res.isWorkingDay)
      setAvailableSlots(res.availableSlots || [])
      if (res.availableSlots && res.availableSlots.length > 0) {
        setHoraStr((prev) => {
          const exists = res.availableSlots.some((s) => s.timeStr === prev)
          return exists ? prev : res.availableSlots[0].timeStr
        })
      } else {
        setHoraStr((prev) => prev || '09:00')
      }
      setLoadingSlots(false)
    }

    loadSlots()
    return () => {
      isMounted = false
    }
  }, [isOpen, profissionalId, selectedServicoId, selectedServicoIds, isMultiSelect, totalDuracaoMinutos, dataStr])

  // Filter client suggestions in real-time by typed name
  const filteredClients = clienteNome.trim().length >= 1
    ? clientes.filter((c) => c.nome.toLowerCase().includes(clienteNome.toLowerCase()))
    : []

  const handleSelectClientSuggestion = (client: ClientOption) => {
    setClienteNome(client.nome)
    setClienteTelefone(formatPhone(client.telefone || ''))
    setShowClientSuggestions(false)
  }

  if (!isOpen) return null

  const reviewServices = explicitlySelectedServices.filter((service) => !packageServiceIds.has(service.id))
  const reviewSummary = buildBookingReview({
    clientName: clienteNome,
    clientPhone: clienteTelefone,
    date: dataStr,
    time: horaStr,
    paymentMethod: PAYMENT_OPTIONS.find((option) => option.id === formaPagamento)?.label || formaPagamento,
    package: selectedCombo ? {
      id: selectedCombo.id,
      name: selectedCombo.nome,
      price: Number(selectedCombo.preco_combo),
      durationMinutes: selectedCombo.duracaoTotalMinutos,
      services: selectedCombo.servicos.map((service) => service.nome),
      serviceDurations: selectedCombo.servicos.map((service) => service.duracao_minutos),
    } : null,
    services: reviewServices.map((service) => ({ id: service.id, name: service.nome, price: Number(service.preco), durationMinutes: service.duracao_minutos })),
    products: produtos.filter((product) => selectedProductIds.includes(product.id)).map((product) => ({ id: product.id, name: product.nome, price: Number(product.preco) })),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profissionalId || !hasSelectedItems || !dataStr || !horaStr) {
      setErrorMsg('Preencha os campos obrigatórios e selecione ao menos um serviço, pacote ou item da comanda.')
      return
    }

    setErrorMsg(null)
    setConfirmationStage((stage) => transitionBookingConfirmation(stage, 'submit'))
  }

  const handleConfirmBooking = async () => {
    if (confirmationStage !== 'reviewing' || !profissionalId) return
    const allServicoIds = isMultiSelect ? selectedServicoIds : selectedServicoId ? [selectedServicoId] : []
    const extraServiceIds = allServicoIds.filter((id) => !packageServiceIds.has(id))
    const primaryServicoId = extraServiceIds[0] || null
    setErrorMsg(null)
    setConfirmationStage((stage) => transitionBookingConfirmation(stage, 'confirm'))

    // Construir data_hora_inicio estritamente no fuso de Brasília (-03:00) para evitar desvios
    const dataHoraInicioStr = new Date(`${dataStr}T${horaStr}:00-03:00`).toISOString()

    try {
      const res = await createBookingAction({
        profissional_id: profissionalId,
        servico_id: primaryServicoId,
        servico_ids: extraServiceIds,
        combo_id: selectedCombo?.id || null,
        produto_ids: selectedProductIds,
        data_hora_inicio: dataHoraInicioStr,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        forma_pagamento_preferida: formaPagamento,
      })

      if (res.success) {
        setClienteNome('')
        setClienteTelefone('')
        setConfirmationStage((stage) => transitionBookingConfirmation(stage, 'success'))
        onClose()
        if (onSuccess) onSuccess()
      } else {
        setErrorMsg(res.message || 'Erro ao criar agendamento.')
        setConfirmationStage((stage) => transitionBookingConfirmation(stage, 'failure'))
      }
    } catch {
      setErrorMsg('Não foi possível salvar o agendamento. Confira sua conexão e tente novamente.')
      setConfirmationStage((stage) => transitionBookingConfirmation(stage, 'failure'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5 overflow-visible">
        {/* Header com Título Estritamente "Novo Agendamento" */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4A3F5C]">Novo Agendamento</h3>
              <p className="text-xs text-gray-500 font-medium">Cadastre um agendamento direto</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 relative">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-[#B8A9D9]" />
                Nome do Cliente
              </label>
              <input
                type="text"
                required
                value={clienteNome}
                onChange={(e) => {
                  setClienteNome(e.target.value)
                  setShowClientSuggestions(true)
                }}
                onFocus={() => setShowClientSuggestions(true)}
                placeholder="Ex: Maria Silva"
                className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] px-3 py-2 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-hidden font-semibold"
              />

              {/* Sugestões de Autocomplete */}
              {showClientSuggestions && filteredClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-2xl bg-white border border-gray-200 shadow-xl py-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Clientes Cadastradas ({filteredClients.length})
                  </div>
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClientSuggestion(client)}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-[#4A3F5C] hover:bg-purple-50 transition flex items-center justify-between gap-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="truncate">{client.nome}</span>
                      {client.telefone && (
                        <span className="text-[11px] font-normal text-gray-400 shrink-0">
                          {formatPhone(client.telefone)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-[#B8A9D9]" />
                WhatsApp / Telefone
              </label>
              <input
                type="tel"
                required
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] px-3 py-2 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-hidden font-semibold"
              />
            </div>
          </div>

          {/* Seção de Serviço com Botão 'Selecionar vários' no mesmo horizonte e Dropdown Rico com Fotos */}
          <div ref={selectionDropdownRef} className="relative space-y-1.5 rounded-2xl border border-gray-200/80 bg-white p-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-[#B8A9D9]" />
                <span>{isMultiSelect ? 'Serviços' : 'Serviço'}</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const next = !isMultiSelect
                  setIsMultiSelect(next)
                  if (next) {
                    if (selectedServicoId && !selectedServicoIds.includes(selectedServicoId)) {
                      setSelectedServicoIds([selectedServicoId])
                    }
                  } else {
                    if (selectedServicoIds.length > 0) {
                      setSelectedServicoId(selectedServicoIds[0])
                    }
                  }
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                  isMultiSelect
                    ? 'bg-[#B8A9D9]/25 border-[#B8A9D9] text-[#4A3F5C]'
                    : 'bg-[#FAF7F5] border-gray-200/80 text-gray-600 hover:bg-gray-100 hover:text-[#4A3F5C]'
                }`}
              >
                <span>Selecionar vários</span>
                {isMultiSelect && selectedServicoIds.length > 1 && (
                  <span className="h-4 w-4 rounded-full bg-[#4A3F5C] text-white text-[10px] flex items-center justify-center font-bold">
                    {selectedServicoIds.length}
                  </span>
                )}
              </button>
            </div>

            {loadingData ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-3 px-3 bg-gray-50 rounded-2xl border border-gray-200">
                <Loader2 className="h-4 w-4 animate-spin text-[#B8A9D9]" />
                <span>Carregando serviços...</span>
              </div>
            ) : servicos.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-semibold">
                Nenhum serviço ativo cadastrado. Cadastre um serviço na página de Serviços.
              </div>
            ) : (
              <div className="relative">
                {/* Botão Trigger do Dropdown */}
                <button
                  type="button"
                  onClick={() => setOpenSelectionPanel((current) => toggleSelectionPanel(current, 'services'))}
                  className={`w-full rounded-2xl border bg-[#FAF7F5] p-2.5 sm:p-3 text-left transition flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
                    openSelectionPanel === 'services'
                      ? 'border-[#B8A9D9] ring-2 ring-[#B8A9D9]/20'
                      : 'border-gray-200/80 hover:border-[#B8A9D9] hover:bg-white'
                  }`}
                >
                  {isMultiSelect ? (
                    selectedServicoIds.length === 0 ? (
                      <span className="text-xs text-gray-400 font-medium">Selecione um ou mais serviços...</span>
                    ) : (
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex -space-x-2 overflow-hidden shrink-0">
                          {activeServices.slice(0, 3).map((s) => (
                            <div
                              key={s.id}
                              className="relative h-9 w-9 rounded-xl border-2 border-white bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs"
                            >
                              {s.foto_url ? (
                                <Image src={s.foto_url} alt={s.nome} fill className="object-cover" unoptimized />
                              ) : (
                                <Scissors className="h-4 w-4 text-[#8675A9]" />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#4A3F5C] truncate">
                            {selectedServicoIds.length === 1
                              ? activeServices[0]?.nome
                              : `${selectedServicoIds.length} serviços selecionados`}
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            Total: <strong className="text-emerald-700 font-bold">R$ {totalPreco.toFixed(2)}</strong> • {totalDuracaoMinutos} min
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    (() => {
                      const current = servicos.find((s) => s.id === selectedServicoId) || servicos[0]
                      if (!current) return <span className="text-xs text-gray-400">Selecione um serviço...</span>
                      return (
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative h-10 w-10 rounded-xl bg-white border border-[#B8A9D9]/30 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                            {current.foto_url ? (
                              <Image src={current.foto_url} alt={current.nome} fill className="object-cover" unoptimized />
                            ) : (
                              <Scissors className="h-5 w-5 text-[#8675A9]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#4A3F5C] truncate">{current.nome}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                              <span className="text-emerald-700 font-bold">R$ {Number(current.preco).toFixed(2)}</span>
                              <span className="mx-1.5">•</span>
                              <span>{current.duracao_minutos} min</span>
                            </p>
                          </div>
                        </div>
                      )
                    })()
                  )}

                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    openSelectionPanel === 'services' ? 'rotate-180 text-[#8675A9]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown com Foto na Esquerda, Nome à Direita, Valor e Tempo */}
                {openSelectionPanel === 'services' && (
                  <div className="lume-smooth-dropdown absolute left-0 right-0 top-full mt-2 z-40 max-h-72 overflow-y-auto rounded-3xl bg-white border border-gray-200 shadow-2xl p-2 space-y-1.5">
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span>{isMultiSelect ? 'Marque os serviços desejados' : 'Selecione o serviço'}</span>
                      {isMultiSelect && (
                        <span className="text-[#8675A9] font-bold">
                          {selectedServicoIds.length} selecionado(s)
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      {servicos.map((s) => {
                        const isSelected = isMultiSelect
                          ? selectedServicoIds.includes(s.id)
                          : selectedServicoId === s.id

                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (isMultiSelect) {
                                if (selectedServicoIds.includes(s.id)) {
                                  setSelectedServicoIds(selectedServicoIds.filter((id) => id !== s.id))
                                } else {
                                  setSelectedServicoIds([...selectedServicoIds, s.id])
                                }
                              } else {
                                setSelectedServicoId(s.id)
                                setOpenSelectionPanel(null)
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer border ${
                              isSelected
                                ? 'bg-purple-50/80 border-[#B8A9D9] shadow-2xs'
                                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200/70'
                            }`}
                          >
                            {/* Foto na Esquerda */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative h-12 w-12 rounded-xl bg-gray-100 border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                                {s.foto_url ? (
                                  <Image src={s.foto_url} alt={s.nome} fill className="object-cover" unoptimized />
                                ) : (
                                  <Scissors className="h-5 w-5 text-[#8675A9]" />
                                )}
                              </div>

                              {/* Nome à Direita, Valor e Tempo */}
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#4A3F5C]' : 'text-gray-800'}`}>
                                  {s.nome}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-semibold">
                                  <span className="text-emerald-700 font-bold">R$ {Number(s.preco).toFixed(2)}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    {s.duracao_minutos} min
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Indicador de Seleção à Direita */}
                            <div className="shrink-0 pl-2">
                              {isMultiSelect ? (
                                <div
                                  className={`h-5 w-5 rounded-lg border flex items-center justify-center transition ${
                                    isSelected
                                      ? 'bg-[#4A3F5C] border-[#4A3F5C] text-white'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                </div>
                              ) : (
                                isSelected && (
                                  <div className="h-6 w-6 rounded-full bg-[#4A3F5C] text-white flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {isMultiSelect && (
                      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between px-1">
                        <div className="text-[11px] font-semibold text-gray-600">
                          Total: <strong className="text-emerald-700 font-bold">R$ {totalPreco.toFixed(2)}</strong> ({totalDuracaoMinutos} min)
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenSelectionPanel(null)}
                          className="px-4 py-1.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer"
                        >
                          Concluir
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {pacotes.length > 0 && (
            <section className="relative border-t border-gray-100 pt-1">
              <button
                type="button"
                aria-expanded={openSelectionPanel === 'packages'}
                onClick={() => setOpenSelectionPanel((current) => toggleSelectionPanel(current, 'packages'))}
                className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-2.5 py-2 text-left transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[.99] ${openSelectionPanel === 'packages' ? 'border-[#B8A9D9] bg-white' : 'border-transparent bg-[#FAF7F5] hover:border-[#B8A9D9]/60'}`}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-700">Pacotes <span className="font-normal text-gray-400">(opcional)</span></span>
                  <span className="mt-0.5 block truncate text-[10px] text-gray-500">
                    {selectedCombo ? `${selectedCombo.nome} · R$ ${Number(selectedCombo.preco_combo).toFixed(2)} · ${selectedCombo.duracaoTotalMinutos} min` : 'Nenhum pacote selecionado'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-[10px] font-medium text-[#6B5E7A]">
                  {selectedCombo ? '1 selecionado' : `${pacotes.length} disponíveis`}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSelectionPanel === 'packages' ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {openSelectionPanel === 'packages' && <div className="lume-smooth-dropdown absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(42vh,20rem)] space-y-1.5 overflow-y-auto rounded-3xl border border-gray-200 bg-white p-2 shadow-2xl">
                <button type="button" onClick={() => setSelectedComboId('')} className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs transition-transform duration-150 ease-out active:scale-[.99] ${!selectedComboId ? 'border-[#B8A9D9] bg-[#B8A9D9]/10' : 'border-gray-200 bg-white'}`}>
                  <span>Sem pacote</span>{!selectedComboId && <Check className="h-4 w-4 text-[#4A3F5C]" />}
                </button>
                {pacotes.map((combo) => {
                  const chosen = selectedComboId === combo.id
                  return <button key={combo.id} type="button" onClick={() => {
                    if (chosen) { setSelectedComboId(''); return }
                    const overlapping = combo.servicos.some((service) => selectedServicoIds.includes(service.id))
                    if (overlapping) setPendingCombo(combo)
                    else setSelectedComboId(combo.id)
                  }} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border p-2 text-left transition-transform duration-150 ease-out active:scale-[.99] ${chosen ? 'border-[#B8A9D9] bg-[#B8A9D9]/10' : 'border-gray-200 bg-white'}`}>
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#FAF7F5]">{combo.foto_url ? <Image src={combo.foto_url} alt="" fill className="object-cover" unoptimized /> : <Scissors className="m-3 h-4 w-4 text-[#8675A9]" />}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#4A3F5C]">{combo.nome}</p><p className="mt-0.5 text-[10px] text-[#6B5E7A]">R$ {Number(combo.preco_combo).toFixed(2)} · {combo.duracaoTotalMinutos} min</p></div>
                    {chosen && <Check className="h-4 w-4 shrink-0 text-[#4A3F5C]" />}
                  </button>
                })}
              </div>}
            </section>
          )}

          {produtos.length > 0 && (
            <section className="relative border-t border-gray-100 pt-1">
              <button
                type="button"
                aria-expanded={openSelectionPanel === 'products'}
                onClick={() => setOpenSelectionPanel((current) => toggleSelectionPanel(current, 'products'))}
                className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-2.5 py-2 text-left transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[.99] ${openSelectionPanel === 'products' ? 'border-[#B8A9D9] bg-white' : 'border-transparent bg-[#FAF7F5] hover:border-[#B8A9D9]/60'}`}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-700">Comanda <span className="font-normal text-gray-400">(opcional)</span></span>
                  <span className="mt-0.5 block truncate text-[10px] text-gray-500">
                    {selectedProductIds.length
                      ? `${selectedProductIds.length} item(ns) · R$ ${produtos.filter((item) => selectedProductIds.includes(item.id)).reduce((sum, item) => sum + Number(item.preco), 0).toFixed(2)}`
                      : 'Nenhum item selecionado'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-[10px] font-medium text-[#6B5E7A]">
                  {produtos.length} disponíveis
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSelectionPanel === 'products' ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {openSelectionPanel === 'products' && <div className="lume-smooth-dropdown absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(42vh,20rem)] space-y-1 overflow-y-auto rounded-3xl border border-gray-200 bg-white px-3 shadow-2xl">
                {produtos.map((item) => {
                  const chosen = selectedProductIds.includes(item.id)
                  return <button key={item.id} type="button" onClick={() => setSelectedProductIds((ids) => chosen ? ids.filter((id) => id !== item.id) : [...ids, item.id])} className="flex min-h-14 w-full items-center gap-3 border-b border-gray-100 py-2 text-left transition-transform duration-150 ease-out active:scale-[.99]">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#FAF7F5]">{item.foto_url ? <Image src={item.foto_url} alt="" fill className="object-cover" unoptimized /> : <CreditCard className="m-3 h-4 w-4 text-[#8675A9]" />}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#4A3F5C]">{item.nome}</p><p className="text-[10px] text-emerald-700">R$ {Number(item.preco).toFixed(2)}</p></div>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${chosen ? 'border-[#4A3F5C] bg-[#4A3F5C] text-white' : 'border-gray-300 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
                  </button>
                })}
              </div>}
            </section>
          )}

          </div>

          {/* Data e Horário (CustomDatePicker + CustomSelect) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <CustomDatePicker
                label="Data do Atendimento"
                value={dataStr}
                onChange={setDataStr}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#B8A9D9]" />
                  Horário de Início
                </label>
                {availableSlots.length > 0 && !allowCustomSlot && (
                  <button
                    type="button"
                    onClick={() => setAllowCustomSlot(true)}
                    className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold cursor-pointer underline"
                  >
                    Encaixe livre
                  </button>
                )}
                {allowCustomSlot && (
                  <button
                    type="button"
                    onClick={() => setAllowCustomSlot(false)}
                    className="text-[10px] text-gray-500 hover:text-gray-700 font-semibold cursor-pointer underline"
                  >
                    Usar grade normal
                  </button>
                )}
              </div>

              {loadingSlots ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Loader2 className="h-4 w-4 animate-spin text-[#B8A9D9]" />
                  <span>Verificando horários livres...</span>
                </div>
              ) : isWorkingDay && availableSlots.length > 0 && !allowCustomSlot ? (
                <CustomSelect
                  options={availableSlots.map((s) => ({ value: s.timeStr, label: s.timeStr }))}
                  value={horaStr}
                  onChange={setHoraStr}
                  size="sm"
                  placeholder="Selecione um horário..."
                  buttonClassName="font-semibold"
                />
              ) : (
                <div className="space-y-1.5">
                  <CustomSelect
                    options={TIME_OPTIONS}
                    value={horaStr || '09:00'}
                    onChange={setHoraStr}
                    size="sm"
                    placeholder="Selecione um horário..."
                    buttonClassName="font-semibold"
                  />
                  {!isWorkingDay && (
                    <span className="text-[10px] text-amber-700 font-medium block">
                      Dia sem atendimento na grade semanal (encaixe livre habilitado)
                    </span>
                  )}
                  {isWorkingDay && availableSlots.length === 0 && (
                    <span className="text-[10px] text-amber-700 font-medium block">
                      Horários da grade ocupados (encaixe livre habilitado)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormaPagamento(opt.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    formaPagamento === opt.id
                      ? 'bg-[#B8A9D9]/25 border-[#B8A9D9] text-[#4A3F5C]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <PaymentIcon method={opt.id} className="h-3.5 w-3.5" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4A3F5C] px-4 py-3 text-xs font-bold text-white hover:bg-[#4A3F5C]/90 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Revisar agendamento</span>
              )}
            </button>
          </div>
        </form>
      </div>
      {isReviewOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="booking-review-title" className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#B8A9D9]/30 bg-[#FAF7F5] shadow-2xl sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-[#4A3F5C]/10 bg-white px-5 py-4">
              <div>
                <h3 id="booking-review-title" className="text-base font-bold text-[#4A3F5C]">Revise o agendamento</h3>
                <p className="mt-0.5 text-xs text-[#6D6478]">Confira os dados antes de salvar.</p>
              </div>
              <button type="button" aria-label="Voltar para edição" disabled={submitting} onClick={() => { setErrorMsg(null); setConfirmationStage((stage) => transitionBookingConfirmation(stage, 'back')) }} className="rounded-full p-2 text-[#6D6478] transition hover:bg-[#FAF7F5] disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="max-h-[65dvh] space-y-4 overflow-y-auto px-5 py-4 sm:max-h-[60dvh]">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><p className="text-[11px] text-[#81788B]">Cliente</p><p className="font-semibold text-[#4A3F5C]">{reviewSummary.clientName}</p><p className="text-xs text-[#6D6478]">{reviewSummary.clientPhone}</p></div>
                <div><p className="text-[11px] text-[#81788B]">Data e horário</p><p className="font-semibold text-[#4A3F5C]">{new Date(`${reviewSummary.date}T12:00:00`).toLocaleDateString('pt-BR')} às {reviewSummary.time}</p><p className="text-xs text-[#6D6478]">{reviewSummary.paymentMethod}</p></div>
              </div>
              <div className="divide-y divide-[#4A3F5C]/10 border-y border-[#4A3F5C]/10">
                {reviewSummary.items.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><p className="text-sm font-semibold text-[#4A3F5C]">{item.name}</p><p className="text-xs text-[#81788B]">{item.type === 'package' ? 'Pacote' : item.type === 'product' ? 'Comanda digital' : 'Serviço'}{item.durationMinutes > 0 ? ` · ${item.durationMinutes} min` : ''}</p></div>
                      <p className="shrink-0 text-sm font-semibold text-[#4A3F5C]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                    </div>
                    {item.type === 'package' && reviewSummary.packageServices.length > 0 && <p className="mt-1 text-xs leading-5 text-[#6D6478]">Inclui: {reviewSummary.packageServices.join(', ')}</p>}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm"><span className="text-[#6D6478]">Duração prevista</span><span className="font-semibold text-[#4A3F5C]">{reviewSummary.totalDurationMinutes} min</span></div>
              <div className="flex items-center justify-between border-t border-[#4A3F5C]/10 pt-3"><span className="text-sm font-semibold text-[#4A3F5C]">Total</span><span className="text-lg font-bold text-[#4A3F5C]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reviewSummary.totalPrice)}</span></div>
              {errorMsg && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{errorMsg}</p>}
            </div>
            <footer className="grid grid-cols-2 gap-2 border-t border-[#4A3F5C]/10 bg-white p-4">
              <button type="button" disabled={submitting} onClick={() => { setErrorMsg(null); setConfirmationStage((stage) => transitionBookingConfirmation(stage, 'back')) }} className="min-h-11 rounded-xl border border-[#B8A9D9]/60 px-3 text-sm font-semibold text-[#4A3F5C] transition hover:bg-[#FAF7F5] disabled:opacity-50">Voltar e editar</button>
              <button type="button" disabled={submitting} onClick={handleConfirmBooking} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4A3F5C] px-3 text-sm font-semibold text-white transition hover:bg-[#392F49] disabled:opacity-60">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : <>Confirmar<ChevronRight className="h-4 w-4" /></>}
              </button>
            </footer>
          </section>
        </div>
      )}
      <ConfirmDialog
        open={!!pendingCombo}
        title="Este pacote inclui um serviço selecionado"
        inlineIcon={<AlertTriangle className="h-5 w-5" />}
        description={pendingCombo ? `${pendingCombo.nome} já inclui ${pendingCombo.servicos.filter((service) => selectedServicoIds.includes(service.id)).map((service) => service.nome).join(', ')}. O serviço permanecerá visível junto ao pacote sem cobrança duplicada.` : ''}
        confirmLabel="Usar pacote"
        onClose={() => setPendingCombo(null)}
        onConfirm={() => { if (pendingCombo) setSelectedComboId(pendingCombo.id); setPendingCombo(null) }}
      />
    </div>
  )
}

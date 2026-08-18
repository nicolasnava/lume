'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Phone, Scissors, Loader2, AlertTriangle } from 'lucide-react'
import { createBookingAction } from '@/app/actions/booking'
import PaymentIcon from '@/components/common/PaymentIcon'
import CustomSelect from '@/components/ui/CustomSelect'
import CustomDatePicker from '@/components/ui/CustomDatePicker'

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
}

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
  const [clientes, setClientes] = useState<ClientOption[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [profissionalId, setProfissionalId] = useState<string | null>(null)

  // Form states
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [selectedServicoId, setSelectedServicoId] = useState('')
  const [dataStr, setDataStr] = useState('')
  const [horaStr, setHoraStr] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('pix')

  // Dynamic slots based on real availability, pauses, blocks and appointments
  const [availableSlots, setAvailableSlots] = useState<{ timeStr: string; dataHoraInicio: string; dataHoraFim: string }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  const [allowCustomSlot, setAllowCustomSlot] = useState(false)

  // Autocomplete states (Item 2)
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
      setAllowCustomSlot(false)

      // Fetch user profile, services and registered clients via server action (Item 1 & 2)
      const loadInitialData = async () => {
        setLoadingData(true)
        const { getProfissionalServicesAndClientsAction } = await import('@/app/actions/booking')
        const res = await getProfissionalServicesAndClientsAction()

        if (res.success && res.profissionalId) {
          setProfissionalId(res.profissionalId)
          setServicos(res.services)
          setClientes(res.clients || [])
          if (res.services.length > 0) {
            setSelectedServicoId(res.services[0].id)
          }
        }
        setLoadingData(false)
      }

      loadInitialData()
    }
  }, [isOpen])

  // Calcular horários disponíveis reais com base na agenda cadastrada
  useEffect(() => {
    if (!isOpen || !profissionalId || !selectedServicoId || !dataStr) return

    let isMounted = true
    const loadSlots = async () => {
      setLoadingSlots(true)
      const { fetchAvailableSlotsAction } = await import('@/app/actions/booking')
      // Passa allowPastSlots = true para permitir agendamentos manuais em qualquer horário do dia
      const res = await fetchAvailableSlotsAction(profissionalId, selectedServicoId, dataStr, true)
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
  }, [isOpen, profissionalId, selectedServicoId, dataStr])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profissionalId || !selectedServicoId || !dataStr || !horaStr) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    // Construir data_hora_inicio com precisão no fuso horário do usuário
    const [year, month, day] = dataStr.split('-').map(Number)
    const [hour, minute] = horaStr.split(':').map(Number)
    const localStartDate = new Date(year, month - 1, day, hour, minute, 0)
    const dataHoraInicioStr = localStartDate.toISOString()

    const res = await createBookingAction({
      profissional_id: profissionalId,
      servico_id: selectedServicoId,
      data_hora_inicio: dataHoraInicioStr,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      forma_pagamento_preferida: formaPagamento,
    })

    setSubmitting(false)

    if (res.success) {
      // Reset form
      setClienteNome('')
      setClienteTelefone('')
      onClose()
      if (onSuccess) onSuccess()
    } else {
      setErrorMsg(res.message || 'Erro ao criar agendamento.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5 overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4A3F5C]">Novo Agendamento Manual</h3>
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
          {/* Dados do Cliente (Item 2: Autocomplete em Tempo Real) */}
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

              {/* Sugestões de Autocomplete (Item 2) */}
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
                          {client.telefone}
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

          {/* Serviço (Item 1: Serviços Ativos Carregados sem RLS Block) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Scissors className="h-3.5 w-3.5 text-[#B8A9D9]" />
              Serviço
            </label>
            {loadingData ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#B8A9D9]" />
                Carregando serviços...
              </div>
            ) : servicos.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 font-semibold">
                Nenhum serviço ativo cadastrado. Cadastre um serviço na página de Serviços.
              </div>
            ) : (
              <CustomSelect
                options={servicos.map((s) => ({
                  value: s.id,
                  label: `${s.nome} (${s.duracao_minutos} min - R$ ${Number(s.preco).toFixed(2)})`,
                }))}
                value={selectedServicoId}
                onChange={setSelectedServicoId}
                size="sm"
                buttonClassName="font-semibold"
              />
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
                <span>Confirmar Agendamento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

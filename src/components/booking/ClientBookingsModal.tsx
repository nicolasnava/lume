'use client'

import { useState } from 'react'
import {
  lookupClientBookingsAction,
  cancelClientBookingAction,
  rescheduleClientBookingAction,
  fetchWorkingDaysAction,
  fetchAvailableSlotsAction,
  ClientBookingItem,
} from '@/app/actions/booking'
import VerticalDayList from '@/components/booking/VerticalDayList'
import { WorkingDayInfo, TimeSlot } from '@/lib/booking/availability'
import Toast from '@/components/ui/Toast'
import {
  Calendar,
  Clock,
  Search,
  X,
  Loader2,
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Ban,
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

const CANCEL_NOTICE_HOURS = 4

interface ClientBookingsModalProps {
  isOpen: boolean
  onClose: () => void
  profissionalSlug: string
  corPrimaria?: string
}

type ActionModalStep =
  | 'choose'
  | 'confirm_cancel'
  | 'reschedule_date'
  | 'reschedule_time'
  | 'reschedule_confirm'
  | 'reschedule_success'

export default function ClientBookingsModal({
  isOpen,
  onClose,
  profissionalSlug,
  corPrimaria = '#B8A9D9',
}: ClientBookingsModalProps) {
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchedPhone, setSearchedPhone] = useState<string | null>(null)

  const [upcoming, setUpcoming] = useState<ClientBookingItem[]>([])
  const [past, setPast] = useState<ClientBookingItem[]>([])
  const [whatsappProfissional, setWhatsappProfissional] = useState<string | null>(null)
  const [loadedProfissionalId, setLoadedProfissionalId] = useState<string | null>(null)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  // Controle do modal de ação (Cancelar / Remarcar)
  const [activeBooking, setActiveBooking] = useState<ClientBookingItem | null>(null)
  const [actionStep, setActionStep] = useState<ActionModalStep>('choose')
  const [actionError, setActionError] = useState<string | null>(null)

  // Estados do fluxo de cancelamento
  const [canceling, setCanceling] = useState(false)
  const [lateNoticeInfo, setLateNoticeInfo] = useState<{ isLate: boolean; message: string } | null>(null)

  // Estados do fluxo de reagendamento
  const [workingDays, setWorkingDays] = useState<WorkingDayInfo[]>([])
  const [loadingDays, setLoadingDays] = useState(false)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleResult, setRescheduleResult] = useState<{ novoInicio: string; novoFim: string } | null>(null)

  if (!isOpen) return null

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
    setPhone(formatted)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    setErrorMsg(null)
    setLateNoticeInfo(null)

    const res = await lookupClientBookingsAction(profissionalSlug, phone)
    setSearching(false)

    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao buscar agendamentos.')
    } else {
      setSearchedPhone(phone)
      setUpcoming(res.upcoming || [])
      setPast(res.past || [])
      setWhatsappProfissional(res.whatsappProfissional || null)
      if (res.profissionalId) {
        setLoadedProfissionalId(res.profissionalId)
      }
    }
  }

  const handleResetSearch = () => {
    setSearchedPhone(null)
    setUpcoming([])
    setPast([])
    setErrorMsg(null)
    setLateNoticeInfo(null)
    setActiveBooking(null)
  }

  const handleOpenActionModal = (booking: ClientBookingItem) => {
    setActiveBooking(booking)
    setActionStep('choose')
    setActionError(null)
    setSelectedDateStr(null)
    setSelectedSlot(null)
    setAvailableSlots([])
    setRescheduleResult(null)

    // Verificar antecedência mínima de 4h
    const inicioDate = new Date(booking.data_hora_inicio)
    const diffHours = (inicioDate.getTime() - Date.now()) / (1000 * 60 * 60)

    if (diffHours < CANCEL_NOTICE_HOURS) {
      setLateNoticeInfo({
        isLate: true,
        message: `Seu agendamento é em menos de ${CANCEL_NOTICE_HOURS} horas. Alterações ou cancelamentos online só são permitidos com no mínimo ${CANCEL_NOTICE_HOURS}h de antecedência.`,
      })
    } else {
      setLateNoticeInfo(null)
    }
  }

  const handleSelectRescheduleOption = async () => {
    setActionStep('reschedule_date')
    setActionError(null)

    // Carregar dias de atendimento se ainda não carregados
    const profId = activeBooking?.profissional_id || loadedProfissionalId
    if (profId && workingDays.length === 0) {
      setLoadingDays(true)
      try {
        const days = await fetchWorkingDaysAction(profId, 90)
        setWorkingDays(days)
      } catch (err) {
        console.error('Erro ao carregar dias de atendimento:', err)
      } finally {
        setLoadingDays(false)
      }
    }
  }

  const handleSelectDateForReschedule = async (dateStr: string) => {
    setSelectedDateStr(dateStr)
    setSelectedSlot(null)
    setActionStep('reschedule_time')
    setLoadingSlots(true)
    setActionError(null)

    const profId = activeBooking?.profissional_id || loadedProfissionalId
    if (!profId) {
      setLoadingSlots(false)
      return
    }

    // Determinar duração do serviço
    let duracaoMinutos = 30
    if (activeBooking?.data_hora_inicio && activeBooking?.data_hora_fim) {
      const msDiff = new Date(activeBooking.data_hora_fim).getTime() - new Date(activeBooking.data_hora_inicio).getTime()
      if (msDiff > 0) duracaoMinutos = Math.round(msDiff / 60000)
    } else if (activeBooking?.servicos?.duracao_minutos) {
      duracaoMinutos = activeBooking.servicos.duracao_minutos
    }

    try {
      const res = await fetchAvailableSlotsAction(profId, duracaoMinutos, dateStr)
      setAvailableSlots(res.availableSlots || [])
    } catch (err) {
      console.error('Erro ao carregar horários disponíveis:', err)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSelectSlotForReschedule = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setActionStep('reschedule_confirm')
    setActionError(null)
  }

  const handleConfirmReschedule = async () => {
    if (!activeBooking || !selectedSlot || !searchedPhone) return

    setRescheduling(true)
    setActionError(null)

    const res = await rescheduleClientBookingAction({
      agendamentoId: activeBooking.id,
      telefone: searchedPhone,
      profissionalSlug,
      novaDataHoraInicio: selectedSlot.dataHoraInicio,
    })

    setRescheduling(false)

    if (!res.success) {
      if (res.isLate) {
        setLateNoticeInfo({
          isLate: true,
          message: res.message || 'Remarcação fora do prazo permitido.',
        })
      } else {
        setActionError(res.message || 'Erro ao remarcar agendamento.')
      }
    } else {
      // Sucesso na remarcação!
      const novoInicio = res.novoInicio || selectedSlot.dataHoraInicio
      const novoFim = res.novoFim || selectedSlot.dataHoraFim

      setRescheduleResult({ novoInicio, novoFim })
      setActionStep('reschedule_success')

      // Atualizar lista local
      setUpcoming((prev) =>
        prev.map((b) =>
          b.id === activeBooking.id
            ? { ...b, data_hora_inicio: novoInicio, data_hora_fim: novoFim }
            : b
        )
      )

      setToast({
        show: true,
        message: 'Horário remarcado com sucesso!',
        type: 'success',
      })
    }
  }

  const handleConfirmCancel = async () => {
    if (!activeBooking || !searchedPhone) return

    setCanceling(true)
    setLateNoticeInfo(null)
    setActionError(null)

    const res = await cancelClientBookingAction({
      agendamentoId: activeBooking.id,
      telefone: searchedPhone,
      profissionalSlug,
    })

    setCanceling(false)

    if (!res.success) {
      if (res.isLateCancel) {
        setLateNoticeInfo({
          isLate: true,
          message: res.message || 'Cancelamento fora do prazo permitido.',
        })
        if (res.whatsappProfissional) {
          setWhatsappProfissional(res.whatsappProfissional)
        }
      } else {
        setToast({ show: true, message: res.message || 'Erro ao cancelar agendamento.', type: 'error' })
      }
    } else {
      setToast({ show: true, message: 'Agendamento cancelado com sucesso!', type: 'success' })
      const canceledItem = { ...activeBooking, status: 'cancelado' as const }
      setUpcoming((prev) => prev.filter((b) => b.id !== activeBooking.id))
      setPast((prev) => [canceledItem, ...prev])
      setActiveBooking(null)
    }
  }

  const cleanWhatsappProf = (whatsappProfissional || '').replace(/\D/g, '')
  const whatsappUrl = cleanWhatsappProf ? `https://wa.me/55${cleanWhatsappProf}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl font-bold text-white shadow-2xs"
              style={{ backgroundColor: corPrimaria }}
            >
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#4A3F5C]">Meus Agendamentos</h2>
              <p className="text-[11px] text-gray-400 font-medium">
                Consulte, remarque ou cancele seus horários marcados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Etapa 1: Formulário de Busca por Telefone */}
        {!searchedPhone ? (
          <form onSubmit={handleSearch} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#4A3F5C]">
                Digite seu telefone / WhatsApp cadastrado
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] py-3 pl-10 pr-4 text-sm text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Buscaremos os horários associados a este número de telefone nesta profissional.
              </p>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: corPrimaria }}
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buscando horários...</span>
                </>
              ) : (
                <span>Consultar Meus Horários</span>
              )}
            </button>
          </form>
        ) : (
          /* Etapa 2: Resultado dos Agendamentos */
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-[#FAF7F5] p-3 rounded-xl border border-gray-100 text-xs">
              <span className="text-gray-500">
                Telefone: <strong className="text-[#4A3F5C]">{searchedPhone}</strong>
              </span>
              <button
                type="button"
                onClick={handleResetSearch}
                className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:underline cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Buscar outro número</span>
              </button>
            </div>

            {/* Próximos Agendamentos */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A3F5C] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>Próximos Agendamentos ({upcoming.length})</span>
              </h3>

              {upcoming.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-4 text-center border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">
                    Você não possui nenhum agendamento futuro confirmado nesta profissional.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => {
                    const inicioDate = new Date(b.data_hora_inicio)
                    const dataStr = inicioDate.toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    const horaStr = inicioDate.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl bg-white p-4 border border-emerald-200/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-[#4A3F5C]">
                              {b.servicos?.nome || 'Serviço Agendado'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 font-medium">
                              <span className="capitalize">{dataStr}</span>
                              <span>às</span>
                              <strong className="text-[#4A3F5C] font-bold">{horaStr}</strong>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmado
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          {b.servicos?.preco && (
                            <span className="text-xs font-black text-emerald-700">
                              R$ {Number(b.servicos.preco).toFixed(2)}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(b)}
                            className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-xs font-bold text-[#4A3F5C] hover:bg-purple-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Gerenciar / Cancelar</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Agendamentos Anteriores / Histórico */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span>Histórico Anterior ({past.length})</span>
              </h3>

              {past.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sem histórico de atendimentos anteriores.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {past.map((b) => {
                    const inicioDate = new Date(b.data_hora_inicio)
                    const dataStr = inicioDate.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    const horaStr = inicioDate.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-700">
                            {b.servicos?.nome || 'Atendimento'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {dataStr} às {horaStr}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'concluido'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'cancelado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {b.status === 'concluido'
                            ? 'Concluído'
                            : b.status === 'cancelado'
                            ? 'Cancelado'
                            : b.status === 'no_show'
                            ? 'Faltou'
                            : 'Realizado'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Interativo de Ação (Escolha, Remarcar ou Cancelar) */}
        {activeBooking && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              {/* Se estiver fora do prazo (< 4h) para qualquer ação online */}
              {lateNoticeInfo?.isLate ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 font-bold">
                      <Ban className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#4A3F5C]">Fora do Prazo Online</h3>
                      <p className="text-xs text-gray-500">
                        {activeBooking.servicos?.nome || 'Atendimento'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4 border border-red-200 space-y-2 text-xs font-medium text-red-900">
                    <p className="font-bold text-red-700">Atenção ao horário limite</p>
                    <p>{lateNoticeInfo.message}</p>
                  </div>

                  {whatsappUrl && (
                    <a
                      href={`${whatsappUrl}?text=${encodeURIComponent(
                        `Olá! Gostaria de remarcar ou cancelar meu agendamento de ${activeBooking.servicos?.nome || 'serviço'} marcado para hoje às ${new Date(activeBooking.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Falar com a Profissional no WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveBooking(null)}
                    className="w-full py-2.5 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              ) : actionStep === 'choose' ? (
                /* 1. Escolha: O que você deseja fazer? */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-[#4A3F5C]">O que você deseja fazer?</h3>
                      <p className="text-xs text-gray-500">
                        {activeBooking.servicos?.nome || 'Atendimento'} •{' '}
                        {new Date(activeBooking.data_hora_inicio).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(activeBooking.data_hora_inicio).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveBooking(null)}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Opção 1: Remarcar para outro horário */}
                    <button
                      type="button"
                      onClick={handleSelectRescheduleOption}
                      className="w-full rounded-2xl border-2 border-purple-200/80 bg-purple-50/50 p-4 text-left transition hover:border-[#B8A9D9] hover:bg-purple-50 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: corPrimaria }}
                        >
                          <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                          <strong className="block text-sm font-bold text-[#4A3F5C]">
                            Remarcar para outro horário
                          </strong>
                          <span className="text-[11px] text-gray-500">
                            Escolha um novo dia ou hora disponível mantendo seu serviço
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#4A3F5C] transition shrink-0 ml-2" />
                    </button>

                    {/* Opção 2: Cancelar agendamento */}
                    <button
                      type="button"
                      onClick={() => setActionStep('confirm_cancel')}
                      className="w-full rounded-2xl border border-red-200 bg-red-50/40 p-4 text-left transition hover:bg-red-50 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold shrink-0">
                          <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <strong className="block text-sm font-bold text-red-700">
                            Cancelar agendamento
                          </strong>
                          <span className="text-[11px] text-gray-500">
                            Liberar seu horário e cancelar este atendimento
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-red-700 transition shrink-0 ml-2" />
                    </button>
                  </div>
                </div>
              ) : actionStep === 'confirm_cancel' ? (
                /* 2. Confirmação do Cancelamento */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold">
                      <XCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#4A3F5C]">Cancelar Agendamento</h3>
                      <p className="text-xs text-gray-500">
                        {activeBooking.servicos?.nome || 'Atendimento'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Tem certeza de que deseja cancelar seu horário de{' '}
                    <strong className="text-[#4A3F5C]">
                      {activeBooking.servicos?.nome || 'serviço'}
                    </strong>{' '}
                    no dia{' '}
                    <strong className="text-[#4A3F5C]">
                      {new Date(activeBooking.data_hora_inicio).toLocaleDateString('pt-BR')}
                    </strong>{' '}
                    às{' '}
                    <strong className="text-[#4A3F5C]">
                      {new Date(activeBooking.data_hora_inicio).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                    ?
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActionStep('choose')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCancel}
                      disabled={canceling}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {canceling ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Cancelando...</span>
                        </>
                      ) : (
                        <span>Sim, Cancelar</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : actionStep === 'reschedule_date' ? (
                /* 3. Reagendamento: Seleção de Data */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-[#4A3F5C]">Escolha a Nova Data</h3>
                      <p className="text-xs text-gray-500">
                        {activeBooking.servicos?.nome || 'Serviço'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActionStep('choose')}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>

                  {loadingDays ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-2 text-xs text-gray-400 font-semibold">
                      <Loader2 className="h-6 w-6 animate-spin text-[#4A3F5C]" />
                      <span>Consultando dias de atendimento...</span>
                    </div>
                  ) : (
                    <VerticalDayList
                      workingDays={workingDays}
                      selectedDateStr={selectedDateStr}
                      onSelectDate={handleSelectDateForReschedule}
                      corPrimaria={corPrimaria}
                    />
                  )}
                </div>
              ) : actionStep === 'reschedule_time' ? (
                /* 4. Reagendamento: Seleção de Horário */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-[#4A3F5C]">Escolha o Horário</h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {selectedDateStr
                          ? new Date(`${selectedDateStr}T12:00:00`).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                            })
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActionStep('reschedule_date')}
                      className="text-xs font-semibold text-purple-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Trocar data</span>
                    </button>
                  </div>

                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-2 text-xs text-gray-400 font-semibold">
                      <Loader2 className="h-6 w-6 animate-spin text-[#4A3F5C]" />
                      <span>Verificando horários vagos...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="rounded-2xl bg-gray-50 p-6 text-center border border-gray-200/60 space-y-2">
                      <p className="text-xs font-bold text-[#4A3F5C]">Sem horários disponíveis neste dia</p>
                      <p className="text-[11px] text-gray-400">
                        Todos os horários já foram reservados ou a profissional não tem vaga nesta data.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActionStep('reschedule_date')}
                        className="mt-2 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Escolher outro dia
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.timeStr}
                            type="button"
                            onClick={() => handleSelectSlotForReschedule(slot)}
                            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#B8A9D9] hover:bg-purple-50 text-center font-bold text-xs text-[#4A3F5C] transition cursor-pointer shadow-2xs"
                          >
                            {slot.timeStr}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : actionStep === 'reschedule_confirm' && selectedSlot ? (
                /* 5. Reagendamento: Confirmação Clara do Novo Horário */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#4A3F5C]">Confirmar Novo Horário</h3>
                      <p className="text-xs text-gray-500">
                        Revise a alteração da sua data e horário
                      </p>
                    </div>
                  </div>

                  {actionError && (
                    <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                      {actionError}
                    </div>
                  )}

                  {/* Card de Comparação: Anterior vs Novo */}
                  <div className="rounded-2xl border border-gray-200 bg-[#FAF7F5] p-4 space-y-3">
                    <div className="text-xs">
                      <span className="block text-[10px] font-bold uppercase text-gray-400">
                        Horário Anterior:
                      </span>
                      <p className="font-semibold text-gray-500 line-through">
                        {new Date(activeBooking.data_hora_inicio).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(activeBooking.data_hora_inicio).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="border-t border-gray-200/60 pt-2 text-xs">
                      <span className="block text-[10px] font-bold uppercase text-emerald-700">
                        Novo Horário Escolhido:
                      </span>
                      <p className="font-bold text-[#4A3F5C] text-sm flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>
                          {new Date(selectedSlot.dataHoraInicio).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}{' '}
                          às{' '}
                          {new Date(selectedSlot.dataHoraInicio).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>

                    <div className="border-t border-gray-200/60 pt-2 text-xs text-gray-600">
                      <span>Serviço: </span>
                      <strong className="text-[#4A3F5C]">
                        {activeBooking.servicos?.nome || 'Atendimento'}
                      </strong>
                      {activeBooking.servicos?.duracao_minutos && (
                        <span className="text-gray-400">
                          {' '}
                          ({activeBooking.servicos.duracao_minutos} min)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActionStep('reschedule_time')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                      Alterar Horário
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReschedule}
                      disabled={rescheduling}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: '#4A3F5C' }}
                    >
                      {rescheduling ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Remarcando...</span>
                        </>
                      ) : (
                        <span>Confirmar Remarcação</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : actionStep === 'reschedule_success' && rescheduleResult ? (
                /* 6. Confirmação Clara de Sucesso */
                <div className="space-y-4 text-center py-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold shadow-xs">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#4A3F5C]">
                      Agendamento Remarcado!
                    </h3>
                    <p className="text-xs text-gray-500">
                      Seu novo horário foi atualizado na agenda da profissional.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 text-xs space-y-1">
                    <span className="block text-[11px] font-bold text-emerald-800">
                      Nova data e horário:
                    </span>
                    <strong className="block text-sm font-black text-emerald-950">
                      {new Date(rescheduleResult.novoInicio).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      às{' '}
                      {new Date(rescheduleResult.novoInicio).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                    <span className="block text-[11px] text-emerald-700">
                      {activeBooking.servicos?.nome}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveBooking(null)}
                    className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-sm transition hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: '#4A3F5C' }}
                  >
                    Concluir
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <Toast
          show={!!toast?.show}
          message={toast?.message || ''}
          type={toast?.type}
          onClose={() => setToast(null)}
        />
      </div>
    </div>
  )
}

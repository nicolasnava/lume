'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { Database } from '@/lib/supabase/database.types'
import {
  fetchWorkingDaysAction,
  fetchAvailableSlotsAction,
  createBookingAction,
} from '@/app/actions/booking'
import { TimeSlot, WorkingDayInfo } from '@/lib/booking/availability'
import { getContrastingTextColor } from '@/lib/utils/contrast'
import Toast from '@/components/ui/Toast'
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  MessageCircle,
  Scissors,
} from 'lucide-react'

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  profissional: ProfissionalRow
  servico: ServicoRow
}

export default function BookingModal({
  isOpen,
  onClose,
  profissional,
  servico,
}: BookingModalProps) {
  const corPrimaria = profissional.cor_primaria || '#B8A9D9'
  const textColorOnPrimary = getContrastingTextColor(corPrimaria)

  // Passos: 1 = Data/Horário, 2 = Dados do Cliente, 3 = Confirmação
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Dados do formulário
  const [workingDays, setWorkingDays] = useState<WorkingDayInfo[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')

  const [loadingDays, setLoadingDays] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  const [, startTransition] = useTransition()

  // Buscar horários quando a data selecionada mudar
  const handleSelectDate = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr)
      setSelectedSlot(null)
      setErrorMsg(null)
      setLoadingSlots(true)

      startTransition(async () => {
        const res = await fetchAvailableSlotsAction(profissional.id, servico.id, dateStr)
        setAvailableSlots(res.availableSlots)
        setLoadingSlots(false)
      })
    },
    [profissional.id, servico.id]
  )

  // Reset do modal ao abrir
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedDate('')
      setAvailableSlots([])
      setSelectedSlot(null)
      setClienteNome('')
      setClienteTelefone('')
      setErrorMsg(null)

      // Carregar os próximos 14 dias
      setLoadingDays(true)
      fetchWorkingDaysAction(profissional.id)
        .then((days) => {
          setWorkingDays(days)
          // Pré-selecionar o primeiro dia de atendimento disponível
          const firstWorkDay = days.find((d: WorkingDayInfo) => d.isWorkingDay)
          if (firstWorkDay) {
            handleSelectDate(firstWorkDay.dateStr)
          }
        })
        .finally(() => setLoadingDays(false))
    }
  }, [isOpen, profissional.id, handleSelectDate])

  // Máscara de telefone WhatsApp brasileira (XX) XXXXX-XXXX
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else if (value.length > 0) {
      value = `(${value}`
    }

    setClienteTelefone(value)
  }

  // Submissão do agendamento
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setErrorMsg(null)
    setSubmitting(true)

    const res = await createBookingAction({
      profissional_id: profissional.id,
      servico_id: servico.id,
      data_hora_inicio: selectedSlot.dataHoraInicio,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
    })

    setSubmitting(false)

    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao realizar agendamento.')
      setToast({ show: true, message: res.message || 'Erro ao realizar agendamento.', type: 'error' })

      // Se ocorreu conflito de concorrência (Exclusion Constraint), atualizar horários e retornar ao Passo 1
      if (res.errorType === 'EXCLUSION_VIOLATION') {
        setTimeout(() => {
          handleSelectDate(selectedDate)
          setStep(1)
        }, 2000)
      }
      return
    }

    // Avançar para a tela de confirmação
    setToast({ show: true, message: 'Agendamento realizado com sucesso!', type: 'success' })
    setStep(3)
  }

  if (!isOpen) return null

  const selectedDayInfo = workingDays.find((d) => d.dateStr === selectedDate)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-black/10 transition-all">
        {/* Cabeçalho do Modal */}
        <div
          className="relative px-6 py-5 border-b border-black/5 flex items-center justify-between"
          style={{ backgroundColor: `${corPrimaria}15` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#4A3F5C] shadow-2xs"
              style={{ backgroundColor: corPrimaria }}
            >
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4A3F5C]">{servico.nome}</h3>
              <p className="text-xs text-[#4A3F5C]/70">
                {servico.duracao_minutos} min •{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(servico.preco)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#4A3F5C]/60 hover:bg-black/5 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Indicador de Passos */}
        {step !== 3 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-[#4A3F5C]/70">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#4A3F5C] font-bold' : ''}`}>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
                style={{ backgroundColor: step === 1 ? corPrimaria : '#CBD5E1' }}
              >
                1
              </span>
              <span>Data e Horário</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#4A3F5C] font-bold' : ''}`}>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
                style={{ backgroundColor: step === 2 ? corPrimaria : '#CBD5E1' }}
              >
                2
              </span>
              <span>Seus Dados</span>
            </div>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="p-6">
          {/* PASSO 1: Seleção de Data e Horário */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Seletor de Datas (Próximos 14 dias) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-2.5 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#4A3F5C]" />
                  Selecione o Dia
                </label>

                {loadingDays ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[#4A3F5C]/40" />
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {workingDays.map((day) => {
                      const isSelected = day.dateStr === selectedDate
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          disabled={!day.isWorkingDay}
                          onClick={() => handleSelectDate(day.dateStr)}
                          className={`flex flex-col items-center justify-center rounded-2xl py-3 px-3 min-w-[64px] border text-xs font-semibold transition shrink-0 ${
                            isSelected
                              ? 'border-transparent shadow-md font-bold'
                              : day.isWorkingDay
                              ? 'border-gray-200 bg-white text-[#4A3F5C] hover:border-gray-300 hover:bg-gray-50'
                              : 'border-gray-100 bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                          style={isSelected ? { backgroundColor: corPrimaria, color: textColorOnPrimary } : {}}
                        >
                          <span className="text-[10px] uppercase opacity-75">{day.displayDay}</span>
                          <span className="text-sm font-bold mt-0.5">{day.displayDate.split('/')[0]}</span>
                          <span className="text-[9px] mt-0.5">
                            {day.isWorkingDay ? 'Livre' : 'Folga'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Seletor de Horários Disponíveis */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-2.5 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#4A3F5C]" />
                  Horários Livres {selectedDayInfo ? `(${selectedDayInfo.fullDisplay})` : ''}
                </label>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#4A3F5C]/40" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.timeStr === slot.timeStr
                      return (
                        <button
                          key={slot.timeStr}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-xl py-2.5 px-3 text-xs font-semibold border text-center transition ${
                            isSelected
                              ? 'border-transparent shadow-sm font-bold'
                              : 'border-gray-200 bg-white text-[#4A3F5C] hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          style={isSelected ? { backgroundColor: corPrimaria, color: textColorOnPrimary } : {}}
                        >
                          {slot.timeStr}
                        </button>
                      )
                    })}
                  </div>
                ) : selectedDayInfo?.isWorkingDay ? (
                  <div className="rounded-2xl bg-amber-50/70 p-4 text-center border border-amber-200/60">
                    <AlertTriangle className="mx-auto h-6 w-6 text-amber-500 mb-1" />
                    <p className="text-xs font-semibold text-amber-800">
                      Nenhum horário livre para esta data
                    </p>
                    <p className="text-[11px] text-amber-700/80 mt-0.5">
                      Todos os horários deste dia já foram preenchidos ou expiraram. Por favor, escolha outro dia.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-50 p-4 text-center border border-gray-200/60">
                    <p className="text-xs text-[#4A3F5C]/70">
                      Selecione um dia de atendimento acima para visualizar a lista de horários.
                    </p>
                  </div>
                )}
              </div>

              {/* Botão para Avançar ao Passo 2 */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(2)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-xs font-bold shadow-md transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                >
                  <span>Continuar para Seus Dados</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASSO 2: Formulário de Dados do Cliente */}
          {step === 2 && (
            <form onSubmit={handleSubmitBooking} className="space-y-5">
              {/* Resumo da Seleção */}
              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#4A3F5C]/60">Data e Horário</span>
                  <p className="text-xs font-bold text-[#4A3F5C] mt-0.5">
                    {selectedDayInfo?.fullDisplay} às {selectedSlot?.timeStr}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-[#4A3F5C] underline hover:opacity-80"
                >
                  Alterar
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs text-red-700 border border-red-200 animate-in fade-in">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Nome do Cliente */}
              <div>
                <label htmlFor="clienteNome" className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#4A3F5C]/40">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="clienteNome"
                    type="text"
                    required
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-9 pr-3 text-xs text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9D9]/30"
                    placeholder="Ex: Maria Oliveira"
                  />
                </div>
              </div>

              {/* Telefone WhatsApp */}
              <div>
                <label htmlFor="clienteTelefone" className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                  WhatsApp com DDD *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#4A3F5C]/40">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="clienteTelefone"
                    type="tel"
                    required
                    value={clienteTelefone}
                    onChange={handleTelefoneChange}
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-9 pr-3 text-xs text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9D9]/30"
                    placeholder="(11) 99999-8888"
                  />
                </div>
                <p className="text-[10px] text-[#4A3F5C]/60 mt-1">
                  Você receberá a confirmação e lembretes do agendamento por este WhatsApp.
                </p>
              </div>

              {/* Botões do Formulário */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-gray-200 py-3 px-4 text-xs font-semibold text-[#4A3F5C] hover:bg-gray-50 transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !clienteNome || clienteTelefone.length < 14}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-xs font-bold shadow-md transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <span>Confirmar Agendamento</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* PASSO 3: Tela de Confirmação Sucesso */}
          {step === 3 && (
            <div className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-200">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
                style={{ backgroundColor: `${corPrimaria}40`, color: '#4A3F5C' }}
              >
                <CheckCircle2 className="h-10 w-10 text-[#4A3F5C]" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#4A3F5C]">Agendamento Realizado!</h3>
                <p className="text-xs text-[#4A3F5C]/70 mt-1">
                  Seu horário foi reservado com sucesso com <strong className="text-[#4A3F5C]">{profissional.nome}</strong>.
                </p>
              </div>

              {/* Card Resumo do Agendamento */}
              <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5 text-xs">
                  <span className="text-[#4A3F5C]/70">Serviço:</span>
                  <strong className="font-bold text-[#4A3F5C]">{servico.nome}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5 text-xs">
                  <span className="text-[#4A3F5C]/70">Data e Horário:</span>
                  <strong className="font-bold text-[#4A3F5C]">
                    {selectedDayInfo?.fullDisplay} às {selectedSlot?.timeStr}
                  </strong>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5 text-xs">
                  <span className="text-[#4A3F5C]/70">Cliente:</span>
                  <strong className="font-bold text-[#4A3F5C]">{clienteNome}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4A3F5C]/70">Valor Total:</span>
                  <strong className="font-extrabold text-[#4A3F5C] text-sm">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(servico.preco)}
                  </strong>
                </div>
              </div>

              {/* Aviso WhatsApp */}
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-200/70 text-emerald-800 text-xs text-left">
                <MessageCircle className="h-6 w-6 shrink-0 text-emerald-600" />
                <p>
                  A confirmação deste agendamento será enviada no seu WhatsApp (<strong>{clienteTelefone}</strong>) em breve.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl py-3.5 px-4 text-xs font-bold text-[#4A3F5C] shadow-md transition hover:opacity-90"
                style={{ backgroundColor: corPrimaria }}
              >
                Concluir
              </button>
            </div>
          )}
        </div>
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

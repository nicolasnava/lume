'use client'

import { useState } from 'react'
import {
  lookupClientBookingsAction,
  cancelClientBookingAction,
  ClientBookingItem,
} from '@/app/actions/booking'

const CANCEL_NOTICE_HOURS = 4
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
} from 'lucide-react'

interface ClientBookingsModalProps {
  isOpen: boolean
  onClose: () => void
  profissionalSlug: string
  corPrimaria?: string
}

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

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  // Controle do modal de confirmação de cancelamento
  const [bookingToCancel, setBookingToCancel] = useState<ClientBookingItem | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [lateCancelInfo, setLateCancelInfo] = useState<{ isLate: boolean; message: string } | null>(null)

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
    setLateCancelInfo(null)

    const res = await lookupClientBookingsAction(profissionalSlug, phone)
    setSearching(false)

    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao buscar agendamentos.')
    } else {
      setSearchedPhone(phone)
      setUpcoming(res.upcoming || [])
      setPast(res.past || [])
      setWhatsappProfissional(res.whatsappProfissional || null)
    }
  }

  const handleResetSearch = () => {
    setSearchedPhone(null)
    setUpcoming([])
    setPast([])
    setErrorMsg(null)
    setLateCancelInfo(null)
  }

  const handleOpenCancelModal = (booking: ClientBookingItem) => {
    setBookingToCancel(booking)
    setLateCancelInfo(null)

    // Verificar antecedência antes mesmo de abrir
    const inicioDate = new Date(booking.data_hora_inicio)
    const diffHours = (inicioDate.getTime() - Date.now()) / (1000 * 60 * 60)

    if (diffHours < CANCEL_NOTICE_HOURS) {
      setLateCancelInfo({
        isLate: true,
        message: `Seu agendamento é em menos de ${CANCEL_NOTICE_HOURS} horas. Cancelamentos online só são permitidos com no mínimo ${CANCEL_NOTICE_HOURS}h de antecedência.`,
      })
    }
  }

  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !searchedPhone) return

    setCanceling(true)
    setLateCancelInfo(null)

    const res = await cancelClientBookingAction({
      agendamentoId: bookingToCancel.id,
      telefone: searchedPhone,
      profissionalSlug,
    })

    setCanceling(false)

    if (!res.success) {
      if (res.isLateCancel) {
        setLateCancelInfo({
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
      // Sucesso no cancelamento
      setToast({ show: true, message: 'Agendamento cancelado com sucesso!', type: 'success' })
      const canceledItem = { ...bookingToCancel, status: 'cancelado' as const }
      setUpcoming((prev) => prev.filter((b) => b.id !== bookingToCancel.id))
      setPast((prev) => [canceledItem, ...prev])
      setBookingToCancel(null)
    }
  }

  const cleanWhatsappProf = (whatsappProfissional || '').replace(/\D/g, '')
  const whatsappUrl = cleanWhatsappProf ? `https://wa.me/55${cleanWhatsappProf}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
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
                Consulte ou cancele seus horários marcados
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
                        className="rounded-xl bg-white p-4 border border-emerald-200/80 shadow-xs space-y-3"
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
                            onClick={() => handleOpenCancelModal(b)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                          >
                            Cancelar Agendamento
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

        {/* Modal / Overlay de Confirmação de Cancelamento */}
        {bookingToCancel && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#4A3F5C]">Cancelar Agendamento</h3>
                  <p className="text-xs text-gray-500">
                    {bookingToCancel.servicos?.nome || 'Atendimento'}
                  </p>
                </div>
              </div>

              {lateCancelInfo?.isLate ? (
                /* Alerta de Cancelamento em Cima da Hora (< 4h) */
                <div className="space-y-4 pt-1">
                  <div className="rounded-xl bg-red-50 p-4 border border-red-200 space-y-2 text-xs font-medium text-red-900">
                    <p className="font-bold flex items-center gap-1.5 text-red-700">
                      <Ban className="h-4 w-4 shrink-0 text-red-600" />
                      Fora do prazo de cancelamento online
                    </p>
                    <p>{lateCancelInfo.message}</p>
                  </div>

                  {whatsappUrl && (
                    <a
                      href={`${whatsappUrl}?text=${encodeURIComponent(
                        `Olá! Preciso cancelar meu agendamento de ${bookingToCancel.servicos?.nome || 'serviço'} marcado para hoje às ${new Date(bookingToCancel.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Falar com a Profissional no WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setBookingToCancel(null)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                /* Confirmação Normal (>= 4h) */
                <div className="space-y-4 pt-1">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Tem certeza de que deseja cancelar seu horário de{' '}
                    <strong className="text-[#4A3F5C]">
                      {bookingToCancel.servicos?.nome || 'serviço'}
                    </strong>{' '}
                    no dia{' '}
                    <strong className="text-[#4A3F5C]">
                      {new Date(bookingToCancel.data_hora_inicio).toLocaleDateString('pt-BR')}
                    </strong>{' '}
                    às{' '}
                    <strong className="text-[#4A3F5C]">
                      {new Date(bookingToCancel.data_hora_inicio).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                    ?
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingToCancel(null)}
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
              )}
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

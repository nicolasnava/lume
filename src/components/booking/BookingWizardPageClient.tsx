'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Database } from '@/lib/supabase/database.types'
import {
  fetchAvailableSlotsAction,
  fetchWorkingDaysAction,
  createBookingAction,
} from '@/app/actions/booking'
import { TimeSlot, WorkingDayInfo } from '@/lib/booking/availability'
import Toast from '@/components/ui/Toast'
import VerticalDayList from './VerticalDayList'
import PaymentIcon from '@/components/common/PaymentIcon'
import { getContrastingTextColor } from '@/lib/utils/contrast'
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Scissors,
  User,
  ArrowLeft,
  Calendar,
  Zap,
} from 'lucide-react'

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']

interface BookingWizardPageClientProps {
  profissional: ProfissionalRow
  allServicos: ServicoRow[]
  initialServicoId?: string
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
  initialServicoId,
  studioContext,
}: BookingWizardPageClientProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const vitrineUrl = studioContext
    ? `/studio/${studioContext.slug}/${profissional.slug}`
    : `/p/${profissional.slug}`

  const initialServico = allServicos.find((s) => s.id === initialServicoId) || null

  const [selectedServicos, setSelectedServicos] = useState<ServicoRow[]>(() =>
    initialServico ? [initialServico] : []
  )

  const [workingDays, setWorkingDays] = useState<WorkingDayInfo[]>([])
  const [loadingDays, setLoadingDays] = useState(false)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

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

  const corPrimaria = profissional.cor_primaria || '#B8A9D9'
  const textColorOnPrimary = getContrastingTextColor(corPrimaria)

  const totalDuracaoMinutos = selectedServicos.reduce((sum, s) => sum + s.duracao_minutos, 0)
  const totalPreco = selectedServicos.reduce((sum, s) => sum + Number(s.preco), 0)

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
    if (!selectedServicos.some((s) => s.id === servico.id)) {
      setSelectedServicos((prev) => [...prev, servico])
    }
  }

  const handleRemoveServico = (servicoId: string) => {
    setSelectedServicos((prev) => prev.filter((s) => s.id !== servicoId))
  }

  const handleSelectDate = async (dateStr: string) => {
    setSelectedDateStr(dateStr)
    setSelectedSlot(null)
    setLoadingSlots(true)
    setErrorMsg(null)
    setStep(3)

    const result = await fetchAvailableSlotsAction(profissional.id, totalDuracaoMinutos, dateStr)
    setAvailableSlots(result.availableSlots)
    setLoadingSlots(false)
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
    if (!selectedSlot || !selectedDateStr || selectedServicos.length === 0) return

    setSubmitting(true)
    setErrorMsg(null)

    const servicoIdsList = selectedServicos.map((s) => s.id)

    const res = await createBookingAction({
      profissional_id: profissional.id,
      servico_id: servicoIdsList[0],
      servico_ids: servicoIdsList,
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
    (s) => !selectedServicos.some((sel) => sel.id === s.id)
  )

  const formatDuracaoTotal = (mins: number) => {
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    const restMins = mins % 60
    return restMins > 0 ? `${hrs}h ${restMins}min` : `${hrs}h`
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
                  R$ {totalPreco.toFixed(2)}
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
                    <span>Monte seu atendimento ({selectedServicos.length})</span>
                  </h3>

                  {selectedServicos.length === 0 ? (
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
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl bg-purple-100 border border-purple-200 shadow-2xs">
                            {servico.foto_url ? (
                              <Image
                                src={servico.foto_url}
                                alt={servico.nome}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#4A3F5C]">
                                <Scissors className="h-6 w-6 sm:h-7 sm:w-7" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-[#4A3F5C] break-words line-clamp-2">
                              {servico.nome}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: corPrimaria }} />
                                {servico.duracao_minutos} min
                              </span>
                              <span className="font-semibold text-emerald-700">
                                R$ {Number(servico.preco).toFixed(2)}
                              </span>
                            </div>
                          </div>

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

                          <div className="space-y-1 flex-1 min-w-0">
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
                        R$ {totalPreco.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={selectedServicos.length === 0}
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

                {loadingDays ? (
                  <div className="flex h-36 w-full items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                    <Loader2 className="h-6 w-6 animate-spin text-[#B8A9D9]" />
                  </div>
                ) : (
                  <VerticalDayList
                    workingDays={workingDays}
                    selectedDateStr={selectedDateStr}
                    onSelectDate={handleSelectDate}
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
                      <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-[#B8A9D9] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Serviços:</span>
                        <strong className="text-sm sm:text-base font-extrabold text-[#4A3F5C] block leading-tight mt-0.5">
                          {selectedServicos.map((s) => s.nome).join(' + ')}
                        </strong>
                        <span className="text-xs text-gray-500 block mt-1 font-semibold">
                          Duração: {formatDuracaoTotal(totalDuracaoMinutos)}
                        </span>
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

                  {/* Totais */}
                  <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Valor Total:</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                      R$ {totalPreco.toFixed(2)}
                    </span>
                  </div>
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
    </div>
  )
}

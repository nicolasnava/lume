'use client'

import { useState, useMemo } from 'react'
import BookingDetailModal, { BookingDetail } from './BookingDetailModal'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  Sparkles,
  TrendingUp,
  DollarSign,
} from 'lucide-react'

interface AgendaCalendarProps {
  initialBookings: BookingDetail[]
  onRefresh: () => void
}

type ViewMode = 'dia' | 'semana' | 'mes'
type IndicatorPeriod = 'hoje' | 'semana' | 'mes'

function formatShortName(fullName: string | null | undefined): string {
  if (!fullName) return 'Cliente sem nome'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 2) return fullName
  return `${parts[0]} ${parts[1]}`
}

function getLocalDateStr(date: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export default function AgendaCalendar({ initialBookings, onRefresh }: AgendaCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dia')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null)

  // Item 3: Filtro de período para os 3 cards de indicadores
  const [indicatorPeriod, setIndicatorPeriod] = useState<IndicatorPeriod>('hoje')

  // Recalcular os agendamentos conforme o período selecionado para os indicadores (hoje, semana, mês)
  const periodBookings = useMemo(() => {
    const now = new Date()
    const todayStr = getLocalDateStr(now)

    return initialBookings.filter((b) => {
      if (b.status === 'cancelado') return false
      const bDateStr = getLocalDateStr(b.data_hora_inicio)
      const bDate = new Date(b.data_hora_inicio)

      if (indicatorPeriod === 'hoje') {
        return bDateStr === todayStr
      }

      if (indicatorPeriod === 'semana') {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        return bDate >= startOfWeek && bDate <= endOfWeek
      }

      if (indicatorPeriod === 'mes') {
        return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear()
      }

      return true
    })
  }, [initialBookings, indicatorPeriod])

  // Card 1: Total de Atendimentos no período
  const totalAtendimentosCount = periodBookings.length

  // Card 1 (Item 1): Faturamento Previsto (soma de agendamentos confirmados ou concluídos no período)
  const faturamentoPrevistoVal = useMemo(() => {
    return periodBookings
      .filter((b) => b.status === 'confirmado' || b.status === 'concluido')
      .reduce((sum, b) => {
        const val =
          b.valor_cobrado !== null && b.valor_cobrado !== undefined
            ? Number(b.valor_cobrado)
            : Number(b.servicos?.preco || 0)
        return sum + val
      }, 0)
  }, [periodBookings])

  // Card 3: Taxa de Ocupação no período
  const taxaOcupacaoVal = useMemo(() => {
    let capacity = 8
    if (indicatorPeriod === 'semana') capacity = 40
    if (indicatorPeriod === 'mes') capacity = 160
    return Math.min(Math.round((totalAtendimentosCount / capacity) * 100), 100)
  }, [totalAtendimentosCount, indicatorPeriod])

  // Manipulação de datas de exibição da agenda
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date())
      return
    }

    const newDate = new Date(selectedDate)
    const factor = direction === 'next' ? 1 : -1

    if (viewMode === 'dia') {
      newDate.setDate(newDate.getDate() + factor)
    } else if (viewMode === 'semana') {
      newDate.setDate(newDate.getDate() + factor * 7)
    } else {
      newDate.setMonth(newDate.getMonth() + factor)
    }

    setSelectedDate(newDate)
  }

  // Filtrar agendamentos de acordo com a visão selecionada (dia/semana/mês)
  const filteredBookings = initialBookings.filter((b) => {
    const bDate = new Date(b.data_hora_inicio)

    if (viewMode === 'dia') {
      return getLocalDateStr(b.data_hora_inicio) === getLocalDateStr(selectedDate)
    }

    if (viewMode === 'semana') {
      const startOfWeek = new Date(selectedDate)
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      return bDate >= startOfWeek && bDate <= endOfWeek
    }

    if (viewMode === 'mes') {
      return (
        bDate.getMonth() === selectedDate.getMonth() &&
        bDate.getFullYear() === selectedDate.getFullYear()
      )
    }

    return true
  })

  // Formatação do título da data
  const getHeaderDateTitle = () => {
    if (viewMode === 'dia') {
      return selectedDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }

    if (viewMode === 'semana') {
      const startOfWeek = new Date(selectedDate)
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      return `${startOfWeek.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })} - ${endOfWeek.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })}`
    }

    return selectedDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* SEÇÃO DE INDICADORES RÁPIDOS + FILTRO DE PERÍODO (Item 1, 3) */}
      <div className="space-y-3">
        {/* Seletor de Período dos Indicadores */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4A3F5C]/70">
            Resumo dos Indicadores
          </span>

          <div className="flex items-center rounded-2xl bg-white p-1 border border-gray-200/80 shadow-2xs">
            {(
              [
                { key: 'hoje', label: 'Hoje' },
                { key: 'semana', label: 'Semana' },
                { key: 'mes', label: 'Mês' },
              ] as { key: IndicatorPeriod; label: string }[]
            ).map((p) => (
              <button
                key={p.key}
                onClick={() => setIndicatorPeriod(p.key)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  indicatorPeriod === p.key
                    ? 'bg-[#4A3F5C] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-[#4A3F5C]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Cards de Indicadores Recalculados */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Metric 1: Total de Atendimentos */}
          <div className="rounded-3xl bg-white p-6 shadow-2xs border border-gray-200/80 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total de Atendimentos
              </p>
              <p className="text-3xl font-extrabold text-[#4A3F5C]">{totalAtendimentosCount}</p>
              <span className="text-xs text-gray-500 font-medium capitalize block pt-1">
                No período ({indicatorPeriod})
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B8A9D9]/25 text-[#4A3F5C] shrink-0">
              <CalendarIcon className="h-6 w-6" />
            </div>
          </div>

          {/* Metric 2: Faturamento Previsto */}
          <div className="rounded-3xl bg-white p-6 shadow-2xs border border-gray-200/80 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Faturamento Previsto
              </p>
              <p className="text-3xl font-extrabold text-emerald-700">
                R$ {faturamentoPrevistoVal.toFixed(2)}
              </p>
              <span className="text-xs text-gray-500 font-medium block pt-1">Agendamentos confirmados/concluídos</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          {/* Metric 3: Taxa de Ocupação */}
          <div className="rounded-3xl bg-white p-6 shadow-2xs border border-gray-200/80 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Taxa de Ocupação
              </p>
              <p className="text-3xl font-extrabold text-[#4A3F5C]">{taxaOcupacaoVal}%</p>
              <span className="text-xs text-gray-500 font-medium block pt-1">Capacidade estimada</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Controles do Calendário: Navegação Centralizada e Modos de Visão (Item 2, Item 20) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-3">
        {/* Navegação de Datas com Texto Centralizado entre Setas (Item 2: fonte responsiva e flexível) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[#4A3F5C] transition cursor-pointer shrink-0"
            title="Período anterior"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Item 3: Texto de data com fonte ampliada e sem quebra de linha (whitespace-nowrap) */}
          <h2 className="text-sm sm:text-lg font-extrabold text-[#4A3F5C] text-center capitalize whitespace-nowrap overflow-hidden text-ellipsis px-1">
            {getHeaderDateTitle()}
          </h2>

          <button
            onClick={() => navigateDate('next')}
            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[#4A3F5C] transition cursor-pointer shrink-0"
            title="Próximo período"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Seletor do Modo de Visão (Dia / Semana / Mês) Centralizado */}
        <div className="flex justify-center pt-2 border-t border-gray-100">
          <div className="flex items-center rounded-2xl bg-gray-100 p-1 border border-gray-200/60">
            {(['dia', 'semana', 'mes'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  viewMode === mode
                    ? 'bg-[#4A3F5C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#4A3F5C]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exibição dos Agendamentos */}
      {filteredBookings.length === 0 ? (
        /* Estado Vazio Amigável */
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center border border-gray-100 shadow-xs space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B8A9D9]/20 text-[#4A3F5C]">
            <CalendarIcon className="h-8 w-8 text-[#B8A9D9]" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-[#4A3F5C]">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-gray-500 mt-1">
              Não há atendimentos marcados para o período selecionado ({getHeaderDateTitle()}).
              Compartilhe seu link de agendamento público para receber novos clientes!
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F5] border border-[#B8A9D9]/40 text-xs font-semibold text-[#4A3F5C]">
              <Sparkles className="h-3.5 w-3.5 text-[#B8A9D9]" />
              Agenda livre e pronta para novos atendimentos
            </span>
          </div>
        </div>
      ) : (
        /* Grid de Cards de Agendamento */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const inicio = new Date(b.data_hora_inicio)
            const fim = new Date(b.data_hora_fim)
            const horaInicio = inicio.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo',
            })
            const horaFim = fim.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo',
            })
            const nomeCompleto = b.clientes?.nome || 'Cliente sem nome'
            const nomeCurto = formatShortName(b.clientes?.nome)

            const hasMultipleServices = !!(b.agendamento_servicos && b.agendamento_servicos.length > 0)
            const servicosNome = hasMultipleServices
              ? b.agendamento_servicos!.map((as) => as.servicos?.nome).filter(Boolean).join(' + ')
              : (b.servicos?.nome || 'Serviço')

            const precoValor = b.valor_cobrado !== null && b.valor_cobrado !== undefined
              ? Number(b.valor_cobrado)
              : hasMultipleServices
              ? b.agendamento_servicos!.reduce((acc, as) => acc + Number(as.preco_no_momento || as.servicos?.preco || 0), 0)
              : b.servicos?.preco !== undefined && b.servicos?.preco !== null
              ? Number(b.servicos.preco)
              : null

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="group cursor-pointer rounded-2xl bg-white p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-md hover:border-[#B8A9D9]/50 transition flex flex-col justify-between"
              >
                <div>
                  {/* Cabeçalho do Card: Horário & Status */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4A3F5C]">
                      <Clock className="h-4 w-4 text-[#B8A9D9]" />
                      <span>
                        {horaInicio} - {horaFim}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        b.status === 'confirmado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.status === 'concluido'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : b.status === 'cancelado'
                          ? 'bg-red-50 text-red-700 border border-red-200 line-through'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {b.status === 'confirmado' && <CheckCircle className="h-3 w-3" />}
                      {b.status === 'cancelado' && <XCircle className="h-3 w-3" />}
                      <span>{b.status}</span>
                    </span>
                  </div>

                  {/* Informações do Cliente e Serviço */}
                  <div className="mt-3.5 space-y-3">
                    {/* Cliente: no mobile 2 nomes, no desktop completo */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#4A3F5C]/60 shrink-0" />
                      <span className="text-sm font-bold text-[#4A3F5C] group-hover:text-[#8675A9] transition truncate">
                        <span className="sm:hidden">{nomeCurto}</span>
                        <span className="hidden sm:inline">{nomeCompleto}</span>
                      </span>
                    </div>

                    {/* Serviço (quebra em até 2 linhas) e Preço bem separado sem encavalar */}
                    <div className="flex items-start justify-between gap-4 pt-0.5">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <Scissors className="h-3.5 w-3.5 text-[#B8A9D9] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2 pr-1" title={servicosNome}>
                            {servicosNome}
                          </p>
                          {b.servicos?.ativo === false && (
                            <span className="inline-block mt-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                              Desativado
                            </span>
                          )}
                        </div>
                      </div>

                      {precoValor !== null && (
                        <div className="shrink-0 text-right">
                          <span className="text-xs sm:text-sm font-bold text-[#4A3F5C] whitespace-nowrap bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                            R$ {precoValor.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Detalhes do Agendamento Selecionado */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onRefresh={onRefresh}
      />
    </div>
  )
}

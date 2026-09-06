'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  User,
  Scissors,
  ChevronDown,
  ChevronUp,
  Phone,
  DollarSign,
  Sparkles,
} from 'lucide-react'
import NewBookingModal from '@/components/dashboard/NewBookingModal'
import ProductTourModal from '@/components/dashboard/ProductTourModal'
import BookingDetailModal, { BookingDetail } from '@/components/dashboard/BookingDetailModal'

export interface GeralBookingItem {
  id: string
  dataHoraInicio: string
  horaInicioStr: string
  clienteNome: string
  clienteTelefone?: string | null
  servicoNome: string
  servicoDuracaoMinutos?: number | null
  servicoPreco?: number | null
  rawBooking?: any
}

interface GeralViewClientProps {
  profissionalNome: string
  todayBookingsCount: number
  nextBooking: GeralBookingItem | null
  todayBookings?: GeralBookingItem[]
  totalAtendimentosSemana: number
  initialShowTour?: boolean
}

function WhatsAppIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  )
}

function capitalizeName(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatShortClientName(name: string | null | undefined): string {
  if (!name) return ''
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 2) return capitalizeName(name)
  return capitalizeName(words.slice(0, 2).join(' '))
}

function getWhatsAppUrl(
  phone: string | null | undefined,
  clientName: string,
  serviceName: string,
  timeStr: string,
  studioName: string
) {
  if (!phone) return null
  const clean = phone.replace(/\D/g, '')
  if (!clean) return null
  const full = clean.length === 10 || clean.length === 11 ? `55${clean}` : clean
  const text = `Olá ${capitalizeName(clientName)}! Tudo bem? Passando para confirmar seu atendimento de ${serviceName} hoje às ${timeStr} no ${studioName}.`
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}

function TimelineBookingCard({
  booking,
  isHighlight = false,
  profissionalNome,
  onOpenDetail,
}: {
  booking: GeralBookingItem
  isHighlight?: boolean
  profissionalNome: string
  onOpenDetail?: () => void
}) {
  const whatsappUrl = booking.clienteTelefone
    ? getWhatsAppUrl(
        booking.clienteTelefone,
        booking.clienteNome,
        booking.servicoNome,
        booking.horaInicioStr,
        profissionalNome
      )
    : null

  return (
    <div
      onClick={onOpenDetail}
      className={`rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 flex items-center gap-2.5 sm:gap-3 cursor-pointer ${
        isHighlight
          ? 'bg-[#FAF7F5] border-[#B8A9D9]/40 shadow-2xs hover:border-[#B8A9D9] hover:bg-[#f5efe9]'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/70'
      }`}
      title="Clique para ver os detalhes do agendamento"
    >
      {/* 1. Bloco de Horário na Esquerda */}
      <div className="flex flex-col items-center justify-center shrink-0 w-13 sm:w-16 py-1.5 px-1 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
        <span className="text-xs sm:text-sm font-extrabold text-[#4A3F5C] leading-none">
          {booking.horaInicioStr}
        </span>
        {booking.servicoDuracaoMinutos ? (
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium mt-1 leading-none whitespace-nowrap">
            {booking.servicoDuracaoMinutos} min
          </span>
        ) : null}
      </div>

      {/* 2. Informações Centrais */}
      <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
        {/* Nome da Cliente + Separador + Valor (Substitui o badge de "Próximo") */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-[#4A3F5C] truncate capitalize tracking-tight">
            {formatShortClientName(booking.clienteNome)}
          </span>
          {booking.servicoPreco !== null && booking.servicoPreco !== undefined && (
            <>
              <span className="text-gray-300 shrink-0">•</span>
              <span className="font-extrabold text-emerald-700 text-xs sm:text-sm shrink-0 whitespace-nowrap">
                R$ {booking.servicoPreco.toFixed(2).replace('.', ',')}
              </span>
            </>
          )}
        </div>

        {/* Serviço */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="truncate text-gray-600 font-medium text-[11px] sm:text-xs">
            {booking.servicoNome}
          </span>
        </div>
      </div>

      {/* 3. Botão WhatsApp na Direita */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition shrink-0 cursor-pointer"
          title={`Conversar com ${capitalizeName(booking.clienteNome)} no WhatsApp`}
        >
          <WhatsAppIcon className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

export default function GeralViewClient({
  profissionalNome,
  todayBookingsCount,
  nextBooking,
  todayBookings = [],
  totalAtendimentosSemana,
  initialShowTour = false,
}: GeralViewClientProps) {
  const router = useRouter()
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isTourOpen, setIsTourOpen] = useState(initialShowTour)
  const [showAllToday, setShowAllToday] = useState(false)
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<BookingDetail | null>(null)

  const handleOpenBookingDetail = (item: GeralBookingItem | null) => {
    if (!item) return
    if (item.rawBooking) {
      setSelectedBookingForDetail(item.rawBooking as BookingDetail)
    } else {
      setSelectedBookingForDetail({
        id: item.id,
        profissional_id: '',
        cliente_id: '',
        servico_id: null,
        data_hora_inicio: item.dataHoraInicio,
        data_hora_fim: item.dataHoraInicio,
        status: 'confirmado',
        google_event_id: null,
        valor_cobrado: item.servicoPreco,
        clientes: {
          nome: item.clienteNome,
          telefone: item.clienteTelefone || '',
        },
        servicos: {
          nome: item.servicoNome,
          duracao_minutos: item.servicoDuracaoMinutos || 30,
          preco: item.servicoPreco || 0,
        },
      })
    }
  }

  useEffect(() => {
    const handleRestartTour = () => setIsTourOpen(true)
    window.addEventListener('restart-lume-tour', handleRestartTour)
    return () => window.removeEventListener('restart-lume-tour', handleRestartTour)
  }, [])

  // 1. Saudação personalizada por horário
  const now = new Date()
  const currentHour = now.getHours()
  let saudacao = 'Boa noite'
  if (currentHour >= 5 && currentHour < 12) {
    saudacao = 'Bom dia'
  } else if (currentHour >= 12 && currentHour < 18) {
    saudacao = 'Boa tarde'
  }

  // 2. Data formatada por extenso (ex: "Segunda-feira, 24 de agosto")
  const dateFormattedStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const dateCapitalized =
    dateFormattedStr.charAt(0).toUpperCase() + dateFormattedStr.slice(1)

  // Outros agendamentos do dia (além do próximo em destaque)
  const otherTodayBookings = nextBooking
    ? todayBookings.filter((b) => b.id !== nextBooking.id)
    : todayBookings

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* CABEÇALHO COM SAUDAÇÃO E DATA */}
      <div className="bg-gradient-to-r from-white via-purple-50/40 to-white p-5 sm:p-7 rounded-3xl border border-gray-200/80 shadow-2xs space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#4A3F5C]/70">
          <Calendar className="h-4 w-4 text-[#B8A9D9]" />
          <span>{dateCapitalized}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#4A3F5C]">
          {saudacao}, <span className="text-[#8675A9]">{profissionalNome}</span>!
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Aqui está o resumo da sua agenda e principais atalhos do dia.
        </p>
      </div>

      {/* PAINEL DE RESUMO DO DIA (Mais compacto e com altura reduzida) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Card 1: Agendamentos de Hoje (Próximo ao topo e ampliado) */}
        <div className="rounded-3xl bg-white p-5 shadow-2xs border border-gray-200/80 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Resumo de Hoje
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/25 text-[#4A3F5C]">
                <Calendar className="h-5 w-5" />
              </div>
            </div>

            <div className="pt-0.5 sm:pt-1">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#4A3F5C] tracking-tight leading-none">
                {todayBookingsCount}{' '}
                <span className="text-base sm:text-lg md:text-xl font-bold text-gray-500">
                  {todayBookingsCount === 1 ? 'agendamento' : 'agendamentos'}
                </span>
              </h2>
            </div>
          </div>

          <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium mt-3">
            <span>Atendimentos da semana: <strong>{totalAtendimentosSemana}</strong></span>
          </div>
        </div>

        {/* Card 2: Próximo Atendimento (Padronizado: Linha 1 = icon nome • icon horario | Linha 2 = icon servico • icon valor) */}
        <div className="rounded-3xl bg-white p-5 shadow-2xs border border-gray-200/80 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Próximo Atendimento
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>

            {nextBooking ? (
              <div className="space-y-2 pt-0.5">
                {/* Mini-card de Destaque do Próximo Atendimento */}
                <TimelineBookingCard
                  booking={nextBooking}
                  isHighlight={true}
                  profissionalNome={profissionalNome}
                  onOpenDetail={() => handleOpenBookingDetail(nextBooking)}
                />

                {/* Botão de expansão dos outros agendamentos do dia */}
                {otherTodayBookings.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAllToday(!showAllToday)}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100/80 text-xs font-semibold text-gray-600 transition cursor-pointer border border-gray-200/60"
                    >
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span>
                          {showAllToday
                            ? 'Recolher agendamentos'
                            : `Ver mais ${otherTodayBookings.length} ${
                                otherTodayBookings.length === 1
                                  ? 'atendimento hoje'
                                  : 'atendimentos hoje'
                              }`}
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          showAllToday ? 'rotate-180 text-[#8675A9]' : ''
                        }`}
                      />
                    </button>

                    {/* Lista dos outros agendamentos do dia */}
                    {showAllToday && (
                      <div className="w-full space-y-2 pt-2 animate-in fade-in duration-200 max-h-56 overflow-y-auto pr-0.5">
                        {otherTodayBookings.map((b) => (
                          <TimelineBookingCard
                            key={b.id}
                            booking={b}
                            isHighlight={false}
                            profissionalNome={profissionalNome}
                            onOpenDetail={() => handleOpenBookingDetail(b)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-gray-400 pt-1">
                Nenhum atendimento pendente para hoje.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Resumo em tempo real do seu dia</span>
          </div>
        </div>
      </div>

      {/* ATALHOS RÁPIDOS */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Ações Rápidas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Atalho 1: Novo Agendamento */}
          <button
            id="tour-btn-new-booking"
            type="button"
            onClick={() => setIsNewBookingOpen(true)}
            className="flex items-center justify-between rounded-3xl bg-[#4A3F5C] p-5 text-white hover:bg-[#4A3F5C]/90 transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Plus className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold">Novo Agendamento</h4>
                <p className="text-xs opacity-80 font-normal">Criar um agendamento manual</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition" />
          </button>

          {/* Atalho 2: Ver Agendamentos */}
          <Link
            href="/dashboard/agenda"
            className="flex items-center justify-between rounded-3xl bg-white p-5 text-[#4A3F5C] border border-gray-200/80 hover:border-[#B8A9D9] transition shadow-2xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold">Ver Agendamentos</h4>
                <p className="text-xs text-gray-500 font-medium">Ir para o calendário completo</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#4A3F5C] group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>

      {/* Modal de Novo Agendamento */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        onSuccess={() => {
          window.location.reload()
        }}
      />

      {/* Modal do Tour Guiado de Onboarding */}
      <ProductTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Modal de Detalhes do Agendamento */}
      {selectedBookingForDetail && (
        <BookingDetailModal
          booking={selectedBookingForDetail}
          onClose={() => setSelectedBookingForDetail(null)}
          onRefresh={() => {
            router.refresh()
            setSelectedBookingForDetail(null)
          }}
        />
      )}
    </div>
  )
}

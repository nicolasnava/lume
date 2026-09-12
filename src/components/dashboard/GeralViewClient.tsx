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
  BarChart2,
  ChevronRight,
  AlertTriangle,
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
  temServicoDesativado?: boolean
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

import WhatsAppIcon from '@/components/ui/WhatsAppIcon'

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
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return capitalizeName(parts[0] || '')
  // Retorna Nome e Sobrenome (ex: Vanessa Schawstaiguer)
  return capitalizeName(`${parts[0]} ${parts[1]}`)
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
        {/* Nome da Cliente + Separador + Valor (Fluido, sem travar na borda direita e truncando sobrenome com ... se necessário) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-nowrap overflow-hidden">
          <span className="text-xs sm:text-sm font-bold text-[#4A3F5C] truncate capitalize tracking-tight shrink min-w-0">
            {formatShortClientName(booking.clienteNome)}
          </span>
          {booking.servicoPreco !== null && booking.servicoPreco !== undefined && (
            <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="text-gray-300">•</span>
              <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">
                R$ {booking.servicoPreco.toFixed(2).replace('.', ',')}
              </span>
            </span>
          )}
        </div>

        {/* Serviço */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {booking.temServicoDesativado && (
            <span title="Serviço desativado no catálogo" className="inline-flex shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
            </span>
          )}
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

      {/* TEASER DISCRETO: Relatórios & Metas (Prompt 62) */}
      <Link
        href="/dashboard/relatorios"
        className="group flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-50/80 via-white to-purple-50/40 border border-gray-200/80 hover:border-[#8675A9] shadow-2xs hover:shadow-xs transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white border border-[#B8A9D9]/40 text-[#4A3F5C] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <BarChart2 className="h-5 w-5 text-[#8675A9]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#4A3F5C]">Relatórios & Metas do Mês</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Acompanhe seu faturamento ao vivo, ritmo diário e progresso da meta →
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#8675A9] group-hover:text-[#4A3F5C] transition">
          <span>Ver Relatórios</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </Link>

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

'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  User,
  Phone,
  MessageCircle,
  Calendar,
  X,
  History,
  Crown,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Filter,
  ChevronRight,
  Clock,
  CreditCard,
  Scissors,
  DollarSign,
} from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import { formatPhoneNumber } from '@/lib/utils/phone'
import {
  calculateClientReliability,
  ClientReliabilityTier,
} from '@/lib/utils/reliability'

function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return ''
  const map: Record<string, string> = {
    cartao_credito: 'CARTÃO DE CRÉDITO',
    cartao_debito: 'CARTÃO DE DÉBITO',
    pix: 'PIX',
    dinheiro: 'DINHEIRO',
    outro: 'OUTRO',
  }
  const clean = method.toLowerCase().trim()
  return map[clean] || method.replace(/_/g, ' ').toUpperCase()
}

export interface ClientData {
  id: string
  nome: string
  telefone: string
  created_at: string
  agendamentos: {
    id: string
    data_hora_inicio: string
    data_hora_fim: string
    status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
    valor_cobrado?: number | null
    pago?: boolean | null
    forma_pagamento?: string | null
    servicos?: {
      nome: string
      preco: number
    } | null
  }[]
}

interface ClientListClientProps {
  initialClients: ClientData[]
}

export type ClientStatusType = 'vip' | 'inativa' | 'regular'
type SortOrder = 'recents' | 'frequency' | 'name' | 'vip' | 'reliability'
export type LastVisitFilter =
  | 'todas'
  | 'ultimos_7_dias'
  | 'ultimos_15_dias'
  | 'ultimos_30_dias'
  | 'mais_30_dias'
  | 'mais_60_dias'
  | 'sem_visitas'

export function getClientStatus(agendamentos: ClientData['agendamentos']): {
  status: ClientStatusType
  label: string
} {
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // 1. VIP: 3 ou mais agendamentos concluídos nos últimos 90 dias
  const concluidosUltimos90Dias = agendamentos.filter((a) => {
    if (a.status !== 'concluido') return false
    const d = new Date(a.data_hora_inicio)
    return d >= ninetyDaysAgo
  })

  if (concluidosUltimos90Dias.length >= 3) {
    return {
      status: 'vip',
      label: 'VIP',
    }
  }

  // 2. Inativa: último agendamento concluído há mais de 60 dias E nenhum agendamento futuro confirmado
  const concluidos = agendamentos
    .filter((a) => a.status === 'concluido')
    .sort((a, b) => new Date(b.data_hora_inicio).getTime() - new Date(a.data_hora_inicio).getTime())

  const ultimoConcluido = concluidos[0]
  const dataUltimoConcluido = ultimoConcluido ? new Date(ultimoConcluido.data_hora_inicio) : null

  const futurosConfirmados = agendamentos.filter((a) => {
    return a.status === 'confirmado' && new Date(a.data_hora_inicio) >= now
  })

  if (dataUltimoConcluido && dataUltimoConcluido < sixtyDaysAgo && futurosConfirmados.length === 0) {
    return {
      status: 'inativa',
      label: 'Inativa',
    }
  }

  return {
    status: 'regular',
    label: 'Regular',
  }
}

export default function ClientListClient({ initialClients }: ClientListClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [showLegendModal, setShowLegendModal] = useState(false)

  // Filtro de Última Visita
  const [lastVisitFilter, setLastVisitFilter] = useState<LastVisitFilter>('todas')

  // Estado de Ordenação da listagem
  const [sortOrder, setSortOrder] = useState<SortOrder>('recents')

  // Estado do Filtro de Data (Intervalo De/Até) dentro do Histórico Individual
  const [showHistoryFilter, setShowHistoryFilter] = useState(false)
  const [historyStartDate, setHistoryStartDate] = useState<string>('')
  const [historyEndDate, setHistoryEndDate] = useState<string>('')

  // Item 5: Detalhes completos do atendimento do histórico
  const [selectedHistoryBooking, setSelectedHistoryBooking] = useState<ClientData['agendamentos'][0] | null>(null)

  // Score de confiabilidade da cliente selecionada no modal (Prompt 60)
  const selectedReliability = useMemo(() => {
    return selectedClient ? calculateClientReliability(selectedClient.agendamentos) : null
  }, [selectedClient])

  // 1. Filtrar clientes por busca (nome/telefone) e última visita
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return initialClients.filter((c) => {
      const matchSearch =
        c.nome.toLowerCase().includes(term) || c.telefone.includes(term)
      if (!matchSearch) return false

      if (lastVisitFilter === 'todas') return true

      const validos = c.agendamentos
        .filter((a) => a.status !== 'cancelado')
        .sort((a, b) => new Date(b.data_hora_inicio).getTime() - new Date(a.data_hora_inicio).getTime())

      const ultimo = validos[0]
      if (!ultimo) {
        return lastVisitFilter === 'sem_visitas'
      }
      if (lastVisitFilter === 'sem_visitas') return false

      const now = new Date()
      const lastDate = new Date(ultimo.data_hora_inicio)
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (lastVisitFilter === 'ultimos_7_dias') return diffDays <= 7
      if (lastVisitFilter === 'ultimos_15_dias') return diffDays <= 15
      if (lastVisitFilter === 'ultimos_30_dias') return diffDays <= 30
      if (lastVisitFilter === 'mais_30_dias') return diffDays > 30
      if (lastVisitFilter === 'mais_60_dias') return diffDays > 60

      return true
    })
  }, [initialClients, searchTerm, lastVisitFilter])

  // 2. Item 8: Ordenar lista de clientes conforme selecionado
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      const getUltimoTime = (client: ClientData) => {
        const sorted = [...client.agendamentos].sort(
          (x, y) => new Date(y.data_hora_inicio).getTime() - new Date(x.data_hora_inicio).getTime()
        )
        return sorted[0] ? new Date(sorted[0].data_hora_inicio).getTime() : 0
      }

      if (sortOrder === 'recents') {
        return getUltimoTime(b) - getUltimoTime(a)
      }

      if (sortOrder === 'frequency') {
        return b.agendamentos.length - a.agendamentos.length
      }

      if (sortOrder === 'name') {
        return a.nome.localeCompare(b.nome)
      }

      if (sortOrder === 'vip') {
        const isVipA = getClientStatus(a.agendamentos).status === 'vip' ? 1 : 0
        const isVipB = getClientStatus(b.agendamentos).status === 'vip' ? 1 : 0
        if (isVipA !== isVipB) return isVipB - isVipA
        return getUltimoTime(b) - getUltimoTime(a)
      }

      if (sortOrder === 'reliability') {
        const orderMap: Record<ClientReliabilityTier, number> = {
          risco_falta: 4,
          atencao: 3,
          confiavel: 2,
          sem_historico: 1,
        }
        const relA = calculateClientReliability(a.agendamentos).tier
        const relB = calculateClientReliability(b.agendamentos).tier
        const scoreA = orderMap[relA] ?? 0
        const scoreB = orderMap[relB] ?? 0
        if (scoreA !== scoreB) return scoreB - scoreA
        return getUltimoTime(b) - getUltimoTime(a)
      }

      return 0
    })
  }, [filteredClients, sortOrder])

  // 3. Item 5: Histórico individual filtrado por intervalo De / Até
  const filteredHistoryBookings = useMemo(() => {
    if (!selectedClient) return []

    return [...selectedClient.agendamentos]
      .sort((a, b) => new Date(b.data_hora_inicio).getTime() - new Date(a.data_hora_inicio).getTime())
      .filter((a) => {
        const aDate = new Date(a.data_hora_inicio)
        if (historyStartDate) {
          const start = new Date(`${historyStartDate}T00:00:00`)
          if (aDate < start) return false
        }
        if (historyEndDate) {
          const end = new Date(`${historyEndDate}T23:59:59`)
          if (aDate > end) return false
        }
        return true
      })
  }, [selectedClient, historyStartDate, historyEndDate])

  return (
    <div className="space-y-6">
      {/* Topo: Busca, Filtro de Última Visita, Ordenação e Legenda */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nome ou telefone..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs text-[#4A3F5C] shadow-2xs transition focus:border-[#B8A9D9] focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Filtro de Última Visita */}
          <div className="w-full sm:w-48">
            <CustomSelect
              options={[
                { value: 'todas', label: 'Todas as visitas' },
                { value: 'ultimos_7_dias', label: 'Últimos 7 dias' },
                { value: 'ultimos_15_dias', label: 'Últimos 15 dias' },
                { value: 'ultimos_30_dias', label: 'Últimos 30 dias' },
                { value: 'mais_30_dias', label: 'Mais de 30 dias' },
                { value: 'mais_60_dias', label: 'Mais de 60 dias' },
                { value: 'sem_visitas', label: 'Sem agendamentos' },
              ]}
              value={lastVisitFilter}
              onChange={(val) => setLastVisitFilter(val as LastVisitFilter)}
              size="sm"
              buttonClassName="font-bold bg-white"
            />
          </div>

          {/* Item 8: Dropdown de Ordenação */}
          <div className="w-full sm:w-44">
            <CustomSelect
              options={[
                { value: 'recents', label: 'Mais recentes' },
                { value: 'frequency', label: 'Mais atendimentos' },
                { value: 'name', label: 'Nome (A-Z)' },
                { value: 'vip', label: 'VIPs primeiro' },
                { value: 'reliability', label: 'Risco de Falta primeiro' },
              ]}
              value={sortOrder}
              onChange={(val) => setSortOrder(val as SortOrder)}
              size="sm"
              buttonClassName="font-bold bg-white"
            />
          </div>

          {/* Item 7: Botão Legenda de Classificação em posição destacada */}
          <button
            type="button"
            onClick={() => setShowLegendModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white text-[#4A3F5C] border border-gray-200/80 text-xs font-bold hover:bg-gray-50 transition cursor-pointer shrink-0 shadow-2xs"
            title="Ver explicação dos ícones e faixas de confiabilidade"
          >
            <HelpCircle className="h-4 w-4 text-[#B8A9D9]" />
            <span>Legenda</span>
          </button>
        </div>
      </div>

      {/* Lista de Clientes Ordenada */}
      {sortedClients.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center border border-gray-100 shadow-2xs">
          <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#4A3F5C]">Nenhum cliente encontrado</h3>
          <p className="text-xs text-gray-500 mt-1">
            {searchTerm || lastVisitFilter !== 'todas'
              ? 'Tente buscar por outro termo ou alterar o filtro de última visita.'
              : 'Seus clientes aparecerão aqui assim que realizarem o primeiro agendamento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedClients.map((client) => {
            const totalAtendimentos = client.agendamentos.length
            const ultimosAgendamentos = [...client.agendamentos].sort(
              (a, b) => new Date(b.data_hora_inicio).getTime() - new Date(a.data_hora_inicio).getTime()
            )
            const ultimoAgendamento = ultimosAgendamentos[0]

            const dataUltimoAtendimento = ultimoAgendamento
              ? new Date(ultimoAgendamento.data_hora_inicio).toLocaleDateString('pt-BR')
              : 'Nenhum'

            const statusInfo = getClientStatus(client.agendamentos)
            const reliabilityInfo = calculateClientReliability(client.agendamentos)

            const cleanPhone = client.telefone.replace(/\D/g, '')
            const reativarMsg = `Oi ${client.nome}, faz um tempinho que você não vem! Bora agendar seu próximo horário?`
            const standardMsg = `Olá, ${client.nome}! Tudo bem? Entrando em contato através do Lumê.`

            const whatsappUrl = cleanPhone
              ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                  statusInfo.status === 'inativa' ? reativarMsg : standardMsg
                )}`
              : null

            return (
              <div
                key={client.id}
                className="rounded-3xl bg-white p-5 border border-gray-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4 relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Nome da cliente com Ícones de Classificação */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-[#4A3F5C]">{client.nome}</h3>
                        {/* Dimensão 1: Valor e Recorrência (VIP / Inativa) */}
                        {statusInfo.status === 'vip' && (
                          <span title="Cliente VIP (3+ agendamentos nos últimos 90 dias)">
                            <Crown className="h-4 w-4 text-amber-500 fill-amber-400 shrink-0" />
                          </span>
                        )}
                        {statusInfo.status === 'inativa' && (
                          <span title="Cliente Inativa (Sem agendamento há mais de 60 dias)">
                            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                          </span>
                        )}

                        {/* Dimensão 2: Confiabilidade de Comparecimento (Prompt 60) */}
                        {reliabilityInfo.tier === 'confiavel' && (
                          <span
                            title={`Confiabilidade: Confiável (${reliabilityInfo.reason})`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Confiável</span>
                          </span>
                        )}
                        {reliabilityInfo.tier === 'atencao' && (
                          <span
                            title={`Confiabilidade: Atenção (${reliabilityInfo.reason})`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span>Atenção</span>
                          </span>
                        )}
                        {reliabilityInfo.tier === 'risco_falta' && (
                          <span
                            title={`Confiabilidade: Risco de Falta (${reliabilityInfo.reason})`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                            <span>Risco de Falta</span>
                          </span>
                        )}
                        {reliabilityInfo.tier === 'sem_historico' && (
                          <span
                            title={`Confiabilidade: Sem histórico suficiente (${reliabilityInfo.reason})`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200/80 shrink-0"
                          >
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                            <span>Sem histórico</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Phone className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span>{formatPhoneNumber(client.telefone) || 'Sem telefone'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {statusInfo.status === 'inativa' && whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                          title="Enviar mensagem de reativação no WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Reativar</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Total</span>
                      <strong className="text-[#4A3F5C] text-sm font-bold">
                        {totalAtendimentos} {totalAtendimentos === 1 ? 'visita' : 'visitas'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Última Visita</span>
                      <strong className="text-[#4A3F5C] font-semibold">{dataUltimoAtendimento}</strong>
                    </div>
                  </div>
                </div>

                {/* Item 6: Botão "Ver Histórico Completo" com paleta Lumê consistente */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(client)
                    setHistoryStartDate('')
                    setHistoryEndDate('')
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#FAF7F5] text-[#4A3F5C] border border-[#B8A9D9]/40 hover:bg-[#B8A9D9]/20 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <History className="h-3.5 w-3.5 text-[#B8A9D9]" />
                  <span>Ver Histórico Completo</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Legenda de Classificação (Item 7 + Prompt 60) */}
      {showLegendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#B8A9D9]" />
                <h3 className="text-base font-bold text-[#4A3F5C]">Legenda de Classificações</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#4A3F5C]">
              {/* Dimensão 1: Valor e Recorrência */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  1. Frequência & Recorrência
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                    <Crown className="h-4 w-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-amber-900 text-xs">Cliente VIP (Coroa)</h4>
                      <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed">
                        Possui 3 ou mais agendamentos concluídos nos últimos 90 dias.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-rose-50/60 border border-rose-200/80">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-rose-900 text-xs">Cliente Inativa (Alerta)</h4>
                      <p className="text-[11px] text-rose-800/90 font-medium leading-relaxed">
                        Último atendimento foi há mais de 60 dias e não possui agendamento futuro.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                    <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] font-bold shrink-0 mt-0.5">
                      —
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-gray-800 text-xs">Cliente Regular</h4>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        Demais clientes com frequência normal de visitas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensão 2: Confiabilidade de Comparecimento (Prompt 60) */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  2. Confiabilidade de Comparecimento (Últimos 6 meses)
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-emerald-900 text-xs">Confiável (Verde)</h4>
                      <p className="text-[11px] text-emerald-800/90 font-medium leading-relaxed">
                        Pelo menos 3 atendimentos no período, excelente taxa de presença e 0 faltas sem aviso.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-amber-900 text-xs">Atenção (Amarelo)</h4>
                      <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed">
                        Histórico com 1 falta sem aviso (no-show) ou cancelamentos recorrentes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-rose-900 text-xs">Risco de Falta (Vermelho)</h4>
                      <p className="text-[11px] text-rose-800/90 font-medium leading-relaxed">
                        2 ou mais faltas sem aviso nos últimos 6 meses ou histórico crítico de cancelamentos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                    <HelpCircle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-gray-700 text-xs">Sem histórico suficiente (Cinza)</h4>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        Menos de 3 atendimentos nos últimos 6 meses — classificação neutra até acumular histórico.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLegendModal(false)}
              className="w-full py-2.5 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#4A3F5C]/90 transition cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Modal de Histórico do Cliente com Filtro de Data e Calendário Personalizado */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#4A3F5C]">{selectedClient.nome}</h3>
                  <p className="text-xs text-gray-500 font-medium">{formatPhoneNumber(selectedClient.telefone) || 'Sem telefone'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Classificação de Confiabilidade do Histórico (Prompt 60) */}
              {selectedReliability && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
                    selectedReliability.tier === 'confiavel'
                      ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                      : selectedReliability.tier === 'atencao'
                      ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                      : selectedReliability.tier === 'risco_falta'
                      ? 'bg-rose-50/70 border-rose-200/80 text-rose-900'
                      : 'bg-gray-50 border-gray-200/80 text-gray-800'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {selectedReliability.tier === 'confiavel' && <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                    {selectedReliability.tier === 'atencao' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    {selectedReliability.tier === 'risco_falta' && <ShieldAlert className="h-5 w-5 text-rose-600" />}
                    {selectedReliability.tier === 'sem_historico' && <HelpCircle className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        Confiabilidade: {selectedReliability.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed opacity-90">
                      {selectedReliability.reason}
                    </p>
                    {selectedReliability.metrics.totalUltimos6Meses > 0 && (
                      <div className="flex items-center gap-3 text-[10px] font-semibold opacity-75 pt-1">
                        <span>{selectedReliability.metrics.concluidos} concluído(s)</span>
                        <span>•</span>
                        <span>{selectedReliability.metrics.noShow} falta(s)</span>
                        <span>•</span>
                        <span>
                          {selectedReliability.metrics.canceladosAntecedencia + selectedReliability.metrics.canceladosUltimaHora} cancelamento(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Botão de Ativação/Desativação do Filtro de Histórico (Foco em UI/UX) */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (showHistoryFilter && (historyStartDate || historyEndDate)) {
                    setHistoryStartDate('')
                    setHistoryEndDate('')
                  }
                  setShowHistoryFilter(!showHistoryFilter)
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  showHistoryFilter || historyStartDate || historyEndDate
                    ? 'bg-purple-100/70 text-[#4A3F5C] border-[#B8A9D9]'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                <Filter className="h-3.5 w-3.5 text-[#B8A9D9]" />
                <span>{showHistoryFilter ? 'Ocultar filtro de data' : 'Filtrar histórico por data'}</span>
                {(historyStartDate || historyEndDate) && (
                  <span className="h-2 w-2 rounded-full bg-purple-600" />
                )}
              </button>

              {(historyStartDate || historyEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryStartDate('')
                    setHistoryEndDate('')
                  }}
                  className="text-[11px] font-bold text-[#8675A9] hover:underline cursor-pointer"
                >
                  Limpar filtro
                </button>
              )}
            </div>

            {/* Painel do Filtro expansível com Calendário Personalizado Lumê */}
            {showHistoryFilter && (
              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-gray-100 text-xs space-y-2.5 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Selecione o intervalo de datas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      De:
                    </span>
                    <CustomDatePicker
                      value={historyStartDate}
                      onChange={setHistoryStartDate}
                      placeholder="Data inicial..."
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Até:
                    </span>
                    <CustomDatePicker
                      value={historyEndDate}
                      onChange={setHistoryEndDate}
                      placeholder="Data final..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#B8A9D9]" />
                <span>
                  Agendamentos ({filteredHistoryBookings.length} de {selectedClient.agendamentos.length})
                </span>
              </h4>

              {filteredHistoryBookings.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4 text-center">
                  Nenhum agendamento encontrado para o filtro selecionado.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredHistoryBookings.map((a) => {
                    const dateFormatted = new Date(a.data_hora_inicio).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })

                    const valorPago =
                      a.valor_cobrado !== null && a.valor_cobrado !== undefined && Number(a.valor_cobrado) > 0
                        ? Number(a.valor_cobrado)
                        : Number(a.servicos?.preco || 0)

                    return (
                      <div
                        key={a.id}
                        onClick={() => setSelectedHistoryBooking(a)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedHistoryBooking(a)
                          }
                        }}
                        className="flex items-center justify-between bg-[#FAF7F5] hover:bg-purple-50/50 p-3.5 rounded-2xl border border-gray-100 text-xs transition cursor-pointer group shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 pr-3 space-y-0.5">
                          <p className="font-bold text-[#4A3F5C] truncate">{a.servicos?.nome || 'Serviço Personalizado'}</p>
                          <span className="text-gray-500 text-[11px] block">
                            {dateFormatted}
                          </span>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2.5">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                a.status === 'concluido'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : a.status === 'confirmado'
                                  ? 'bg-purple-100 text-purple-800'
                                  : a.status === 'no_show'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {a.status === 'concluido'
                                ? 'Concluído'
                                : a.status === 'confirmado'
                                ? 'Confirmado'
                                : a.status === 'no_show'
                                ? 'No-Show'
                                : 'Cancelado'}
                            </span>
                            <p className="font-extrabold text-emerald-700 text-xs mt-0.5">
                              R$ {valorPago.toFixed(2)}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#4A3F5C] transition shrink-0" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              className="w-full py-2.5 rounded-2xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes Completos do Atendimento do Histórico */}
      {selectedHistoryBooking && selectedClient && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Detalhes do Atendimento
                </span>
                <h4 className="text-sm font-bold text-[#4A3F5C] mt-0.5">
                  {selectedHistoryBooking.servicos?.nome || 'Serviço Personalizado'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryBooking(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 py-1 text-xs text-[#4A3F5C]">
              {/* Data e Horário */}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <span className="font-semibold capitalize">
                  {new Date(selectedHistoryBooking.data_hora_inicio).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <span className="font-semibold">
                  {new Date(selectedHistoryBooking.data_hora_inicio).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(selectedHistoryBooking.data_hora_fim).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Cliente */}
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <span className="font-bold">{selectedClient.nome}</span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-1 border-t border-b border-gray-50">
                <span className="text-gray-500">Status do Agendamento:</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedHistoryBooking.status === 'concluido'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedHistoryBooking.status === 'confirmado'
                      ? 'bg-purple-100 text-purple-800'
                      : selectedHistoryBooking.status === 'no_show'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {selectedHistoryBooking.status === 'concluido'
                    ? 'Concluído'
                    : selectedHistoryBooking.status === 'confirmado'
                    ? 'Confirmado'
                    : selectedHistoryBooking.status === 'no_show'
                    ? 'Faltou (No-Show)'
                    : 'Cancelado'}
                </span>
              </div>

              {/* Forma de Pagamento se houver */}
              {selectedHistoryBooking.forma_pagamento && (
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Forma de Pagamento:</span>
                  <span className="font-bold uppercase text-gray-800">
                    {formatPaymentMethod(selectedHistoryBooking.forma_pagamento)}
                  </span>
                </div>
              )}

              {/* Pagamento Recebido */}
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Pagamento:</span>
                <span
                  className={`font-bold text-[11px] ${
                    selectedHistoryBooking.pago !== false
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {selectedHistoryBooking.pago !== false ? 'Recebido' : 'Pendente'}
                </span>
              </div>

              {/* Valor Cobrado / Total */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                  <span className="text-gray-500 font-medium text-xs">Valor Total</span>
                </div>
                <span className="font-extrabold text-emerald-700 text-base">
                  R${' '}
                  {(selectedHistoryBooking.valor_cobrado !== null &&
                  selectedHistoryBooking.valor_cobrado !== undefined &&
                  Number(selectedHistoryBooking.valor_cobrado) > 0
                    ? Number(selectedHistoryBooking.valor_cobrado)
                    : Number(selectedHistoryBooking.servicos?.preco || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedHistoryBooking(null)}
                className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

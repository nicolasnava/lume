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
  Filter,
} from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'
import CustomDatePicker from '@/components/ui/CustomDatePicker'

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
type SortOrder = 'recents' | 'frequency' | 'name' | 'vip'
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
  const [historyStartDate, setHistoryStartDate] = useState<string>('')
  const [historyEndDate, setHistoryEndDate] = useState<string>('')

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
            title="Ver explicação dos ícones VIP e Inativa"
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
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Phone className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span>{client.telefone || 'Sem telefone'}</span>
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

      {/* Modal Legenda de Classificação (Item 7) */}
      {showLegendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#B8A9D9]" />
                <h3 className="text-base font-bold text-[#4A3F5C]">Classificação de Clientes</h3>
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
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <Crown className="h-5 w-5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-amber-900">Cliente VIP (Coroa)</h4>
                  <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed">
                    Possui 3 ou mais agendamentos concluídos nos últimos 90 dias.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/60 border border-rose-200/80">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-rose-900">Cliente Inativa (Alerta)</h4>
                  <p className="text-[11px] text-rose-800/90 font-medium leading-relaxed">
                    Último atendimento foi há mais de 60 dias e não possui agendamento futuro.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
                <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] font-bold shrink-0 mt-0.5">
                  —
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-800">Cliente Regular (Sem ícone)</h4>
                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                    Demais clientes com atendimento dentro da frequência normal.
                  </p>
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
                <p className="text-xs text-gray-500 font-medium">{selectedClient.telefone || 'Sem telefone'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filtro de Histórico com Calendário Personalizado Lumê */}
            <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-gray-100 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#4A3F5C] shrink-0">
                  <Filter className="h-3.5 w-3.5 text-[#B8A9D9]" />
                  <span>Filtrar histórico por data:</span>
                </div>
                {(historyStartDate || historyEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryStartDate('')
                      setHistoryEndDate('')
                    }}
                    className="text-[11px] font-bold text-[#8675A9] hover:underline cursor-pointer shrink-0"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Seletor De / Até com CustomDatePicker Centralizado */}
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
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    const valorPago =
                      a.valor_cobrado !== null && a.valor_cobrado !== undefined && Number(a.valor_cobrado) > 0
                        ? Number(a.valor_cobrado)
                        : Number(a.servicos?.preco || 0)

                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between bg-[#FAF7F5] p-3 rounded-2xl border border-gray-100 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#4A3F5C]">{a.servicos?.nome || 'Serviço Personalizado'}</p>
                          <span className="text-gray-500 text-[11px]">{dateFormatted}</span>
                        </div>

                        <div className="text-right space-y-1">
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
                            {a.status.replace('_', ' ')}
                          </span>
                          <p className="font-bold text-emerald-700 text-[11px]">
                            {a.status === 'concluido' ? 'Pago: ' : 'Valor: '}
                            R$ {valorPago.toFixed(2)}
                          </p>
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
    </div>
  )
}

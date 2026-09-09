'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import BookingDetailModal from '@/components/dashboard/BookingDetailModal'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Ban,
  ArrowUpDown,
  Scissors,
  CheckCircle2,
  Filter,
  User,
  Users,
  Calendar,
  Search,
  X,
  MessageCircle,
  Clock,
  ChevronDown,
  Check,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import PaymentIcon from '@/components/common/PaymentIcon'
import CustomSelect from '@/components/ui/CustomSelect'
import CustomDatePicker from '@/components/ui/CustomDatePicker'

export interface FinancialBookingRow {
  id: string
  profissional_id: string
  cliente_id: string
  servico_id: string | null
  data_hora_inicio: string
  data_hora_fim: string
  status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
  forma_pagamento?: 'dinheiro' | 'pix' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'outro' | null
  valor_cobrado?: number | null
  pago?: boolean | null
  observacao_pagamento?: string | null
  clientes?: {
    nome: string
    telefone: string
  } | null
  servicos?: {
    nome: string
    preco: number
  } | null
  agendamento_servicos?: {
    id: string
    preco_no_momento: number
    duracao_no_momento_minutos: number
    servicos?: {
      id?: string
      nome: string
      preco: number
    } | null
  }[] | null
}

interface FinancialDashboardProps {
  initialBookings: FinancialBookingRow[]
  allServices?: {
    id: string
    nome: string
    preco?: number
    duracao_minutos?: number
    foto_url?: string | null
  }[]
  allClients?: { id: string; nome: string }[]
}

type PeriodFilter = 'hoje' | 'esta_semana' | 'este_mes' | 'mes_anterior' | 'custom'
type SortOption = 'date_desc' | 'date_asc' | 'value_desc' | 'value_asc'

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  cartao_credito: 'Cartão',
  cartao_debito: 'Cartão',
  outro: 'Outro',
}

const PAYMENT_COLORS: Record<string, string> = {
  pix: '#10B981', // Emerald
  dinheiro: '#F59E0B', // Amber
  cartao: '#B8A9D9', // Lumê Lilás
  cartao_credito: '#B8A9D9',
  cartao_debito: '#B8A9D9',
  outro: '#4A3F5C', // Lumê Roxo
}

const getBookingValue = (b: FinancialBookingRow): number => {
  if (b.valor_cobrado !== null && b.valor_cobrado !== undefined && Number(b.valor_cobrado) > 0) {
    return Number(b.valor_cobrado)
  }
  if (b.servicos?.preco !== null && b.servicos?.preco !== undefined && Number(b.servicos.preco) > 0) {
    return Number(b.servicos.preco)
  }
  return Number(b.valor_cobrado || 0)
}

export default function FinancialDashboard({
  initialBookings,
  allServices = [],
  allClients = [],
}: FinancialDashboardProps) {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodFilter>('este_mes')
  const [sortOption, setSortOption] = useState<SortOption>('date_desc')

  // Filtros customizados de data
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Item 4: Filtros combináveis por Serviço, Cliente e Forma de Pagamento (Dados reais dinâmicos)
  const [selectedServicoId, setSelectedServicoId] = useState<string>('todos')
  const [selectedClienteId, setSelectedClienteId] = useState<string>('todos')
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<string>('todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<FinancialBookingRow | null>(null)

  // Estado do dropdown rico de serviços
  const [isServiceFilterOpen, setIsServiceFilterOpen] = useState(false)
  const serviceFilterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (serviceFilterRef.current && !serviceFilterRef.current.contains(e.target as Node)) {
        setIsServiceFilterOpen(false)
      }
    }
    if (isServiceFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isServiceFilterOpen])

  // Obter lista única de serviços e clientes reais vindos dos agendamentos + cadastrados (Item 4)
  const servicesList = useMemo(() => {
    const map = new Map<
      string,
      { id: string; nome: string; preco?: number; duracao_minutos?: number; foto_url?: string | null }
    >()
    allServices.forEach((s) => map.set(s.id, s))
    initialBookings.forEach((b) => {
      if (b.servico_id && b.servicos?.nome && !map.has(b.servico_id)) {
        map.set(b.servico_id, {
          id: b.servico_id,
          nome: b.servicos.nome,
          preco: b.servicos.preco,
          duracao_minutos: undefined,
          foto_url: null,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [allServices, initialBookings])

  const currentSelectedService = useMemo(() => {
    if (selectedServicoId === 'todos') return null
    return servicesList.find((s) => s.id === selectedServicoId) || null
  }, [selectedServicoId, servicesList])

  const clientsList = useMemo(() => {
    const map = new Map<string, string>()
    allClients.forEach((c) => map.set(c.id, c.nome))
    initialBookings.forEach((b) => {
      if (b.cliente_id && b.clientes?.nome) {
        map.set(b.cliente_id, b.clientes.nome)
      }
    })
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allClients, initialBookings])

  // 1. Filtragem Combinada Única (Período + Serviço + Cliente + Forma de Pagamento)
  const filteredBookings = useMemo(() => {
    const now = new Date()

    return initialBookings.filter((b) => {
      const bDate = new Date(b.data_hora_inicio)

      // Filtro de Período
      let periodMatch = true
      if (period === 'hoje') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        periodMatch = bDate >= startOfToday && bDate <= endOfToday
      } else if (period === 'esta_semana') {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        periodMatch = bDate >= startOfWeek && bDate <= endOfWeek
      } else if (period === 'este_mes') {
        periodMatch = bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear()
      } else if (period === 'mes_anterior') {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        periodMatch = bDate.getMonth() === prevMonth.getMonth() && bDate.getFullYear() === prevMonth.getFullYear()
      } else if (period === 'custom') {
        if (customStart || customEnd) {
          const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0)
          const end = customEnd ? new Date(`${customEnd}T23:59:59`) : new Date(8640000000000000)
          periodMatch = bDate >= start && bDate <= end
        }
      }

      if (!periodMatch) return false

      // Filtro por Serviço Específico
      if (selectedServicoId !== 'todos' && b.servico_id !== selectedServicoId) {
        return false
      }

      // Filtro por Cliente Específica
      if (selectedClienteId !== 'todos' && b.cliente_id !== selectedClienteId) {
        return false
      }

      // Filtro por Forma de Pagamento
      if (selectedFormaPagamento !== 'todas') {
        const normPay =
          b.forma_pagamento === 'cartao_credito' || b.forma_pagamento === 'cartao_debito'
            ? 'cartao'
            : b.forma_pagamento
        if (normPay !== selectedFormaPagamento) return false
      }

      return true
    })
  }, [
    initialBookings,
    period,
    customStart,
    customEnd,
    selectedServicoId,
    selectedClienteId,
    selectedFormaPagamento,
  ])

  // 2. Separação por Status (Todos os concluídos entram no cálculo financeiro)
  const completedBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.status === 'concluido')
  }, [filteredBookings])

  const noShowBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.status === 'no_show')
  }, [filteredBookings])

  // 3. Cálculos de Faturamento
  const totalFaturado = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + getBookingValue(b), 0)
  }, [completedBookings])

  const valorPerdidoNoShow = useMemo(() => {
    return noShowBookings.reduce((sum, b) => sum + getBookingValue(b), 0)
  }, [noShowBookings])

  // 4. Dados para Gráfico de Formas de Pagamento
  const chartPaymentData = useMemo(() => {
    const totals: Record<string, number> = {
      pix: 0,
      cartao: 0,
      dinheiro: 0,
      outro: 0,
    }

    completedBookings.forEach((b) => {
      const pay = b.forma_pagamento || 'outro'
      const normPay = pay === 'cartao_credito' || pay === 'cartao_debito' ? 'cartao' : pay
      const val = getBookingValue(b)

      if (totals[normPay] !== undefined) {
        totals[normPay] += val
      } else {
        totals.outro += val
      }
    })

    return Object.entries(totals)
      .map(([key, val]) => ({
        key,
        name: PAYMENT_LABELS[key] || 'Outro',
        value: val,
        color: PAYMENT_COLORS[key] || PAYMENT_COLORS.outro,
      }))
      .filter((d) => d.value > 0)
  }, [completedBookings])

  // 5. Item 5: Card 1 - Ranking dos Serviços Mais Vendidos
  const topServices = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {}

    completedBookings.forEach((b) => {
      const serviceName = b.servicos?.nome || 'Serviço Personalizado'
      const val = getBookingValue(b)

      if (!map[serviceName]) {
        map[serviceName] = { name: serviceName, total: 0, count: 0 }
      }
      map[serviceName].total += val
      map[serviceName].count += 1
    })

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [completedBookings])

  // 6. Item 5: Card 2 - Ranking dos Top Clientes no Período
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {}

    completedBookings.forEach((b) => {
      const clientName = b.clientes?.nome || 'Cliente sem nome'
      const val = getBookingValue(b)

      if (!map[clientName]) {
        map[clientName] = { name: clientName, total: 0, count: 0 }
      }
      map[clientName].total += val
      map[clientName].count += 1
    })

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [completedBookings])

  // 7. Ordenação e Busca da Tabela Detalhada (Nome, Serviço ou Data)
  const sortedCompletedBookings = useMemo(() => {
    let list = [...completedBookings]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((b) => {
        const clienteMatch = b.clientes?.nome?.toLowerCase().includes(q)
        const servicoMatch = b.servicos?.nome?.toLowerCase().includes(q)
        const dateFormatted = new Date(b.data_hora_inicio).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        return clienteMatch || servicoMatch || dateFormatted.includes(q)
      })
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.data_hora_inicio).getTime()
      const dateB = new Date(b.data_hora_inicio).getTime()

      const valA = getBookingValue(a)
      const valB = getBookingValue(b)

      if (sortOption === 'date_desc') return dateB - dateA
      if (sortOption === 'date_asc') return dateA - dateB
      if (sortOption === 'value_desc') return valB - valA
      if (sortOption === 'value_asc') return valA - valB
      return 0
    })
  }, [completedBookings, sortOption, searchQuery])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho do Dashboard Financeiro */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#4A3F5C]">
          Painel Financeiro
        </h1>
        <p className="text-xs sm:text-sm text-[#4A3F5C]/70 mt-1">
          Acompanhe o faturamento real, métricas de atendimentos e métodos de pagamento
        </p>
      </div>

      {/* Item 4: CARD ÚNICO DE FILTROS CONSOLIDADOS (Período + Serviço + Cliente + Forma de Pagamento) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4A3F5C] uppercase tracking-wider">
            <Filter className="h-4 w-4 text-[#B8A9D9]" />
            <span>Filtros</span>
          </div>

          {(selectedServicoId !== 'todos' ||
            selectedClienteId !== 'todos' ||
            selectedFormaPagamento !== 'todas' ||
            period !== 'hoje') && (
            <button
              type="button"
              onClick={() => {
                setPeriod('hoje')
                setSelectedServicoId('todos')
                setSelectedClienteId('todos')
                setSelectedFormaPagamento('todas')
              }}
              className="text-xs font-bold text-[#8675A9] hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Dropdowns Combináveis Padronizados Lumê (Período, Serviço, Cliente, Forma de Pagamento) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          {/* Filtro por Período (Item 3) */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Período</span>
            </label>
            <CustomSelect
              options={[
                { value: 'hoje', label: 'Hoje' },
                { value: 'esta_semana', label: 'Esta Semana' },
                { value: 'este_mes', label: 'Este Mês' },
                { value: 'mes_anterior', label: 'Mês Anterior' },
                { value: 'custom', label: 'Customizado' },
              ]}
              value={period}
              onChange={(val) => setPeriod(val as PeriodFilter)}
              size="sm"
              buttonClassName="font-semibold"
            />
          </div>

          {/* Filtro por Serviço com Foto à Esquerda e Detalhes */}
          <div className="space-y-1 relative" ref={serviceFilterRef}>
            <label className="block font-semibold text-gray-700 flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Serviço</span>
            </label>

            <button
              type="button"
              onClick={() => setIsServiceFilterOpen(!isServiceFilterOpen)}
              className={`w-full flex items-center justify-between gap-2 border font-semibold transition duration-150 rounded-xl min-h-[36px] px-3 py-1.5 text-xs bg-[#FAF8F5] border-gray-200 text-[#4A3F5C] hover:border-[#B8A9D9] cursor-pointer ${
                isServiceFilterOpen ? 'border-[#B8A9D9] ring-2 ring-[#B8A9D9]/20' : ''
              }`}
            >
              <div className="flex items-center gap-2 truncate text-left flex-1 min-w-0">
                {currentSelectedService ? (
                  <>
                    <div className="relative h-5 w-5 rounded-md bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {currentSelectedService.foto_url ? (
                        <Image
                          src={currentSelectedService.foto_url}
                          alt={currentSelectedService.nome}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Scissors className="h-3 w-3 text-[#8675A9]" />
                      )}
                    </div>
                    <span className="truncate font-bold text-[#4A3F5C]">
                      {currentSelectedService.nome}
                    </span>
                  </>
                ) : (
                  <span className="truncate font-semibold text-[#4A3F5C]">
                    Todos os Serviços
                  </span>
                )}
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 opacity-60 ${
                  isServiceFilterOpen ? 'rotate-180 opacity-100 text-[#8675A9]' : ''
                }`}
              />
            </button>

            {/* Dropdown com foto na esquerda, infos na direita */}
            {isServiceFilterOpen && (
              <div className="absolute left-0 min-w-full w-[290px] sm:w-[320px] top-full mt-1.5 z-[100] max-h-72 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 space-y-1 shadow-2xl animate-in fade-in slide-in-from-top-1">
                {/* Opção Todos os Serviços */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServicoId('todos')
                    setIsServiceFilterOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                    selectedServicoId === 'todos'
                      ? 'bg-purple-50/80 border border-[#B8A9D9] font-bold text-[#4A3F5C]'
                      : 'hover:bg-[#FAF8F5] text-[#4A3F5C]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#B8A9D9]/20 flex items-center justify-center text-[#4A3F5C] shrink-0">
                      <Scissors className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#4A3F5C]">Todos os Serviços</p>
                      <p className="text-[10px] text-gray-400 font-medium">Ver agendamentos de todos</p>
                    </div>
                  </div>
                  {selectedServicoId === 'todos' && (
                    <Check className="h-4 w-4 text-[#8675A9] shrink-0" />
                  )}
                </button>

                <div className="border-t border-gray-100 my-1" />

                {/* Lista de serviços com foto na esquerda */}
                {servicesList.map((s) => {
                  const isSelected = selectedServicoId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedServicoId(s.id)
                        setIsServiceFilterOpen(false)
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50/80 border border-[#B8A9D9]'
                          : 'hover:bg-[#FAF8F5] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Foto à Esquerda */}
                        <div className="relative h-10 w-10 rounded-xl bg-gray-100 border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                          {s.foto_url ? (
                            <Image
                              src={s.foto_url}
                              alt={s.nome}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Scissors className="h-4 w-4 text-[#8675A9]" />
                          )}
                        </div>

                        {/* Nome, Preço e Duração à Direita */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#4A3F5C]' : 'text-gray-800'}`}>
                            {s.nome}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 font-medium">
                            {s.preco !== undefined && s.preco !== null && (
                              <span className="text-emerald-700 font-bold">
                                R$ {Number(s.preco).toFixed(2)}
                              </span>
                            )}
                            {s.duracao_minutos ? (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  {s.duracao_minutos} min
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 text-[#8675A9] shrink-0 ml-1" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filtro por Cliente */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Cliente</span>
            </label>
            <CustomSelect
              options={[
                { value: 'todos', label: 'Todas as Clientes' },
                ...clientsList.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={selectedClienteId}
              onChange={setSelectedClienteId}
              size="sm"
              buttonClassName="font-semibold"
              searchable={true}
              searchPlaceholder="Buscar cliente..."
            />
          </div>

          {/* Filtro por Forma de Pagamento */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-700 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Forma de Pagamento</span>
            </label>
            <CustomSelect
              options={[
                { value: 'todas', label: 'Todas as Formas' },
                { value: 'pix', label: 'Pix' },
                { value: 'cartao', label: 'Cartão' },
                { value: 'dinheiro', label: 'Dinheiro' },
                { value: 'outro', label: 'Outro' },
              ]}
              value={selectedFormaPagamento}
              onChange={setSelectedFormaPagamento}
              size="sm"
              buttonClassName="font-semibold"
            />
          </div>
        </div>

        {/* Intervalo Customizado no mesmo horizonte */}
        {period === 'custom' && (
          <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3 pt-2 border-t border-gray-100 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs shrink-0 flex-1 min-w-[130px] sm:min-w-[160px]">
              <span className="text-gray-500 font-semibold shrink-0">De:</span>
              <CustomDatePicker
                value={customStart}
                onChange={setCustomStart}
                placeholder="Data inicial"
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs shrink-0 flex-1 min-w-[130px] sm:min-w-[160px]">
              <span className="text-gray-500 font-semibold shrink-0">Até:</span>
              <CustomDatePicker
                value={customEnd}
                onChange={setCustomEnd}
                placeholder="Data final"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1: Total Faturado */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Faturado</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#4A3F5C]">
            R$ {totalFaturado.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            {completedBookings.length} {completedBookings.length === 1 ? 'atendimento concluído' : 'atendimentos concluídos'}
          </p>
        </div>

        {/* Metric 2: Ticket Médio */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Ticket Médio</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#4A3F5C]">
            R${' '}
            {completedBookings.length > 0
              ? (totalFaturado / completedBookings.length).toFixed(2)
              : '0.00'}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Média recebida por atendimento</p>
        </div>

        {/* Metric 3: Perdas por No-Show */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Perdido em Faltas (No-Show)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Ban className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            R$ {valorPerdidoNoShow.toFixed(2)}
          </div>
          <p className="text-[11px] text-rose-500 font-medium">
            {noShowBookings.length} {noShowBookings.length === 1 ? 'falta registrada' : 'faltas registradas'}
          </p>
        </div>
      </div>

      {/* Item 5: CARDS DE DETALHAMENTO REORDENADOS (Serviços → Clientes → Formas de Pagamento) SEM FILTROS INDIVIDUAIS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1: Serviços Mais Vendidos */}
        <div className="rounded-3xl bg-white p-6 shadow-xs border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-[#4A3F5C] flex items-center gap-2">
            <Scissors className="h-4 w-4 text-[#B8A9D9]" />
            <span>Serviços Mais Vendidos</span>
          </h3>

          {topServices.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-xs text-gray-400 font-medium">
              Nenhum serviço faturado no período.
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((item, idx) => {
                const percent = totalFaturado > 0 ? (item.total / totalFaturado) * 100 : 0

                return (
                  <div key={item.name} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-[#4A3F5C]">
                      <span className="truncate max-w-[160px]">
                        {idx + 1}. {item.name} ({item.count}x)
                      </span>
                      <span className="font-bold text-emerald-700">R$ {item.total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#B8A9D9] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Card 2: Principais Clientes no Período */}
        <div className="rounded-3xl bg-white p-6 shadow-xs border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-[#4A3F5C] flex items-center gap-2">
            <Users className="h-4 w-4 text-[#B8A9D9]" />
            <span>Principais Clientes</span>
          </h3>

          {topClients.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-xs text-gray-400 font-medium">
              Nenhum atendimento no período.
            </div>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, idx) => {
                const percent = totalFaturado > 0 ? (client.total / totalFaturado) * 100 : 0

                return (
                  <div key={client.name} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-[#4A3F5C]">
                      <span className="truncate max-w-[160px]">
                        {idx + 1}. {client.name} ({client.count}x)
                      </span>
                      <span className="font-bold text-emerald-700">R$ {client.total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-purple-300 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Card 3: Recebimento por Forma de Pagamento */}
        <div className="rounded-3xl bg-white p-6 shadow-xs border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-[#4A3F5C] flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#B8A9D9]" />
            <span>Formas de Pagamento</span>
          </h3>

          {chartPaymentData.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-xs text-gray-400 font-medium">
              Nenhum recebimento no período.
            </div>
          ) : (
            <div className="h-52 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPaymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Faturado']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#E5E7EB' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartPaymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Detalhamento dos Atendimentos com Busca, Padronização e Modal de Detalhes */}
      <div className="rounded-3xl bg-white p-6 shadow-xs border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Detalhamento dos Atendimentos</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {sortedCompletedBookings.length} {sortedCompletedBookings.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Campo de Busca com Lupa por Nome, Serviço ou Data */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-[#4A3F5C] placeholder:text-gray-400 focus:outline-none focus:border-[#B8A9D9] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Ordenação da Tabela */}
            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 shrink-0 hidden sm:inline" />
              <div className="w-full sm:w-44">
                <CustomSelect
                  options={[
                    { value: 'date_desc', label: 'Data (Mais recente)' },
                    { value: 'date_asc', label: 'Data (Mais antiga)' },
                    { value: 'value_desc', label: 'Valor (Maior)' },
                    { value: 'value_asc', label: 'Valor (Menor)' },
                  ]}
                  value={sortOption}
                  onChange={(val) => setSortOption(val as SortOption)}
                  size="sm"
                  buttonClassName="font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {sortedCompletedBookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 font-medium">
            Nenhum atendimento concluído encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Data/Hora</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Serviço</th>
                  <th className="py-3 px-3 text-center">Pagamento</th>
                  <th className="py-3 px-3 text-right">Valor Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#4A3F5C]">
                {sortedCompletedBookings.map((b) => {
                  const valor = getBookingValue(b)

                  const dateFormatted = new Date(b.data_hora_inicio).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  const payMethod = b.forma_pagamento || 'outro'

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBookingForDetail(b)}
                      className="hover:bg-purple-50/50 transition cursor-pointer group"
                      title="Clique para ver os detalhes completos deste atendimento"
                    >
                      <td className="py-3.5 px-3 font-medium text-gray-600 whitespace-nowrap">{dateFormatted}</td>
                      <td className="py-3.5 px-3 font-semibold">
                        <span className="truncate max-w-[150px] block group-hover:text-purple-900 transition">
                          {b.clientes?.nome || 'Cliente'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-gray-600">
                        <span className="truncate max-w-[180px] block" title={
                          b.agendamento_servicos && b.agendamento_servicos.length > 0
                            ? b.agendamento_servicos.map((as) => as.servicos?.nome).filter(Boolean).join(' + ')
                            : (b.servicos?.nome || 'Personalizado')
                        }>
                          {b.agendamento_servicos && b.agendamento_servicos.length > 0
                            ? b.agendamento_servicos.map((as) => as.servicos?.nome).filter(Boolean).join(' + ')
                            : (b.servicos?.nome || 'Personalizado')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 font-semibold text-gray-700 border border-gray-200 w-28 text-center shrink-0">
                          <PaymentIcon method={payMethod} className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{PAYMENT_LABELS[payMethod] || 'Outro'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        R$ {valor.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhamento do Atendimento (Mesmo padrão da Agenda) */}
      {selectedBookingForDetail && (
        <BookingDetailModal
          booking={{
            id: selectedBookingForDetail.id,
            profissional_id: selectedBookingForDetail.profissional_id,
            cliente_id: selectedBookingForDetail.cliente_id,
            servico_id: selectedBookingForDetail.servico_id,
            data_hora_inicio: selectedBookingForDetail.data_hora_inicio,
            data_hora_fim: selectedBookingForDetail.data_hora_fim,
            status: selectedBookingForDetail.status,
            google_event_id: null,
            forma_pagamento: selectedBookingForDetail.forma_pagamento,
            valor_cobrado: selectedBookingForDetail.valor_cobrado,
            pago: selectedBookingForDetail.pago,
            observacao_pagamento: selectedBookingForDetail.observacao_pagamento,
            clientes: selectedBookingForDetail.clientes,
            servicos: selectedBookingForDetail.servicos
              ? {
                  nome: selectedBookingForDetail.servicos.nome,
                  duracao_minutos: 60,
                  preco: selectedBookingForDetail.servicos.preco,
                }
              : null,
            agendamento_servicos: selectedBookingForDetail.agendamento_servicos as any,
          }}
          onClose={() => setSelectedBookingForDetail(null)}
          onRefresh={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

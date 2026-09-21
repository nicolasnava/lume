'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Download,
  CreditCard,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ticket,
  Plus,
  Trash2,
  Loader2,
  Tag,
  Smartphone,
  Barcode,
  Phone,
  MessageSquare,
  ChevronDown,
  X,
} from 'lucide-react'
import { PixIcon } from '@/components/common/PaymentIcon'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  saveSaaSCoupon,
  deleteSaaSCoupon,
  updateSaaSPlanPrice,
} from '@/app/actions/adminSaasFinance'
import { exportFinanceiroCSV } from '@/app/actions/adminPrompt34'

interface AdminFinanceiroClientProps {
  initialPlansAndCoupons?: {
    planos: Array<{
      id: string
      nome: string
      slug: string
      preco: number
      intervalo: string
      descricao?: string | null
    }>
    cupons: Array<{
      id: string
      codigo: string
      desconto_pct?: number | null
      desconto_valor?: number | null
      dias_trial_extra?: number | null
      limite_usos?: number | null
      usado_count?: number | null
      ativo?: boolean
      created_at: string
    }>
  }
}

export default function AdminFinanceiroClient({ initialPlansAndCoupons }: AdminFinanceiroClientProps) {
  const searchParams = useSearchParams()
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [plansAndCoupons, setPlansAndCoupons] = useState(initialPlansAndCoupons || { planos: [], cupons: [] })
  const [isPending, startTransition] = useTransition()
  const [isExporting, setIsExporting] = useState(false)

  // Rolagem suave e foco caso o menu selecione Inadimplência ou Cupons
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'recusas') {
      const el = document.getElementById('recusas')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (view === 'cupons') {
      const el = document.getElementById('cupons')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [searchParams])

  // Estados para criação de cupom
  const [couponCode, setCouponCode] = useState('')
  const [couponPct, setCouponPct] = useState<number | ''>('')
  const [couponTrialDays, setCouponTrialDays] = useState<number | ''>('')
  const [couponLimit, setCouponLimit] = useState<number | ''>('')
  const [isSavingCoupon, setIsSavingCoupon] = useState(false)
  const [showAllRecusas, setShowAllRecusas] = useState(false)
  const [showAllTransacoes, setShowAllTransacoes] = useState(false)

  // Estado para preço do plano solo
  const planoSolo = plansAndCoupons.planos.find((p) => p.slug === 'mensal')
  const [planPrice, setPlanPrice] = useState<number>(planoSolo?.preco ?? 69.90)
  const [isSavingPlanPrice, setIsSavingPlanPrice] = useState(false)

  // Estados para histórico expandido dos KPIs e filtros de gráficos
  const [expandedKpi, setExpandedKpi] = useState<'mrr' | 'inadimplencia' | 'faturas' | 'aprovacao' | null>(null)
  const [showMrrFilter, setShowMrrFilter] = useState(false)
  const [mrrFilter, setMrrFilter] = useState<'todos' | 'solo' | 'estudios' | 'anual'>('todos')
  const [showPaymentFilter, setShowPaymentFilter] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState<'todas' | 'recorrente' | 'anual'>('todas')

  const kpiHistoryData = {
    mrr: {
      title: 'Receita Recorrente Mensal (MRR)',
      subtitle: 'Evolução dos contratos recorrentes ativos nos últimos 6 meses',
      color: '#B8A9D9',
      history: [
        { mes: 'Abr/26', valor: 'R$ 94.280', delta: '+11,4%', sub: '1.340 assinantes' },
        { mes: 'Mai/26', valor: 'R$ 105.700', delta: '+12,1%', sub: '1.510 assinantes' },
        { mes: 'Jun/26', valor: 'R$ 118.560', delta: '+12,2%', sub: '1.690 assinantes' },
        { mes: 'Jul/26', valor: 'R$ 125.700', delta: '+6,0%', sub: '1.790 assinantes' },
        { mes: 'Ago/26', valor: 'R$ 134.280', delta: '+6,8%', sub: '1.920 assinantes' },
        { mes: 'Set/26', valor: 'R$ 142.850', delta: '+6,4%', sub: '2.040 assinantes' },
      ],
    },
    inadimplencia: {
      title: 'Taxa de Inadimplência Líquida',
      subtitle: 'Percentual de faturas vencidas não recuperadas pós-ciclos Asaas (Meta < 3,0%)',
      color: '#F5B84B',
      history: [
        { mes: 'Abr/26', valor: '2,1%', delta: '-0,3%', sub: 'Perdas: 0,4%' },
        { mes: 'Mai/26', valor: '1,9%', delta: '-0,2%', sub: 'Perdas: 0,3%' },
        { mes: 'Jun/26', valor: '1,8%', delta: '-0,1%', sub: 'Perdas: 0,3%' },
        { mes: 'Jul/26', valor: '1,6%', delta: '-0,2%', sub: 'Perdas: 0,2%' },
        { mes: 'Ago/26', valor: '1,5%', delta: '-0,1%', sub: 'Perdas: 0,2%' },
        { mes: 'Set/26', valor: '1,4%', delta: '-0,1%', sub: 'Perdas: 0,2%' },
      ],
    },
    faturas: {
      title: 'Faturas Pendentes & Em Retentativa',
      subtitle: 'Cobranças aguardando compensação ou repassadas aos robôs de retentativa',
      color: '#F87171',
      history: [
        { mes: 'Abr/26', valor: '34 faturas', delta: '-12%', sub: 'R$ 2.450,00' },
        { mes: 'Mai/26', valor: '29 faturas', delta: '-15%', sub: 'R$ 2.110,00' },
        { mes: 'Jun/26', valor: '26 faturas', delta: '-10%', sub: 'R$ 1.890,00' },
        { mes: 'Jul/26', valor: '22 faturas', delta: '-15%', sub: 'R$ 1.540,00' },
        { mes: 'Ago/26', valor: '20 faturas', delta: '-9%', sub: 'R$ 1.390,00' },
        { mes: 'Set/26', valor: '18 faturas', delta: '-10%', sub: 'R$ 1.258,20' },
      ],
    },
    aprovacao: {
      title: 'Taxa de Aprovação do Gateway Asaas',
      subtitle: 'Conversão média de transações liquidadas sem atrito em 1ª ou 2ª tentativa',
      color: '#34D399',
      history: [
        { mes: 'Abr/26', valor: '93,2%', delta: '+0,8%', sub: 'Pix: 98,1% · Cartão: 91,4%' },
        { mes: 'Mai/26', valor: '94,1%', delta: '+0,9%', sub: 'Pix: 98,6% · Cartão: 92,2%' },
        { mes: 'Jun/26', valor: '95,0%', delta: '+0,9%', sub: 'Pix: 99,0% · Cartão: 93,1%' },
        { mes: 'Jul/26', valor: '95,8%', delta: '+0,8%', sub: 'Pix: 99,1% · Cartão: 93,9%' },
        { mes: 'Ago/26', valor: '96,2%', delta: '+0,4%', sub: 'Pix: 99,2% · Cartão: 94,3%' },
        { mes: 'Set/26', valor: '96,8%', delta: '+0,6%', sub: 'Pix: 99,4% · Cartão: 94,8%' },
      ],
    },
  }

  const mrrEvolutionDatasets = {
    todos: [
      { mes: 'Abr/26', mrr: 94280, liquidado: 89400, faturas: 1340 },
      { mes: 'Mai/26', mrr: 105700, liquidado: 101200, faturas: 1510 },
      { mes: 'Jun/26', mrr: 118560, liquidado: 114300, faturas: 1690 },
      { mes: 'Jul/26', mrr: 125700, liquidado: 121800, faturas: 1790 },
      { mes: 'Ago/26', mrr: 134280, liquidado: 130500, faturas: 1920 },
      { mes: 'Set/26', mrr: 142850, liquidado: 139100, faturas: 2040 },
    ],
    solo: [
      { mes: 'Abr/26', mrr: 65200, liquidado: 62100, faturas: 930 },
      { mes: 'Mai/26', mrr: 72800, liquidado: 69900, faturas: 1040 },
      { mes: 'Jun/26', mrr: 81400, liquidado: 78600, faturas: 1165 },
      { mes: 'Jul/26', mrr: 86500, liquidado: 83900, faturas: 1240 },
      { mes: 'Ago/26', mrr: 92400, liquidado: 89800, faturas: 1320 },
      { mes: 'Set/26', mrr: 98420, liquidado: 96200, faturas: 1410 },
    ],
    estudios: [
      { mes: 'Abr/26', mrr: 20100, liquidado: 18900, faturas: 120 },
      { mes: 'Mai/26', mrr: 22800, liquidado: 21800, faturas: 135 },
      { mes: 'Jun/26', mrr: 25600, liquidado: 24700, faturas: 151 },
      { mes: 'Jul/26', mrr: 27100, liquidado: 26200, faturas: 160 },
      { mes: 'Ago/26', mrr: 28800, liquidado: 27900, faturas: 170 },
      { mes: 'Set/26', mrr: 30145, liquidado: 29200, faturas: 180 },
    ],
    anual: [
      { mes: 'Abr/26', mrr: 8980, liquidado: 8400, faturas: 290 },
      { mes: 'Mai/26', mrr: 10100, liquidado: 9500, faturas: 335 },
      { mes: 'Jun/26', mrr: 11560, liquidado: 11000, faturas: 374 },
      { mes: 'Jul/26', mrr: 12100, liquidado: 11700, faturas: 390 },
      { mes: 'Ago/26', mrr: 13080, liquidado: 12800, faturas: 430 },
      { mes: 'Set/26', mrr: 14285, liquidado: 13700, faturas: 450 },
    ],
  }

  const activeMrrData = mrrEvolutionDatasets[mrrFilter]

  const paymentMethodDatasets = {
    todas: {
      totalPagantes: '2.040',
      methods: [
        {
          id: 'card',
          name: 'Cartão de crédito',
          short: 'Cartão',
          count: '1.387 assinaturas',
          valor: 'R$ 97.138',
          pct: 68,
          color: '#B8A9D9',
          iconType: 'card',
        },
        {
          id: 'pix',
          name: 'Pix mensal',
          short: 'Pix Mensal',
          count: '448 assinaturas',
          valor: 'R$ 31.427',
          pct: 22,
          color: '#34D399',
          iconType: 'pix',
        },
        {
          id: 'anual',
          name: 'Planos anuais',
          short: 'Anual',
          count: '205 assinaturas',
          valor: 'R$ 14.285',
          pct: 10,
          color: '#38BDF8',
          iconType: 'anual',
        },
      ],
    },
    recorrente: {
      totalPagantes: '1.835',
      methods: [
        {
          id: 'card',
          name: 'Cartão recorrente',
          short: 'Cartão Recorrente',
          count: '1.387 assinaturas',
          valor: 'R$ 97.138',
          pct: 76,
          color: '#B8A9D9',
          iconType: 'card',
        },
        {
          id: 'pix',
          name: 'Pix mensal recorrente',
          short: 'Pix Recorrente',
          count: '448 assinaturas',
          valor: 'R$ 31.427',
          pct: 24,
          color: '#34D399',
          iconType: 'pix',
        },
      ],
    },
    anual: {
      totalPagantes: '205',
      methods: [
        {
          id: 'card',
          name: 'Cartão parcelado 12x',
          short: 'Cartão Anual',
          count: '123 assinaturas',
          valor: 'R$ 8.571',
          pct: 60,
          color: '#B8A9D9',
          iconType: 'card',
        },
        {
          id: 'pix',
          name: 'Pix anual à vista',
          short: 'Pix Anual',
          count: '82 assinaturas',
          valor: 'R$ 5.714',
          pct: 40,
          color: '#34D399',
          iconType: 'pix',
        },
      ],
    },
  }

  const activePaymentData = paymentMethodDatasets[paymentFilter]

  const reenviosPendentes = [
    {
      id: 'fat_01',
      cliente: 'Studio Glow & Co',
      plano: 'Estúdios (R$ 169,00)',
      motivo: 'Cartão final 4821 recusado · Saldo insuficiente',
      data: 'Hoje às 09:14',
    },
    {
      id: 'fat_02',
      cliente: 'Camila Rossi',
      plano: 'Solo (R$ 69,90)',
      motivo: 'Cartão final 9012 recusado · Bloqueio temporário do banco',
      data: 'Ontem às 18:30',
    },
    {
      id: 'fat_03',
      cliente: 'Larissa Duarte',
      plano: 'Solo (R$ 69,90)',
      motivo: 'Cartão expirado · Validade 02/25',
      data: 'Há 2 dias',
    },
    {
      id: 'fat_04',
      cliente: 'Mariana Lima Nail',
      plano: 'Solo (R$ 69,90)',
      motivo: 'Cartão final 3310 recusado · Não autorizado',
      data: 'Há 3 dias',
    },
    {
      id: 'fat_05',
      cliente: 'Clínica Bella Face',
      plano: 'Estúdios (R$ 169,00)',
      motivo: 'Chave Pix expirada · Não compensada em 24h',
      data: 'Há 4 dias',
    },
  ]

  const transacoesRecentes = [
    {
      id: 'pay_982181',
      profissional: 'Beatriz Mendes',
      valor: 'R$ 69,90',
      metodo: 'Cartão de crédito',
      data: 'Hoje às 11:20',
      status: 'Confirmada',
      statusColor: 'text-[#34D399]',
    },
    {
      id: 'pay_982180',
      profissional: 'Isabella Fontana',
      valor: 'R$ 694,80',
      metodo: 'Pix Anual Solo',
      data: 'Hoje às 10:45',
      status: 'Confirmada',
      statusColor: 'text-[#34D399]',
    },
    {
      id: 'pay_982179',
      profissional: 'Studio Bellas',
      valor: 'R$ 169,00',
      metodo: 'Cartão de crédito',
      data: 'Hoje às 09:30',
      status: 'Confirmada',
      statusColor: 'text-[#34D399]',
    },
    {
      id: 'pay_982178',
      profissional: 'Studio Glow & Co',
      valor: 'R$ 169,00',
      metodo: 'Cartão final 4821',
      data: 'Hoje às 09:14',
      status: 'Falha de pagamento',
      statusColor: 'text-[#F87171]',
    },
    {
      id: 'pay_982177',
      profissional: 'Mariana Silveira',
      valor: 'R$ 69,90',
      metodo: 'Boleto bancário',
      data: 'Ontem às 16:10',
      status: 'Aguardando compensação',
      statusColor: 'text-[#F5B84B]',
    },
    {
      id: 'pay_982176',
      profissional: 'Fernanda Alves',
      valor: 'R$ 69,90',
      metodo: 'Pix Mensal',
      data: 'Ontem às 14:05',
      status: 'Confirmada',
      statusColor: 'text-[#34D399]',
    },
    {
      id: 'pay_982175',
      profissional: 'Studio Mulher & Arte',
      valor: 'R$ 169,00',
      metodo: 'Cartão de crédito',
      data: 'Há 2 dias',
      status: 'Confirmada',
      statusColor: 'text-[#34D399]',
    },
    {
      id: 'pay_982174',
      profissional: 'Juliana Costa Lash',
      valor: 'R$ 69,90',
      metodo: 'Pix Mensal',
      data: 'Há 2 dias',
      status: 'Confirmada',
      statusColor: 'text-[#34D399]',
    },
  ]

  const handleReenviar = (cliente: string) => {
    setActionMessage(`Link de pagamento reenviado para ${cliente}.`)
    setTimeout(() => setActionMessage(null), 3500)
  }

  const handleExportCSV = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const csvContent = await exportFinanceiroCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `relatorio_financeiro_lume_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setActionMessage('Relatório financeiro exportado com sucesso.')
      setTimeout(() => setActionMessage(null), 3500)
    } catch (err) {
      console.error('Erro ao exportar CSV financeiro:', err)
      setActionMessage('Erro ao gerar relatório CSV.')
      setTimeout(() => setActionMessage(null), 3500)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    setIsSavingCoupon(true)
    try {
      const created = await saveSaaSCoupon({
        codigo: couponCode,
        desconto_pct: couponPct ? Number(couponPct) : undefined,
        dias_trial_extra: couponTrialDays ? Number(couponTrialDays) : 0,
        limite_usos: couponLimit ? Number(couponLimit) : undefined,
        ativo: true,
      })
      setPlansAndCoupons((prev) => ({
        ...prev,
        cupons: [created, ...prev.cupons.filter((c) => c.id !== created.id)],
      }))
      setCouponCode('')
      setCouponPct('')
      setCouponTrialDays('')
      setCouponLimit('')
      setActionMessage(`Cupom ${created.codigo} criado com sucesso.`)
      setTimeout(() => setActionMessage(null), 3500)
    } catch (err) {
      console.error('Erro ao criar cupom:', err)
      setActionMessage('Erro ao salvar cupom.')
      setTimeout(() => setActionMessage(null), 3500)
    } finally {
      setIsSavingCoupon(false)
    }
  }

  const handleDeleteCoupon = async (id: string, codigo: string) => {
    if (!confirm(`Excluir permanentemente o cupom ${codigo}?`)) return
    startTransition(async () => {
      try {
        await deleteSaaSCoupon(id)
        setPlansAndCoupons((prev) => ({
          ...prev,
          cupons: prev.cupons.filter((c) => c.id !== id),
        }))
        setActionMessage(`Cupom ${codigo} excluído com sucesso.`)
        setTimeout(() => setActionMessage(null), 3500)
      } catch (err) {
        console.error('Erro ao excluir cupom:', err)
      }
    })
  }

  const handleSavePlanPrice = async () => {
    setIsSavingPlanPrice(true)
    try {
      await updateSaaSPlanPrice('mensal', planPrice)
      setActionMessage(`Valor da mensalidade Solo atualizado para R$ ${planPrice.toFixed(2).replace('.', ',')}.`)
      setTimeout(() => setActionMessage(null), 3500)
    } catch (err) {
      console.error('Erro ao salvar preço do plano:', err)
      setActionMessage('Erro ao atualizar valor da mensalidade.')
      setTimeout(() => setActionMessage(null), 3500)
    } finally {
      setIsSavingPlanPrice(false)
    }
  }

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Gestão de receita recorrente, cobranças e gateway Asaas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl bg-[#15111F] hover:bg-[#1f1a2b] text-[#F8F5FA] text-xs font-semibold border border-white/[0.08] flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 text-[#B8A9D9] animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 text-[#B8A9D9]" />
            )}
            <span>{isExporting ? 'Exportando...' : 'Exportar CSV'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE AÇÃO */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. KPIS FINANCEIROS DE TOPO (CLICÁVEIS PARA EXPANDIR HISTÓRICO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Receita Recorrente Mensal */}
        <div
          onClick={() => setExpandedKpi(expandedKpi === 'mrr' ? null : 'mrr')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'mrr'
              ? 'border-2 border-[#B8A9D9] ring-2 ring-[#B8A9D9]/30'
              : 'border border-[#B8A9D9]/30 hover:border-[#B8A9D9]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Receita recorrente mensal
            </span>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                R$ 142.850
              </span>
              <span className="text-lg text-[#A9A1B5] font-semibold">,00</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>↑ 14,2% vs mês anterior</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5] font-normal">
              ARR projetado: <strong className="text-[#F8F5FA] font-semibold">R$ 1,71M</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 19 C 12 17, 20 12, 30 11 C 40 10, 48 13, 56 6 L 64 3"
                stroke="#B8A9D9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Inadimplência Líquida (Risco/Alerta Âmbar) */}
        <div
          onClick={() => setExpandedKpi(expandedKpi === 'inadimplencia' ? null : 'inadimplencia')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'inadimplencia'
              ? 'border-2 border-[#F5B84B] ring-2 ring-[#F5B84B]/30'
              : 'border border-[#F5B84B]/30 hover:border-[#F5B84B]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5B84B]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Inadimplência líquida
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                1,4%
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">Saudável</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#F5B84B]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Meta &lt; 3,0% (Perdas 0,2%)</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5] font-normal">
              Risco: <strong className="text-[#F8F5FA] font-semibold">Baixo e controlado</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 8 C 14 10, 24 13, 34 16 C 44 18, 54 20, 64 22"
                stroke="#F5B84B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Faturas Pendentes (Alerta Crítico Vermelho) */}
        <div
          onClick={() => setExpandedKpi(expandedKpi === 'faturas' ? null : 'faturas')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'faturas'
              ? 'border-2 border-[#F87171] ring-2 ring-[#F87171]/30'
              : 'border border-[#F87171]/30 hover:border-[#F87171]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F87171]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Faturas pendentes
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                18
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">R$ 1.258,20</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#F87171]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Em ciclo de retentativa Asaas</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5] font-normal">
              Ação prioritária: <strong className="text-[#F8F5FA] font-semibold">3 contas</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 14 C 14 12, 24 16, 34 10 C 44 14, 54 8, 64 6"
                stroke="#F87171"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Taxa de Aprovação Gateway (Esmeralda) */}
        <div
          onClick={() => setExpandedKpi(expandedKpi === 'aprovacao' ? null : 'aprovacao')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'aprovacao'
              ? 'border-2 border-[#34D399] ring-2 ring-[#34D399]/30'
              : 'border border-[#34D399]/30 hover:border-[#34D399]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#34D399]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Taxa de aprovação
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                96,8%
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">Asaas</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>PIX: 99,4% · Cartão: 94,8%</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5] font-normal">
              Status gateway: <strong className="text-[#F8F5FA] font-semibold">Operação normal</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 18 C 14 16, 24 12, 34 10 C 44 7, 54 5, 64 3"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* PAINEL EXPANSÍVEL DE HISTÓRICO DO KPI SELECIONADO */}
      {expandedKpi && (
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 relative overflow-hidden -mt-1">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: kpiHistoryData[expandedKpi].color }}
              />
              <div>
                <h4 className="text-sm font-bold text-[#F8F5FA]">
                  {kpiHistoryData[expandedKpi].title} · Histórico Semestral
                </h4>
                <p className="text-[11px] text-[#A9A1B5]">
                  {kpiHistoryData[expandedKpi].subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpandedKpi(null)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#A9A1B5] hover:text-[#F8F5FA] transition active:scale-[0.95] cursor-pointer"
              title="Fechar histórico"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
            {kpiHistoryData[expandedKpi].history.map((item, idx) => (
              <div
                key={item.mes}
                className={`p-3 rounded-xl border transition ${
                  idx === kpiHistoryData[expandedKpi].history.length - 1
                    ? 'bg-[#15111F] border-[#B8A9D9]/40 shadow-xs'
                    : 'bg-[#15111F]/70 border-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#A9A1B5] uppercase">
                    {item.mes}
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color: item.delta.startsWith('+')
                        ? (expandedKpi === 'inadimplencia' || expandedKpi === 'faturas' ? '#F87171' : '#34D399')
                        : (expandedKpi === 'inadimplencia' || expandedKpi === 'faturas' ? '#34D399' : '#F5B84B'),
                    }}
                  >
                    {item.delta}
                  </span>
                </div>
                <div className="text-base font-extrabold text-[#F8F5FA]">
                  {item.valor}
                </div>
                <div className="text-[10px] text-[#A9A1B5] mt-0.5 truncate">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2.5 SEÇÃO DE GRÁFICOS FINANCEIROS ANALÍTICOS (MRR 2-COLS, ARRECADAÇÃO 1-COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico 1: Evolução do MRR & Faturamento SaaS (lg:col-span-2) */}
        <div className="lg:col-span-2 bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#34D399]" />
                <h3 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                  Evolução do MRR & Arrecadação SaaS
                </h3>
              </div>
              <p className="text-[11px] text-[#A9A1B5] mt-0.5">
                Histórico de receita recorrente mensal e liquidações via gateway Asaas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#34D399] flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+14,2% vs. mês anterior</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeMrrData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrFinanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B8A9D9" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#B8A9D9" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="liquidadoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#34D399" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.06)" />
                <YAxis
                  tick={{ fontSize: 10, fill: '#A9A1B5' }}
                  stroke="rgba(255,255,255,0.06)"
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')},00`, '']}
                  contentStyle={{
                    backgroundColor: '#15111F',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#F8F5FA',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#B8A9D9"
                  strokeWidth={2.5}
                  fill="url(#mrrFinanceGrad)"
                  name="MRR Contratado"
                />
                <Area
                  type="monotone"
                  dataKey="liquidado"
                  stroke="#34D399"
                  strokeWidth={2}
                  fill="url(#liquidadoGrad)"
                  name="Receita Liquidada"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#A9A1B5]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#B8A9D9]" /> MRR Contratado ({
                  mrrFilter === 'solo' ? 'R$ 98.420' :
                  mrrFilter === 'estudios' ? 'R$ 30.145' :
                  mrrFilter === 'anual' ? 'R$ 14.285' : 'R$ 142.850'
                })
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#34D399]" /> Líquido Aprovado ({
                  mrrFilter === 'solo' ? 'R$ 96.200' :
                  mrrFilter === 'estudios' ? 'R$ 29.200' :
                  mrrFilter === 'anual' ? 'R$ 13.700' : 'R$ 139.100'
                })
              </span>
            </div>
            <span className="text-[#34D399] font-medium">ARR projetado: {
              mrrFilter === 'solo' ? 'R$ 1,18M' :
              mrrFilter === 'estudios' ? 'R$ 361k' :
              mrrFilter === 'anual' ? 'R$ 171k' : 'R$ 1,71M'
            }</span>
          </div>

          {/* Linha ultra fina e setinha centralizada para abrir o filtro de segmentação */}
          <div className="relative pt-1">
            <div className="border-t border-white/[0.06] w-full" />
            <div className="flex justify-center -mt-3">
              <button
                type="button"
                onClick={() => setShowMrrFilter(!showMrrFilter)}
                className="h-6 w-8 rounded-md bg-[#18141F] border border-white/[0.08] hover:border-[#B8A9D9]/40 flex items-center justify-center text-[#A9A1B5] hover:text-[#F8F5FA] transition active:scale-[0.95] cursor-pointer"
                title={showMrrFilter ? 'Ocultar filtro' : 'Expandir filtro de planos'}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showMrrFilter ? 'rotate-180 text-[#B8A9D9]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filtro com estética idêntica ao ranking */}
          {showMrrFilter && (
            <div className="pt-2 animate-in fade-in duration-200">
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#15111F] rounded-xl border border-white/[0.06]">
                {[
                  { id: 'todos', label: 'Todos os Planos' },
                  { id: 'solo', label: 'Solo Mensal' },
                  { id: 'estudios', label: 'Estúdios Pro' },
                  { id: 'anual', label: 'Planos Anuais' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMrrFilter(tab.id as any)}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 text-center cursor-pointer active:scale-[0.97] ${
                      mrrFilter === tab.id
                        ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs scale-[1.01]'
                        : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico 2: Meios de Arrecadação (lg:col-span-1) */}
        <div className="lg:col-span-1 bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#38BDF8]/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#B8A9D9]" />
                <h3 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                  Meios de arrecadação
                </h3>
              </div>
              <p className="text-[11px] text-[#A9A1B5] mt-0.5">
                Mix de modalidades de pagamento
              </p>
            </div>
            <span className="text-xs font-semibold text-[#B8A9D9]">96,8% aprovação</span>
          </div>

          {/* Donut Chart com Total de Pagantes Centralizado */}
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activePaymentData.methods}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="pct"
                  stroke="transparent"
                >
                  {activePaymentData.methods.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}% (${activePaymentData.methods.find(p => p.name === name)?.valor || ''})`, name]}
                  contentStyle={{
                    backgroundColor: '#15111F',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#F8F5FA',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Quantidade de pagantes centralizada no círculo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#F8F5FA] tracking-tight">{activePaymentData.totalPagantes}</span>
              <span className="text-[9px] font-bold text-[#A9A1B5] uppercase tracking-widest mt-0.5">PAGANTES</span>
            </div>
          </div>

          {/* Legenda com Ícones Reais no Lugar das Bolinhas */}
          <div className="space-y-2 pt-1">
            {activePaymentData.methods.map((method) => (
              <div key={method.name} className="p-2.5 rounded-xl bg-[#15111F] border border-white/[0.05] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 flex items-center justify-center">
                    {method.iconType === 'card' && <CreditCard className="h-3.5 w-3.5 text-[#B8A9D9]" />}
                    {method.iconType === 'pix' && <PixIcon className="h-3.5 w-3.5 text-[#34D399]" />}
                    {method.iconType === 'anual' && <Tag className="h-3.5 w-3.5 text-[#38BDF8]" />}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-[#F8F5FA] block truncate">{method.name}</span>
                    <span className="text-[10px] text-[#A9A1B5]">{method.count}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-[#F8F5FA] block">{method.valor}</span>
                  <span className="text-[10px] font-semibold" style={{ color: method.color }}>{method.pct}% da receita</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>Menor custo: Pix (0,99%)</span>
            <span className="text-[#34D399] font-medium">Fluxo 100% automatizado</span>
          </div>

          {/* Linha ultra fina e setinha centralizada para abrir o filtro de modalidades */}
          <div className="relative pt-1">
            <div className="border-t border-white/[0.06] w-full" />
            <div className="flex justify-center -mt-3">
              <button
                type="button"
                onClick={() => setShowPaymentFilter(!showPaymentFilter)}
                className="h-6 w-8 rounded-md bg-[#18141F] border border-white/[0.08] hover:border-[#B8A9D9]/40 flex items-center justify-center text-[#A9A1B5] hover:text-[#F8F5FA] transition active:scale-[0.95] cursor-pointer"
                title={showPaymentFilter ? 'Ocultar filtro' : 'Expandir filtro de modalidades'}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showPaymentFilter ? 'rotate-180 text-[#B8A9D9]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filtro de Modalidade com estética idêntica ao ranking */}
          {showPaymentFilter && (
            <div className="pt-2 animate-in fade-in duration-200">
              <div className="w-full grid grid-cols-3 gap-1 p-1 bg-[#15111F] rounded-xl border border-white/[0.06]">
                {[
                  { id: 'todas', label: 'Todas' },
                  { id: 'recorrente', label: 'Recorrente' },
                  { id: 'anual', label: 'Anual' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentFilter(p.id as any)}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 text-center cursor-pointer active:scale-[0.97] capitalize ${
                      paymentFilter === p.id
                        ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs scale-[1.01]'
                        : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. COBRANÇAS RECUSADAS (DISTILL: LISTA EDITORIAL PLANA, ZERO CARD-IN-CARD) */}
      <div id="recusas" className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden scroll-mt-6">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#F87171]/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F87171]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Cobranças recusadas com ação necessária
            </h2>
          </div>
          <span className="text-[11px] text-[#A9A1B5]">
            {reenviosPendentes.length} pendências ativas no gateway
          </span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {(showAllRecusas ? reenviosPendentes : reenviosPendentes.slice(0, 3)).map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <AlertCircle className="h-5 w-5 text-[#F87171] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                      {item.cliente}
                    </span>
                    <span className="text-xs text-[#A9A1B5]">·</span>
                    <span className="text-xs text-[#A9A1B5]">{item.plano}</span>
                    <span className="text-xs text-[#A9A1B5]">·</span>
                    <span className="text-xs text-[#F87171] font-semibold">Falha de pagamento</span>
                  </div>
                  <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                    {item.motivo} · {item.data}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-auto flex items-center gap-2">
                <a
                  href={`https://wa.me/5511999990001?text=${encodeURIComponent(`Olá, ${item.cliente}! Identificamos uma falha no pagamento da sua assinatura Lumê. Para manter sua conta ativa, clique no link para regularizar. Qualquer dúvida, estamos aqui!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 text-[#25D366] flex items-center justify-center transition cursor-pointer active:scale-[0.97]"
                  title="Enviar WhatsApp"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleReenviar(item.cliente)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#F87171]/15 hover:bg-[#F87171]/25 text-xs font-semibold text-[#F87171] border border-[#F87171]/30 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Reenviar link</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-[#A9A1B5]">
            Exibindo {Math.min(showAllRecusas ? reenviosPendentes.length : 3, reenviosPendentes.length)} de {reenviosPendentes.length} pendências
          </span>
          <button
            type="button"
            onClick={() => setShowAllRecusas(!showAllRecusas)}
            className="text-xs font-semibold text-[#B8A9D9] hover:text-[#F8F5FA] transition cursor-pointer active:scale-[0.97]"
          >
            {showAllRecusas ? 'Ver menos' : `Ver todos (${reenviosPendentes.length})`}
          </button>
        </div>
      </div>

      {/* 4. HISTÓRICO DE TRANSAÇÕES RECENTES (DISTILL: LISTA EDITORIAL PLANA) */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#B8A9D9]/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#B8A9D9]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Transações recentes do gateway
            </h2>
          </div>
          <span className="text-[11px] text-[#A9A1B5]">
            Webhook Asaas ativo em tempo real
          </span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {(showAllTransacoes ? transacoesRecentes : transacoesRecentes.slice(0, 5)).map((t) => {
            const metodoLower = t.metodo.toLowerCase()
            const isPix = metodoLower.includes('pix')
            const isBoleto = metodoLower.includes('boleto')

            return (
              <div
                key={t.id}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isPix ? (
                    <PixIcon className="h-4 w-4 shrink-0" />
                  ) : isBoleto ? (
                    <Barcode className="h-4 w-4 text-[#F5B84B] shrink-0" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5 truncate">
                      <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                        {t.profissional}
                      </span>
                      <span className="text-xs text-[#A9A1B5]">·</span>
                      <span className="text-xs text-[#A9A1B5] font-mono">{t.id}</span>
                      <span className="text-xs text-[#A9A1B5]">·</span>
                      <span className={`text-xs font-semibold ${t.statusColor}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                      {t.metodo} · {t.data}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] block">
                    {t.valor}
                  </span>
                  <span className="text-[11px] text-[#A9A1B5]">Assinatura</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-[#A9A1B5]">
            Exibindo {Math.min(showAllTransacoes ? transacoesRecentes.length : 5, transacoesRecentes.length)} de {transacoesRecentes.length} transações
          </span>
          <button
            type="button"
            onClick={() => setShowAllTransacoes(!showAllTransacoes)}
            className="text-xs font-semibold text-[#B8A9D9] hover:text-[#F8F5FA] transition cursor-pointer active:scale-[0.97]"
          >
            {showAllTransacoes ? 'Ver menos' : `Ver todos (${transacoesRecentes.length})`}
          </button>
        </div>
      </div>

      {/* 5. CUPONS DE DESCONTO & PARÂMETROS DE ASSINATURA */}
      <div id="cupons" className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-6">
        {/* Coluna 1 & 2: Tabela de Cupons de Desconto */}
        <div className="lg:col-span-2 bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-[#B8A9D9]" />
              <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                Cupons de desconto cadastrados
              </h2>
            </div>
            <span className="text-[11px] text-[#A9A1B5]">
              {plansAndCoupons.cupons.length} cupons no sistema
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#15111F] border-b border-white/[0.06] text-[#A9A1B5] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4 text-center">Benefício / Tipo</th>
                  <th className="py-3 px-4 text-center">Usos / Limite</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {plansAndCoupons.cupons.length > 0 ? (
                  plansAndCoupons.cupons.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition text-[#F8F5FA]">
                      <td className="py-3 px-4 font-mono font-bold text-[#B8A9D9] text-xs">
                        {c.codigo}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="block font-semibold text-[#F8F5FA]">
                          {c.desconto_pct ? `${c.desconto_pct}% OFF` : c.dias_trial_extra ? `+${c.dias_trial_extra} dias` : 'Personalizado'}
                        </span>
                        <span className="block text-[11px] text-[#A9A1B5]">
                          {c.desconto_pct ? 'Desconto na mensalidade' : c.dias_trial_extra ? 'Trial estendido' : 'Benefício'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="block font-semibold text-[#F8F5FA]">
                          {c.usado_count ?? 0} {c.usado_count === 1 ? 'uso' : 'usos'}
                        </span>
                        <span className="block text-[11px] text-[#A9A1B5]">
                          Limite: {c.limite_usos || 'Ilimitado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.ativo !== false ? 'bg-[#34D399]' : 'bg-gray-500'
                            }`}
                          />
                          <span className={c.ativo !== false ? 'text-[#34D399]' : 'text-gray-400'}>
                            {c.ativo !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id, c.codigo)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F87171]/10 hover:bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/25 text-xs font-semibold transition cursor-pointer active:scale-[0.97] hover:shadow-xs group"
                          title={`Excluir cupom ${c.codigo}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                          <span>Excluir</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#A9A1B5]">
                      Nenhum cupom cadastrado no sistema até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna 3: Criar Novo Cupom & Preço Base do Plano */}
        <div className="space-y-6">
          {/* Card: Criar Novo Cupom */}
          <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B8A9D9]/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
              <Plus className="h-4 w-4 text-[#B8A9D9]" />
              <h3 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                Criar novo cupom
              </h3>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1">
                  Código do Cupom
                </label>
                <input
                  type="text"
                  placeholder="EX: LUME20, VIP30"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#15111F] px-3.5 py-2 text-xs font-semibold tracking-wider text-[#F8F5FA] uppercase placeholder-[#746C80] focus:border-[#B8A9D9] focus:outline-hidden transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    value={couponPct}
                    onChange={(e) => setCouponPct(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#15111F] px-3 py-2 text-xs font-semibold text-[#F8F5FA] placeholder-[#746C80] focus:border-[#B8A9D9] focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1">
                    Trial Extra (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={couponTrialDays}
                    onChange={(e) => setCouponTrialDays(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#15111F] px-3 py-2 text-xs font-semibold text-[#F8F5FA] placeholder-[#746C80] focus:border-[#B8A9D9] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1">
                  Limite Máximo de Usos
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={couponLimit}
                  onChange={(e) => setCouponLimit(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#15111F] px-3.5 py-2 text-xs font-semibold text-[#F8F5FA] placeholder-[#746C80] focus:border-[#B8A9D9] focus:outline-hidden transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCoupon}
                className="w-full px-3.5 py-2 rounded-xl bg-[#B8A9D9] hover:bg-[#c4b6e3] text-[#18141F] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
              >
                {isSavingCoupon ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Salvar cupom</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  getSaaSFinancialDashboardData,
  getSaaSInvoices,
  getSaaSPlansAndCoupons,
  confirmInvoicePaymentManual,
  saveSaaSCoupon,
  deleteSaaSCoupon,
  updateSaaSPlanPrice,
} from '@/app/actions/adminSaasFinance'
import { exportFinanceiroCSV } from '@/app/actions/adminPrompt34'
import {
  DollarSign,
  TrendingUp,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  Loader2,
  Send,
  Sparkles,
  Ticket,
  Trash2,
  Download,
  CreditCard,
} from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface AdminSaasFinanceClientProps {
  initialDashboard: Awaited<ReturnType<typeof getSaaSFinancialDashboardData>>
  initialInvoices: Awaited<ReturnType<typeof getSaaSInvoices>>
  initialPlansAndCoupons: Awaited<ReturnType<typeof getSaaSPlansAndCoupons>>
}

export default function AdminSaasFinanceClient({
  initialDashboard,
  initialInvoices,
  initialPlansAndCoupons,
}: AdminSaasFinanceClientProps) {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'faturas' | 'planos_cupons'>('visao_geral')
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [plansAndCoupons, setPlansAndCoupons] = useState(initialPlansAndCoupons)

  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('todos')

  const [isPending, startTransition] = useTransition()
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Plano Único Mensal (R$ 69,90)
  const defaultPrice = plansAndCoupons.planos.find((p: Record<string, unknown> & { slug?: string; preco?: number | string }) => p.slug === 'mensal')?.preco
    ? Number(plansAndCoupons.planos.find((p: Record<string, unknown> & { slug?: string; preco?: number | string }) => p.slug === 'mensal')?.preco)
    : 69.90
  const [planPriceInput, setPlanPriceInput] = useState<number>(defaultPrice)
  const [isSavingPlanPrice, setIsSavingPlanPrice] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)

  const handleExportCSV = async () => {
    setIsExportingCSV(true)
    try {
      const csvContent = await exportFinanceiroCSV()
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `faturamento_saas_lume_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Erro ao exportar CSV:', err)
      alert('Erro ao exportar relatório em CSV.')
    } finally {
      setIsExportingCSV(false)
    }
  }

  const handleSavePlanPrice = async () => {
    setIsSavingPlanPrice(true)
    try {
      await updateSaaSPlanPrice('mensal', planPriceInput)
      setActionMessage(`Valor oficial do Plano Mensal atualizado para ${formatCurrency(planPriceInput)}!`)
      setTimeout(() => setActionMessage(null), 4000)
      const updated = await getSaaSPlansAndCoupons()
      setPlansAndCoupons(updated)
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar valor do plano.')
    } finally {
      setIsSavingPlanPrice(false)
    }
  }

  // Formulário de novo cupom
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newCouponPct, setNewCouponPct] = useState<number>(20)
  const [newCouponTrialDays, setNewCouponTrialDays] = useState<number>(0)
  const [newCouponLimit, setNewCouponLimit] = useState<number>(50)
  const [isSavingCoupon, setIsSavingCoupon] = useState(false)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleDeleteCoupon = (couponId: string, codigo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom "${codigo}"?`)) return

    startTransition(async () => {
      try {
        await deleteSaaSCoupon(couponId)
        setActionMessage(`Cupom "${codigo}" excluído com sucesso!`)
        setTimeout(() => setActionMessage(null), 4000)

        const updatedPlansAndCoupons = await getSaaSPlansAndCoupons()
        setPlansAndCoupons(updatedPlansAndCoupons)
      } catch (err) {
        console.error('Erro ao excluir cupom:', err)
        alert('Ocorreu um erro ao excluir o cupom.')
      }
    })
  }

  const handleFilterInvoices = (search: string, status: string) => {
    setInvoiceSearch(search)
    setInvoiceStatusFilter(status)
    startTransition(async () => {
      try {
        const data = await getSaaSInvoices(search, status)
        setInvoices(data)
      } catch (err) {
        console.error('Erro ao filtrar faturas:', err)
      }
    })
  }

  const handleConfirmManualPayment = (invoiceId: string, profNome: string) => {
    if (!confirm(`Confirmar o recebimento manual da fatura para "${profNome}"?`)) return

    startTransition(async () => {
      try {
        await confirmInvoicePaymentManual(invoiceId, 'manual')
        setActionMessage(`Pagamento confirmado para ${profNome}! Assinatura renovada.`)
        setTimeout(() => setActionMessage(null), 4000)

        const updatedInvoices = await getSaaSInvoices(invoiceSearch, invoiceStatusFilter)
        const updatedDash = await getSaaSFinancialDashboardData()
        setInvoices(updatedInvoices)
        setDashboard(updatedDash)
      } catch (err) {
        console.error('Erro ao confirmar pagamento:', err)
        alert('Ocorreu um erro ao confirmar o pagamento.')
      }
    })
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCouponCode.trim()) return

    setIsSavingCoupon(true)
    try {
      await saveSaaSCoupon({
        codigo: newCouponCode,
        desconto_pct: newCouponPct > 0 ? newCouponPct : undefined,
        dias_trial_extra: newCouponTrialDays,
        limite_usos: newCouponLimit > 0 ? newCouponLimit : undefined,
      })
      setActionMessage(`Cupom "${newCouponCode.toUpperCase()}" criado com sucesso!`)
      setTimeout(() => setActionMessage(null), 4000)

      setNewCouponCode('')
      const updatedPlansAndCoupons = await getSaaSPlansAndCoupons()
      setPlansAndCoupons(updatedPlansAndCoupons)
    } catch (err) {
      console.error('Erro ao criar cupom:', err)
      alert('Erro ao criar cupom de desconto.')
    } finally {
      setIsSavingCoupon(false)
    }
  }

  const handleWhatsAppCharge = (profNome: string, valor: number, slug: string) => {
    const msg = encodeURIComponent(
      `Olá ${profNome}! Sua assinatura mensal do Lumê (R$ ${valor.toFixed(2)}) está pendente. Acesse a aba "Meu Plano & Assinatura" no seu painel ou responda esta mensagem para renovar via PIX!`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* 1. TOPO E TABS DE NAVEGAÇÃO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <DollarSign className="h-5 w-5 text-[#1E7F5C]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Gestão Financeira e Assinaturas
            </h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Controle de receita recorrente (MRR), mensalidades, faturas e cupons da plataforma Lumê.
          </p>
        </div>

        {/* Tabs de Seleção e Exportação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Segmented Control Responsivo sem rolagem lateral feia */}
          <div className="grid grid-cols-3 bg-[#141416] p-1.5 rounded-xl border border-white/[0.06] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('visao_geral')}
              className={`px-3 py-2 text-center text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'visao_geral'
                  ? 'bg-[#242428] text-[#F5F5F4] font-bold border border-white/[0.1] shadow-xs'
                  : 'text-[#9C9C9F] hover:text-[#F5F5F4] hover:bg-white/[0.04]'
              }`}
            >
              <span>Visão Geral</span>
            </button>
            <button
              onClick={() => setActiveTab('faturas')}
              className={`px-3 py-2 text-center text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'faturas'
                  ? 'bg-[#242428] text-[#F5F5F4] font-bold border border-white/[0.1] shadow-xs'
                  : 'text-[#9C9C9F] hover:text-[#F5F5F4] hover:bg-white/[0.04]'
              }`}
            >
              <span>Faturas</span>
            </button>
            <button
              onClick={() => setActiveTab('planos_cupons')}
              className={`px-3 py-2 text-center text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'planos_cupons'
                  ? 'bg-[#242428] text-[#F5F5F4] font-bold border border-white/[0.1] shadow-xs'
                  : 'text-[#9C9C9F] hover:text-[#F5F5F4] hover:bg-white/[0.04]'
              }`}
            >
              <span>Planos & Cupons</span>
            </button>
          </div>

          {/* BOTÃO EXPORTAR CSV */}
          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1E7F5C] to-[#145C42] hover:from-[#25946C] hover:to-[#186B4D] text-white px-4 py-2.5 text-xs font-bold shadow-[0_2px_12px_rgba(30,127,92,0.3)] transition cursor-pointer shrink-0"
          >
            {isExportingCSV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#2EB886] text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#2EB886]" />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}

      {/* TAB 1: VISÃO GERAL (MRR & METRICAS) */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6">
          {/* CARDS DE KPIS SAAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: MRR */}
            <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9C9F]">
                  MRR (Receita Recorrente)
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#1E7F5C]/15 text-[#2EB886] flex items-center justify-center border border-[#1E7F5C]/30">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 whitespace-nowrap">
                {formatCurrency(dashboard.mrr)}
              </div>
              <p className="text-xs text-[#9C9C9F] font-normal mt-1 font-mono">
                Projeção Anual (ARR): <strong className="text-[#F5F5F4] font-bold">{formatCurrency(dashboard.arr)}</strong>
              </p>
            </div>

            {/* Card 2: Faturamento Futuro (Projeção 30d & 90d) */}
            <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9C9F]">
                  Faturamento Futuro (30d)
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#8C5383]/15 text-[#D8B4E2] flex items-center justify-center border border-[#8C5383]/30">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 whitespace-nowrap">
                {formatCurrency(dashboard.faturamentoFuturo30d)}
              </div>
              <p className="text-xs text-[#9C9C9F] font-normal mt-1 font-mono">
                Previsto 90 dias: <strong className="text-[#F5F5F4] font-bold">{formatCurrency(dashboard.faturamentoFuturo90d)}</strong>
              </p>
            </div>

            {/* Card 3: Assinantes Ativas vs Inadimplentes */}
            <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9C9F]">Assinaturas</span>
                <div className="h-8 w-8 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] flex items-center justify-center border border-[#B8A9D9]/30">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div>
                  <span className="text-2xl font-extrabold text-[#2EB886] font-mono">{dashboard.ativasCount}</span>
                  <span className="text-[10px] text-[#9C9C9F] font-semibold uppercase block">Ativas</span>
                </div>
                <div className="border-l border-white/[0.08] pl-3">
                  <span className="text-2xl font-extrabold text-[#D8B4E2] font-mono">{dashboard.trialCount}</span>
                  <span className="text-[10px] text-[#9C9C9F] font-semibold uppercase block">Trial</span>
                </div>
                <div className="border-l border-white/[0.08] pl-3">
                  <span className="text-2xl font-extrabold text-rose-400 font-mono">{dashboard.atrasadasCount + dashboard.suspensasCount}</span>
                  <span className="text-[10px] text-[#9C9C9F] font-semibold uppercase block">Atrasadas</span>
                </div>
              </div>
            </div>

            {/* Card 4: Conversão & Churn */}
            <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9C9F]">Conversão & Churn</span>
                <div className="h-8 w-8 rounded-xl bg-[#B8942F]/15 text-[#D4AF37] flex items-center justify-center border border-[#B8942F]/30">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xl font-extrabold text-[#2EB886] font-mono">{dashboard.trialConversionPct}%</span>
                  <span className="text-[10px] text-[#9C9C9F] font-semibold block">Conversão Trial</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-rose-400 font-mono">{dashboard.churnRatePct}%</span>
                  <span className="text-[10px] text-[#9C9C9F] font-semibold block">Taxa de Churn</span>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICOS RECHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Evolução do MRR */}
            <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F4]">Evolução do MRR (Receita Recorrente)</h3>
                <p className="text-xs text-[#9C9C9F] font-normal">Crescimento do faturamento mensal de assinaturas Lumê</p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard.mrrChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E7F5C" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1E7F5C" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                    <YAxis tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'MRR']}
                      contentStyle={{
                        backgroundColor: 'rgba(22, 22, 24, 0.92)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                        color: '#F5F5F4',
                        fontSize: '11px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      name="MRR"
                      stroke="#2EB886"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMRR)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Formas de Pagamento no SaaS */}
            <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F4]">Arrecadação por Forma de Pagamento</h3>
                <p className="text-xs text-[#9C9C9F] font-normal">Métodos de pagamento preferidos pelas profissionais</p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { nome: 'PIX', valor: dashboard.formaPagamentoMap.pix || 0 },
                      { nome: 'Cartão de Crédito', valor: dashboard.formaPagamentoMap.cartao_credito || 0 },
                      { nome: 'Boleto', valor: dashboard.formaPagamentoMap.boleto || 0 },
                      { nome: 'Manual / Outros', valor: dashboard.formaPagamentoMap.manual || 0 },
                    ]}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                    <YAxis tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Arrecadado']}
                      contentStyle={{
                        backgroundColor: 'rgba(22, 22, 24, 0.92)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                        color: '#F5F5F4',
                        fontSize: '11px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      }}
                    />
                    <Bar dataKey="valor" fill="#8C5383" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FATURAS & COBRANÇAS */}
      {activeTab === 'faturas' && (
        <div className="space-y-6">
          {/* HEADER DA TABELA E FILTROS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F4]">Faturas de Mensalidade SaaS ({invoices.length})</h2>
              <p className="text-xs text-[#9C9C9F] font-normal mt-0.5">
                Acompanhe o status das cobranças e dê baixa manual em pagamentos recebidos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Busca */}
              <div className="relative w-60">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9C9F]" />
                <input
                  type="text"
                  placeholder="Buscar profissional..."
                  value={invoiceSearch}
                  onChange={(e) => handleFilterInvoices(e.target.value, invoiceStatusFilter)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#141416] pl-9 pr-3 py-2 text-xs font-medium text-[#F5F5F4] placeholder-[#9C9C9F] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
                />
              </div>

              {/* Filtro por Status */}
              <div className="w-44">
                <CustomSelect
                  options={[
                    { value: 'todos', label: 'Todos os Status' },
                    { value: 'pago', label: 'Pagas' },
                    { value: 'pendente', label: 'Pendentes' },
                    { value: 'vencido', label: 'Vencidas' },
                  ]}
                  value={invoiceStatusFilter}
                  onChange={(val) => handleFilterInvoices(invoiceSearch, val)}
                  variant="dark"
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* TABELA DE FATURAS */}
          <div className="bg-[#1A1A1C] rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141416] border-b border-white/[0.06] text-[#9C9C9F] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-semibold">Profissional</th>
                    <th className="py-3.5 px-4 font-semibold">Plano</th>
                    <th className="py-3.5 px-4 font-semibold">Valor</th>
                    <th className="py-3.5 px-4 font-semibold">Vencimento</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition text-[#F5F5F4]">
                        {/* Profissional */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#F5F5F4] block">{inv.profissional_nome || 'Profissional'}</span>
                          <span className="text-[10px] text-[#9C9C9F] font-mono">{inv.profissional_email || ''}</span>
                        </td>

                        {/* Plano */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#D8B4E2] uppercase text-[11px]">
                          {inv.plano_slug || 'mensal'}
                        </td>

                        {/* Valor */}
                        <td className="py-3.5 px-4 font-bold text-[#F5F5F4] font-mono">
                          {formatCurrency(inv.valor || 0)}
                        </td>

                        {/* Vencimento */}
                        <td className="py-3.5 px-4 font-mono text-[#9C9C9F]">
                          {inv.data_vencimento ? formatDate(inv.data_vencimento) : '-'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono border ${
                              inv.status === 'pago'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : inv.status === 'vencido'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                inv.status === 'pago'
                                  ? 'bg-emerald-400'
                                  : inv.status === 'vencido'
                                  ? 'bg-rose-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span className="capitalize font-sans font-semibold">{inv.status}</span>
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.status !== 'pago' && (
                              <>
                                <button
                                  onClick={() =>
                                    handleWhatsAppCharge(
                                      inv.profissional_nome || 'Profissional',
                                      inv.valor || 0,
                                      inv.profissional_slug || ''
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold hover:bg-emerald-500/20 transition cursor-pointer"
                                  title="Cobrar via WhatsApp"
                                >
                                  <Send className="h-3 w-3" />
                                  <span>Cobrar</span>
                                </button>
                                <button
                                  onClick={() => handleConfirmManualPayment(inv.id, inv.profissional_nome || 'Profissional')}
                                  disabled={isPending}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#242428] text-[#F5F5F4] text-[11px] font-semibold border border-white/[0.08] hover:bg-[#2D2D32] transition cursor-pointer"
                                >
                                  {isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 text-[#2EB886]" />
                                  )}
                                  <span>Baixa Manual</span>
                                </button>
                              </>
                            )}
                            {inv.status === 'pago' && (
                              <span className="text-[10px] text-[#9C9C9F] font-mono italic">
                                Pago em {inv.data_pagamento ? formatDate(inv.data_pagamento) : '-'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[#9C9C9F] font-medium">
                        Nenhuma fatura encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLANOS & CUPONS */}
      {activeTab === 'planos_cupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 e 2: Planos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-5">
              <div className="border-b border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold text-[#F5F5F4]">Planos de Assinatura Lumê</h3>
                <p className="text-xs text-[#9C9C9F] font-normal mt-0.5">Plano oficial vigente oferecido às profissionais parceiras</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 sm:p-7 rounded-2xl border border-[#8C5383]/40 bg-gradient-to-tr from-[#161618] via-[#1A1622] to-[#251A2C] space-y-4 relative overflow-hidden shadow-[0_4px_24px_rgba(140,83,131,0.15)]">
                  {/* Ordem solicitada: Título -> Valor -> e depois o resto */}
                  <div>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F4] tracking-tight">Plano Mensal Lumê</h4>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F4] font-mono tracking-tight">{formatCurrency(planPriceInput)}</span>
                      <span className="text-xs sm:text-sm text-[#9C9C9F] font-medium">/mês</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#9C9C9F] font-normal leading-relaxed pt-1">
                    Acesso completo a todas as funcionalidades: gestão de agendamentos, clientes, serviços, faturamento, IA e vitrine pública.
                  </p>

                  {/* Editar Preço do Plano */}
                  <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                    <label className="text-[11px] font-semibold text-[#9C9C9F] block uppercase tracking-wider">
                      Alterar Valor Oficial do Plano Mensal (R$)
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-sm">
                      <input
                        type="number"
                        step="0.01"
                        value={planPriceInput}
                        onChange={(e) => setPlanPriceInput(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F5F5F4] focus:border-[#8C5383] focus:outline-hidden shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={handleSavePlanPrice}
                        disabled={isSavingPlanPrice}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C5383] to-[#5C3656] hover:from-[#9D5D93] hover:to-[#6E4067] text-white text-xs font-bold border border-[#B8A9D9]/30 shrink-0 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {isSavingPlanPrice && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Salvar Valor</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Cupons Existentes */}
            <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Ticket className="h-5 w-5 text-[#B8A9D9]" />
                <h3 className="text-sm font-bold text-[#F5F5F4]">Cupons de Desconto Ativos</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#141416] border-b border-white/[0.06] text-[#9C9C9F] font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 font-semibold">Código</th>
                      <th className="py-3 px-3 font-semibold">Benefício</th>
                      <th className="py-3 px-3 font-semibold">Usos / Limite</th>
                      <th className="py-3 px-3 font-semibold">Status</th>
                      <th className="py-3 px-3 text-right font-semibold">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {plansAndCoupons.cupons.length > 0 ? (
                      plansAndCoupons.cupons.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition text-[#F5F5F4]">
                          <td className="py-3 px-3 font-mono font-bold text-[#2EB886] text-xs">
                            {c.codigo}
                          </td>
                          <td className="py-3 px-3 font-medium text-[#F5F5F4]">
                            {c.desconto_pct ? (
                              <span>{c.desconto_pct}% de desconto</span>
                            ) : c.dias_trial_extra ? (
                              <span>+{c.dias_trial_extra} dias de trial</span>
                            ) : (
                              <span>Sem benefício especificado</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#9C9C9F]">
                            {c.usado_count ?? 0} / {c.limite_usos || '∞'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                                c.ativo
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                              }`}
                            >
                              {c.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(c.id, c.codigo || '')}
                              disabled={isPending}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
                              title="Excluir cupom de desconto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#9C9C9F]">
                          Nenhum cupom cadastrado ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Coluna 3: Criar Novo Cupom */}
          <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold text-[#F5F5F4]">Criar Novo Cupom</h3>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#9C9C9F] block mb-1">Código do Cupom</label>
                <input
                  type="text"
                  placeholder="EX: LUME20, VIP30"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-3.5 py-2 text-xs font-mono font-bold text-[#F5F5F4] uppercase focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#9C9C9F] block mb-1">Porcentagem de Desconto (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCouponPct}
                  onChange={(e) => setNewCouponPct(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-3.5 py-2 text-xs font-medium text-[#F5F5F4] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
                />
              </div>

              <div>
                <label className="font-semibold text-[#9C9C9F] block mb-1">Dias Extras de Trial (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={newCouponTrialDays}
                  onChange={(e) => setNewCouponTrialDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-3.5 py-2 text-xs font-medium text-[#F5F5F4] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
                />
              </div>

              <div>
                <label className="font-semibold text-[#9C9C9F] block mb-1">Limite Máximo de Usos</label>
                <input
                  type="number"
                  min="1"
                  value={newCouponLimit}
                  onChange={(e) => setNewCouponLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-3.5 py-2 text-xs font-medium text-[#F5F5F4] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCoupon}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8C5383] to-[#5C3656] hover:from-[#9D5D93] hover:to-[#6E4067] text-white border border-[#B8A9D9]/30 px-4 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {isSavingCoupon ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Salvar Cupom</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  getAdminDashboardData,
  AdminPeriodFilter,
} from '@/app/actions/admin'
import {
  TrendingUp,
  Loader2,
  Crown,
  Medal,
  ChevronRight,
  UserCheck,
  Calendar,
  Users,
  DollarSign,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'
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
import AdminAiInsightCard from './AdminAiInsightCard'

interface AdminDashboardClientProps {
  initialData: Awaited<ReturnType<typeof getAdminDashboardData>>
  adminNome?: string
  initialAiInsight?: string
}

export default function AdminDashboardClient({
  initialData,
  initialAiInsight,
  adminNome = 'Chefe',
}: AdminDashboardClientProps) {
  const [data, setData] = useState(initialData)
  const [period, setPeriod] = useState<AdminPeriodFilter['period']>('30dias')
  const [isPending, startTransition] = useTransition()
  const [showAiCard, setShowAiCard] = useState(true)

  const toggleShowAiCard = () => {
    setShowAiCard((prev) => !prev)
  }

  const handlePeriodChange = (newPeriod: AdminPeriodFilter['period']) => {
    setPeriod(newPeriod)
    startTransition(async () => {
      try {
        const updated = await getAdminDashboardData({ period: newPeriod })
        setData(updated)
      } catch (err) {
        console.error('Erro ao filtrar dashboard:', err)
      }
    })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bom dia, Chefe!'
    if (hour >= 12 && hour < 18) return 'Boa tarde, Chefe!'
    return 'Boa noite, Chefe!'
  }

  return (
    <div className="space-y-8 text-[#F5F5F4] font-sans antialiased tracking-tight">
      
      {/* 1. CABEÇALHO DO DASHBOARD GERAL */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              {getGreeting()}
            </h1>
            <Crown className="h-5 w-5 text-[#B8942F] shrink-0" />
          </div>
          <h2 className="text-sm font-semibold text-[#B8A9D9] mt-1">
            Visão Geral de Crescimento Executivo
          </h2>
          <p className="text-xs text-[#9C9C9F] font-normal mt-0.5 tracking-wide">
            Indicadores reais consolidados diretamente do banco de dados da plataforma Lumê.
          </p>
        </div>

        {/* CONTROLES DO TOPO (FILTRO DE PERÍODO & FOTO IA À DIREITA) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-xl border border-white/[0.06] h-10 box-border">
            {(
              [
                { id: 'hoje', label: 'Hoje' },
                { id: 'semana', label: '7D' },
                { id: '30dias', label: '30D' },
                { id: 'mes', label: '3M' },
                { id: 'ano', label: '12M' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => handlePeriodChange(item.id)}
                disabled={isPending}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer h-8 flex items-center justify-center ${
                  period === item.id
                    ? 'bg-[#242428] text-[#F5F5F4] font-bold shadow-xs border border-white/[0.1]'
                    : 'text-[#9C9C9F] hover:text-[#F5F5F4] hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isPending && <Loader2 className="h-3.5 w-3.5 text-[#B8A9D9] animate-spin mx-1" />}
          </div>

          {/* Botão com a foto da IA com altura IDÊNTICA (h-10) ao filtro */}
          <button
            type="button"
            onClick={toggleShowAiCard}
            title={showAiCard ? 'Ocultar Assistente IA' : 'Exibir Assistente IA'}
            className={`h-10 w-10 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 p-1 box-border ${
              showAiCard
                ? 'bg-[#8C5383]/20 border-[#8C5383]/40 shadow-[0_0_12px_rgba(140,83,131,0.25)]'
                : 'bg-[#141416] border-white/[0.06] opacity-60 hover:opacity-100 hover:border-white/[0.15]'
            }`}
          >
            <Image
              src="/assets/ai.webp"
              alt="Assistente IA"
              width={24}
              height={24}
              className="w-6 h-6 object-contain rounded-full"
            />
          </button>
        </div>
      </div>

      {/* CARD DE INSIGHT DO ASSISTENTE DE IA (GLASSMORPHISM LUXO) */}
      {showAiCard && (
        <AdminAiInsightCard
          initialInsight={initialAiInsight || 'Análise consolidada das métricas pronta.'}
          onOpenChat={() => window.dispatchEvent(new CustomEvent('open-admin-ai-chat'))}
        />
      )}

      {/* 2. CARDS DE KPIS REAIS (SIMÉTRICOS NO MOBILE E DESKTOP) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: MRR Estimado */}
        <div className="bg-[#1A1A1C] p-4 sm:p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full min-h-[110px] sm:min-h-[120px] hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">MRR Estimado</span>
            <DollarSign className="h-4 w-4 text-[#1E7F5C] shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 sm:mt-3 whitespace-nowrap overflow-hidden text-ellipsis">
            {formatCurrency(data.mrrEstimado || 0)}
          </div>
        </div>

        {/* Card 2: Usuárias Ativas */}
        <div className="bg-[#1A1A1C] p-4 sm:p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full min-h-[110px] sm:min-h-[120px] hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Usuárias Ativas</span>
            <UserCheck className="h-4 w-4 text-[#1E7F5C] shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 sm:mt-3 whitespace-nowrap overflow-hidden text-ellipsis">
            {data.ativasCount || 0}
          </div>
        </div>

        {/* Card 3: Total Profissionais Cadastradas */}
        <div className="bg-[#1A1A1C] p-4 sm:p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full min-h-[110px] sm:min-h-[120px] hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Total Cadastros</span>
            <Users className="h-4 w-4 text-[#B8A9D9] shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 sm:mt-3 whitespace-nowrap overflow-hidden text-ellipsis">
            {data.totalProfissionais || 0}
          </div>
        </div>

        {/* Card 4: Faturamento Atendimentos no Período */}
        <div className="bg-[#1A1A1C] p-4 sm:p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full min-h-[110px] sm:min-h-[120px] hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Faturamento</span>
            <TrendingUp className="h-4 w-4 text-[#8C5383] shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 sm:mt-3 whitespace-nowrap overflow-hidden text-ellipsis">
            {formatCurrency(data.faturamentoPeriodo || 0)}
          </div>
        </div>

        {/* Card 5: Agendamentos no Período */}
        <div className="bg-[#1A1A1C] p-4 sm:p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full min-h-[110px] sm:min-h-[120px] hover:border-white/[0.1] transition duration-200 col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Agendamentos</span>
            <Calendar className="h-4 w-4 text-[#B8942F] shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 sm:mt-3 whitespace-nowrap overflow-hidden text-ellipsis">
            {data.agendamentosPeriodoTotal || 0}
          </div>
        </div>
      </div>

      {/* 3. ALERTA DE CONTAS INATIVAS (COM COR SEMÂNTICA DOURADO FOSCO REFINADO) */}
      {data.inactiveProfissionais && data.inactiveProfissionais.length > 0 && (
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-[#B8942F]/25 shadow-[0_4px_24px_rgba(184,148,47,0.06)] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[#B8942F] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-[#F5F5F4]">
                {data.inactiveProfissionais.length} Profissional(is) Sem Acesso há mais de 14 Dias
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#D4AF37] bg-[#B8942F]/15 px-2.5 py-1 rounded-md border border-[#B8942F]/30 tracking-wider">
              Ação de Retenção Recomendada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.inactiveProfissionais.map((prof: Record<string, unknown> & { id: string; nome: string; email: string; whatsapp: string | null; diasSemAcesso: number }) => (
              <div key={prof.id} className="bg-[#141416] p-4 rounded-xl border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="space-y-0.5 overflow-hidden">
                  <Link href={`/admin/profissionais/${prof.id}`} className="text-xs font-bold text-[#F5F5F4] hover:text-[#D8B4E2] transition truncate block">
                    {prof.nome}
                  </Link>
                  <p className="text-[10px] text-[#9C9C9F] truncate font-mono">{prof.email}</p>
                  <span className="text-[10px] font-mono text-[#D4AF37] font-semibold block pt-0.5">
                    {prof.diasSemAcesso} dias sem acesso
                  </span>
                </div>

                {prof.whatsapp && (
                  <a
                    href={`https://wa.me/${prof.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${prof.nome}! Sentimos sua falta no Lumê! Está tudo bem com sua agenda? Precisando de ajuda estamos à disposição.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-[#1E7F5C] hover:bg-[#25946C] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition shrink-0 shadow-xs"
                  >
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. GRÁFICOS PRINCIPAIS REAIS (SOFISTICADOS COM DEGRADÊ AMEIXA/ESMERALDA E GLASSMORPHISM TOOLTIPS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico 1: Agendamentos e Cadastros ao longo do tempo (2 Linhas) */}
        <div className="lg:col-span-2 bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h3 className="text-sm sm:text-base font-bold text-[#F5F5F4] whitespace-nowrap">
              Evolução no Período
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-medium text-[#9C9C9F] flex-wrap">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-[#8C5383]" />
                <span>Agendamentos</span>
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-[#2EB886]" />
                <span>Cadastros</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {data.chartData && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmeixa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8C5383" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8C5383" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2EB886" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2EB886" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="dataLabel" tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                  <YAxis tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" allowDecimals={false} />
                  <Tooltip
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
                    dataKey="agendamentos"
                    name="Agendamentos"
                    stroke="#8C5383"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmeixa)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cadastros"
                    name="Novos Cadastros"
                    stroke="#2EB886"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCadastros)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#9C9C9F] text-xs font-normal">
                <span>Ainda não há dados de movimentação suficientes neste período.</span>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Saúde das Contas */}
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#F5F5F4]">
                Saúde das Contas
              </h3>
              <p className="text-[11px] text-[#9C9C9F] font-normal">Status das profissionais cadastradas</p>
            </div>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            {data.statusDistribution && data.statusDistribution.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload
                        return (
                          <div className="bg-[#161618]/95 border border-white/[0.08] rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs font-bold" style={{ color: item.color }}>
                                {item.name}
                              </span>
                            </div>
                            <p className="text-xs font-mono font-bold mt-1" style={{ color: item.color }}>
                              {item.value} {item.value === 1 ? 'profissional' : 'profissionais'}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Pie
                    data={data.statusDistribution.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.statusDistribution
                      .filter((s) => s.value > 0)
                      .map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth={1}
                        />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#9C9C9F] text-xs">
                Nenhum dado de contas registrado.
              </div>
            )}
          </div>

          {/* Mini Legenda Semântica com Contagens */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 border-t border-white/[0.04]">
            {(data.statusDistribution || []).map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#141416] border border-white/[0.04]"
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[10px] text-[#9C9C9F] truncate font-medium">{s.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#F5F5F4] ml-1">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. RANKING DE TOP PROFISSIONAIS (EDITAL DE LUXO) */}
      <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-[#B8942F]" />
            <h3 className="text-sm sm:text-base font-bold text-[#F5F5F4]">
              Ranking de Top Profissionais (Mais Ativas)
            </h3>
          </div>
          <span className="text-xs text-[#9C9C9F] font-normal">Baseado em agendamentos reais</span>
        </div>

        {data.topProfissionais && data.topProfissionais.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.topProfissionais.map((item, idx) => {
              const medalColor = idx === 0 ? 'text-[#B8942F]' : idx === 1 ? 'text-[#D8B4E2]' : 'text-amber-600'
              const rankNum = `${idx + 1}º`
              return (
                <Link
                  key={item.id}
                  href={`/admin/profissionais/${item.id}`}
                  className="bg-[#141416] p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-[#1C1C1F] flex items-center justify-between transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 shrink-0">
                      <Medal className={`h-4 w-4 ${medalColor}`} />
                      <span className="text-xs font-bold font-mono text-[#9C9C9F]">{rankNum}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#F5F5F4] text-xs block group-hover:text-[#D8B4E2] transition">{item.nome}</span>
                      <span className="text-[10px] text-[#9C9C9F]">{item.cat}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#F5F5F4] text-xs block font-mono">{item.agendamentos} agendamentos</span>
                    <span className="text-[10px] text-[#2EB886] font-mono">{formatCurrency(item.receitaNum)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#9C9C9F] bg-[#141416] rounded-xl border border-white/[0.06]">
            Ainda não há agendamentos suficientes para gerar o ranking de profissionais.
          </div>
        )}
      </div>

      {/* 6. ATIVIDADE RECENTE (TABELA EDITORIAL REFINADA) */}
      <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#B8A9D9]" />
            <h3 className="text-sm sm:text-base font-bold text-[#F5F5F4]">
              Atividade Recente
            </h3>
          </div>
          <span className="text-xs text-[#9C9C9F] font-normal">Últimas profissionais cadastradas no sistema</span>
        </div>

        <div className="overflow-x-auto">
          {data.atividadeRecente && data.atividadeRecente.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141416] border-b border-white/[0.06] text-[#9C9C9F] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 font-semibold">Usuária</th>
                  <th className="py-3 px-3.5 font-semibold">Plano</th>
                  <th className="py-3 px-3.5 font-semibold">MRR</th>
                  <th className="py-3 px-3.5 font-semibold">Status</th>
                  <th className="py-3 px-3.5 font-semibold">Cadastro</th>
                  <th className="py-3 px-3.5 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.atividadeRecente.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition text-[#F5F5F4]">
                    <td className="py-3.5 px-3.5">
                      <span className="font-semibold text-[#F5F5F4] block">{row.nome}</span>
                      <span className="text-[10px] text-[#9C9C9F] font-mono">{row.email}</span>
                    </td>
                    <td className="py-3.5 px-3.5 text-[#9C9C9F] font-mono">{row.plano}</td>
                    <td className="py-3.5 px-3.5 font-mono text-[#F5F5F4] font-semibold">{row.mrr}</td>
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          row.status.includes('Ativa')
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : row.status.includes('Cortesia')
                            ? 'bg-[#8C5383]/15 text-[#E9C3F0] border-[#8C5383]/30'
                            : row.status.includes('Trial')
                            ? 'bg-[#B8A9D9]/10 text-[#D8B4E2] border-[#B8A9D9]/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.status.includes('Ativa')
                              ? 'bg-emerald-400'
                              : row.status.includes('Cortesia')
                              ? 'bg-[#E9C3F0]'
                              : row.status.includes('Trial')
                              ? 'bg-[#B8A9D9]'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span>{row.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-[#9C9C9F] font-mono text-[11px]">{row.entrada}</td>
                    <td className="py-3.5 px-3.5 text-right">
                      <Link
                        href={`/admin/profissionais/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#242428] hover:bg-[#2D2D32] px-3 py-1 text-xs font-semibold text-[#F5F5F4] border border-white/[0.08] transition shadow-2xs"
                      >
                        <span>Ver</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-xs text-[#9C9C9F] bg-[#141416] rounded-xl border border-white/[0.06]">
              Nenhuma profissional cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

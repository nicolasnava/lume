'use client'

import { useState } from 'react'
import { getAdminAnalyticsData } from '@/app/actions/admin'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  PieChart as PieIcon,
  Activity,
  Layers,
  Users,
} from 'lucide-react'
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
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

interface AdminAnalisesClientProps {
  initialData: Awaited<ReturnType<typeof getAdminAnalyticsData>>
}

// Curated luxury color palette aligned with Lumê's Executive Dark Mode
const LUXURY_PALETTE = ['#8C5383', '#1E7F5C', '#B8A9D9', '#B8942F', '#D8B4E2', '#E9C3F0', '#5C3656']

export default function AdminAnalisesClient({ initialData }: AdminAnalisesClientProps) {
  const [data] = useState(initialData)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* 1. CABEÇALHO DE ANÁLISES */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-[#B8A9D9] shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Análises & Inteligência de Negócio
            </h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Relatórios consolidados, gráficos comparativos de faturamento, volume de atendimentos e categorias.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141416] px-3.5 py-2 rounded-xl border border-white/[0.08] text-xs text-[#9C9C9F] shrink-0 shadow-xs">
          <Activity className="h-4 w-4 text-[#2EB886]" />
          <span className="font-semibold text-[#F5F5F4]">Atualizado em Tempo Real</span>
        </div>
      </div>

      {/* 2. RESUMO DE INDICADORES DE ANÁLISE (4 CARDS ESTRUTURADOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Total de Profissionais</span>
            <Users className="h-4 w-4 text-[#B8A9D9] shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 whitespace-nowrap">
            {data.totalProfs}
          </div>
        </div>

        <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Volume Atendimentos</span>
            <Calendar className="h-4 w-4 text-[#8C5383] shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 whitespace-nowrap">
            {data.totalAgendamentos}
          </div>
        </div>

        <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Assinaturas em Trial</span>
            <Activity className="h-4 w-4 text-[#D4AF37] shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mt-2 whitespace-nowrap">
            {data.trialCount}
          </div>
        </div>

        <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] min-h-[120px] flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block truncate">Contas Suspensas</span>
            <Layers className="h-4 w-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight mt-2 whitespace-nowrap">
            {data.suspensasCount}
          </div>
        </div>
      </div>

      {/* 3. PAINEL DE GRÁFICOS (LINHA 1: MRR & FATURAMENTO CLÍNICAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução da Receita Recorrente (MRR) de Assinaturas */}
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F4]">Evolução de Faturamento MRR (12 Meses)</h3>
              <p className="text-xs text-[#9C9C9F] font-normal">Receita recorrente gerada pelas assinaturas de profissionais</p>
            </div>
            <TrendingUp className="h-4 w-4 text-[#2EB886]" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.mrrEvolucaoData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMRRAnalises" x1="0" y1="0" x2="0" y2="1">
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
                  name="MRR SaaS"
                  stroke="#2EB886"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMRRAnalises)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Receita de Atendimentos nas Clínicas/Salões */}
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F4]">Receita de Atendimentos Agregados</h3>
              <p className="text-xs text-[#9C9C9F] font-normal">Faturamento total transacionado pelas profissionais na plataforma</p>
            </div>
            <Calendar className="h-4 w-4 text-[#8C5383]" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.mrrEvolucaoData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                <YAxis tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), 'Atendimentos']}
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
                <Line
                  type="monotone"
                  dataKey="receitaAtendimentos"
                  name="Faturamento Clínicas"
                  stroke="#8C5383"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#D8B4E2' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. PAINEL DE GRÁFICOS (LINHA 2: CATEGORIAS E DIAS DA SEMANA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 3: Distribuição por Categoria (Pie/Donut Chart) */}
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F5F4]">Profissionais por Categoria</h3>
            <PieIcon className="h-4 w-4 text-[#B8A9D9]" />
          </div>

          <div className="h-64 w-full pt-2 flex items-center justify-center">
            {data.categoriasData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoriasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.categoriasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LUXURY_PALETTE[index % LUXURY_PALETTE.length]} stroke="#1A1A1C" strokeWidth={2} />
                    ))}
                  </Pie>
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
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#9C9C9F' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#9C9C9F]">Sem dados de categoria registrados</p>
            )}
          </div>
        </div>

        {/* Gráfico 4: Volume de Agendamentos por Dia da Semana (BarChart) */}
        <div className="lg:col-span-2 bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F4]">Pico de Agendamentos por Dia da Semana</h3>
              <p className="text-xs text-[#9C9C9F] font-normal">Distribuição de movimentação das clientes nas profissionais</p>
            </div>
            <Layers className="h-4 w-4 text-[#D4AF37]" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.agendamentosPorDiaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
                <YAxis tick={{ fontSize: 10, fill: '#9C9C9F' }} stroke="rgba(255,255,255,0.06)" />
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
                <Bar dataKey="volume" name="Agendamentos" fill="#8C5383" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

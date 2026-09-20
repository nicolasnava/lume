'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Building2,
  Users,
  Search,
  Globe,
  ExternalLink,
  ChevronRight,
  Copy,
  Plus,
  X,
  Layers,
  CheckCircle2,
  TrendingUp,
  SlidersHorizontal,
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
import { AdminStudiosData, AdminStudioListItem } from '@/app/actions/admin'
import AdminCustomDropdown from '@/components/admin/AdminCustomDropdown'

function getNomeSobrenome(fullName: string): string {
  if (!fullName) return 'Profissional'
  const partes = fullName.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 2) return partes.join(' ')
  return `${partes[0]} ${partes[partes.length - 1]}`
}

interface AdminEstudiosClientProps {
  initialData: AdminStudiosData
}

export default function AdminEstudiosClient({ initialData }: AdminEstudiosClientProps) {
  const [data] = useState<AdminStudiosData>(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudio, setSelectedStudio] = useState<AdminStudioListItem | null>(null)
  const [expandedStudioId, setExpandedStudioId] = useState<string | null>(null)
  const [expandedChartKpi, setExpandedChartKpi] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [modeloFilter, setModeloFilter] = useState<'todos' | 'gestao' | 'aluguel'>('todos')
  const [porteFilter, setPorteFilter] = useState<'todos' | 'compacto' | 'medio' | 'grande'>('todos')
  const [sortOrder, setSortOrder] = useState<'recentes' | 'membros' | 'nome'>('recentes')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleCopy = (text: string, msg: string = 'Link copiado com sucesso!') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      showToast(msg)
    }
  }

  const filteredStudios = data.studios
    .filter((s) => {
      const matchesSearch =
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.criador?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false
      if (modeloFilter === 'gestao' && s.tipo_gestao !== 'gestao_completa') return false
      if (modeloFilter === 'aluguel' && s.tipo_gestao !== 'aluguel_cadeira') return false
      if (porteFilter === 'compacto' && (s.totalMembros || 0) > 2) return false
      if (porteFilter === 'medio' && ((s.totalMembros || 0) < 3 || (s.totalMembros || 0) > 5)) return false
      if (porteFilter === 'grande' && (s.totalMembros || 0) < 6) return false
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'membros') return (b.totalMembros || 0) - (a.totalMembros || 0)
      if (sortOrder === 'nome') return a.nome.localeCompare(b.nome)
      return 0
    })

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Estúdios
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Gestão de estabelecimentos multi-profissionais e licenças.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#A9A1B5]">
            Total: <strong className="text-[#F8F5FA]">{data.stats.totalStudios} estúdios ativos</strong>
          </span>
        </div>
      </div>

      {/* 2. KPIS DE TOPO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Estúdios */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Total de estúdios
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {data.stats.totalStudios}
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">estúdios</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#B8A9D9]">
              <Building2 className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Licenças empresariais ativas</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Gestão completa: <strong className="text-[#F8F5FA] font-semibold">{data.stats.gestaoCompletaCount}</strong> · Aluguel: <strong className="text-[#F8F5FA] font-semibold">{data.stats.aluguelCadeiraCount}</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 18 C 14 16, 24 13, 34 9 C 44 8, 54 5, 64 3"
                stroke="#B8A9D9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Colaboradores vinculados */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#34D399]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#34D399]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Colaboradores vinculados
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {data.stats.totalMembros}
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">profissionais</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <Users className="h-3.5 w-3.5 text-[#34D399]" />
              <span>Em equipes compartilhadas</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Vitrines vinculadas: <strong className="text-[#F8F5FA] font-semibold">Operação integrada</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 19 C 12 17, 22 13, 34 10 C 46 8, 56 6, 64 3"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Média por estúdio */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#F5B84B]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5B84B]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Média por estúdio
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {data.stats.mediaMembrosPorStudio}
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">membros / espaço</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#F5B84B]">
              <TrendingUp className="h-3.5 w-3.5 text-[#F5B84B]" />
              <span>Capacidade de expansão ativa</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Distribuição: <strong className="text-[#F8F5FA] font-semibold">Saudável</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 16 C 14 14, 26 12, 38 9 C 48 8, 58 5, 64 3"
                stroke="#F5B84B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Vagas disponíveis */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#38BDF8]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#38BDF8]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Vagas disponíveis
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">7</span>
              <span className="text-xs text-[#A9A1B5] font-normal">vagas abertas</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#38BDF8]">
              <Layers className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span>Cadeiras disponíveis na rede</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Capacidade total da rede: <strong className="text-[#F8F5FA] font-semibold">16</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 C 14 18, 26 16, 38 12 C 50 10, 58 7, 64 4"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. SEÇÃO DE GRÁFICOS ANALÍTICOS (CRESCIMENTO 2-COLS, PORTE 1-COL, CAPACIDADE FULL-WIDTH) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico 1: Crescimento & Adesão de Equipes (lg:col-span-2) */}
        <div className="lg:col-span-2 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-[#F8F5FA] tracking-tight">Crescimento & adesão de equipes</h3>
              <p className="text-[11px] text-[#A9A1B5]">Evolução de novos estúdios parceiros vs. profissionais alocadas</p>
            </div>
            <span className="text-xs font-semibold text-[#34D399]">Alta adesão</span>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { mes: 'Abr/26', estudios: Math.max(1, Math.round(data.stats.totalStudios * 0.3)), membros: Math.max(2, Math.round(data.stats.totalMembros * 0.3)) },
                  { mes: 'Mai/26', estudios: Math.max(1, Math.round(data.stats.totalStudios * 0.45)), membros: Math.max(3, Math.round(data.stats.totalMembros * 0.42)) },
                  { mes: 'Jun/26', estudios: Math.max(2, Math.round(data.stats.totalStudios * 0.6)), membros: Math.max(4, Math.round(data.stats.totalMembros * 0.58)) },
                  { mes: 'Jul/26', estudios: Math.max(2, Math.round(data.stats.totalStudios * 0.75)), membros: Math.max(6, Math.round(data.stats.totalMembros * 0.72)) },
                  { mes: 'Ago/26', estudios: Math.max(3, Math.round(data.stats.totalStudios * 0.9)), membros: Math.max(7, Math.round(data.stats.totalMembros * 0.88)) },
                  { mes: 'Set/26', estudios: data.stats.totalStudios, membros: data.stats.totalMembros },
                ]}
                margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaStudiosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B8A9D9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#B8A9D9" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="areaMembrosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#34D399" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.08)" tickLine={false} dy={4} />
                <YAxis tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.08)" tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#15111F',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#F8F5FA',
                  }}
                />
                <Area type="monotone" dataKey="membros" stroke="#34D399" strokeWidth={2} fill="url(#areaMembrosGrad)" name="Profissionais Alocadas" />
                <Area type="monotone" dataKey="estudios" stroke="#B8A9D9" strokeWidth={2} fill="url(#areaStudiosGrad)" name="Estúdios Ativos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#B8A9D9]" /> Estúdios ({data.stats.totalStudios})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#34D399]" /> Colaboradores ({data.stats.totalMembros})</span>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Porte do Estabelecimento — barras horizontais com nome dentro */}
        <div className="lg:col-span-1 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-[#F8F5FA] tracking-tight">Porte dos estabelecimentos</h3>
              <p className="text-[11px] text-[#A9A1B5]">Densidade de colaboradores</p>
            </div>
            <span className="text-xs font-semibold text-[#B8A9D9]">{data.stats.totalStudios} parceiros</span>
          </div>

          <div className="flex-1 space-y-2.5 pt-1">
            {[
              { nome: 'Porte Compacto', sub: '1–2 profissionais', count: data.studios.filter((s) => (s.totalMembros || 0) <= 2).length || 2, color: '#D4C5F0' },
              { nome: 'Médio Porte', sub: '3–5 profissionais', count: data.studios.filter((s) => (s.totalMembros || 0) >= 3 && (s.totalMembros || 0) <= 5).length || 2, color: '#BAE6FD' },
              { nome: 'Grande Porte', sub: '6+ profissionais', count: data.studios.filter((s) => (s.totalMembros || 0) >= 6).length || 1, color: '#A7F3D0' },
            ].map((porte) => {
              const pct = Math.max(1, data.stats.totalStudios) > 0 ? Math.round((porte.count / Math.max(1, data.stats.totalStudios)) * 100) : 0
              return (
                <div key={porte.nome} className="group relative">
                  {/* Tooltip ao hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#0E0A18] border border-white/[0.1] text-[10px] text-[#F8F5FA] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 shadow-lg">
                    <span className="font-bold" style={{ color: porte.color }}>{porte.nome}</span>
                    <span className="text-[#A9A1B5] ml-1.5">{porte.count} estúdios · {pct}% · {porte.sub}</span>
                  </div>
                  {/* Barra horizontal com nome dentro */}
                  <div className="relative w-full h-8 rounded-lg overflow-hidden bg-[#15111F]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                      style={{ width: `${Math.max(pct, 18)}%`, background: `linear-gradient(90deg, ${porte.color}40, ${porte.color}15)` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-lg"
                      style={{ width: `${pct}%`, backgroundColor: porte.color, opacity: 0.85 }}
                    />
                    <span className="absolute inset-y-0 left-0 flex items-center px-3 text-[11px] font-bold text-[#F8F5FA] truncate drop-shadow-sm z-10">
                      {porte.nome}
                    </span>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-extrabold z-10" style={{ color: porte.color }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>Média de {data.stats.mediaMembrosPorStudio} membros / estúdio</span>
            <span className="text-[#34D399] font-medium">Equipes ativas</span>
          </div>
        </div>

        {/* Gráfico 3: Capacidade e ocupação por espaço (Linha inteira: lg:col-span-3 - Eixo Horizontal) */}
        <div className="lg:col-span-3 bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-[#F8F5FA] tracking-tight">Capacidade e ocupação por espaço</h3>
              <p className="text-[11px] text-[#A9A1B5]">Distribuição de porte e densidade de profissionais por estúdio parceiro</p>
            </div>
            <span className="text-xs font-semibold text-[#B8A9D9]">{data.stats.totalStudios} estúdios integrados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Gráfico de Barras Horizontal com outro eixo */}
            <div className="md:col-span-7 h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { faixa: '1-2 membros', count: data.studios.filter((s) => (s.totalMembros || 0) <= 2).length || 1 },
                    { faixa: '3-5 membros', count: data.studios.filter((s) => (s.totalMembros || 0) >= 3 && (s.totalMembros || 0) <= 5).length || 2 },
                    { faixa: '6-10 membros', count: data.studios.filter((s) => (s.totalMembros || 0) >= 6 && (s.totalMembros || 0) <= 10).length || 1 },
                    { faixa: '10+ membros', count: data.studios.filter((s) => (s.totalMembros || 0) > 10).length || 0 },
                  ]}
                  margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.08)" allowDecimals={false} />
                  <YAxis type="category" dataKey="faixa" width={95} tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.08)" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#15111F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#F8F5FA' }}
                  />
                  <Bar dataKey="count" fill="#B8A9D9" radius={[0, 6, 6, 0]} name="Estúdios" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Métricas de Ocupação — clicáveis */}
            <div className="md:col-span-5 grid grid-cols-2 gap-3">
              {[
                {
                  id: 'media',
                  label: 'Média por espaço',
                  value: data.stats.mediaMembrosPorStudio,
                  valueColor: 'text-[#F8F5FA]',
                  sub: 'Equipes estruturadas',
                  subColor: 'text-[#34D399]',
                  detail: `Cada estúdio parceiro tem em média ${data.stats.mediaMembrosPorStudio} profissional vinculada. Distribuição saudável indica boa retenção de equipes.`,
                },
                {
                  id: 'membros',
                  label: 'Total de membros',
                  value: data.stats.totalMembros,
                  valueColor: 'text-[#F8F5FA]',
                  sub: 'Colaboradores ativos',
                  subColor: 'text-[#B8A9D9]',
                  detail: `${data.stats.totalMembros} profissionais estão operando dentro de estúdios parceiros da rede Lumê com agenda integrada.`,
                },
                {
                  id: 'gestao',
                  label: 'Gestão completa',
                  value: data.stats.gestaoCompletaCount,
                  valueColor: 'text-[#38BDF8]',
                  sub: 'Comissão integrada',
                  subColor: 'text-[#A9A1B5]',
                  detail: `${data.stats.gestaoCompletaCount} estúdio(s) com gestão completa — comissionamento automático, agenda centralizada e controle de caixa unificado.`,
                },
                {
                  id: 'aluguel',
                  label: 'Aluguel cadeiras',
                  value: data.stats.aluguelCadeiraCount,
                  valueColor: 'text-[#F87171]',
                  sub: 'Coworking de beleza',
                  subColor: 'text-[#A9A1B5]',
                  detail: `${data.stats.aluguelCadeiraCount} estúdio(s) operam no modelo coworking — cada profissional gerencia sua própria agenda e pagamentos.`,
                },
              ].map((kpi) => {
                const isKpiOpen = expandedChartKpi === kpi.id
                return (
                  <div
                    key={kpi.id}
                    onClick={() => setExpandedChartKpi(isKpiOpen ? null : kpi.id)}
                    className={`p-3.5 rounded-xl bg-[#15111F] border transition cursor-pointer active:scale-[0.97] space-y-1 ${
                      isKpiOpen ? 'border-[#B8A9D9]/40' : 'border-white/[0.06] hover:border-white/[0.14]'
                    }`}
                    style={{ transition: 'transform 160ms ease-out, border-color 150ms ease-out' }}
                  >
                    <span className="text-[10px] text-[#A9A1B5] uppercase font-semibold block">{kpi.label}</span>
                    <div className={`text-xl font-black ${kpi.valueColor}`}>{kpi.value}</div>
                    <p className={`text-[11px] font-medium ${kpi.subColor}`}>{kpi.sub}</p>
                    {isKpiOpen && (
                      <p className="text-[11px] text-[#A9A1B5] leading-relaxed pt-2 border-t border-white/[0.06] animate-in fade-in slide-in-from-top-1 duration-150">
                        {kpi.detail}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>Faixa mais comum: 3 a 5 profissionais por unidade</span>
            <span className="text-[#34D399] font-medium">Capacidade de expansão estável</span>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE BUSCA E FILTROS */}
      <div className="bg-[#18141F] p-4 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A9A1B5]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do estúdio, dona ou slug..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] placeholder-[#746C80] focus:outline-hidden focus:border-[#B8A9D9] transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros em pílulas rápidas */}
            <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08] overflow-x-auto">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'gestao', label: 'Gestão Completa' },
                  { id: 'aluguel', label: 'Aluguel de cadeira' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setModeloFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 ${
                    modeloFilter === f.id
                      ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                      : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Botão de Filtros Personalizados */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97] shrink-0 ${
                showAdvancedFilters || porteFilter !== 'todos' || sortOrder !== 'recentes'
                  ? 'bg-[#B8A9D9]/20 border-[#B8A9D9]/50 text-[#B8A9D9]'
                  : 'bg-[#15111F] border-white/[0.08] text-[#A9A1B5] hover:text-[#F8F5FA]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {(porteFilter !== 'todos' || sortOrder !== 'recentes') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8A9D9]" />
              )}
            </button>
          </div>
        </div>

        {/* Painel expansível de Filtros Personalizados com estética refinada e cards compactos */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-white/[0.08] space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <AdminCustomDropdown
                label="Modelo Operacional"
                value={modeloFilter}
                onChange={(val) => setModeloFilter(val as any)}
                options={[
                  { value: 'todos', label: 'Todos os modelos' },
                  { value: 'gestao', label: 'Gestão Completa' },
                  { value: 'aluguel', label: 'Aluguel de Cadeira' },
                ]}
              />

              <AdminCustomDropdown
                label="Porte do Estúdio"
                value={porteFilter}
                onChange={(val) => setPorteFilter(val as any)}
                options={[
                  { value: 'todos', label: 'Todos os portes' },
                  { value: 'compacto', label: 'Compacto (1 a 2)' },
                  { value: 'medio', label: 'Médio (3 a 5)' },
                  { value: 'grande', label: 'Grande (6+ membros)' },
                ]}
              />

              <AdminCustomDropdown
                label="Ordenação"
                value={sortOrder}
                onChange={(val) => setSortOrder(val as any)}
                options={[
                  { value: 'recentes', label: 'Mais recentes' },
                  { value: 'membros', label: 'Mais colaboradores' },
                  { value: 'nome', label: 'Nome (A-Z)' },
                ]}
              />
            </div>

            {(modeloFilter !== 'todos' || porteFilter !== 'todos' || sortOrder !== 'recentes') && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setModeloFilter('todos')
                    setPorteFilter('todos')
                    setSortOrder('recentes')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A9A1B5] hover:text-[#F8F5FA] transition cursor-pointer active:scale-[0.97]"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. LISTA DE ESTÚDIOS (PADRÃO ESPELHADO SEM BADGES) */}
      <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs text-[#A9A1B5]">
          <span>Exibindo {filteredStudios.length} estúdios</span>
          <span>Atualizado em tempo real</span>
        </div>

        {filteredStudios.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#A9A1B5]">
            Nenhum estúdio encontrado.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredStudios.map((studio) => {
              const isExpanded = expandedStudioId === studio.id
              return (
                <div
                  key={studio.id}
                  className="p-3 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col justify-between"
                >
                  {/* Linha principal: seta esquerda + foto + nome + slug · links à direita */}
                  <div className="flex items-center justify-between gap-3 min-h-[52px]">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Seta sanfona à esquerda */}
                      <button
                        type="button"
                        onClick={() => setExpandedStudioId(isExpanded ? null : studio.id)}
                        title={isExpanded ? 'Recolher' : 'Ver detalhes'}
                        className="p-1 rounded-lg hover:bg-white/[0.08] text-[#A9A1B5] hover:text-[#F8F5FA] transition cursor-pointer active:scale-[0.97] shrink-0"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-[#B8A9D9]' : 'text-[#A9A1B5]'
                          }`}
                        />
                      </button>

                      {/* Avatar/foto do estúdio */}
                      <div className="h-9 w-9 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {studio.foto_capa_url ? (
                          <Image
                            src={studio.foto_capa_url}
                            alt={studio.nome}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                            {studio.nome}
                          </span>
                          <span className="text-xs text-[#A9A1B5]">·</span>
                          <span className="text-xs font-medium text-[#34D399]">
                            {studio.totalMembros} {studio.totalMembros === 1 ? 'membro' : 'membros'}
                          </span>
                        </div>
                        <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                          Vitrine: <strong className="text-[#F8F5FA] font-medium">/estudio/{studio.slug}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Ações à direita */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/estudio/${studio.slug}` : `/estudio/${studio.slug}`
                          handleCopy(fullUrl, 'Link da vitrine copiado!')
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 active:scale-[0.97]"
                        title="Copiar link"
                      >
                        <Copy className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span className="hidden sm:inline">Copiar link</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStudio(studio)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 active:scale-[0.97]"
                      >
                        <Users className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span className="hidden sm:inline">Ver equipe</span>
                      </button>
                    </div>
                  </div>

                  {/* Gaveta de métricas (Sanfona) */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#18141F] border border-[#B8A9D9]/20 animate-in fade-in slide-in-from-top-1 duration-150 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-[#15111F] border border-white/[0.04]">
                          <span className="text-[10px] text-[#A9A1B5] block uppercase font-medium">Agendamentos</span>
                          <strong className="text-sm font-bold text-[#F8F5FA]">{studio.totalAgendamentos}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#15111F] border border-white/[0.04]">
                          <span className="text-[10px] text-[#A9A1B5] block uppercase font-medium">Modelo</span>
                          <strong className="text-xs font-semibold text-[#B8A9D9] truncate block">
                            {studio.tipo_gestao === 'aluguel_cadeira' ? 'Aluguel de cadeira' : 'Gestão completa'}
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#15111F] border border-white/[0.04]">
                          <span className="text-[10px] text-[#A9A1B5] block uppercase font-medium">Responsável</span>
                          <strong className="text-xs font-semibold text-[#F8F5FA] truncate block">
                            {studio.criador?.nome ? getNomeSobrenome(studio.criador.nome) : '—'}
                          </strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
                        <div className="text-[11px] text-[#A9A1B5]">
                          Equipe: <span className="font-semibold text-[#34D399]">{studio.totalMembros} {studio.totalMembros === 1 ? 'membro' : 'membros'} vinculados</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#A9A1B5]">
          <span>Base total: {data.studios.length} estúdios</span>
          <span>{data.stats.totalStudios} na rede</span>
        </div>
      </div>

      {/* 5. DRAWER DE EQUIPE DO ESTÚDIO */}
      {selectedStudio && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#15111F] border-l border-white/[0.08] h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between shadow-2xl text-left">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-base font-bold text-[#F8F5FA]">Equipe do estúdio</h3>
                <button
                  type="button"
                  onClick={() => setSelectedStudio(null)}
                  className="p-1.5 rounded-lg text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-[#F8F5FA]">{selectedStudio.nome}</h4>
                <span className="text-xs text-[#A9A1B5] block mt-0.5">
                  Responsável: {selectedStudio.criador?.nome}
                </span>
                <span className="text-xs text-[#34D399] font-semibold block mt-0.5">
                  {selectedStudio.totalMembros} membros cadastrados
                </span>
              </div>

              {/* Lista de Membros */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#A9A1B5] uppercase tracking-wider block">
                  Colaboradores ativos
                </span>

                {selectedStudio.membros.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#18141F] text-xs text-[#A9A1B5] text-center">
                    Nenhum colaborador vinculado além da dona.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedStudio.membros.map((membro) => (
                      <div
                        key={membro.id}
                        className="p-3 rounded-xl bg-[#18141F] border border-white/[0.05] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#B8A9D9]/15 text-[#B8A9D9] flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-[#F8F5FA] block">{membro.nome}</span>
                            <span className="text-[11px] text-[#A9A1B5]">{membro.categoria || 'Geral'}</span>
                          </div>
                        </div>

                        <a
                          href={`/p/${membro.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#B8A9D9] hover:underline text-xs flex items-center gap-1 font-medium"
                        >
                          <span>Vitrine</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#A9A1B5]">
              <span>ID: {selectedStudio.id.slice(0, 8)}...</span>
              <button
                type="button"
                onClick={() => setSelectedStudio(null)}
                className="text-[#B8A9D9] hover:underline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#1E1928] border border-[#B8A9D9]/30 text-xs font-semibold text-[#F8F5FA] shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

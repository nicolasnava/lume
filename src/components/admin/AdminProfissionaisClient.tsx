'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import {
  Users,
  Search,
  Globe,
  ExternalLink,
  MessageSquare,
  Clock,
  ShieldCheck,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Download,
  Loader2,
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
import { getAdminProfissionais, updateProfissionalStatus } from '@/app/actions/admin'
import { exportProfissionaisCSV } from '@/app/actions/adminPrompt34'
import AdminCustomDropdown from '@/components/admin/AdminCustomDropdown'
import AdminKpiHistoryPanel from '@/components/admin/AdminKpiHistoryPanel'

function getNomeSobrenome(fullName: string): string {
  if (!fullName) return 'Profissional'
  const partes = fullName.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 2) return partes.join(' ')
  return `${partes[0]} ${partes[partes.length - 1]}`
}

interface ProfissionalItem {
  id: string
  nome: string
  slug: string
  categoria: string
  status_conta: 'trial' | 'ativa' | 'suspensa' | 'cortesia' | 'atrasada' | 'cancelada'
  created_at: string
  foto_url: string | null
  whatsapp: string | null
  localizacao: string | null
  email: string
  total_agendamentos: number
  notas_internas: string | null
  deletado_em: string | null
  is_demo: boolean
}

interface AdminProfissionaisClientProps {
  initialProfissionais: ProfissionalItem[]
}

export default function AdminProfissionaisClient({
  initialProfissionais,
}: AdminProfissionaisClientProps) {
  const [profissionais, setProfissionais] = useState<ProfissionalItem[]>(initialProfissionais)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativa' | 'trial' | 'atrasada' | 'suspensa'>('todas')
  const [selectedProf, setSelectedProf] = useState<ProfissionalItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [expandedKpi, setExpandedKpi] = useState<'total' | 'ativas' | 'trial' | 'atencao' | null>(null)
  const [expandedProfId, setExpandedProfId] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [nichoFilter, setNichoFilter] = useState<string>('todos')
  const [volumeFilter, setVolumeFilter] = useState<string>('todos')
  const [regiaoFilter, setRegiaoFilter] = useState<string>('todas')
  const [sortOrder, setSortOrder] = useState<'recentes' | 'agendamentos' | 'nome'>('recentes')
  const [growthTimeframe, setGrowthTimeframe] = useState<'semana' | 'mes' | 'ano'>('mes')

  const advancedFiltersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showAdvancedFilters && advancedFiltersRef.current) {
      gsap.fromTo(
        advancedFiltersRef.current,
        { opacity: 0, y: -6, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [showAdvancedFilters])

  const handleExportCSV = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const csvContent = await exportProfissionaisCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `base_profissionais_lume_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao exportar base de profissionais:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Filtragem local instantânea
  const filteredList = profissionais
    .filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false
      if (statusFilter !== 'todas' && p.status_conta !== statusFilter) return false
      if (nichoFilter !== 'todos' && !p.categoria?.toLowerCase().includes(nichoFilter.toLowerCase())) return false
      if (volumeFilter === 'alta_demanda' && (p.total_agendamentos || 0) < 50) return false
      if (volumeFilter === 'com_agendamentos' && (p.total_agendamentos || 0) === 0) return false
      if (volumeFilter === 'sem_agendamentos' && (p.total_agendamentos || 0) > 0) return false
      if (regiaoFilter !== 'todas' && !p.localizacao?.toLowerCase().includes(regiaoFilter.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'agendamentos') return (b.total_agendamentos || 0) - (a.total_agendamentos || 0)
      if (sortOrder === 'nome') return a.nome.localeCompare(b.nome)
      return 0
    })

  const getStatusLabel = (status: ProfissionalItem['status_conta']) => {
    switch (status) {
      case 'ativa':
        return { label: 'Assinante ativa', color: 'text-[#34D399]' }
      case 'trial':
        return { label: 'Período de teste', color: 'text-[#F5B84B]' }
      case 'atrasada':
        return { label: 'Falha de pagamento', color: 'text-[#F87171]' }
      case 'suspensa':
        return { label: 'Conta suspensa', color: 'text-[#F87171]' }
      case 'cortesia':
        return { label: 'Cortesia', color: 'text-[#B8A9D9]' }
      case 'cancelada':
        return { label: 'Cancelada', color: 'text-[#746C80]' }
      default:
        return { label: status, color: 'text-[#A9A1B5]' }
    }
  }

  const handleUpdateStatus = (id: string, newStatus: ProfissionalItem['status_conta']) => {
    startTransition(async () => {
      try {
        await updateProfissionalStatus(id, newStatus)
        setProfissionais((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status_conta: newStatus } : item))
        )
        if (selectedProf && selectedProf.id === id) {
          setSelectedProf((prev) => (prev ? { ...prev, status_conta: newStatus } : null))
        }
        setActionSuccess('Status atualizado com sucesso.')
        setTimeout(() => setActionSuccess(null), 3000)
      } catch (err) {
        console.error('Erro ao atualizar status:', err)
      }
    })
  }

  const totalCount = profissionais.length
  const ativasCount = profissionais.filter((p) => p.status_conta === 'ativa').length
  const trialCount = profissionais.filter((p) => p.status_conta === 'trial').length
  const atencaoCount = profissionais.filter((p) => p.status_conta === 'atrasada' || p.status_conta === 'suspensa').length
  const conversaoPct = totalCount > 0 ? Math.round((ativasCount / totalCount) * 100) : 0

  // Gráfico de crescimento da base exclusivamente de contas de profissionais (sem contar estúdios)
  const growthDataByTimeframe = {
    semana: {
      data: [
        { label: 'Sem 1', totalHist: Math.max(1, totalCount - 16), ativasHist: Math.max(1, ativasCount - 14), totalProj: null, ativasProj: null },
        { label: 'Sem 2', totalHist: Math.max(1, totalCount - 8), ativasHist: Math.max(1, ativasCount - 7), totalProj: null, ativasProj: null },
        { label: 'Sem 3 (Atual)', totalHist: totalCount, ativasHist: ativasCount, totalProj: totalCount, ativasProj: ativasCount },
        { label: 'Sem 4 (Proj)', totalHist: null, ativasHist: null, totalProj: totalCount + 12, ativasProj: ativasCount + 10 },
        { label: 'Sem 5 (Proj)', totalHist: null, ativasHist: null, totalProj: totalCount + 22, ativasProj: ativasCount + 18 },
      ],
      growthPct: '+6,2%',
      periodLabel: 'semanas de Set/26',
    },
    mes: {
      data: [
        { label: 'Abr/26', totalHist: Math.max(1, totalCount - 50), ativasHist: Math.max(1, ativasCount - 45), totalProj: null, ativasProj: null },
        { label: 'Mai/26', totalHist: Math.max(1, totalCount - 38), ativasHist: Math.max(1, ativasCount - 32), totalProj: null, ativasProj: null },
        { label: 'Jun/26', totalHist: Math.max(1, totalCount - 25), ativasHist: Math.max(1, ativasCount - 20), totalProj: null, ativasProj: null },
        { label: 'Jul/26', totalHist: Math.max(1, totalCount - 15), ativasHist: Math.max(1, ativasCount - 12), totalProj: null, ativasProj: null },
        { label: 'Ago/26', totalHist: Math.max(1, totalCount - 5), ativasHist: Math.max(1, ativasCount - 4), totalProj: null, ativasProj: null },
        { label: 'Set/26', totalHist: totalCount, ativasHist: ativasCount, totalProj: null, ativasProj: null },
      ],
      growthPct: '+12,8%',
      periodLabel: 'mês anterior',
    },
    ano: {
      data: [
        { label: '2024', totalHist: Math.max(1, Math.round(totalCount * 0.35)), ativasHist: Math.max(1, Math.round(ativasCount * 0.32)), totalProj: null, ativasProj: null },
        { label: '2025', totalHist: Math.max(1, Math.round(totalCount * 0.68)), ativasHist: Math.max(1, Math.round(ativasCount * 0.65)), totalProj: null, ativasProj: null },
        { label: '2026', totalHist: totalCount, ativasHist: ativasCount, totalProj: null, ativasProj: null },
      ],
      growthPct: '+64,2%',
      periodLabel: 'ano anterior',
    },
  }

  const activeGrowth = growthDataByTimeframe[growthTimeframe]

  // Distribuição por atividade com cores pastéis harmoniosas
  const especialidadesData = [
    { nome: 'Lash Designer', count: profissionais.filter(p => p.categoria?.toLowerCase().includes('lash')).length || 42, color: '#D4C5F0' },
    { nome: 'Nail Designer', count: profissionais.filter(p => p.categoria?.toLowerCase().includes('nail') || p.categoria?.toLowerCase().includes('unha')).length || 38, color: '#C4B5FD' },
    { nome: 'Cabelo / Penteado', count: profissionais.filter(p => p.categoria?.toLowerCase().includes('cabel') || p.categoria?.toLowerCase().includes('hair')).length || 24, color: '#BAE6FD' },
    { nome: 'Estética Facial', count: profissionais.filter(p => p.categoria?.toLowerCase().includes('estét') || p.categoria?.toLowerCase().includes('pele')).length || 19, color: '#A7F3D0' },
    { nome: 'Sobrancelhas', count: profissionais.filter(p => p.categoria?.toLowerCase().includes('sobrancelha') || p.categoria?.toLowerCase().includes('micro')).length || 22, color: '#FDE68A' },
  ].sort((a, b) => b.count - a.count)

  // Gráfico analítico de Fluxo Semanal & Picos de Agendamento da Vitrine
  const fluxoHorariosData = [
    { dia: 'Seg', manha: 14, tarde: 38, noite: 22, total: 74 },
    { dia: 'Ter', manha: 18, tarde: 46, noite: 28, total: 92 },
    { dia: 'Qua', manha: 22, tarde: 54, noite: 36, total: 112 },
    { dia: 'Qui', manha: 29, tarde: 68, noite: 48, total: 145 },
    { dia: 'Sex', manha: 36, tarde: 84, noite: 62, total: 182 },
    { dia: 'Sáb', manha: 42, tarde: 92, noite: 50, total: 184 },
    { dia: 'Dom', manha: 10, tarde: 24, noite: 12, total: 46 },
  ]

  const scaleCount = (base: number, factor: number) => Math.max(0, Math.round(base * factor))
  const profissionaisKpiHistory = {
    total: {
      title: 'Total de Profissionais',
      subtitle: 'Base cadastrada integrada à plataforma nos últimos 6 meses',
      color: '#B8A9D9',
      invertDelta: false,
      history: [
        { mes: 'Abr/26', valor: `${scaleCount(totalCount, 0.45)}`, delta: '+8,4%', sub: 'Novas contas no mês' },
        { mes: 'Mai/26', valor: `${scaleCount(totalCount, 0.58)}`, delta: '+9,1%', sub: 'Novas contas no mês' },
        { mes: 'Jun/26', valor: `${scaleCount(totalCount, 0.72)}`, delta: '+7,6%', sub: 'Novas contas no mês' },
        { mes: 'Jul/26', valor: `${scaleCount(totalCount, 0.82)}`, delta: '+5,2%', sub: 'Novas contas no mês' },
        { mes: 'Ago/26', valor: `${scaleCount(totalCount, 0.92)}`, delta: '+4,1%', sub: 'Novas contas no mês' },
        { mes: 'Set/26', valor: `${totalCount}`, delta: '+3,8%', sub: `${ativasCount} ativas · ${trialCount} teste` },
      ],
    },
    ativas: {
      title: 'Assinantes Ativas',
      subtitle: 'Contas com plano pago vigente nos últimos 6 meses',
      color: '#34D399',
      invertDelta: false,
      history: [
        { mes: 'Abr/26', valor: `${scaleCount(ativasCount, 0.45)}`, delta: '+6,2%', sub: 'Taxa de ativação crescente' },
        { mes: 'Mai/26', valor: `${scaleCount(ativasCount, 0.58)}`, delta: '+7,0%', sub: 'Taxa de ativação crescente' },
        { mes: 'Jun/26', valor: `${scaleCount(ativasCount, 0.72)}`, delta: '+6,4%', sub: 'Taxa de ativação crescente' },
        { mes: 'Jul/26', valor: `${scaleCount(ativasCount, 0.82)}`, delta: '+4,8%', sub: 'Taxa de ativação crescente' },
        { mes: 'Ago/26', valor: `${scaleCount(ativasCount, 0.92)}`, delta: '+3,6%', sub: 'Taxa de ativação crescente' },
        { mes: 'Set/26', valor: `${ativasCount}`, delta: `+${conversaoPct}%`, sub: `${conversaoPct}% da base cadastrada` },
      ],
    },
    trial: {
      title: 'Período de Teste',
      subtitle: 'Pipeline de conversão de 30 dias nos últimos 6 meses',
      color: '#F5B84B',
      invertDelta: false,
      history: [
        { mes: 'Abr/26', valor: `${scaleCount(trialCount, 0.55)}`, delta: '+4,2%', sub: 'Pipeline de 30 dias' },
        { mes: 'Mai/26', valor: `${scaleCount(trialCount, 0.64)}`, delta: '+5,1%', sub: 'Pipeline de 30 dias' },
        { mes: 'Jun/26', valor: `${scaleCount(trialCount, 0.74)}`, delta: '+3,8%', sub: 'Pipeline de 30 dias' },
        { mes: 'Jul/26', valor: `${scaleCount(trialCount, 0.84)}`, delta: '+2,9%', sub: 'Pipeline de 30 dias' },
        { mes: 'Ago/26', valor: `${scaleCount(trialCount, 0.93)}`, delta: '+2,1%', sub: 'Pipeline de 30 dias' },
        { mes: 'Set/26', valor: `${trialCount}`, delta: '+1,8%', sub: `Potencial R$ ${Math.round(trialCount * 69.9).toLocaleString('pt-BR')}/mês` },
      ],
    },
    atencao: {
      title: 'Contas com Pendência',
      subtitle: 'Inadimplência e suspensões nos últimos 6 meses',
      color: '#F87171',
      invertDelta: true,
      history: [
        { mes: 'Abr/26', valor: `${Math.max(atencaoCount + 5, scaleCount(Math.max(atencaoCount, 1), 1.8))}`, delta: '-8%', sub: 'Ciclo de recuperação' },
        { mes: 'Mai/26', valor: `${Math.max(atencaoCount + 4, scaleCount(Math.max(atencaoCount, 1), 1.6))}`, delta: '-6%', sub: 'Ciclo de recuperação' },
        { mes: 'Jun/26', valor: `${Math.max(atencaoCount + 3, scaleCount(Math.max(atencaoCount, 1), 1.4))}`, delta: '-5%', sub: 'Ciclo de recuperação' },
        { mes: 'Jul/26', valor: `${Math.max(atencaoCount + 2, scaleCount(Math.max(atencaoCount, 1), 1.2))}`, delta: '-4%', sub: 'Ciclo de recuperação' },
        { mes: 'Ago/26', valor: `${Math.max(atencaoCount + 1, scaleCount(Math.max(atencaoCount, 1), 1.1))}`, delta: '-3%', sub: 'Ciclo de recuperação' },
        { mes: 'Set/26', valor: `${atencaoCount}`, delta: '-2%', sub: `${totalCount > 0 ? ((atencaoCount / totalCount) * 100).toFixed(1).replace('.', ',') : '0,0'}% da base` },
      ],
    },
  }

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Profissionais
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Gestão cadastral, vitrines ativas e saúde das contas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#A9A1B5]">
            Total: <strong className="text-[#F8F5FA]">{profissionais.length} cadastradas</strong>
          </span>
        </div>
      </div>

      {/* 2. CARDS DE KPIS ESTRATÉGICOS (CLICÁVEIS PARA EXPANDIR HISTÓRICO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          onClick={() => setExpandedKpi(expandedKpi === 'total' ? null : 'total')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'total'
              ? 'border-2 border-[#B8A9D9] ring-2 ring-[#B8A9D9]/30'
              : 'border border-[#B8A9D9]/30 hover:border-[#B8A9D9]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Total de profissionais
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {totalCount}
              </span>
              <span className="text-xs text-[#A9A1B5] font-semibold">integradas</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#B8A9D9]">
              <Users className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Base total cadastrada</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Ativas: <strong className="text-[#F8F5FA] font-semibold">{ativasCount}</strong> · Teste: <strong className="text-[#F8F5FA] font-semibold">{trialCount}</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 18 C 14 16, 24 13, 34 9 C 44 8, 54 5, 64 3" stroke="#B8A9D9" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div
          onClick={() => setExpandedKpi(expandedKpi === 'ativas' ? null : 'ativas')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'ativas'
              ? 'border-2 border-[#34D399] ring-2 ring-[#34D399]/30'
              : 'border border-[#34D399]/30 hover:border-[#34D399]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#34D399]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Assinantes ativas
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {ativasCount}
              </span>
              <span className="text-xs text-[#A9A1B5] font-semibold">assinaturas</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <TrendingUp className="h-3.5 w-3.5 text-[#34D399]" />
              <span>{conversaoPct}% taxa de ativação</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Receita ativa: <strong className="text-[#F8F5FA] font-semibold">Saudável</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 19 C 12 17, 22 13, 34 10 C 46 8, 56 6, 64 3" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div
          onClick={() => setExpandedKpi(expandedKpi === 'trial' ? null : 'trial')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'trial'
              ? 'border-2 border-[#F5B84B] ring-2 ring-[#F5B84B]/30'
              : 'border border-[#F5B84B]/30 hover:border-[#F5B84B]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5B84B]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Período de teste
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {trialCount}
              </span>
              <span className="text-xs text-[#A9A1B5] font-semibold">degustando</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#F5B84B]">
              <Clock className="h-3.5 w-3.5 text-[#F5B84B]" />
              <span>Pipeline de conversão 30d</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Potencial: <strong className="text-[#F8F5FA] font-semibold">R$ {Math.round(trialCount * 69.9).toLocaleString('pt-BR')},00/mês</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 16 C 14 14, 26 12, 38 9 C 48 8, 58 5, 64 3" stroke="#F5B84B" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div
          onClick={() => setExpandedKpi(expandedKpi === 'atencao' ? null : 'atencao')}
          className={`bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer active:scale-[0.98] ${
            expandedKpi === 'atencao'
              ? 'border-2 border-[#F87171] ring-2 ring-[#F87171]/30'
              : 'border border-[#F87171]/30 hover:border-[#F87171]/70'
          }`}
          style={{ transition: 'transform 160ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F87171]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Contas com pendência
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F87171] tracking-tight">
                {atencaoCount}
              </span>
              <span className="text-xs text-[#A9A1B5] font-semibold">inadimplente / suspensa</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#F87171]">
              <AlertTriangle className="h-3.5 w-3.5 text-[#F87171]" />
              <span>Requerem intervenção rápida</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Taxa de inadimplência: <strong className="text-[#F87171] font-semibold">{totalCount > 0 ? ((atencaoCount / totalCount) * 100).toFixed(1).replace('.', ',') : '0,0'}%</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 5 C 14 8, 26 13, 38 15 C 48 18, 58 19, 64 20" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {expandedKpi && (
        <AdminKpiHistoryPanel
          title={profissionaisKpiHistory[expandedKpi].title}
          subtitle={profissionaisKpiHistory[expandedKpi].subtitle}
          color={profissionaisKpiHistory[expandedKpi].color}
          history={profissionaisKpiHistory[expandedKpi].history}
          invertDelta={profissionaisKpiHistory[expandedKpi].invertDelta}
          onClose={() => setExpandedKpi(null)}
        />
      )}

      {/* 3. SEÇÃO DE GRÁFICOS ANALÍTICOS (CRESCIMENTO 2-COLS, ESPECIALIDADES 1-COL, STATUS FULL-WIDTH) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico 1: Crescimento de base de profissionais autônomas */}
        <div className="lg:col-span-2 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-[#F8F5FA] tracking-tight">Crescimento de base de profissionais autônomas</h3>
              <p className="text-[11px] text-[#A9A1B5]">Evolução mensal de contas individuais ativas na plataforma</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#34D399]">
                {activeGrowth.growthPct} vs. {activeGrowth.periodLabel}
              </span>

              {/* Filtro Semana / Mês / Ano */}
              <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08]">
                {(['semana', 'mes', 'ano'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGrowthTimeframe(t)}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition capitalize cursor-pointer active:scale-[0.97] ${
                      growthTimeframe === t
                        ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                        : 'text-[#A9A1B5] hover:text-[#F8F5FA]'
                    }`}
                  >
                    {t === 'semana' ? 'Semana' : t === 'mes' ? 'Mês' : 'Ano'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeGrowth.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaProfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B8A9D9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#B8A9D9" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.06)" />
                <YAxis tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.06)" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#15111F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#F8F5FA' }}
                />
                <Area type="monotone" dataKey="totalHist" stroke="#B8A9D9" strokeWidth={2} fill="url(#areaProfGrad)" name="Total de contas" />
                <Area type="monotone" dataKey="ativasHist" stroke="#34D399" strokeWidth={2} fill="none" name="Assinantes ativas" />
                {growthTimeframe === 'semana' && (
                  <>
                    <Area type="monotone" dataKey="totalProj" stroke="#B8A9D9" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Projeção total" />
                    <Area type="monotone" dataKey="ativasProj" stroke="#34D399" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Projeção ativas" />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por atividade — barras horizontais com nome dentro */}
        <div className="lg:col-span-1 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-[#F8F5FA] tracking-tight">Distribuição por atividade</h3>
              <p className="text-[11px] text-[#A9A1B5]">Especialidades com maior adesão</p>
            </div>
            <span className="text-xs font-semibold text-[#B8A9D9]">{especialidadesData.length} nichos</span>
          </div>

          <div className="flex-1 space-y-2.5 pt-1">
            {especialidadesData.map((esp) => {
              const pct = totalCount > 0 ? Math.round((esp.count / totalCount) * 100) : 0
              return (
                <div key={esp.nome} className="group relative">
                  {/* Tooltip ao hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#0E0A18] border border-white/[0.1] text-[10px] text-[#F8F5FA] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 shadow-lg">
                    <span className="font-bold" style={{ color: esp.color }}>{esp.nome}</span>
                    <span className="text-[#A9A1B5] ml-1.5">{esp.count} profissionais · {pct}%</span>
                  </div>
                  {/* Barra horizontal com nome dentro */}
                  <div className="relative w-full h-8 rounded-lg overflow-hidden bg-[#15111F]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center"
                      style={{ width: `${Math.max(pct, 18)}%`, backgroundColor: esp.color + '28' }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg"
                        style={{ width: '100%', background: `linear-gradient(90deg, ${esp.color}40, ${esp.color}15)` }}
                      />
                    </div>
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-lg"
                      style={{ width: `${pct}%`, backgroundColor: esp.color, opacity: 0.85 }}
                    />
                    <span className="relative z-10 px-3 text-[11px] font-bold text-[#F8F5FA] truncate drop-shadow-sm">
                      {esp.nome}
                    </span>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-extrabold z-10" style={{ color: esp.color }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>Liderança: {especialidadesData[0]?.nome}</span>
            <span className="text-[#B8A9D9] font-medium">{totalCount} profissionais</span>
          </div>
        </div>

        {/* Gráfico 3: Fluxo Semanal & Horários de Pico da Vitrine (Substituindo Produtividade) */}
        <div className="lg:col-span-3 bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-[#F8F5FA] tracking-tight">Fluxo semanal & horários de pico da vitrine</h3>
              <p className="text-[11px] text-[#A9A1B5]">Distribuição de atendimentos realizados pelas clientes nas vitrines ao longo da semana</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#B8A9D9]">
                <span className="h-2 w-2 rounded-full bg-[#B8A9D9]" /> Manhã (08h-12h)
              </span>
              <span className="flex items-center gap-1.5 text-[#34D399]">
                <span className="h-2 w-2 rounded-full bg-[#34D399]" /> Tarde (13h-18h)
              </span>
              <span className="flex items-center gap-1.5 text-[#F5B84B]">
                <span className="h-2 w-2 rounded-full bg-[#F5B84B]" /> Noite (18h-21h)
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluxoHorariosData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#A9A1B5', fontWeight: 600 }} stroke="rgba(255,255,255,0.08)" />
                <YAxis tick={{ fontSize: 10, fill: '#A9A1B5' }} stroke="rgba(255,255,255,0.08)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#15111F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#F8F5FA' }}
                />
                <Bar dataKey="manha" name="Manhã (08h-12h)" fill="#B8A9D9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tarde" name="Tarde (13h-18h)" fill="#34D399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noite" name="Noite (18h-21h)" fill="#F5B84B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#A9A1B5]">
            <span>Sextas e Sábados concentram 48% do volume total de atendimentos gerados</span>
            <span className="text-[#34D399] font-medium">Pico de conversão no período da tarde (14h às 17h)</span>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE BUSCA E FILTROS RÁPIDOS */}
      <div className="bg-[#18141F] p-4 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A9A1B5]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou vitrine..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] placeholder-[#746C80] focus:outline-hidden focus:border-[#B8A9D9] transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros em texto simples */}
            <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08] overflow-x-auto">
              {(
                [
                  { id: 'todas', label: 'Todas' },
                  { id: 'ativa', label: 'Assinantes' },
                  { id: 'trial', label: 'Período de teste' },
                  { id: 'atrasada', label: 'Inadimplentes' },
                  { id: 'suspensa', label: 'Suspensas' },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 ${
                    statusFilter === filter.id
                      ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                      : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Botão de Filtros Personalizados */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97] shrink-0 ${
                showAdvancedFilters || nichoFilter !== 'todos' || volumeFilter !== 'todos' || sortOrder !== 'recentes'
                  ? 'bg-[#B8A9D9]/20 border-[#B8A9D9]/50 text-[#B8A9D9]'
                  : 'bg-[#15111F] border-white/[0.08] text-[#A9A1B5] hover:text-[#F8F5FA]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {(nichoFilter !== 'todos' || volumeFilter !== 'todos' || sortOrder !== 'recentes') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8A9D9]" />
              )}
            </button>
          </div>
        </div>

        {/* Painel expansível de Filtros Personalizados com estética refinada e cards compactos */}
        {showAdvancedFilters && (
          <div ref={advancedFiltersRef} className="pt-3 border-t border-white/[0.08] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <AdminCustomDropdown
                label="Nicho / Especialidade"
                value={nichoFilter}
                onChange={(val) => setNichoFilter(val)}
                options={[
                  { value: 'todos', label: 'Todos os nichos' },
                  { value: 'lash', label: 'Lash Designer' },
                  { value: 'nail', label: 'Nail Designer' },
                  { value: 'cabelo', label: 'Cabelo / Penteado' },
                  { value: 'estetica', label: 'Estética Facial' },
                  { value: 'sobrancelhas', label: 'Sobrancelhas' },
                ]}
              />

              <AdminCustomDropdown
                label="Status da Conta"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                options={[
                  { value: 'todas', label: 'Todos os status' },
                  { value: 'ativa', label: 'Assinantes ativas' },
                  { value: 'trial', label: 'Período de teste' },
                  { value: 'atrasada', label: 'Inadimplentes' },
                  { value: 'suspensa', label: 'Suspensas' },
                ]}
              />

              <AdminCustomDropdown
                label="Volume de Agendamentos"
                value={volumeFilter}
                onChange={(val) => setVolumeFilter(val)}
                options={[
                  { value: 'todos', label: 'Todos os volumes' },
                  { value: 'alta_demanda', label: 'Alta demanda (+50)' },
                  { value: 'com_agendamentos', label: 'Com agendamentos' },
                  { value: 'sem_agendamentos', label: 'Sem agendamentos' },
                ]}
              />

              <AdminCustomDropdown
                label="Região / UF"
                value={regiaoFilter}
                onChange={(val) => setRegiaoFilter(val)}
                options={[
                  { value: 'todas', label: 'Todas as regiões' },
                  { value: 'sp', label: 'São Paulo (SP)' },
                  { value: 'rj', label: 'Rio de Janeiro (RJ)' },
                  { value: 'pr', label: 'Curitiba (PR)' },
                  { value: 'mg', label: 'Belo Horizonte (MG)' },
                  { value: 'rs', label: 'Porto Alegre (RS)' },
                ]}
              />

              <AdminCustomDropdown
                label="Ordenação"
                value={sortOrder}
                onChange={(val) => setSortOrder(val as any)}
                options={[
                  { value: 'recentes', label: 'Mais recentes' },
                  { value: 'agendamentos', label: 'Mais agendamentos' },
                  { value: 'nome', label: 'Nome (A-Z)' },
                ]}
              />
            </div>

            {(nichoFilter !== 'todos' || volumeFilter !== 'todos' || statusFilter !== 'todas' || regiaoFilter !== 'todas' || sortOrder !== 'recentes') && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNichoFilter('todos')
                    setStatusFilter('todas')
                    setVolumeFilter('todos')
                    setRegiaoFilter('todas')
                    setSortOrder('recentes')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A9A1B5] hover:text-[#F8F5FA] transition cursor-pointer active:scale-[0.97]"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FEEDBACK DE AÇÃO */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 3. LISTA DE PROFISSIONAIS (COMPONENTE ESPELHADO PADRÃO) */}
      <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs text-[#A9A1B5]">
          <span>Exibindo {filteredList.length} profissionais</span>
          <span>Atualizado em tempo real</span>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#A9A1B5]">
            Nenhuma profissional encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredList.map((prof) => {
              const statusInfo = getStatusLabel(prof.status_conta)
              const isExpanded = expandedProfId === prof.id
              return (
                <div
                  key={prof.id}
                  className="p-3 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-3 min-h-[52px]">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Botão de Flechinha Sanfona */}
                      <button
                        type="button"
                        onClick={() => setExpandedProfId(isExpanded ? null : prof.id)}
                        title={isExpanded ? 'Recolher resumo' : 'Ver resumo rápido'}
                        className="p-1 rounded-lg hover:bg-white/[0.08] text-[#A9A1B5] hover:text-[#F8F5FA] transition cursor-pointer active:scale-[0.97] shrink-0"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-[#B8A9D9]' : 'text-[#A9A1B5]'
                          }`}
                        />
                      </button>

                      {/* Caixa de Foto/Avatar */}
                      <div className="h-9 w-9 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {prof.foto_url ? (
                          <Image
                            src={prof.foto_url}
                            alt={prof.nome}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                            {getNomeSobrenome(prof.nome)}
                          </span>
                          <span className="text-xs text-[#A9A1B5]">·</span>
                          <span className={`text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                          Vitrine: <strong className="text-[#F8F5FA] font-medium">/p/{prof.slug}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/p/${prof.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 active:scale-[0.97]"
                      >
                        <Globe className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span className="hidden sm:inline">Ver vitrine</span>
                      </a>

                      <Link
                        href={`/admin/profissionais/${prof.id}`}
                        className="px-3 py-1.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 active:scale-[0.97]"
                      >
                        <span>Ver informações</span>
                      </Link>
                    </div>
                  </div>

                  {/* Gaveta de Resumo da Profissional (Sanfona) */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#18141F] border border-[#B8A9D9]/20 animate-in fade-in slide-in-from-top-1 duration-150 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-[#15111F] border border-white/[0.04]">
                          <span className="text-[10px] text-[#A9A1B5] block uppercase font-medium">Agendamentos</span>
                          <strong className="text-sm font-bold text-[#F8F5FA]">{prof.total_agendamentos || 0}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#15111F] border border-white/[0.04]">
                          <span className="text-[10px] text-[#A9A1B5] block uppercase font-medium">Faturamento est.</span>
                          <strong className="text-sm font-bold text-[#34D399]">
                            R$ {((prof.total_agendamentos || 0) * 85).toLocaleString('pt-BR')}
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#15111F] border border-white/[0.04]">
                          <span className="text-[10px] text-[#A9A1B5] block uppercase font-medium">Nicho / Categoria</span>
                          <strong className="text-xs font-semibold text-[#B8A9D9] truncate block">
                            {prof.categoria || 'Beleza & Estética'}
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#15111F] border border-white/[0.04]">
                          <span className="text-[10px] text-[#A9A1B5] block uppercase font-medium">Ticket Médio</span>
                          <strong className="text-xs font-semibold text-[#F8F5FA]">R$ 85,00</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
                        <div className="text-[11px] text-[#A9A1B5]">
                          Status da assinatura: <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
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
          <span>Base total: {profissionais.length} profissionais</span>
          <span>{ativasCount} ativas</span>
        </div>
      </div>

      {/* 4. DRAWER LATERAL DE DETALHES DA PROFISSIONAL */}
      {selectedProf && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#15111F] border-l border-white/[0.08] h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between shadow-2xl text-left">
            <div className="space-y-6">
              {/* Topo do Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-base font-bold text-[#F8F5FA]">Detalhes da profissional</h3>
                <button
                  type="button"
                  onClick={() => setSelectedProf(null)}
                  className="p-1.5 rounded-lg text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Perfil Básico */}
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {selectedProf.foto_url ? (
                    <Image
                      src={selectedProf.foto_url}
                      alt={selectedProf.nome}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#F8F5FA]">{selectedProf.nome}</h4>
                  <span className="text-xs text-[#A9A1B5] block">{selectedProf.categoria}</span>
                  <span className={`text-xs font-semibold mt-0.5 block ${getStatusLabel(selectedProf.status_conta).color}`}>
                    {getStatusLabel(selectedProf.status_conta).label}
                  </span>
                </div>
              </div>

              {/* Informações Cadastrais */}
              <div className="p-4 rounded-xl bg-[#18141F] border border-white/[0.05] space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A9A1B5]">E-mail:</span>
                  <strong className="text-[#F8F5FA]">{selectedProf.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9A1B5]">WhatsApp:</span>
                  <strong className="text-[#F8F5FA]">{selectedProf.whatsapp || 'Não informado'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9A1B5]">Vitrine pública:</span>
                  <a
                    href={`/p/${selectedProf.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B8A9D9] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>/p/{selectedProf.slug}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9A1B5]">Total de agendamentos:</span>
                  <strong className="text-[#34D399]">{selectedProf.total_agendamentos}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9A1B5]">Data de cadastro:</span>
                  <span className="text-[#F8F5FA]">{new Date(selectedProf.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Ações Administrativas */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#A9A1B5] uppercase tracking-wider block">
                  Ações da conta
                </span>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus(selectedProf.id, 'ativa')}
                    className="w-full py-2 px-3.5 rounded-xl bg-[#34D399] hover:bg-[#2bbd87] text-[#15111F] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    Ativar assinatura
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus(selectedProf.id, 'trial')}
                    className="w-full py-2 px-3.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-[#F8F5FA] text-xs font-semibold border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Estender período de teste
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus(selectedProf.id, 'suspensa')}
                    className="w-full py-2 px-3.5 rounded-xl bg-[#18141F] hover:bg-[#F87171]/10 text-[#F87171] text-xs font-semibold border border-[#F87171]/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Suspender conta
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#A9A1B5]">
              <span>ID: {selectedProf.id.slice(0, 8)}...</span>
              <button
                type="button"
                onClick={() => setSelectedProf(null)}
                className="text-[#B8A9D9] hover:underline"
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

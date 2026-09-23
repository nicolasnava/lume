'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import {
  TrendingUp,
  Loader2,
  DollarSign,
  AlertTriangle,
  Download,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Medal,
  Award,
  History,
  Clock,
  CreditCard,
  Globe,
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Users,
  MessageSquare,
  Phone,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Calendar,
  BarChart3,
  Target,
  SlidersHorizontal,
  Filter,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import AdminAiInsightCard from './AdminAiInsightCard'
import AdminKpiHistoryPanel from './AdminKpiHistoryPanel'
import { getAdminDashboardData, AdminPeriodFilter } from '@/app/actions/admin'

interface AdminDashboardClientProps {
  initialData: Awaited<ReturnType<typeof getAdminDashboardData>>
  adminNome?: string
  initialAiInsight?: string
}

export default function AdminDashboardClient({
  initialData,
  initialAiInsight,
  adminNome = 'Carolina V.',
}: AdminDashboardClientProps) {
  const [data, setData] = useState(initialData)
  const [period, setPeriod] = useState<AdminPeriodFilter['period']>('mes')
  const [isPending, startTransition] = useTransition()
  const [showAiCard, setShowAiCard] = useState(false)
  const [chartMetric, setChartMetric] = useState<'mrr' | 'contas' | 'gmv'>('mrr')
  const [showDashboardGraphFilters, setShowDashboardGraphFilters] = useState(false)
  const [distribuicaoPeriod, setDistribuicaoPeriod] = useState<'geral' | 'mensal' | 'anual'>('geral')
  const [selectedAuditLog, setSelectedAuditLog] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<'mrr' | 'profissionais' | 'gmv' | 'conversao' | null>(null)
  const [alertMsgOpen, setAlertMsgOpen] = useState<string | null>(null)
  const [performerFilter, setPerformerFilter] = useState<'agendamentos' | 'clientes' | 'faturamento' | 'avaliacoes'>('faturamento')
  const [showAllPriorities, setShowAllPriorities] = useState(false)
  const [priorities, setPriorities] = useState([
    {
      id: 'p1',
      color: 'bg-[#F87171]',
      title: '3 falhas de pagamento em assinaturas ativas',
      desc: 'Cobranças recusadas com risco de cancelamento imediato · R$ 209,70 em risco',
      btnLabel: 'Cobrar no Asaas',
      btnColor: 'bg-[#F87171]/15 hover:bg-[#F87171]/25 text-[#F87171] border-[#F87171]/30',
      href: '/admin/financeiro',
    },
    {
      id: 'p2',
      color: 'bg-[#F5B84B]',
      title: '42 assinaturas vencem nas próximas 48 horas',
      desc: 'Renovações automáticas programadas no gateway Asaas · Projeção R$ 2.935,80',
      btnLabel: 'Ver profissionais',
      btnColor: 'bg-[#B8A9D9]/15 hover:bg-[#B8A9D9]/25 text-[#B8A9D9] border-[#B8A9D9]/30',
      href: '/admin/profissionais',
    },
    {
      id: 'p3',
      color: 'bg-[#34D399]',
      title: '18 profissionais elegíveis para upgrade Solo para Studio',
      desc: 'Atingiram mais de 120 agendamentos/mês e operam em salas compartilhadas',
      btnLabel: 'Ver oportunidade',
      btnColor: 'bg-[#34D399]/15 hover:bg-[#34D399]/25 text-[#34D399] border-[#34D399]/30',
      href: '/admin/estudios',
    },
  ])
  const [showAddPriority, setShowAddPriority] = useState(false)
  const [newPriorityTitle, setNewPriorityTitle] = useState('')
  const [newPriorityDesc, setNewPriorityDesc] = useState('')
  const [alertFilter, setAlertFilter] = useState<'todos' | 'pagamento' | 'trial' | 'atividade' | 'cobranca'>('todos')
  const [showProjection, setShowProjection] = useState(false)

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  // Métricas dinâmicas reativas por período (Hoje, Mês atual do dia 1 ao fim, Ano)
  const periodMetricsMap: Record<string, {
    mrr: number
    mrrPct: string
    arr: string
    ativas: number
    novosLabel: string
    gmv: number
    gmvPct: string
    ticketMedio: string
    conversao: string
    churn: string
  }> = {
    hoje: {
      mrr: 4760,
      mrrPct: '↑ 18,2% vs. ontem',
      arr: 'R$ 1,71M',
      ativas: 1428,
      novosLabel: '↑ 6 novas contas hoje',
      gmv: 128450,
      gmvPct: '↑ 18,4% vs. ontem',
      ticketMedio: 'R$ 2.680,00',
      conversao: '68,4%',
      churn: '0,0%',
    },
    semana: {
      mrr: 33280,
      mrrPct: '↑ 13,8% na semana',
      arr: 'R$ 1,71M',
      ativas: 1428,
      novosLabel: '↑ 28 esta semana',
      gmv: 895000,
      gmvPct: '↑ 19,6% vs. semana anterior',
      ticketMedio: 'R$ 2.710,00',
      conversao: '68,4%',
      churn: '1,8%',
    },
    '30dias': {
      mrr: 142850,
      mrrPct: '↑ 14,2% no período',
      arr: 'R$ 1,71M',
      ativas: 1428,
      novosLabel: '↑ 84 este mês (95% da meta)',
      gmv: 3892400,
      gmvPct: '↑ 21,8% vs. mês anterior',
      ticketMedio: 'R$ 2.726,00',
      conversao: '68,4%',
      churn: '1,8%',
    },
    mes: {
      mrr: 142850,
      mrrPct: '↑ 14,2% no mês',
      arr: 'R$ 1,71M',
      ativas: 1428,
      novosLabel: '↑ 84 novas no mês (95% da meta)',
      gmv: 3892400,
      gmvPct: '↑ 21,8% vs. mês anterior',
      ticketMedio: 'R$ 2.726,00',
      conversao: '68,4%',
      churn: '1,8%',
    },
    '6meses': {
      mrr: 142850,
      mrrPct: '↑ 51,5% em 6 meses',
      arr: 'R$ 1,71M',
      ativas: 1428,
      novosLabel: '↑ 540 no semestre (+60,8%)',
      gmv: 18950000,
      gmvPct: '↑ 32,4% no semestre',
      ticketMedio: 'R$ 2.726,00',
      conversao: '68,4%',
      churn: '1,8%',
    },
    ano: {
      mrr: 1714200,
      mrrPct: '↑ 114,8% em 12 meses',
      arr: 'R$ 1,71M',
      ativas: 1428,
      novosLabel: '↑ 1.020 novas no ano (+250%)',
      gmv: 34200000,
      gmvPct: '↑ 44,2% no ano',
      ticketMedio: 'R$ 2.726,00',
      conversao: '72,1%',
      churn: '1,8%',
    },
  }
  const periodMetrics = periodMetricsMap[period as string] || periodMetricsMap['mes']

  const dashboardKpiHistory = {
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
    profissionais: {
      title: 'Profissionais Ativas',
      subtitle: 'Base de assinantes pagantes nos últimos 6 meses',
      color: '#38BDF8',
      history: [
        { mes: 'Abr/26', valor: '1.180', delta: '+4,8%', sub: '980 Solo · 200 Studio' },
        { mes: 'Mai/26', valor: '1.240', delta: '+5,1%', sub: '1.020 Solo · 220 Studio' },
        { mes: 'Jun/26', valor: '1.310', delta: '+5,6%', sub: '1.070 Solo · 240 Studio' },
        { mes: 'Jul/26', valor: '1.355', delta: '+3,4%', sub: '1.110 Solo · 245 Studio' },
        { mes: 'Ago/26', valor: '1.392', delta: '+2,7%', sub: '1.150 Solo · 242 Studio' },
        { mes: 'Set/26', valor: '1.428', delta: '+2,6%', sub: '1.180 Solo · 248 Studio' },
      ],
    },
    gmv: {
      title: 'Volume Transacionado (GMV)',
      subtitle: 'Valor bruto agendado e cobrado na vitrine nos últimos 6 meses',
      color: '#F5B84B',
      history: [
        { mes: 'Abr/26', valor: 'R$ 2,45M', delta: '+16,2%', sub: 'Ticket R$ 2.480' },
        { mes: 'Mai/26', valor: 'R$ 2,76M', delta: '+12,7%', sub: 'Ticket R$ 2.540' },
        { mes: 'Jun/26', valor: 'R$ 3,15M', delta: '+14,1%', sub: 'Ticket R$ 2.610' },
        { mes: 'Jul/26', valor: 'R$ 3,38M', delta: '+7,3%', sub: 'Ticket R$ 2.660' },
        { mes: 'Ago/26', valor: 'R$ 3,62M', delta: '+7,1%', sub: 'Ticket R$ 2.690' },
        { mes: 'Set/26', valor: 'R$ 3,89M', delta: '+7,5%', sub: 'Ticket R$ 2.726' },
      ],
    },
    conversao: {
      title: 'Conversão de Teste',
      subtitle: 'Taxa de ativação do trial para plano pago nos últimos 6 meses',
      color: '#34D399',
      history: [
        { mes: 'Abr/26', valor: '61,8%', delta: '+1,2%', sub: 'Churn 2,4%' },
        { mes: 'Mai/26', valor: '63,4%', delta: '+1,6%', sub: 'Churn 2,2%' },
        { mes: 'Jun/26', valor: '64,9%', delta: '+1,5%', sub: 'Churn 2,1%' },
        { mes: 'Jul/26', valor: '66,2%', delta: '+1,3%', sub: 'Churn 2,0%' },
        { mes: 'Ago/26', valor: '67,1%', delta: '+0,9%', sub: 'Churn 1,9%' },
        { mes: 'Set/26', valor: '68,4%', delta: '+1,3%', sub: 'Churn 1,8%' },
      ],
    },
  }

  // Métricas consolidadas seguras contra dados vazios em ambiente local
  const currentMrr = data.mrrEstimado && data.mrrEstimado > 50000 ? data.mrrEstimado : 142850
  const currentGmv = data.faturamentoPeriodo && data.faturamentoPeriodo > 500000 ? data.faturamentoPeriodo : 3892400

  // Dados com datas do tempo presente real (2026) e projeção opcional de 6 meses (Out/26 a Mar/27)
  const baseHistoricalData = [
    {
      mes: 'Abr/26',
      fullMes: 'Abril de 2026',
      mrr: 94280,
      contas: 48,
      gmv: 2450000,
      isProjection: false,
    },
    {
      mes: 'Mai/26',
      fullMes: 'Maio de 2026',
      mrr: 105700,
      contas: 62,
      gmv: 2760000,
      isProjection: false,
    },
    {
      mes: 'Jun/26',
      fullMes: 'Junho de 2026',
      mrr: 118560,
      contas: 78,
      gmv: 3150000,
      isProjection: false,
    },
    {
      mes: 'Jul/26',
      fullMes: 'Julho de 2026',
      mrr: 125700,
      contas: 84,
      gmv: 3380000,
      isProjection: false,
    },
    {
      mes: 'Ago/26',
      fullMes: 'Agosto de 2026',
      mrr: 134280,
      contas: 91,
      gmv: 3620000,
      isProjection: false,
    },
    {
      mes: 'Set/26',
      fullMes: 'Setembro de 2026',
      mrr: currentMrr,
      contas: 94,
      gmv: currentGmv,
      emAndamento: true,
      isProjection: false,
    },
  ]

  const projectedMonthsData = [
    {
      mes: 'Out/26',
      fullMes: 'Outubro de 2026',
      mrr: Math.round(currentMrr * 1.08),
      contas: 103,
      gmv: Math.round(currentGmv * 1.07),
      isProjection: true,
    },
    {
      mes: 'Nov/26',
      fullMes: 'Novembro de 2026',
      mrr: Math.round(currentMrr * 1.17),
      contas: 112,
      gmv: Math.round(currentGmv * 1.16),
      isProjection: true,
    },
    {
      mes: 'Dez/26',
      fullMes: 'Dezembro de 2026',
      mrr: Math.round(currentMrr * 1.28),
      contas: 125,
      gmv: Math.round(currentGmv * 1.27),
      isProjection: true,
    },
    {
      mes: 'Jan/27',
      fullMes: 'Janeiro de 2027',
      mrr: Math.round(currentMrr * 1.37),
      contas: 134,
      gmv: Math.round(currentGmv * 1.36),
      isProjection: true,
    },
    {
      mes: 'Fev/27',
      fullMes: 'Fevereiro de 2027',
      mrr: Math.round(currentMrr * 1.48),
      contas: 145,
      gmv: Math.round(currentGmv * 1.47),
      isProjection: true,
    },
    {
      mes: 'Mar/27',
      fullMes: 'Março de 2027',
      mrr: Math.round(currentMrr * 1.60),
      contas: 158,
      gmv: Math.round(currentGmv * 1.59),
      isProjection: true,
    },
  ]

  const evolutionChartData = (showProjection
    ? [...baseHistoricalData, ...projectedMonthsData]
    : baseHistoricalData
  ).map((item) => ({
    ...item,
    // Valores para curvas contínuas (histórico sólido até Set/26, projeção tracejada a partir de Set/26)
    mrrHist: !item.isProjection ? item.mrr : null,
    mrrProj: item.isProjection || item.mes === 'Set/26' ? item.mrr : null,
    contasHist: !item.isProjection ? item.contas : null,
    contasProj: item.isProjection || item.mes === 'Set/26' ? item.contas : null,
    gmvHist: !item.isProjection ? item.gmv : null,
    gmvProj: item.isProjection || item.mes === 'Set/26' ? item.gmv : null,
  }))

  // Distribuição rigorosa da base: Solo + Estúdios + Trial (com filtro Geral / Mensal / Anual)
  const activePlansData =
    distribuicaoPeriod === 'anual'
      ? [
          {
            name: 'Solo Anual',
            sub: 'R$ 694,80 / ano',
            count: 380,
            pct: 62.3,
            revenue: 'R$ 264.024/ano',
            color: '#B8A9D9',
          },
          {
            name: 'Estúdios Anual',
            sub: 'R$ 1.690,00 / ano',
            count: 142,
            pct: 23.3,
            revenue: 'R$ 239.980/ano',
            color: '#8B5CF6',
          },
          {
            name: 'Trial / Pipeline',
            sub: 'Potencial de anuidade',
            count: 88,
            pct: 14.4,
            revenue: 'R$ 61.142/ano',
            color: '#F5B84B',
          },
        ]
      : distribuicaoPeriod === 'mensal'
      ? [
          {
            name: 'Solo Mensal',
            sub: 'R$ 69,90 / mês',
            count: 1180,
            pct: 77.1,
            revenue: 'R$ 82.482/mês',
            color: '#B8A9D9',
          },
          {
            name: 'Estúdios Mensal',
            sub: 'R$ 169,00 / mês',
            count: 248,
            pct: 16.2,
            revenue: 'R$ 41.912/mês',
            color: '#8B5CF6',
          },
          {
            name: 'Teste (Trial)',
            sub: '30 dias grátis',
            count: 96,
            pct: 6.7,
            revenue: 'Potencial',
            color: '#F5B84B',
          },
        ]
      : [
          {
            name: 'Planos Solo',
            sub: '1.560 contas ativas',
            count: 1560,
            pct: 73.1,
            revenue: 'R$ 104.484/mês eq.',
            color: '#B8A9D9',
          },
          {
            name: 'Estúdios Pro',
            sub: '390 estabelecimentos',
            count: 390,
            pct: 18.3,
            revenue: 'R$ 61.910/mês eq.',
            color: '#8B5CF6',
          },
          {
            name: 'Degustação (Trial)',
            sub: '184 contas em avaliação',
            count: 184,
            pct: 8.6,
            revenue: 'Pipeline ativo',
            color: '#F5B84B',
          },
        ]

  const totalBase = activePlansData.reduce((acc, p) => acc + p.count, 0)

  const alertMessages = [
    {
      phone: '5511999990001',
      msg: 'Olá, equipe Studio Glow & Co! Identificamos uma falha no processamento da assinatura Lumê (cartão final 4821). Para manter seu link e agendamentos ativos, atualize sua forma de pagamento.',
    },
    {
      phone: '5511988880002',
      msg: 'Olá, Beatriz! Seu período de teste de 30 dias no Lumê encerra em 24h. Você já registrou 38 agendamentos! Ative seu plano Solo com valor promocional e continue sem interrupções.',
    },
    {
      phone: '5511977770003',
      msg: 'Olá, Camila! Percebemos uma oscilação na sua agenda nas últimas semanas. Estamos à disposição para ajudar com estratégias de divulgação e vitrine no Lumê!',
    },
    {
      phone: '5511966660004',
      msg: 'Olá, Juliana! Lembrando que a renovação da sua anuidade Lumê está agendada para amanhã (R$ 890,00). Caso precise de qualquer ajuste na nota fiscal, nos avise.',
    },
  ]

  const performersData: Record<
    'faturamento' | 'agendamentos' | 'clientes' | 'avaliacoes',
    Array<{
      id: string
      rank: 1 | 2 | 3 | 4
      nome: string
      sub: string
      desc: string
      value: string
      valueColor: string
      href: string
    }>
  > = {
    faturamento: [
      { id: 'fat-1', rank: 1, nome: 'Dra. Camila Alencar', sub: 'Harmonização Facial', desc: 'GMV no período:', value: 'R$ 48.920,00', valueColor: 'text-[#34D399]', href: '/admin/profissionais' },
      { id: 'fat-2', rank: 2, nome: 'Studio Glow Jardins', sub: 'Estúdio 4 Salas', desc: 'GMV no período:', value: 'R$ 39.450,00', valueColor: 'text-[#34D399]', href: '/admin/profissionais' },
      { id: 'fat-3', rank: 3, nome: 'Lucas Silveira', sub: 'Tatuagem & Piercing', desc: 'GMV no período:', value: 'R$ 31.200,00', valueColor: 'text-[#34D399]', href: '/admin/profissionais' },
      { id: 'fat-4', rank: 4, nome: 'Dra. Juliana Meirelles', sub: 'Estética Avançada', desc: 'GMV no período:', value: 'R$ 27.800,00', valueColor: 'text-[#34D399]', href: '/admin/profissionais' },
    ],
    agendamentos: [
      { id: 'agd-1', rank: 1, nome: 'Beatriz Mendes', sub: 'Lash Designer', desc: 'Sessões realizadas:', value: '184 agendamentos', valueColor: 'text-[#B8A9D9]', href: '/admin/profissionais' },
      { id: 'agd-2', rank: 2, nome: 'Mariana Rocha', sub: 'Micropigmentação', desc: 'Sessões realizadas:', value: '162 agendamentos', valueColor: 'text-[#B8A9D9]', href: '/admin/profissionais' },
      { id: 'agd-3', rank: 3, nome: 'Renan Barreto', sub: 'Barbearia & Visagismo', desc: 'Sessões realizadas:', value: '149 agendamentos', valueColor: 'text-[#B8A9D9]', href: '/admin/profissionais' },
      { id: 'agd-4', rank: 4, nome: 'Carla Dias', sub: 'Nail Designer', desc: 'Sessões realizadas:', value: '138 agendamentos', valueColor: 'text-[#B8A9D9]', href: '/admin/profissionais' },
    ],
    clientes: [
      { id: 'cli-1', rank: 1, nome: 'Espaço Bella Donna', sub: 'Estúdio Moema', desc: 'Base de clientes:', value: '520 ativas', valueColor: 'text-sky-400', href: '/admin/profissionais' },
      { id: 'cli-2', rank: 2, nome: 'Dra. Camila Alencar', sub: 'Estética Avançada', desc: 'Base de clientes:', value: '412 ativas', valueColor: 'text-sky-400', href: '/admin/profissionais' },
      { id: 'cli-3', rank: 3, nome: 'Juliana Prado', sub: 'Design de Sobrancelhas', desc: 'Base de clientes:', value: '388 ativas', valueColor: 'text-sky-400', href: '/admin/profissionais' },
      { id: 'cli-4', rank: 4, nome: 'Larissa Faria', sub: 'Podologia Clínica', desc: 'Base de clientes:', value: '345 ativas', valueColor: 'text-sky-400', href: '/admin/profissionais' },
    ],
    avaliacoes: [
      { id: 'av-1', rank: 1, nome: 'Studio Glow Jardins', sub: 'Nota média 5.0', desc: 'Feedbacks recebidos:', value: '230 avaliações', valueColor: 'text-[#F5B84B]', href: '/admin/profissionais' },
      { id: 'av-2', rank: 2, nome: 'Beatriz Mendes', sub: 'Nota média 4.9', desc: 'Feedbacks recebidos:', value: '194 avaliações', valueColor: 'text-[#F5B84B]', href: '/admin/profissionais' },
      { id: 'av-3', rank: 3, nome: 'Lucas Silveira', sub: 'Nota média 4.9', desc: 'Feedbacks recebidos:', value: '158 avaliações', valueColor: 'text-[#F5B84B]', href: '/admin/profissionais' },
      { id: 'av-4', rank: 4, nome: 'Renan Barreto', sub: 'Nota média 4.9', desc: 'Feedbacks recebidos:', value: '142 avaliações', valueColor: 'text-[#F5B84B]', href: '/admin/profissionais' },
    ],
  }

  // Ícones de ranking sem fundo — puramente a cor do ícone
  function RankIcon({ rank }: { rank: 1 | 2 | 3 | 4 }) {
    if (rank === 1) return <Trophy className="h-4 w-4 text-[#F5B84B]" />
    if (rank === 2) return <Medal className="h-4 w-4 text-[#B8A9D9]" />
    if (rank === 3) return <Medal className="h-4 w-4 text-[#E5A97D]" />
    return <Medal className="h-4 w-4 text-[#A9A1B5]" />
  }

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      
      {/* 1. CABEÇALHO EXECUTIVO DO DASHBOARD */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Visão Geral
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Acompanhe receita, crescimento e saúde da operação em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08]">
            {(
              [
                { id: 'hoje', label: 'Hoje', title: 'Operação de hoje' },
                { id: 'mes', label: 'Mês', title: 'Mês atual: do dia 1º ao último dia do mês' },
                { id: 'ano', label: 'Ano', title: 'Ano vigente consolidado' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => handlePeriodChange(item.id)}
                disabled={isPending}
                title={item.title}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-transform duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                  period === item.id
                    ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                    : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isPending && <Loader2 className="h-3.5 w-3.5 text-[#B8A9D9] animate-spin mx-1" />}
          </div>

          <button
            type="button"
            onClick={toggleShowAiCard}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-transform duration-150 ease-out cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.97] ${
              showAiCard
                ? 'bg-[#B8A9D9] text-[#15111F] border-[#B8A9D9] font-bold'
                : 'bg-[#15111F] hover:bg-[#1f1a2b] text-[#A9A1B5] hover:text-[#F8F5FA] border-white/[0.08]'
            }`}
            title="Assistente Lumê"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#B8A9D9]" />
            <span className="hidden sm:inline">Assistente Lumê</span>
          </button>
        </div>
      </div>

      {/* CARD DE INSIGHT DO ASSISTENTE IA */}
      {showAiCard && (
        <AdminAiInsightCard
          initialInsight={initialAiInsight || 'Operação estável. A curva de novos cadastros e a retenção de clientes demonstram crescimento contínuo de receita recorrente.'}
          onOpenChat={() => window.dispatchEvent(new CustomEvent('open-admin-ai-chat'))}
        />
      )}

      {/* 2. CARDS DE KPIS ESTRATÉGICOS (CLICÁVEIS PARA EXPANDIR HISTÓRICO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div
          onClick={() => setExpandedCard(expandedCard === 'mrr' ? null : 'mrr')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedCard === 'mrr'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setExpandedCard(expandedCard === 'mrr' ? null : 'mrr')
            }
          }}
          whileHover={{ y: -3, scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.55 }}
          className={`min-w-0 bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A9D9] ${
            expandedCard === 'mrr'
              ? 'border-2 border-[#B8A9D9] ring-2 ring-[#B8A9D9]/30'
              : 'border border-[#B8A9D9]/30 hover:border-[#B8A9D9]/70'
          }`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="min-w-0">
            <span className="block min-w-0 max-w-full truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
              {period === 'hoje'
                ? 'Receita de hoje'
                : period === 'ano'
                ? 'Receita anual acumulada (ARR)'
                : 'Receita recorrente mensal (MRR)'}
            </span>
            <div className="mt-2.5 flex min-w-0 items-baseline gap-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={periodMetrics.mrr} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="block min-w-0 max-w-full truncate whitespace-nowrap text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  {periodMetrics.mrr >= 1000000
                    ? `R$ ${(periodMetrics.mrr / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`
                    : `R$ ${periodMetrics.mrr.toLocaleString('pt-BR')},00`}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-[#34D399]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{periodMetrics.mrrPct}</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] text-[#A9A1B5] font-normal">
              {period === 'hoje' ? (
                <>Projeção do dia: <strong className="text-[#F8F5FA] font-semibold">R$ 5.200,00</strong></>
              ) : period === 'ano' ? (
                <>MRR médio: <strong className="text-[#F8F5FA] font-semibold">R$ 142.850,00</strong></>
              ) : (
                <>Mês vigente: <strong className="text-[#F8F5FA] font-semibold">1º ao fim do mês</strong></>
              )}
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 19 C 12 17, 20 12, 30 11 C 40 10, 48 13, 56 6 L 64 3" stroke="#B8A9D9" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>

        <motion.div
          onClick={() => setExpandedCard(expandedCard === 'profissionais' ? null : 'profissionais')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedCard === 'profissionais'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setExpandedCard(expandedCard === 'profissionais' ? null : 'profissionais')
            }
          }}
          whileHover={{ y: -3, scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.55 }}
          className={`min-w-0 bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A9D9] ${
            expandedCard === 'profissionais'
              ? 'border-2 border-[#38BDF8] ring-2 ring-[#38BDF8]/30'
              : 'border border-[#38BDF8]/30 hover:border-[#38BDF8]/70'
          }`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#38BDF8]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="min-w-0">
            <span className="block min-w-0 max-w-full truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
              Profissionais ativas
            </span>
            <div className="mt-2.5 flex min-w-0 items-baseline gap-2 whitespace-nowrap">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={periodMetrics.ativas} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="block min-w-0 max-w-full truncate whitespace-nowrap text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  {periodMetrics.ativas.toLocaleString('pt-BR')}
                </motion.span>
              </AnimatePresence>
              <span className="shrink-0 whitespace-nowrap text-xs text-[#A9A1B5] font-semibold">assinantes</span>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-[#38BDF8]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{periodMetrics.novosLabel}</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] text-[#A9A1B5] font-normal">
              Mix: <strong className="text-[#F8F5FA] font-semibold">1.180 Solo · 248 Studio</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 18 C 14 16, 24 13, 34 9 C 44 8, 54 5, 64 3" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>

        <motion.div
          onClick={() => setExpandedCard(expandedCard === 'gmv' ? null : 'gmv')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedCard === 'gmv'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setExpandedCard(expandedCard === 'gmv' ? null : 'gmv')
            }
          }}
          whileHover={{ y: -3, scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.55 }}
          className={`min-w-0 bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A9D9] ${
            expandedCard === 'gmv'
              ? 'border-2 border-[#F5B84B] ring-2 ring-[#F5B84B]/30'
              : 'border border-[#F5B84B]/30 hover:border-[#F5B84B]/70'
          }`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5B84B]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="min-w-0">
            <span className="block min-w-0 max-w-full truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
              Volume transacionado (GMV)
            </span>
            <div className="mt-2.5 flex min-w-0 items-baseline gap-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={periodMetrics.gmv} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="block min-w-0 max-w-full truncate whitespace-nowrap text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  {periodMetrics.gmv >= 1000000
                    ? `R$ ${(periodMetrics.gmv / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`
                    : periodMetrics.gmv >= 1000
                    ? `R$ ${(periodMetrics.gmv / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`
                    : `R$ ${periodMetrics.gmv.toLocaleString('pt-BR')},00`}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-[#F5B84B]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{periodMetrics.gmvPct}</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] text-[#A9A1B5] font-normal">
              Ticket médio: <strong className="text-[#F8F5FA] font-semibold">{periodMetrics.ticketMedio}</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 20 C 12 18, 22 14, 32 12 C 42 10, 52 7, 64 2" stroke="#F5B84B" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>

        <motion.div
          onClick={() => setExpandedCard(expandedCard === 'conversao' ? null : 'conversao')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedCard === 'conversao'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setExpandedCard(expandedCard === 'conversao' ? null : 'conversao')
            }
          }}
          whileHover={{ y: -3, scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.55 }}
          className={`min-w-0 bg-[#18141F] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A9D9] ${
            expandedCard === 'conversao'
              ? 'border-2 border-[#34D399] ring-2 ring-[#34D399]/30'
              : 'border border-[#34D399]/30 hover:border-[#34D399]/70'
          }`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#34D399]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="min-w-0">
            <span className="block min-w-0 max-w-full truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
              Conversão de teste
            </span>
            <div className="mt-2.5 flex min-w-0 items-baseline gap-2 whitespace-nowrap">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={periodMetrics.conversao} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="block min-w-0 max-w-full truncate whitespace-nowrap text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  {periodMetrics.conversao}
                </motion.span>
              </AnimatePresence>
              <span className="shrink-0 whitespace-nowrap text-xs text-[#A9A1B5] font-semibold">Saudável</span>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-[#34D399]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Retenção 98,2% da base</span>
            </div>
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] text-[#A9A1B5] font-normal">
              Churn líquido: <strong className="text-[#F8F5FA] font-semibold">{periodMetrics.churn}</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path d="M2 17 C 14 15, 24 13, 34 11 C 44 9, 54 6, 64 4" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {expandedCard && (
          <motion.div
            key={expandedCard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <AdminKpiHistoryPanel
              title={dashboardKpiHistory[expandedCard].title}
              subtitle={dashboardKpiHistory[expandedCard].subtitle}
              color={dashboardKpiHistory[expandedCard].color}
              history={dashboardKpiHistory[expandedCard].history}
              onClose={() => setExpandedCard(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SEÇÃO DE GRÁFICOS: EVOLUÇÃO E DISTRIBUIÇÃO DA BASE ATIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO 1: EVOLUÇÃO — título dinâmico com botão de projeção e KPIs */}
        <div className="lg:col-span-2 bg-[#18141F] p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#B8A9D9]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
            <div>
              <h3 className="text-base font-bold text-[#F8F5FA] tracking-tight">
                {chartMetric === 'mrr' && 'Evolução de Receita'}
                {chartMetric === 'contas' && 'Evolução de Novas Contas'}
                {chartMetric === 'gmv' && 'Evolução de Volume Transacionado'}
              </h3>
              <p className="text-xs text-[#A9A1B5] font-normal mt-0.5">
                {showProjection
                  ? 'Projeção estimada para os próximos 6 meses'
                  : 'Visão consolidada dos últimos 6 meses'}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#34D399]">
              {chartMetric === 'mrr' ? periodMetrics.mrrPct : chartMetric === 'contas' ? periodMetrics.novosLabel : periodMetrics.gmvPct}
            </span>
          </div>

          {/* Curva suave em lavanda (#B8A9D9) e projeção tracejada */}
          <div className="h-72 w-full pt-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionChartData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaLilacGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B8A9D9" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#B8A9D9" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="areaProjGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#A9A1B5', fontWeight: 600 }}
                  stroke="rgba(255,255,255,0.08)"
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#A9A1B5', fontWeight: 600 }}
                  stroke="rgba(255,255,255,0.08)"
                  domain={chartMetric === 'mrr' ? [0, 250000] : chartMetric === 'gmv' ? [0, 6500000] : [0, 180]}
                  ticks={
                    chartMetric === 'mrr'
                      ? [0, 50000, 100000, 150000, 200000, 250000]
                      : chartMetric === 'gmv'
                      ? [0, 1000000, 2500000, 4000000, 5500000, 6500000]
                      : [0, 40, 80, 120, 160]
                  }
                  tickFormatter={(val) => {
                    if (chartMetric === 'mrr') {
                      return val === 0 ? 'R$ 0' : `R$ ${val / 1000}k`
                    }
                    if (chartMetric === 'gmv') {
                      return val === 0 ? 'R$ 0' : `R$ ${(val / 1000000).toFixed(1)}M`
                    }
                    return `${val}`
                  }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload
                      return (
                        <div className="bg-[#15111F] border border-white/10 rounded-xl p-3.5 shadow-2xl backdrop-blur-md min-w-[240px] text-left">
                          <div className="pb-2 border-b border-white/10">
                            <span className="text-xs font-bold text-[#F8F5FA] tracking-tight">
                              {item.fullMes}
                            </span>
                          </div>
                          <div className="pt-2.5 space-y-1.5">
                            {chartMetric === 'mrr' && (
                              <>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#A9A1B5]">Receita Recorrente:</span>
                                  <strong className="text-[#F8F5FA] font-bold">
                                    R$ {item.mrr.toLocaleString('pt-BR')},00
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#A9A1B5]">ARR Estimado:</span>
                                  <strong className="text-[#B8A9D9]">
                                    R$ {((item.mrr * 12) / 1000000).toFixed(2).replace('.', ',')}M
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.05]">
                                  <span className="text-[#A9A1B5]">Tendência:</span>
                                  <span className="text-[#34D399] font-medium">
                                    {item.isProjection ? 'Projeção estimada +8% MoM' : '+14,2% vs mês ant.'}
                                  </span>
                                </div>
                              </>
                            )}
                            {chartMetric === 'contas' && (
                              <>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#A9A1B5]">Novas Contas Ativas:</span>
                                  <strong className="text-[#F8F5FA] font-bold">
                                    {item.contas} contas
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#A9A1B5]">Base Total Estimada:</span>
                                  <strong className="text-[#B8A9D9]">
                                    {(1428 + (item.contas - 94)).toLocaleString('pt-BR')} profissionais
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.05]">
                                  <span className="text-[#A9A1B5]">Conversão média:</span>
                                  <span className="text-[#34D399] font-medium">68,4% no funil</span>
                                </div>
                              </>
                            )}
                            {chartMetric === 'gmv' && (
                              <>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#A9A1B5]">Volume Transacionado:</span>
                                  <strong className="text-[#F8F5FA] font-bold">
                                    R$ {item.gmv.toLocaleString('pt-BR')},00
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#A9A1B5]">Média por Profissional:</span>
                                  <strong className="text-[#B8A9D9]">
                                    R$ {Math.round(item.gmv / 1428).toLocaleString('pt-BR')},00
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.05]">
                                  <span className="text-[#A9A1B5]">Sessões movimentadas:</span>
                                  <span className="text-[#34D399] font-medium">
                                    ~{Math.round(item.gmv / 90).toLocaleString('pt-BR')} agendamentos
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                {/* Linha sólida histórica até Set/26 */}
                <Area
                  type="monotone"
                  dataKey={chartMetric === 'mrr' ? 'mrrHist' : chartMetric === 'gmv' ? 'gmvHist' : 'contasHist'}
                  stroke="#B8A9D9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaLilacGradient)"
                  dot={{ r: 4, fill: '#F8F5FA', stroke: '#8675A9', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#F8F5FA', stroke: '#B8A9D9', strokeWidth: 2.5 }}
                />
                {/* Linha tracejada projetada (Out/26 a Mar/27) quando toggle ativado */}
                {showProjection && (
                  <Area
                    type="monotone"
                    dataKey={chartMetric === 'mrr' ? 'mrrProj' : chartMetric === 'gmv' ? 'gmvProj' : 'contasProj'}
                    stroke="#A78BFA"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#areaProjGradient)"
                    dot={{ r: 3.5, fill: '#A78BFA', stroke: '#15111F', strokeWidth: 1.5 }}
                    activeDot={{ r: 5.5, fill: '#A78BFA', stroke: '#F8F5FA', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Linha ultra fina e setinha centralizada para abrir os filtros da seção */}
          <div className="relative pt-1">
            <div className="border-t border-white/[0.06] w-full" />
            <div className="flex justify-center -mt-3">
              <button
                type="button"
                onClick={() => setShowDashboardGraphFilters(!showDashboardGraphFilters)}
                className="h-6 w-8 rounded-md bg-[#18141F] border border-white/[0.08] hover:border-[#B8A9D9]/40 flex items-center justify-center text-[#A9A1B5] hover:text-[#F8F5FA] transition active:scale-[0.95] cursor-pointer"
                title={showDashboardGraphFilters ? 'Ocultar filtros' : 'Expandir filtros'}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showDashboardGraphFilters ? 'rotate-180 text-[#B8A9D9]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filtros de Métrica e Projeção transferidos do topo para o rodapé */}
          {showDashboardGraphFilters && (
            <div className="pt-2 animate-in fade-in duration-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="w-full sm:w-auto grid grid-cols-3 gap-1 p-1 bg-[#15111F] rounded-xl border border-white/[0.06]">
                {(
                  [
                    { id: 'mrr', label: 'Receita' },
                    { id: 'contas', label: 'Contas' },
                    { id: 'gmv', label: 'Volume' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setChartMetric(m.id)}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 text-center cursor-pointer active:scale-[0.97] ${
                      chartMetric === m.id
                        ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs scale-[1.01]'
                        : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowProjection(!showProjection)}
                className={`w-full sm:w-auto px-3.5 py-1.5 text-[11px] font-semibold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                  showProjection
                    ? 'bg-[#B8A9D9] text-[#15111F] border-[#B8A9D9] font-bold shadow-xs'
                    : 'bg-[#15111F] text-[#A9A1B5] hover:text-[#F8F5FA] border-white/[0.08]'
                }`}
                title="Alternar projeção de crescimento para os próximos 6 meses"
              >
                <TrendingUp className="h-3 w-3" />
                <span>{showProjection ? 'Projeção Ativa' : 'Exibir Projeção'}</span>
              </button>
            </div>
          )}
        </div>

        {/* GRÁFICO 2: DISTRIBUIÇÃO DA BASE ATIVA (DONUT com Teste) */}
        <div className="bg-[#18141F] p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#F8F5FA] tracking-tight">Distribuição da base ativa</h3>
            <span className="text-xs font-semibold text-[#A9A1B5]">{totalBase} contas</span>
          </div>

          {/* Gráfico Donut com Total Contas Centralizado */}
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activePlansData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {activePlansData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#F8F5FA] tracking-tight">{totalBase}</span>
              <span className="text-[9px] font-bold text-[#A9A1B5] uppercase tracking-widest mt-0.5">CONTAS</span>
            </div>
          </div>

          {/* Legenda dos planos */}
          <div className="space-y-2 pt-1 border-t border-white/[0.08]">
            {activePlansData.map((plan) => (
              <div
                key={plan.name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#15111F] border border-white/[0.05] transition hover:border-white/10"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: plan.color }} />
                  <div className="truncate">
                    <span className="text-xs font-bold text-[#F8F5FA] block truncate">{plan.name}</span>
                    <span className="text-[10px] text-[#A9A1B5] block truncate">{plan.sub}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#F8F5FA] block">
                    {plan.pct}% <span className="text-[10px] text-[#A9A1B5] font-normal">({plan.count})</span>
                  </span>
                  <span className="text-[10px] text-[#B8A9D9] block font-medium">{plan.revenue}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Linha ultra fina e setinha centralizada para abrir o filtro de período sincronizado */}
          <div className="relative pt-1">
            <div className="border-t border-white/[0.06] w-full" />
            <div className="flex justify-center -mt-3">
              <button
                type="button"
                onClick={() => setShowDashboardGraphFilters(!showDashboardGraphFilters)}
                className="h-6 w-8 rounded-md bg-[#18141F] border border-white/[0.08] hover:border-[#B8A9D9]/40 flex items-center justify-center text-[#A9A1B5] hover:text-[#F8F5FA] transition active:scale-[0.95] cursor-pointer"
                title={showDashboardGraphFilters ? 'Ocultar filtro' : 'Expandir filtro de período'}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showDashboardGraphFilters ? 'rotate-180 text-[#B8A9D9]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filtro Geral / Mensal / Anual (Geral é o padrão) com estética IDÊNTICA ao ranking de profissionais */}
          {showDashboardGraphFilters && (
            <div className="pt-2 animate-in fade-in duration-200">
              <div className="w-full grid grid-cols-3 gap-1 p-1 bg-[#15111F] rounded-xl border border-white/[0.06]">
                {(
                  [
                    { id: 'geral', label: 'Geral' },
                    { id: 'mensal', label: 'Mensal' },
                    { id: 'anual', label: 'Anual' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDistribuicaoPeriod(p.id)}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 text-center cursor-pointer active:scale-[0.97] capitalize ${
                      distribuicaoPeriod === p.id
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

      {/* 4. INDICADORES OPERACIONAIS (ENTRE GRÁFICOS E PRIORIDADES) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#A9A1B5] uppercase tracking-wider">
            Indicadores Operacionais
          </h2>
          <span className="text-[11px] text-[#A9A1B5]">
            Métricas de apoio do ecossistema
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Indicador 1: Vencimentos 48h */}
          <div className="min-w-0 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[150px] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B8A9D9]/10 rounded-full blur-xl pointer-events-none" />
            <div className="min-w-0">
              <span className="block min-w-0 truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
                Renovações próximas
              </span>
              <div className="mt-2 flex min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                <span className="shrink-0 whitespace-nowrap text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  42
                </span>
                <span className="min-w-0 truncate whitespace-nowrap text-xs text-[#F5B84B] font-semibold">em 48h</span>
              </div>
              <p className="mt-1 min-w-0 truncate whitespace-nowrap text-xs text-[#A9A1B5]">
                Processamento automático Asaas
              </p>
            </div>
            <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-white/[0.08] pt-2.5 text-[11px] text-[#A9A1B5]">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">Volume estimado</span>
              <strong className="max-w-[50%] shrink-0 truncate whitespace-nowrap font-semibold text-[#E9D5FF]">R$ 2.935,00</strong>
            </div>
          </div>

          {/* Indicador 2: Ticket Médio */}
          <div className="min-w-0 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[150px] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B8A9D9]/10 rounded-full blur-xl pointer-events-none" />
            <div className="min-w-0">
              <span className="block min-w-0 truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
                Ticket médio da base
              </span>
              <div className="mt-2 flex min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                <span className="shrink-0 whitespace-nowrap text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  R$ 99,90
                </span>
                <span className="min-w-0 truncate whitespace-nowrap text-xs text-[#34D399] font-semibold">+3,2% MoM</span>
              </div>
              <p className="mt-1 min-w-0 truncate whitespace-nowrap text-xs text-[#A9A1B5]">
                Média ponderada Solo + Studio
              </p>
            </div>
            <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-white/[0.08] pt-2.5 text-[11px] text-[#A9A1B5]">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">Base do ecossistema</span>
              <strong className="max-w-[50%] shrink-0 truncate whitespace-nowrap font-semibold text-[#E9D5FF]">Solo + Studio</strong>
            </div>
          </div>

          {/* Indicador 3: NPS */}
          <div className="min-w-0 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[150px] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B8A9D9]/10 rounded-full blur-xl pointer-events-none" />
            <div className="min-w-0">
              <span className="block min-w-0 truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
                Satisfação NPS
              </span>
              <div className="mt-2 flex min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                <span className="shrink-0 whitespace-nowrap text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  78
                </span>
                <span className="min-w-0 truncate whitespace-nowrap text-xs text-[#B8A9D9] font-semibold">Zona de Excelência</span>
              </div>
              <p className="mt-1 min-w-0 truncate whitespace-nowrap text-xs text-[#A9A1B5]">
                Avaliadoras ativas no mês
              </p>
            </div>
            <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-white/[0.08] pt-2.5 text-[11px] text-[#A9A1B5]">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">Meta do trimestre</span>
              <strong className="max-w-[50%] shrink-0 truncate whitespace-nowrap font-semibold text-[#E9D5FF]">&gt; 75 pts</strong>
            </div>
          </div>

          {/* Indicador 4: Vitrines Ativas */}
          <div className="min-w-0 bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[150px] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B8A9D9]/10 rounded-full blur-xl pointer-events-none" />
            <div className="min-w-0">
              <span className="block min-w-0 truncate whitespace-nowrap text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider">
                Vitrines online
              </span>
              <div className="mt-2 flex min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                <span className="shrink-0 whitespace-nowrap text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                  1.390
                </span>
                <span className="min-w-0 truncate whitespace-nowrap text-xs text-[#38BDF8] font-semibold">97,4% no ar</span>
              </div>
              <p className="mt-1 min-w-0 truncate whitespace-nowrap text-xs text-[#A9A1B5]">
                Páginas públicas recebendo visitas
              </p>
            </div>
            <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-white/[0.08] pt-2.5 text-[11px] text-[#A9A1B5]">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">Disponibilidade</span>
              <strong className="max-w-[50%] shrink-0 truncate whitespace-nowrap font-semibold text-[#E9D5FF]">99,9% uptime</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRIORIDADES DA GESTÃO (DEBAIXO DOS CARDS DE EVOLUÇÃO E DISTRIBUIÇÃO) */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#B8A9D9]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#B8A9D9]" />
            <h2 className="text-xs sm:text-sm font-bold text-[#F8F5FA] uppercase tracking-wider">
              Prioridades da Gestão
            </h2>
          </div>
          <span className="text-[11px] text-[#A9A1B5]">
            {priorities.length} ações com alto impacto operacional
          </span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {(showAllPriorities ? priorities : priorities.slice(0, 3)).map((item) => (
            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`h-2 w-2 rounded-full ${item.color} mt-2 shrink-0`} />
                <div>
                  <span className="text-sm font-bold text-[#F8F5FA] block">{item.title}</span>
                  <p className="text-xs text-[#A9A1B5] mt-0.5">{item.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Link
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg ${item.btnColor} border text-xs font-semibold active:scale-[0.97] transition-all duration-150`}
                >
                  {item.btnLabel}
                </Link>
                <button
                  type="button"
                  onClick={() => setPriorities(prev => prev.filter(p => p.id !== item.id))}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#A9A1B5] hover:text-[#F87171] transition cursor-pointer"
                  title="Remover prioridade"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {priorities.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAllPriorities(!showAllPriorities)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04] transition cursor-pointer border border-white/[0.06]"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllPriorities ? 'rotate-180' : ''}`} />
            <span>{showAllPriorities ? 'Ver menos' : `Ver mais ${priorities.length - 3} prioridades`}</span>
          </button>
        )}
      </div>

      {/* 6. LISTAS OPERACIONAIS: ALERTAS PRIORITÁRIOS E PROFISSIONAIS EM DESTAQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* BLOCO ESQUERDO: ALERTAS PRIORITÁRIOS */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden h-full">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#B8A9D9]/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08] min-h-[40px]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#F5B84B]" />
              <h3 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">Alertas prioritários</h3>
            </div>
            
            <span className="text-xs font-semibold text-[#A9A1B5]">4 ações prioritárias</span>
          </div>

          <div className="divide-y divide-white/[0.06] flex-1">
            <AnimatePresence initial={false}>
            {[
              { id: 'alert1', category: 'pagamento', icon: AlertCircle, nome: 'Studio Glow & Co', tipo: 'Falha de pagamento', tipoColor: 'text-[#F87171]', iconColor: 'text-[#F87171]', desc: 'Cartão final 4821 recusado · Tentativa 2 de 3', btnLabel: 'Reenviar link', btnColor: 'bg-[#F87171]/15 hover:bg-[#F87171]/25 text-[#F87171] border-[#F87171]/30', phone: '5511999990001', msg: 'Olá, equipe Studio Glow & Co! Identificamos uma falha no processamento da assinatura Lumê (cartão final 4821). Para manter seu link e agendamentos ativos, atualize sua forma de pagamento.' },
              { id: 'alert2', category: 'trial', icon: Clock, nome: 'Beatriz Mendes', tipo: 'Período de teste', tipoColor: 'text-[#F5B84B]', iconColor: 'text-[#F5B84B]', desc: 'Trial termina em 24h · 38 agendamentos gerados', btnLabel: 'Estender trial', btnColor: 'bg-[#B8A9D9]/15 hover:bg-[#B8A9D9]/25 text-[#B8A9D9] border-[#B8A9D9]/30', phone: '5511988880002', msg: 'Olá, Beatriz! Seu período de teste de 30 dias no Lumê encerra em 24h. Você já registrou 38 agendamentos! Ative seu plano Solo com valor promocional e continue sem interrupções.' },
              { id: 'alert3', category: 'atividade', icon: TrendingDown, nome: 'Camila Rossi', tipo: 'Queda de atividade', tipoColor: 'text-[#F5B84B]', iconColor: 'text-[#F5B84B]', desc: 'Queda de 60% nos agendamentos nas últimas 2 semanas', btnLabel: 'Ver perfil', btnColor: 'bg-white/[0.06] hover:bg-white/[0.1] text-[#F8F5FA] border-white/10', phone: '5511977770003', msg: 'Olá, Camila! Percebemos uma oscilação na sua agenda nas últimas semanas. Estamos à divulgação e vitrine no Lumê!' },
              { id: 'alert4', category: 'cobranca', icon: CreditCard, nome: 'Juliana Prado', tipo: 'Informativo', tipoColor: 'text-[#A9A1B5]', iconColor: 'text-[#A9A1B5]', desc: 'Renovação anual programada para amanhã · R$ 694,80', btnLabel: 'Ver perfil', btnColor: 'bg-white/[0.06] hover:bg-white/[0.1] text-[#F8F5FA] border-white/10', phone: '5511966660004', msg: 'Olá, Juliana! Lembrando que a renovação da sua anuidade Lumê está agendada para amanhã (R$ 694,80). Caso precise de qualquer ajuste na nota fiscal, nos avise.' },
            ]
              .filter(a => alertFilter === 'todos' || a.category === alertFilter)
              .map((alert) => {
                const AlertIcon = alert.icon
                return (
                  <motion.div
                    key={`${alertFilter}-${alert.id}`}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="py-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Ícone sem fundo — só o ícone colorido */}
                        <div className={`h-9 w-9 flex items-center justify-center shrink-0 ${alert.iconColor}`}>
                          <AlertIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-xs sm:text-sm font-bold text-[#F8F5FA]">{alert.nome}</span>
                            <span className="text-xs text-[#A9A1B5]">·</span>
                            <span className={`text-xs font-semibold ${alert.tipoColor}`}>{alert.tipo}</span>
                          </div>
                          <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">{alert.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAlertMsgOpen(alertMsgOpen === alert.id ? null : alert.id)}
                          className="h-8 w-8 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 flex items-center justify-center transition cursor-pointer active:scale-[0.97]"
                          title="Enviar via WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`h-8 px-3 py-1.5 rounded-lg ${alert.btnColor} border text-xs font-semibold transition cursor-pointer active:scale-[0.97] flex items-center justify-center`}
                        >
                          {alert.btnLabel}
                        </button>
                      </div>
                    </div>
                    {alertMsgOpen === alert.id && (
                      <div className="mt-3 p-3.5 rounded-xl bg-[#0E2A1A] border border-[#25D366]/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#25D366] flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Mensagem pronta — WhatsApp
                          </span>
                          <button type="button" onClick={() => setAlertMsgOpen(null)} className="text-[#A9A1B5] hover:text-[#F8F5FA] cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-[#A9A1B5] leading-relaxed">{alert.msg}</p>
                        <a
                          href={`https://wa.me/${alert.phone}?text=${encodeURIComponent(alert.msg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#25D366] hover:bg-[#22c25e] text-white text-xs font-bold transition cursor-pointer active:scale-[0.97]"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Abrir no WhatsApp
                        </a>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Filtros no rodapé com animação suave e transição de preenchimento */}
          <div className="pt-3 border-t border-white/[0.08]">
            <div className="w-full grid grid-cols-5 gap-1 p-1 bg-[#15111F] rounded-xl border border-white/[0.06]">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'pagamento', label: 'Falhas' },
                { id: 'trial', label: 'Trial' },
                { id: 'atividade', label: 'Atividade' },
                { id: 'cobranca', label: 'Renovações' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAlertFilter(f.id as any)}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 text-center cursor-pointer active:scale-[0.97] ${
                    alertFilter === f.id
                      ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs scale-[1.01]'
                      : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BLOCO DIREITO: TOP PERFORMERS COM EXPANSÃO ACCORDION E FILTRO PERSONALIZADO */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden h-full">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#B8A9D9]/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08] min-h-[40px]">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#B8A9D9]" />
              <h3 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">Profissionais em destaque</h3>
            </div>

            <span className="text-xs font-semibold text-[#A9A1B5]">{totalBase} cadastradas</span>
          </div>

          {/* Lista de Performers */}
          <div className="divide-y divide-white/[0.06] flex-1">
            <AnimatePresence initial={false}>
            {performersData[performerFilter].map((perf) => (
              <motion.div
                key={`${performerFilter}-${perf.id}`}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Ícone de posição sem fundo */}
                  <div className="h-8 w-8 flex items-center justify-center shrink-0">
                    <RankIcon rank={perf.rank} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate block">
                      {perf.nome}
                    </span>
                    <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                      {perf.sub}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`text-xs font-bold ${perf.valueColor}`}>
                    {perf.value}
                  </span>
                  <a
                    href={perf.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg text-[#A9A1B5] hover:text-[#B8A9D9] hover:bg-white/[0.04] transition cursor-pointer active:scale-[0.97] flex items-center justify-center"
                    title="Ver vitrine pública"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>

          {/* Filtros no rodapé com animação suave e transição de preenchimento */}
          <div className="pt-3 border-t border-white/[0.08]">
            <div className="w-full grid grid-cols-4 gap-1 p-1 bg-[#15111F] rounded-xl border border-white/[0.06]">
              {[
                { id: 'faturamento', label: 'Faturamento' },
                { id: 'agendamentos', label: 'Agendamentos' },
                { id: 'clientes', label: 'Clientes' },
                { id: 'avaliacoes', label: 'Avaliações' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPerformerFilter(f.id as any)}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 text-center cursor-pointer active:scale-[0.97] ${
                    performerFilter === f.id
                      ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs scale-[1.01]'
                      : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

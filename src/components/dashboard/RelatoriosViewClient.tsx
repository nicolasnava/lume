'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  RelatorioMesAtualData,
  RelatorioMesFechadoData,
  salvarMetaMensalAction,
  getRelatoriosEMetasAction,
} from '@/app/actions/reports'
import Toast from '@/components/ui/Toast'

const MESES_DO_ANO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Pencil,
  Plus,
  Loader2,
  Trophy,
  Scissors,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react'

interface RelatoriosViewClientProps {
  initialMesAtual: RelatorioMesAtualData
  initialHistorico: RelatorioMesFechadoData[]
}

export default function RelatoriosViewClient({
  initialMesAtual,
  initialHistorico,
}: RelatoriosViewClientProps) {
  const [mesAtual, setMesAtual] = useState<RelatorioMesAtualData>(initialMesAtual)
  const [historico, setHistorico] = useState<RelatorioMesFechadoData[]>(initialHistorico)
  const [isCarregandoMes, setIsCarregandoMes] = useState(false)

  // Estado do Modal de Meta
  const [isModalMetaOpen, setIsModalMetaOpen] = useState(false)
  const [metaValorInput, setMetaValorInput] = useState(
    mesAtual.meta.definida
      ? String(mesAtual.meta.valor)
      : mesAtual.metaMesAnteriorSugerida
      ? String(mesAtual.metaMesAnteriorSugerida)
      : '5000'
  )
  const [isSavingMeta, setIsSavingMeta] = useState(false)

  // Estado de Expansão dos Meses Fechados
  const [expandedMonths, setExpandedMonths] = useState<string[]>([])

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Identificação do mês atual e contexto temporal
  const hoje = new Date()
  const mesAtualHojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const isViewingCurrentMonth = mesAtual.mesReferencia === mesAtualHojeStr

  const [anoSel, mesSel] = mesAtual.mesReferencia.split('-').map(Number)
  const dataSel = new Date(anoSel, mesSel - 1, 1)
  const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const isViewingPastMonth = dataSel < dataHoje
  const isViewingFutureMonth = dataSel > dataHoje

  // Seletor Personalizado de Mês/Ano (sem dias)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(anoSel)
  const monthPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPickerYear(anoSel)
  }, [anoSel])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false)
      }
    }
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMonthPickerOpen])

  const nomeMesApenas = useMemo(() => {
    const d = new Date(anoSel, mesSel - 1, 1)
    const m = d.toLocaleDateString('pt-BR', { month: 'long' })
    return m.charAt(0).toUpperCase() + m.slice(1)
  }, [anoSel, mesSel])

  // Opções de meses para o dropdown
  const opcoesMeses = useMemo(() => {
    const opts: { valor: string; label: string }[] = []
    const agora = new Date()
    for (let i = 3; i >= -12; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() + i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      let label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      label = label.charAt(0).toUpperCase() + label.slice(1)
      if (i === 0) {
        label += ' (Atual)'
      }
      opts.push({ valor: val, label })
    }
    return opts
  }, [])

  const handleTrocarMes = async (novoMes: string) => {
    if (novoMes === mesAtual.mesReferencia || isCarregandoMes) return
    setIsCarregandoMes(true)
    try {
      const res = await getRelatoriosEMetasAction(novoMes)
      if (res.success && res.mesAtual) {
        setMesAtual(res.mesAtual)
        if (res.historicoMesesFechados) {
          setHistorico(res.historicoMesesFechados)
        }
        setMetaValorInput(
          res.mesAtual.meta.definida
            ? String(res.mesAtual.meta.valor)
            : res.mesAtual.metaMesAnteriorSugerida
            ? String(res.mesAtual.metaMesAnteriorSugerida)
            : '5000'
        )
      } else {
        setToast({ show: true, message: res.message || 'Erro ao carregar dados do mês.', type: 'error' })
      }
    } catch {
      setToast({ show: true, message: 'Erro de conexão ao carregar mês.', type: 'error' })
    } finally {
      setIsCarregandoMes(false)
    }
  }

  const handleNavegarMes = (delta: -1 | 1) => {
    const [ano, mes] = mesAtual.mesReferencia.split('-').map(Number)
    const d = new Date(ano, mes - 1 + delta, 1)
    const novoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    handleTrocarMes(novoMes)
  }

  const toggleExpandMonth = (id: string) => {
    setExpandedMonths((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    )
  }

  const handleSalvarMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(metaValorInput)
    if (!num || num <= 0) {
      setToast({ show: true, message: 'Informe um valor válido para a meta.', type: 'error' })
      return
    }

    setIsSavingMeta(true)
    const res = await salvarMetaMensalAction({
      mesReferencia: mesAtual.mesReferencia,
      valorMeta: num,
      tipoMeta: 'faturamento',
    })
    setIsSavingMeta(false)

    if (res.success) {
      const faturamento = mesAtual.faturamentoAtual
      const progressoPct = Math.min(100, Math.round((faturamento / num) * 100))
      const faltam = Math.max(0, num - faturamento)
      const ritmoDiario = faltam > 0 ? Math.round(faltam / mesAtual.diasRestantes) : 0
      const status = faturamento >= num ? 'batida' : progressoPct >= 70 ? 'no_caminho' : 'atrasada'

      setMesAtual((prev) => ({
        ...prev,
        meta: {
          ...prev.meta,
          definida: true,
          valor: num,
          progressoPct,
          faltam,
          ritmoDiarioNecessario: ritmoDiario,
          status,
        },
      }))
      setIsModalMetaOpen(false)
      setToast({ show: true, message: 'Meta mensal atualizada com sucesso!', type: 'success' })
    } else {
      setToast({ show: true, message: res.message || 'Erro ao salvar meta.', type: 'error' })
    }
  }

  // Granularidade e Métricas do Gráfico de Evolução do Faturamento
  const [chartGranularity, setChartGranularity] = useState<'dia' | 'mes' | 'ano'>('dia')
  const [showChartMetrics, setShowChartMetrics] = useState(false)

  const revenueChartData = useMemo(() => {
    const rawList = mesAtual.dadosGrafico || []
    const [targetAno, targetMes] = mesAtual.mesReferencia.split('-').map(Number)
    const targetMesIdx = targetMes - 1

    const getBookingVal = (b: any) => {
      if (b.valor_cobrado !== null && b.valor_cobrado !== undefined && Number(b.valor_cobrado) > 0) {
        return Number(b.valor_cobrado)
      }
      if (b.agendamento_servicos && b.agendamento_servicos.length > 0) {
        return b.agendamento_servicos.reduce(
          (acc: number, as: any) => acc + Number(as.preco_no_momento || as.servicos?.preco || 0),
          0
        )
      }
      return Number(b.servicos?.preco || 0)
    }

    if (chartGranularity === 'dia') {
      const diasNoMes = new Date(targetAno, targetMesIdx + 1, 0).getDate()
      const daysTotals = Array.from({ length: diasNoMes }, (_, i) => ({
        day: i + 1,
        total: 0,
        count: 0,
      }))

      rawList.forEach((b) => {
        const bDate = new Date(b.data_hora_inicio)
        if (bDate.getFullYear() === targetAno && bDate.getMonth() === targetMesIdx) {
          const d = bDate.getDate()
          if (d >= 1 && d <= diasNoMes) {
            daysTotals[d - 1].total += getBookingVal(b)
            daysTotals[d - 1].count += 1
          }
        }
      })

      const maxVal = Math.max(...daysTotals.map((d) => d.total), 0)

      return daysTotals.map((d) => {
        const dateObj = new Date(targetAno, targetMesIdx, d.day)
        const fullLabel = dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        })
        return {
          key: `${targetAno}-${targetMesIdx + 1}-${d.day}`,
          label: String(d.day),
          fullLabel,
          total: d.total,
          count: d.count,
          isPeak: maxVal > 0 && d.total === maxVal,
        }
      })
    }

    if (chartGranularity === 'mes') {
      const monthNamesShort = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
      ]
      const monthNamesFull = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
      ]

      const monthsTotals = Array.from({ length: 12 }, () => ({
        total: 0,
        count: 0,
      }))

      rawList.forEach((b) => {
        const bDate = new Date(b.data_hora_inicio)
        if (bDate.getFullYear() === targetAno) {
          const m = bDate.getMonth()
          if (m >= 0 && m <= 11) {
            monthsTotals[m].total += getBookingVal(b)
            monthsTotals[m].count += 1
          }
        }
      })

      const maxVal = Math.max(...monthsTotals.map((m) => m.total), 0)

      return monthsTotals.map((m, idx) => ({
        key: `mes-${idx}`,
        label: monthNamesShort[idx],
        fullLabel: `${monthNamesFull[idx]} de ${targetAno}`,
        total: m.total,
        count: m.count,
        isPeak: maxVal > 0 && m.total === maxVal,
      }))
    }

    // chartGranularity === 'ano'
    const targetYears = [targetAno - 2, targetAno - 1, targetAno]
    const yearsMap: Record<number, { total: number; count: number }> = {}
    targetYears.forEach((y) => {
      yearsMap[y] = { total: 0, count: 0 }
    })

    rawList.forEach((b) => {
      const y = new Date(b.data_hora_inicio).getFullYear()
      if (yearsMap[y]) {
        yearsMap[y].total += getBookingVal(b)
        yearsMap[y].count += 1
      }
    })

    const maxVal = Math.max(...targetYears.map((y) => yearsMap[y].total), 0)

    return targetYears.map((y) => ({
      key: `ano-${y}`,
      label: String(y),
      fullLabel: `Ano de ${y}`,
      total: yearsMap[y].total,
      count: yearsMap[y].count,
      isPeak: maxVal > 0 && yearsMap[y].total === maxVal,
    }))
  }, [mesAtual.dadosGrafico, mesAtual.mesReferencia, chartGranularity])

  const revenueChartMetrics = useMemo(() => {
    const totalFaturado = revenueChartData.reduce((acc, item) => acc + item.total, 0)
    const totalAtendimentos = revenueChartData.reduce((acc, item) => acc + item.count, 0)
    const activeItems = revenueChartData.filter((i) => i.total > 0)
    const divisor = chartGranularity === 'dia' ? revenueChartData.length : activeItems.length || 1
    const media = divisor > 0 ? totalFaturado / divisor : 0
    const peakItem = [...revenueChartData].sort((a, b) => b.total - a.total)[0] || null

    return {
      totalFaturado,
      totalAtendimentos,
      media,
      peakItem: peakItem && peakItem.total > 0 ? peakItem : null,
    }
  }, [revenueChartData, chartGranularity])

  const isMetaBatida = mesAtual.meta.definida && mesAtual.meta.status === 'batida'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Cabeçalho da Página com Seletor e Navegador de Mês */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4A3F5C] tracking-tight">
            Relatórios & Metas
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Acompanhe seu faturamento, ritmo e metas para qualquer período.
          </p>
        </div>

        {/* Navegador de Meses estendendo-se de ponta a ponta com elementos centralizados */}
        <div className="w-full bg-white border border-gray-200/90 rounded-2xl p-1.5 shadow-2xs flex items-center justify-between gap-2 relative">
          <button
            type="button"
            onClick={() => handleNavegarMes(-1)}
            disabled={isCarregandoMes}
            aria-label="Mês anterior"
            className="p-2 rounded-xl text-gray-500 hover:text-[#4A3F5C] hover:bg-gray-100 transition cursor-pointer disabled:opacity-40 shrink-0"
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 flex items-center justify-center relative" ref={monthPickerRef}>
            <button
              type="button"
              onClick={() => {
                setPickerYear(anoSel)
                setIsMonthPickerOpen((prev) => !prev)
              }}
              disabled={isCarregandoMes}
              className="w-full max-w-xs sm:max-w-sm flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl hover:bg-gray-50 transition cursor-pointer text-center"
              title="Clique para selecionar o mês e ano"
            >
              <Calendar className="h-4 w-4 text-[#8675A9] shrink-0" />
              <div className="flex items-baseline gap-1.5 justify-center">
                <span className="text-sm sm:text-base font-black text-[#4A3F5C] capitalize tracking-tight">
                  {nomeMesApenas}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {anoSel}
                </span>
              </div>
            </button>

            {/* Popover Exclusivo de Mês/Ano (sem grade de dias) */}
            {isMonthPickerOpen && (
              <div className="absolute top-full mt-2 z-50 w-72 sm:w-80 bg-white rounded-3xl p-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                {/* Topo: Navegação de Ano */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1.5 text-gray-500 hover:text-[#4A3F5C] rounded-xl hover:bg-gray-100 transition cursor-pointer"
                    title="Ano anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-black text-[#4A3F5C]">{pickerYear}</span>
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="p-1.5 text-gray-500 hover:text-[#4A3F5C] rounded-xl hover:bg-gray-100 transition cursor-pointer"
                    title="Próximo ano"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Grade 3x4 dos 12 Meses */}
                <div className="grid grid-cols-3 gap-2">
                  {MESES_DO_ANO.map((mesNome, idx) => {
                    const mesStr = `${pickerYear}-${String(idx + 1).padStart(2, '0')}-01`
                    const isSelected = mesAtual.mesReferencia === mesStr
                    const isCurrent = mesAtualHojeStr === mesStr

                    return (
                      <button
                        key={mesNome}
                        type="button"
                        onClick={() => {
                          handleTrocarMes(mesStr)
                          setIsMonthPickerOpen(false)
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#4A3F5C] text-white shadow-xs'
                            : 'text-[#4A3F5C] hover:bg-[#B8A9D9]/20'
                        }`}
                      >
                        <span>{mesNome.slice(0, 3)}</span>
                        {isCurrent && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#8675A9]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNavegarMes(1)}
            disabled={isCarregandoMes}
            aria-label="Próximo mês"
            className="p-2 rounded-xl text-gray-500 hover:text-[#4A3F5C] hover:bg-gray-100 transition cursor-pointer disabled:opacity-40 shrink-0"
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: Meta e Progresso do Mês Selecionado */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-5 relative overflow-hidden">
        {isMetaBatida && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-emerald-600 shrink-0 animate-bounce" />
              <span>
                {isViewingPastMonth
                  ? 'Meta batida neste mês! Excelente resultado consolidado.'
                  : 'Parabéns! Você bateu a sua meta deste mês! Excelente trabalho.'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase">
              100% Batida
            </span>
          </div>
        )}

        {/* Header do Card de Metas: Título e Mês com status inline */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#4A3F5C] tracking-tight">
              Meta Mensal de Faturamento
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              <span className="capitalize">{mesAtual.nomeMes}</span>
              <span> — {isViewingCurrentMonth ? 'em andamento' : isViewingPastMonth ? 'concluído' : 'planejamento'}</span>
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C] shrink-0">
            <Target className="h-5 w-5 text-[#8675A9]" />
          </div>
        </div>

        {mesAtual.meta.definida ? (
          <div className="space-y-4">
            {/* Linha de Valores Principais com Hierarquia Clara e Lápis na frente da Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-baseline">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Meta Estipulada
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#4A3F5C] tracking-tight">
                    R$ {mesAtual.meta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsModalMetaOpen(true)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-[#4A3F5C] hover:bg-gray-100 transition cursor-pointer"
                    title="Ajustar Meta Mensal"
                  >
                    <Pencil className="h-4 w-4 text-[#8675A9]" />
                  </button>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {isViewingPastMonth ? 'Faturamento Total Realizado' : 'Faturamento Realizado'}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">
                  R$ {mesAtual.faturamentoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-500">
                  {isViewingPastMonth ? 'Atingimento da meta' : 'Progresso até agora'}
                </span>
                <span className="text-[#4A3F5C] font-black">{mesAtual.meta.progressoPct}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isMetaBatida
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-r from-[#B8A9D9] to-[#4A3F5C]'
                  }`}
                  style={{ width: `${mesAtual.meta.progressoPct}%` }}
                />
              </div>
            </div>

            {/* Resumo de Ritmo e Dias Restantes */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/80 border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  {isMetaBatida ? (
                    'Meta conquistada! O faturamento adicional agora é pura bonificação.'
                  ) : isViewingPastMonth ? (
                    `Mês encerrado com ${mesAtual.meta.progressoPct}% da meta atingida (faltaram R$ ${mesAtual.meta.faltam.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
                  ) : isViewingFutureMonth ? (
                    `Planejamento de meta para o mês de ${mesAtual.nomeMes}.`
                  ) : (
                    <>
                      Faltam <strong className="text-[#4A3F5C]">R$ {mesAtual.meta.faltam.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> e{' '}
                      <strong className="text-[#4A3F5C]">{mesAtual.diasRestantes} dias</strong> restantes no mês.
                    </>
                  )}
                </span>
              </div>

              {!isMetaBatida && isViewingCurrentMonth && mesAtual.meta.ritmoDiarioNecessario > 0 && (
                <div className="shrink-0 inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200/80 font-semibold text-gray-700 shadow-2xs">
                  <span>Ritmo diário:</span>
                  <strong className="text-emerald-700 font-bold">
                    R$ {mesAtual.meta.ritmoDiarioNecessario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                  </strong>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200/80 text-center space-y-3">
            <Target className="h-8 w-8 text-[#8675A9] mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#4A3F5C]">
                {isViewingPastMonth
                  ? 'Nenhuma meta foi estipulada para este mês'
                  : 'Você ainda não definiu a meta deste mês'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Profissionais que definem metas faturam em média 35% mais por terem clareza do ritmo diário necessário.
              </p>
            </div>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalMetaOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#4A3F5C] hover:bg-[#393047] text-white text-xs font-bold transition cursor-pointer"
              >
                Definir Meta Agora
              </button>
              {mesAtual.metaMesAnteriorSugerida && (
                <button
                  type="button"
                  onClick={() => {
                    setMetaValorInput(String(mesAtual.metaMesAnteriorSugerida))
                    setIsModalMetaOpen(true)
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 transition cursor-pointer"
                >
                  Repetir meta anterior (R$ {mesAtual.metaMesAnteriorSugerida})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: Resumo do Mês Selecionado + Destaque Narrativo */}
      <div className="space-y-4">
        {/* Destaque Narrativo Automático */}
        {mesAtual.destaqueNarrativo && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-white to-purple-50/40 border border-gray-200/80 shadow-2xs flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-[#8675A9] shrink-0" />
            <p className="text-xs font-semibold text-[#4A3F5C] leading-relaxed">
              {mesAtual.destaqueNarrativo}
            </p>
          </div>
        )}

        {/* Grade de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Faturamento & Comparativo Proporcional */}
          <div className="rounded-3xl bg-white p-5 border border-gray-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {isViewingPastMonth ? 'Faturamento Total' : 'Faturamento Atual'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div>
              <span className="text-3xl font-black text-[#4A3F5C] tracking-tight">
                R$ {mesAtual.faturamentoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {mesAtual.comparativoMesAnteriorPct !== null ? (
                  mesAtual.comparativoMesAnteriorPct >= 0 ? (
                    <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                      +{mesAtual.comparativoMesAnteriorPct}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-bold text-rose-600">
                      <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                      {mesAtual.comparativoMesAnteriorPct}%
                    </span>
                  )
                ) : (
                  <span className="text-xs text-gray-400 font-medium">Sem base anterior</span>
                )}
                <span className="text-[11px] text-gray-400">
                  {isViewingPastMonth ? 'vs mês anterior' : 'vs mesmo período mês passado'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Atendimentos Concluídos */}
          <div className="rounded-3xl bg-white p-5 border border-gray-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Atendimentos Concluídos
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/25 text-[#4A3F5C]">
                <CheckCircle2 className="h-5 w-5 text-[#8675A9]" />
              </div>
            </div>

            <div>
              <span className="text-3xl font-black text-[#4A3F5C] tracking-tight">
                {mesAtual.atendimentosConcluidos}{' '}
                <span className="text-sm font-bold text-gray-400">
                  {mesAtual.atendimentosConcluidos === 1 ? 'cliente atendida' : 'clientes atendidas'}
                </span>
              </span>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {isViewingCurrentMonth
                  ? `Dia ${mesAtual.diaAtualDoMes} de ${mesAtual.diasNoMes} dias`
                  : isViewingPastMonth
                  ? `${mesAtual.diasNoMes} de ${mesAtual.diasNoMes} dias finalizados`
                  : `${mesAtual.diasNoMes} dias no mês`}
              </p>
            </div>
          </div>

          {/* Card 3: Serviço Campeão de Vendas */}
          <div className="rounded-3xl bg-white p-5 border border-gray-200/80 shadow-2xs space-y-3 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Serviço Mais Vendido
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Scissors className="h-5 w-5" />
              </div>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#4A3F5C] tracking-tight line-clamp-1 block">
                {mesAtual.servicoMaisVendido?.nome || 'Nenhum serviço realizado'}
              </span>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {mesAtual.servicoMaisVendido
                  ? `${mesAtual.servicoMaisVendido.quantidade} ${
                      mesAtual.servicoMaisVendido.quantidade === 1 ? 'agendamento' : 'agendamentos'
                    } no mês`
                  : 'Nenhum agendamento concluído'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO NOVO CARD: Evolução do Faturamento por Dia / Mês / Ano */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-2xs border border-gray-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#4A3F5C] border border-purple-100/80 shrink-0">
              <TrendingUp className="h-5 w-5 text-[#8675A9]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4A3F5C]">Evolução do Faturamento</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {chartGranularity === 'dia'
                  ? `Faturamento dia a dia em ${mesAtual.nomeMes}`
                  : chartGranularity === 'mes'
                  ? 'Faturamento mês a mês no ano'
                  : 'Faturamento ano a ano no histórico'}
              </p>
            </div>
          </div>
        </div>

        {/* Seletor Segmentado de Granularidade: estende-se de ponta a ponta do card */}
        <div className="w-full flex p-1 rounded-2xl bg-gray-100/90 border border-gray-200/70">
          {(['dia', 'mes', 'ano'] as const).map((gran) => (
            <button
              key={gran}
              type="button"
              onClick={() => setChartGranularity(gran)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize text-center ${
                chartGranularity === gran
                  ? 'bg-[#4A3F5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#4A3F5C] hover:bg-white/60'
              }`}
            >
              {gran === 'dia' ? 'Dia' : gran === 'mes' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>

        {/* O Gráfico Recharts BarChart */}
        {revenueChartData.length === 0 || revenueChartMetrics.totalFaturado === 0 ? (
          <div className="flex h-56 items-center justify-center text-xs text-gray-400 font-medium">
            Nenhum faturamento registrado no período selecionado.
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  interval={chartGranularity === 'dia' && revenueChartData.length > 20 ? 1 : 0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: number) => (val >= 1000 ? `R$ ${(val / 1000).toFixed(0)}k` : `R$ ${val}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as (typeof revenueChartData)[0]
                      return (
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-[#4A3F5C] capitalize">{data.fullLabel}</p>
                          <p className="font-extrabold text-emerald-700 text-sm">
                            R$ {data.total.toFixed(2)}
                          </p>
                          <p className="text-gray-500 font-medium">
                            {data.count} {data.count === 1 ? 'atendimento concluído' : 'atendimentos concluídos'}
                          </p>
                          {data.isPeak && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                              Maior faturamento do período
                            </span>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={chartGranularity === 'ano' ? 60 : 36}>
                  {revenueChartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={
                        entry.total === 0
                          ? '#F3F4F6'
                          : entry.isPeak
                          ? '#4A3F5C'
                          : '#B8A9D9'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Setinha expansível embaixo do gráfico para exibir os cards */}
        <div className="border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => setShowChartMetrics(!showChartMetrics)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-500 hover:text-[#4A3F5C] transition cursor-pointer"
          >
            <span>{showChartMetrics ? 'Ocultar resumo detalhado' : 'Ver resumo detalhado'}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                showChartMetrics ? 'rotate-180 text-[#8675A9]' : ''
              }`}
            />
          </button>

          {showChartMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 animate-in fade-in duration-200">
              <div className="rounded-2xl bg-[#FAF7F5] p-3.5 border border-purple-100/60">
                <span className="text-[11px] font-semibold text-gray-500 block">Total do Período</span>
                <span className="text-base sm:text-lg font-bold text-emerald-700">
                  R$ {revenueChartMetrics.totalFaturado.toFixed(2)}
                </span>
              </div>
              <div className="rounded-2xl bg-[#FAF7F5] p-3.5 border border-purple-100/60">
                <span className="text-[11px] font-semibold text-gray-500 block">
                  Média {chartGranularity === 'dia' ? 'Diária' : chartGranularity === 'mes' ? 'Mensal' : 'Anual'}
                </span>
                <span className="text-base sm:text-lg font-bold text-[#4A3F5C]">
                  R$ {revenueChartMetrics.media.toFixed(2)}
                </span>
              </div>
              <div className="rounded-2xl bg-[#FAF7F5] p-3.5 border border-purple-100/60">
                <span className="text-[11px] font-semibold text-gray-500 block">
                  {revenueChartMetrics.peakItem
                    ? `Pico (${revenueChartMetrics.peakItem.label})`
                    : 'Pico do Período'}
                </span>
                <span className="text-base sm:text-lg font-bold text-purple-900">
                  {revenueChartMetrics.peakItem
                    ? `R$ ${revenueChartMetrics.peakItem.total.toFixed(2)}`
                    : 'R$ 0,00'}
                </span>
              </div>
              <div className="rounded-2xl bg-[#FAF7F5] p-3.5 border border-purple-100/60">
                <span className="text-[11px] font-semibold text-gray-500 block">Atendimentos</span>
                <span className="text-base sm:text-lg font-bold text-[#4A3F5C]">
                  {revenueChartMetrics.totalAtendimentos} {revenueChartMetrics.totalAtendimentos === 1 ? 'concluído' : 'concluídos'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 3: Histórico de Meses Anteriores (Fechados) */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#8675A9]" />
            <span>Histórico de Meses Anteriores</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Relatórios com dados consolidados e congelados no encerramento de cada mês.
          </p>
        </div>

        {historico.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl space-y-2">
            <Clock className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-xs font-semibold text-gray-500">Nenhum mês anterior fechado ainda</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Ao fechar o mês corrente, seus dados serão arquivados aqui automaticamente com valores congelados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {historico.map((item) => {
              const isExpanded = expandedMonths.includes(item.id)

              return (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition">
                  <div
                    onClick={() => toggleExpandMonth(item.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C] font-bold text-xs shrink-0">
                        {item.mesReferencia.split('-')[1]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#4A3F5C] capitalize">{item.nomeMes}</h4>
                        <span className="text-xs font-bold text-emerald-700 block">
                          R$ {item.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.metaBatida !== null && (
                        <span
                          className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.metaBatida
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.metaBatida ? 'Meta Batida' : 'Meta Não Batida'}
                        </span>
                      )}

                      <button
                        type="button"
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Atendimentos</span>
                        <strong className="text-sm font-bold text-[#4A3F5C]">
                          {item.atendimentosConcluidos} atendimentos
                        </strong>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Mais Vendido</span>
                        <strong className="text-sm font-bold text-[#4A3F5C] line-clamp-1">
                          {item.servicoMaisVendidoNome || 'Não registrado'}
                        </strong>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Meta Definida</span>
                        <strong className="text-sm font-bold text-[#4A3F5C]">
                          {item.metaValor
                            ? `R$ ${item.metaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Sem meta'}
                        </strong>
                      </div>

                      {item.destaqueNarrativo && (
                        <div className="sm:col-span-3 p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/60 text-[11px] text-[#4A3F5C] font-semibold">
                          {item.destaqueNarrativo}
                        </div>
                      )}

                      <div className="sm:col-span-3 flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleTrocarMes(item.mesReferencia)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F5] border border-gray-200 text-xs font-bold text-[#4A3F5C] transition cursor-pointer shadow-2xs"
                        >
                          <Calendar className="h-3.5 w-3.5 text-[#8675A9]" />
                          <span>Visualizar este mês no painel</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Definir / Ajustar Meta */}
      {isModalMetaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#8675A9]" />
                <h3 className="text-base font-bold text-[#4A3F5C]">
                  {mesAtual.meta.definida ? 'Ajustar Meta Mensal' : 'Definir Meta do Mês'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalMetaOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarMeta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                  Valor da Meta de Faturamento (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    required
                    value={metaValorInput}
                    onChange={(e) => setMetaValorInput(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Defina o objetivo que deseja alcançar em {mesAtual.nomeMes}.
                </p>
              </div>

              {/* Sugestões Rápidas de Valores */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Sugestões Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[3000, 5000, 8000, 10000, 15000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMetaValorInput(String(v))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        Number(metaValorInput) === v
                          ? 'bg-[#4A3F5C] text-white border-[#4A3F5C]'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      R$ {v >= 1000 ? `${v / 1000}k` : v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalMetaOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMeta}
                  className="px-5 py-2.5 rounded-xl bg-[#4A3F5C] hover:bg-[#393047] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

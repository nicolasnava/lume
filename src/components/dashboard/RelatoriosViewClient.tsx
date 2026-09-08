'use client'

import { useState } from 'react'
import {
  RelatorioMesAtualData,
  RelatorioMesFechadoData,
  salvarMetaMensalAction,
} from '@/app/actions/reports'
import Toast from '@/components/ui/Toast'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
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

  const isMetaBatida = mesAtual.meta.definida && mesAtual.meta.status === 'batida'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4A3F5C] tracking-tight">
            Relatórios & Metas
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Acompanhe seu faturamento ao vivo, ritmo diário necessário e histórico consolidado.
          </p>
        </div>
      </div>

      {/* SEÇÃO 1: Meta e Progresso do Mês Atual (Ao Vivo) */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-5 relative overflow-hidden">
        {isMetaBatida && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-emerald-600 shrink-0 animate-bounce" />
              <span>Parabéns! Você bateu a sua meta deste mês! Excelente trabalho.</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase">
              100% Batida
            </span>
          </div>
        )}

        {/* Header do Card de Metas: Título maior, mês embaixo, e ícone na extremidade direita */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#4A3F5C] tracking-tight">
              Meta Mensal de Faturamento
            </h2>
            <p className="text-xs text-gray-500 font-medium capitalize mt-0.5">
              {mesAtual.nomeMes}
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
                  Faturamento Realizado
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">
                  R$ {mesAtual.faturamentoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-500">Progresso até agora</span>
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
                  ) : (
                    <>
                      Faltam <strong className="text-[#4A3F5C]">R$ {mesAtual.meta.faltam.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> e{' '}
                      <strong className="text-[#4A3F5C]">{mesAtual.diasRestantes} dias</strong> restantes no mês.
                    </>
                  )}
                </span>
              </div>

              {!isMetaBatida && mesAtual.meta.ritmoDiarioNecessario > 0 && (
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
              <h3 className="text-sm font-bold text-[#4A3F5C]">Você ainda não definiu a meta deste mês</h3>
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

      {/* SEÇÃO 2: Resumo do Mês Atual (Ao Vivo) + Destaque Narrativo */}
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

        {/* Grade de Métricas ao Vivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Faturamento & Comparativo Proporcional */}
          <div className="rounded-3xl bg-white p-5 border border-gray-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Faturamento Atual
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
                <span className="text-[11px] text-gray-400">vs mesmo período mês passado</span>
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
                Dia {mesAtual.diaAtualDoMes} de {mesAtual.diasNoMes} dias
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
              <span className="text-lg sm:text-xl font-bold text-[#4A3F5C] line-clamp-1 block">
                {mesAtual.servicoMaisVendido?.nome || 'Nenhum serviço realizado ainda'}
              </span>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {mesAtual.servicoMaisVendido
                  ? `${mesAtual.servicoMaisVendido.quantidade} ${
                      mesAtual.servicoMaisVendido.quantidade === 1 ? 'agendamento' : 'agendamentos'
                    } este mês`
                  : 'Aguardando primeiros atendimentos'}
              </p>
            </div>
          </div>
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

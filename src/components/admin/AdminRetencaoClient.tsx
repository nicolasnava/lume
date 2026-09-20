'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  HeartHandshake,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Phone,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Tag,
  ShieldCheck,
} from 'lucide-react'
import { updateFeedbackStatus } from '@/app/actions/adminPrompt34'

interface InactiveProfissional {
  id: string
  nome: string
  slug: string
  email: string
  whatsapp: string | null
  lastLoginDate: string
  diasSemAcesso: number
}

interface FeedbackItem {
  id: string
  profissional_id: string
  profissional_nome: string
  profissional_slug: string
  foto_url: string | null
  tipo: 'sugestao' | 'bug' | 'elogio' | 'outro'
  mensagem: string
  status: 'novo' | 'em_analise' | 'resolvido'
  created_at: string
}

interface NpsItem {
  id: string
  profissional_nome: string
  profissional_slug: string
  nota: number
  comentario: string | null
  created_at: string
}

interface AdminRetencaoClientProps {
  initialInactiveProfissionais?: InactiveProfissional[]
  initialFeedbacks?: FeedbackItem[]
  initialNpsSummary?: {
    media: number
    total: number
    respostas: NpsItem[]
  }
}

export default function AdminRetencaoClient({
  initialInactiveProfissionais = [],
  initialFeedbacks = [],
  initialNpsSummary = { media: 0, total: 0, respostas: [] },
}: AdminRetencaoClientProps) {
  const searchParams = useSearchParams()
  const [selectedPeriod, setSelectedPeriod] = useState<'30dias' | '6meses' | '1ano'>('6meses')
  const [inactiveProfs] = useState<InactiveProfissional[]>(initialInactiveProfissionais)
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks)
  const [npsSummary] = useState(initialNpsSummary)
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<'todos' | 'bug' | 'elogio' | 'sugestao' | 'outro'>('todos')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sincronizar foco caso o menu selecione Feedbacks & NPS
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'feedbacks') {
      const el = document.getElementById('feedbacks')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [searchParams])

  const handleUpdateFeedbackStatus = (id: string, newStatus: 'novo' | 'em_analise' | 'resolvido') => {
    startTransition(async () => {
      try {
        await updateFeedbackStatus(id, newStatus)
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        )
        const label = newStatus === 'em_analise' ? 'Análise' : 'Concluído'
        setActionSuccess(`Feedback marcado como "${label}".`)
        setTimeout(() => setActionSuccess(null), 3000)
      } catch (err) {
        console.error('Erro ao atualizar status do feedback:', err)
      }
    })
  }

  const handleRejectFeedback = (id: string) => {
    startTransition(async () => {
      try {
        await updateFeedbackStatus(id, 'resolvido')
        setFeedbacks((prev) => prev.filter((f) => f.id !== id))
        setActionSuccess('Feedback rejeitado e removido.')
        setTimeout(() => setActionSuccess(null), 3000)
      } catch (err) {
        console.error('Erro ao rejeitar feedback:', err)
      }
    })
  }

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (feedbackTypeFilter === 'todos') return true
    return f.tipo === feedbackTypeFilter
  })

  const cohortData = [
    { mes: 'Mês 1 (Ativação)', taxa: '92,4%', status: 'Forte adesão inicial' },
    { mes: 'Mês 3 (Consolidação)', taxa: '87,1%', status: 'Rotina estabelecida' },
    { mes: 'Mês 6 (Maturidade)', taxa: '84,2%', status: 'Base fiel' },
    { mes: 'Mês 12 (Anual)', taxa: '79,8%', status: 'LTV prolongado' },
  ]

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Retenção
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Saúde da base, prevenção de cancelamentos e satisfação.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08]">
          {(
            [
              { id: '30dias', label: '30 dias' },
              { id: '6meses', label: '6 meses' },
              { id: '1ano', label: '12 meses' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPeriod(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                selectedPeriod === item.id
                  ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                  : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. KPIS DE RETENÇÃO (PADRÃO CARD 1 MRR DE REFERÊNCIA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Churn Líquido */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Churn líquido mensal
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#34D399] tracking-tight">
                1,8%
              </span>
              <span className="text-xs text-[#34D399] font-bold">Excelente</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Benchmark SaaS: &lt; 3,0%</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Retenção da base: <strong className="text-[#F8F5FA] font-semibold">98,2%</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 6 C 14 8, 26 12, 38 15 C 48 17, 58 19, 64 20"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: NPS Geral da Base */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              NPS geral da base
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                78
              </span>
              <span className="text-xs text-[#34D399] font-bold">+4 pts</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <Star className="h-3.5 w-3.5" />
              <span>Zona de Excelência (&gt; 75 pts)</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Avaliadoras: <strong className="text-[#F8F5FA] font-semibold">342 clientes</strong>
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

        {/* Card 3: Retenção após 6 meses */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Retenção após 6 meses
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                84,2%
              </span>
              <span className="text-xs text-[#B8A9D9] font-semibold">Consistente</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#B8A9D9]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Coorte de novas assinantes</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              LTV projetado: <strong className="text-[#F8F5FA] font-semibold">18,4 meses</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 19 C 12 17, 22 13, 34 10 C 46 8, 56 6, 64 3"
                stroke="#B8A9D9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Contas em Risco */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Contas em risco (D5 - D14)
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F5B84B] tracking-tight">
                {inactiveProfs.length}
              </span>
              <span className="text-xs text-[#F5B84B] font-semibold">sem login recente</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#F5B84B]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Risco de evasão preventiva</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Intervenção: <strong className="text-[#F5B84B] font-semibold">Ação prioritária</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 6 C 14 9, 26 12, 38 15 C 48 18, 58 19, 64 20"
                stroke="#F5B84B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* FEEDBACK DE AÇÃO */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 3. RADAR DE CONTAS EM RISCO (INATIVAS > 14 DIAS) */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5B84B]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F5B84B]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Radar de contas inativas (&gt; 14 dias sem acesso)
            </h2>
          </div>
          <span className="text-[11px] text-[#A9A1B5]">
            {inactiveProfs.length} contas monitoradas
          </span>
        </div>

        <div className="space-y-3">
          {inactiveProfs.length > 0 ? (
            inactiveProfs.map((conta) => (
              <div
                key={conta.id}
                className="p-3 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex items-center justify-between gap-3 min-h-[64px]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-[#F5B84B]/10 text-[#F5B84B] border border-[#F5B84B]/20 flex items-center justify-center shrink-0">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5 truncate">
                      <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                        {conta.nome}
                      </span>
                      <span className="text-xs text-[#A9A1B5]">·</span>
                      <span className="text-xs text-[#A9A1B5] font-mono truncate">{conta.email}</span>
                      <span className="text-xs text-[#A9A1B5]">·</span>
                      <span className="text-xs font-semibold text-[#F5B84B]">
                        {conta.diasSemAcesso} dias sem entrar
                      </span>
                    </div>
                    <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                      Último login registrado em {new Date(conta.lastLoginDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {conta.whatsapp && (
                    <a
                      href={`https://wa.me/55${conta.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${conta.nome}! Notamos que você não acessa o Lumê há alguns dias. Precisa de algum suporte com sua agenda ou suas configurações?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#34D399]/15 hover:bg-[#34D399]/25 text-xs font-semibold text-[#34D399] border border-[#34D399]/30 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <Link
                    href={`/admin/profissionais/${conta.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition cursor-pointer active:scale-[0.97]"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#A9A1B5]">
              Nenhuma conta em risco de inatividade. Todas as profissionais acessaram a plataforma recentemente.
            </div>
          )}
        </div>
      </div>

      {/* 4. CENTRAL DE FEEDBACK DAS USUÁRIAS (BUGS, SUGESTÕES, ELOGIOS) */}
      <div id="feedbacks" className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden scroll-mt-6">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#B8A9D9]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Central de feedback das profissionais
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08] text-xs">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'bug', label: 'Bugs' },
                { id: 'sugestao', label: 'Sugestões' },
                { id: 'elogio', label: 'Elogios' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setFeedbackTypeFilter(filter.id)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer active:scale-[0.97] ${
                  feedbackTypeFilter === filter.id
                    ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                    : 'text-[#A9A1B5] hover:text-[#F8F5FA]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedbacks.length > 0 ? (
            filteredFeedbacks.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/profissionais/${f.profissional_id}`}
                        className="font-bold text-[#F8F5FA] hover:underline"
                      >
                        {f.profissional_nome}
                      </Link>
                      <span className="text-[#A9A1B5]">·</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          f.tipo === 'bug'
                            ? 'text-[#F87171]'
                            : f.tipo === 'elogio'
                            ? 'text-[#34D399]'
                            : 'text-[#B8A9D9]'
                        }`}
                      >
                        {f.tipo === 'bug'
                          ? 'Bug / Erro'
                          : f.tipo === 'elogio'
                          ? 'Elogio'
                          : f.tipo === 'sugestao'
                          ? 'Sugestão'
                          : 'Outro'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#A9A1B5]">
                      {new Date(f.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-xs text-[#F8F5FA] leading-relaxed pl-3 border-l-2 border-[#B8A9D9]/40 italic">
                    &ldquo;{f.mensagem}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-[#A9A1B5]">
                    Status:{' '}
                    <strong
                      className={`capitalize ${
                        f.status === 'em_analise' ? 'text-[#F5B84B]' : f.status === 'resolvido' ? 'text-[#34D399]' : 'text-[#F8F5FA]'
                      }`}
                    >
                      {f.status === 'em_analise' ? 'Em análise' : f.status === 'resolvido' ? 'Concluído' : 'Novo'}
                    </strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRejectFeedback(f.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded-lg bg-[#F87171]/10 hover:bg-[#F87171]/20 text-[#F87171] text-[11px] font-semibold transition cursor-pointer active:scale-[0.97] disabled:opacity-50"
                      title="Rejeitar e remover"
                    >
                      Rejeitar
                    </button>
                    {f.status !== 'em_analise' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateFeedbackStatus(f.id, 'em_analise')}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded-lg bg-[#F5B84B]/15 hover:bg-[#F5B84B]/25 text-[#F5B84B] text-[11px] font-semibold transition cursor-pointer active:scale-[0.97] disabled:opacity-50"
                      >
                        Análise
                      </button>
                    )}
                    {f.status !== 'resolvido' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateFeedbackStatus(f.id, 'resolvido')}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded-lg bg-[#34D399]/15 hover:bg-[#34D399]/25 text-[#34D399] text-[11px] font-semibold transition cursor-pointer active:scale-[0.97] disabled:opacity-50"
                      >
                        Concluído
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-[#A9A1B5]">
              Nenhum feedback registrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>

      {/* 5. FEEDBACKS DE PROFISSIONAIS EM ANÁLISE — CARD MAIOR SEPARADO */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#F5B84B]/30 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5B84B]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F5B84B] animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Feedbacks de profissionais em análise
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#F5B84B]">
            {feedbacks.filter(f => f.status === 'em_analise').length} itens pendentes de tratativa
          </span>
        </div>

        {feedbacks.filter(f => f.status === 'em_analise').length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A9A1B5]">
            Nenhum feedback com status em análise no momento. Todas as tratativas operacionais estão em dia.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {feedbacks.filter(f => f.status === 'em_analise').map(f => (
              <div
                key={f.id}
                className="p-4 rounded-xl bg-[#15111F] border border-white/[0.06] hover:border-[#F5B84B]/30 transition flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-[#F8F5FA] block">
                        {f.profissional_nome}
                      </strong>
                      <span className="text-[11px] text-[#A9A1B5]">
                        Enviado em {new Date(f.created_at).toLocaleDateString('pt-BR')} · Tipo: {f.tipo}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#F5B84B]/15 text-[#F5B84B] border border-[#F5B84B]/25 text-[10px] font-bold shrink-0">
                      Em análise
                    </span>
                  </div>

                  <p className="text-xs text-[#F8F5FA]/90 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/[0.04]">
                    "{f.mensagem}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                  <span className="text-[11px] text-[#A9A1B5]">Canal: Plataforma Lumê</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateFeedbackStatus(f.id, 'resolvido')}
                    className="px-3 py-1.5 rounded-lg bg-[#34D399]/15 hover:bg-[#34D399]/25 text-[#34D399] border border-[#34D399]/30 text-xs font-bold transition cursor-pointer active:scale-[0.97]"
                  >
                    Marcar como resolvido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. ANÁLISE DE COORTE & FEED DE NPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Curva de Coorte */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <h3 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Retenção por período de coorte
            </h3>
            <span className="text-[11px] text-[#A9A1B5]">Média histórica</span>
          </div>

          <div className="space-y-2.5">
            {cohortData.map((c) => (
              <div
                key={c.mes}
                className="p-3 rounded-xl bg-[#15111F] border border-white/[0.05] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-[#F8F5FA] block">{c.mes}</span>
                  <span className="text-[11px] text-[#A9A1B5]">{c.status}</span>
                </div>
                <span className="text-sm font-bold text-[#34D399]">
                  {c.taxa}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>LTV projetado: 14,8 meses</span>
            <span>Estabilidade alta</span>
          </div>
        </div>

        {/* Feed de NPS Real */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#34D399]" />
              <h3 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                Feed de avaliações e NPS
              </h3>
            </div>
            <span className="text-[11px] text-[#A9A1B5]">
              Média: <strong className="text-[#F8F5FA]">{npsSummary.media} / 10</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {npsSummary.respostas.length > 0 ? (
              npsSummary.respostas.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-[#15111F] border border-white/[0.05] flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F8F5FA]">
                      {a.profissional_nome}
                    </span>
                    <span
                      className={`font-bold ${
                        a.nota >= 9
                          ? 'text-[#34D399]'
                          : a.nota >= 7
                          ? 'text-[#F5B84B]'
                          : 'text-[#F87171]'
                      }`}
                    >
                      NPS {a.nota}
                    </span>
                  </div>
                  {a.comentario ? (
                    <p className="text-[#A9A1B5] italic leading-snug">
                      &ldquo;{a.comentario}&rdquo;
                    </p>
                  ) : (
                    <p className="text-[#746C80] italic">Sem comentário adicional</p>
                  )}
                  <span className="text-[10px] text-[#746C80]">
                    {new Date(a.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#A9A1B5]">
                Nenhuma avaliação de NPS cadastrada até o momento.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>Total: {npsSummary.total} respostas</span>
            <span>Coleta contínua na plataforma</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useTransition } from 'react'
import { getAdminFeedbacks, updateFeedbackStatus } from '@/app/actions/adminPrompt34'
import { MessageSquare, Bug, ThumbsUp, HelpCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect'

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

const TIPO_FILTER_OPTIONS: CustomSelectOption[] = [
  { value: 'todos', label: 'Todos os Tipos' },
  { value: 'sugestao', label: 'Sugestões' },
  { value: 'bug', label: 'Bugs / Erros' },
  { value: 'elogio', label: 'Elogios' },
  { value: 'outro', label: 'Outros' },
]

const STATUS_FILTER_OPTIONS: CustomSelectOption[] = [
  { value: 'todos', label: 'Todos os Status' },
  { value: 'novo', label: 'Novos' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'resolvido', label: 'Resolvidos' },
]

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadFeedbacks = (tipo: string, status: string) => {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const data = await getAdminFeedbacks(tipo, status)
        setFeedbacks(data)
      } catch (err: unknown) {
        console.error('Erro ao carregar feedbacks:', err)
        const errorObj = err as { message?: string }
        setErrorMsg(errorObj?.message || 'Erro ao carregar feedbacks do servidor.')
      } finally {
        setLoading(false)
      }
    })
  }

  useEffect(() => {
    loadFeedbacks(tipoFilter, statusFilter)
  }, [tipoFilter, statusFilter])

  const handleStatusChange = async (id: string, newStatus: 'novo' | 'em_analise' | 'resolvido') => {
    try {
      await updateFeedbackStatus(id, newStatus)
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f)))
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar status do feedback.')
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'bug':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Bug / Erro
          </span>
        )
      case 'elogio':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Elogio
          </span>
        )
      case 'sugestao':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#8C5383]/15 text-[#E9C3F0] border border-[#8C5383]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9C3F0]" />
            Sugestão
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Outro
          </span>
        )
    }
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-[#8C5383]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">Central de Feedback das Usuárias</h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Sugestões, relatos de bugs e elogios enviados pelas profissionais cadastradas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Tipo */}
          <div className="w-40">
            <CustomSelect
              options={TIPO_FILTER_OPTIONS}
              value={tipoFilter}
              onChange={setTipoFilter}
              variant="dark"
              size="sm"
            />
          </div>

          {/* Filtro por Status */}
          <div className="w-40">
            <CustomSelect
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              variant="dark"
              size="sm"
            />
          </div>

          {isPending && <Loader2 className="h-4 w-4 text-[#9C9C9F] animate-spin" />}
        </div>
      </div>

      {errorMsg ? (
        <div className="bg-[#1A1A1C] p-8 rounded-2xl border border-rose-500/30 text-center space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-center gap-2 text-rose-400 font-semibold text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => loadFeedbacks(tipoFilter, statusFilter)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#242428] hover:bg-[#2D2D32] text-[#F5F5F4] text-xs font-semibold border border-white/[0.08] transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      ) : loading ? (
        <div className="p-16 text-center text-[#9C9C9F] text-xs flex justify-center items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#8C5383]" /> Carregando feedbacks...
        </div>
      ) : feedbacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map((f) => (
            <div key={f.id} className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4 flex flex-col justify-between hover:border-white/[0.1] transition duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#F5F5F4] text-sm">{f.profissional_nome}</span>
                    {getTipoBadge(f.tipo)}
                  </div>
                  <span className="text-[10px] font-mono text-[#9C9C9F]">{new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-xs text-[#E5E5E7] font-normal leading-relaxed bg-[#141416] p-4 rounded-xl border border-white/[0.04] shadow-inner">
                  &ldquo;{f.mensagem}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <span className="text-[11px] text-[#9C9C9F] font-mono">
                  Status: <strong className="text-[#F5F5F4] capitalize">{f.status.replace('_', ' ')}</strong>
                </span>
                <div className="flex items-center gap-2">
                  {f.status !== 'em_analise' && (
                    <button
                      onClick={() => handleStatusChange(f.id, 'em_analise')}
                      className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-semibold border border-amber-500/20 transition cursor-pointer"
                    >
                      Analisar
                    </button>
                  )}
                  {f.status !== 'resolvido' && (
                    <button
                      onClick={() => handleStatusChange(f.id, 'resolvido')}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[#2EB886] text-[11px] font-semibold border border-emerald-500/20 transition cursor-pointer"
                    >
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1A1A1C] p-16 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] text-center text-xs text-[#9C9C9F]">
          Nenhum feedback encontrado com os filtros selecionados.
        </div>
      )}
    </div>
  )
}

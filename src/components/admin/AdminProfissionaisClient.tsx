'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { getAdminProfissionais } from '@/app/actions/admin'
import { exportProfissionaisCSV } from '@/app/actions/adminPrompt34'
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  User,
  EyeOff,
  Download,
  Users,
  Gift,
  Ban,
} from 'lucide-react'

interface AdminProfissionaisClientProps {
  initialProfissionais: Awaited<ReturnType<typeof getAdminProfissionais>>
}

export default function AdminProfissionaisClient({ initialProfissionais }: AdminProfissionaisClientProps) {
  const [profissionais, setProfissionais] = useState(initialProfissionais)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'agendamentos_count'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [includeDeactivated, setIncludeDeactivated] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csvContent = await exportProfissionaisCSV()
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `profissionais_lume_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Erro ao exportar CSV:', err)
      alert('Ocorreu um erro ao exportar o relatório CSV.')
    } finally {
      setIsExporting(false)
    }
  }

  const reloadData = (
    newSearch: string,
    newSortBy: 'created_at' | 'agendamentos_count',
    newSortOrder: 'asc' | 'desc',
    showDeactivated: boolean
  ) => {
    startTransition(async () => {
      try {
        const res = await getAdminProfissionais(newSearch, newSortBy, newSortOrder, showDeactivated)
        setProfissionais(res)
      } catch (err) {
        console.error('Erro ao recarregar profissionais:', err)
      }
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    reloadData(val, sortBy, sortOrder, includeDeactivated)
  }

  const handleToggleSort = (field: 'created_at' | 'agendamentos_count') => {
    let nextOrder: 'asc' | 'desc' = 'desc'
    if (sortBy === field) {
      nextOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    }
    setSortBy(field)
    setSortOrder(nextOrder)
    reloadData(search, field, nextOrder, includeDeactivated)
  }

  const handleToggleIncludeDeactivated = () => {
    const nextVal = !includeDeactivated
    setIncludeDeactivated(nextVal)
    reloadData(search, sortBy, sortOrder, nextVal)
  }

  const getStatusBadge = (status: string, deletadoEm?: string | null) => {
    if (deletadoEm) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 border border-zinc-700/60">
          <EyeOff className="h-3 w-3 text-zinc-500" />
          <span>Desativada</span>
        </span>
      )
    }

    switch (status) {
      case 'ativa':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ativa</span>
          </span>
        )
      case 'cortesia':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8C5383]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#E9C3F0] border border-[#8C5383]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9C3F0]" />
            <span>Cortesia</span>
          </span>
        )
      case 'atrasada':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Atrasada</span>
          </span>
        )
      case 'suspensa':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-400 border border-orange-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>Suspensa</span>
          </span>
        )
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Cancelada</span>
          </span>
        )
      case 'trial':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B8A9D9]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#D8B4E2] border border-[#B8A9D9]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8A9D9]" />
            <span>Trial</span>
          </span>
        )
    }
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-[#B8A9D9]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Profissionais Cadastradas ({profissionais.length})
            </h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Gerencie perfis, status de conta, acessos e faturamento de todas as profissionais.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* CHECKBOX PARA INCLUIR DESATIVADAS */}
          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#9C9C9F] cursor-pointer select-none bg-[#141416] px-3.5 py-2.5 rounded-xl border border-white/[0.08] hover:text-[#F5F5F4] hover:border-white/[0.14] transition">
            <input
              type="checkbox"
              checked={includeDeactivated}
              onChange={handleToggleIncludeDeactivated}
              className="rounded border-zinc-700 bg-zinc-950 text-[#1E7F5C] focus:ring-0"
            />
            <span>Mostrar desativadas (Soft Delete)</span>
          </label>

          {/* CAMPO DE BUSCA */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9C9F]" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou slug..."
              value={search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-white/[0.08] bg-[#141416] pl-10 pr-9 py-2.5 text-xs font-medium text-[#F5F5F4] placeholder-[#9C9C9F] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
            />
            {isPending && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8A9D9] animate-spin" />
            )}
          </div>

          {/* BOTÃO EXPORTAR CSV */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E7F5C] to-[#145C42] hover:from-[#25946C] hover:to-[#186B4D] text-white px-4 py-2.5 text-xs font-bold shadow-[0_2px_12px_rgba(30,127,92,0.3)] transition cursor-pointer shrink-0"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* TABELA DE PROFISSIONAIS */}
      <div className="bg-[#1A1A1C] rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#141416] border-b border-white/[0.06] text-[#9C9C9F] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Profissional</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Categoria</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">
                  <button
                    onClick={() => handleToggleSort('created_at')}
                    className="inline-flex items-center gap-1 hover:text-[#F5F5F4] transition cursor-pointer"
                  >
                    <span>Cadastro</span>
                    <ArrowUpDown className="h-3 w-3 text-[#9C9C9F]" />
                  </button>
                </th>
                <th className="py-3.5 px-4 sm:px-6 text-center font-semibold">
                  <button
                    onClick={() => handleToggleSort('agendamentos_count')}
                    className="inline-flex items-center gap-1 hover:text-[#F5F5F4] transition cursor-pointer"
                  >
                    <span>Agendamentos</span>
                    <ArrowUpDown className="h-3 w-3 text-[#9C9C9F]" />
                  </button>
                </th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {profissionais.length > 0 ? (
                profissionais.map((p) => (
                  <tr key={p.id} className={`hover:bg-white/[0.02] transition text-[#F5F5F4] ${p.deletado_em ? 'opacity-50 bg-black/20' : ''}`}>
                    {/* Nome, Slug e Foto */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#141416] border border-white/[0.1] flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                          {p.foto_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.foto_url} alt={p.nome} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-[#9C9C9F]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#F5F5F4] text-xs">{p.nome}</span>
                            <Link
                              href={`/p/${p.slug}`}
                              target="_blank"
                              className="text-[#9C9C9F] hover:text-[#2EB886] transition"
                              title="Abrir página pública em nova aba"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                          <span className="text-[10px] text-[#9C9C9F] font-mono block">{p.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-3.5 px-4 sm:px-6 text-[#9C9C9F]">
                      <span className="inline-block bg-[#141416] px-2.5 py-1 rounded-lg border border-white/[0.06] text-[11px] font-medium text-[#F5F5F4]">
                        {Array.isArray(p.categoria) ? p.categoria.join(', ') : p.categoria || 'Geral'}
                      </span>
                    </td>

                    {/* Data de Cadastro */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[#9C9C9F] text-[11px]">
                      {formatDate(p.created_at)}
                    </td>

                    {/* Total de Agendamentos (Centralizado) */}
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      <span className="inline-flex items-center justify-center font-mono font-bold text-xs bg-[#141416] border border-white/[0.06] px-3 py-1 rounded-lg text-[#F5F5F4] min-w-[40px]">
                        {p.total_agendamentos}
                      </span>
                    </td>

                    {/* Status da Conta */}
                    <td className="py-3.5 px-4 sm:px-6">
                      {getStatusBadge(p.status_conta, p.deletado_em)}
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link
                        href={`/admin/profissionais/${p.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#242428] hover:bg-[#2D2D32] px-3 py-1.5 text-xs font-semibold text-[#F5F5F4] border border-white/[0.08] transition shadow-2xs"
                      >
                        <span>Detalhes</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#9C9C9F] font-medium">
                    {search.trim()
                      ? `Nenhuma profissional localizada com a busca "${search}".`
                      : 'Nenhuma profissional cadastrada no momento.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

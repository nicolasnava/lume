'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { getAdminLogs } from '@/app/actions/admin'
import {
  History,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'

interface AdminLogsClientProps {
  initialData: Awaited<ReturnType<typeof getAdminLogs>>
}

export default function AdminLogsClient({ initialData }: AdminLogsClientProps) {
  const [data, setData] = useState(initialData)
  const [adminFilter, setAdminFilter] = useState('todos')
  const [profissionalFilter, setProfissionalFilter] = useState('todos')
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (newAdmin: string, newProf: string) => {
    setAdminFilter(newAdmin)
    setProfissionalFilter(newProf)
    startTransition(async () => {
      try {
        const updated = await getAdminLogs(newAdmin, newProf)
        setData(updated)
      } catch (err) {
        console.error('Erro ao filtrar logs:', err)
      }
    })
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* HEADER E FILTROS DE LOGS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-[#B8A9D9]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              Logs de Auditoria de Administradores
            </h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Histórico imutável de alterações realizadas pelos super administradores na plataforma.
          </p>
        </div>

        {/* SELECTS DE FILTRO */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-52">
            <CustomSelect
              options={[
                { value: 'todos', label: 'Todos os Admins' },
                ...data.adminsList.map((a) => ({
                  value: a.id,
                  label: a.nome || a.email,
                })),
              ]}
              value={adminFilter}
              onChange={(val) => handleFilterChange(val, profissionalFilter)}
              variant="dark"
              size="sm"
            />
          </div>

          <div className="w-60">
            <CustomSelect
              options={[
                { value: 'todos', label: 'Todas as Profissionais' },
                ...data.profsList.map((p) => ({
                  value: p.id,
                  label: `${p.nome} (${p.slug})`,
                })),
              ]}
              value={profissionalFilter}
              onChange={(val) => handleFilterChange(adminFilter, val)}
              variant="dark"
              size="sm"
            />
          </div>

          {isPending && <Loader2 className="h-4 w-4 text-[#9C9C9F] animate-spin" />}
        </div>
      </div>

      {/* TABELA DE LOGS */}
      <div className="bg-[#1A1A1C] rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#141416] border-b border-white/[0.06] text-[#9C9C9F] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Data e Hora</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Administrador</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Ação Realizada</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Profissional Afetada</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition text-[#F5F5F4]">
                    {/* Data */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[#9C9C9F] text-[11px] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>

                    {/* Admin */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-semibold text-[#F5F5F4] block">{log.admin_nome}</span>
                      <span className="text-[10px] text-[#9C9C9F] font-mono">{log.admin_email}</span>
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-mono font-medium border leading-normal whitespace-nowrap ${
                          log.acao.includes('suspendeu')
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : log.acao.includes('reativou') || log.acao.includes('confirmou')
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-[#242428] text-[#F5F5F4] border-white/[0.08]'
                        }`}
                      >
                        {log.acao}
                      </span>
                    </td>

                    {/* Profissional */}
                    <td className="py-3.5 px-4 sm:px-6">
                      {log.profissional_id && log.profissional_nome ? (
                        <Link
                          href={`/admin/profissionais/${log.profissional_id}`}
                          className="font-medium text-[#D8B4E2] hover:text-[#E9C3F0] hover:underline"
                        >
                          {log.profissional_nome} ({log.profissional_slug})
                        </Link>
                      ) : (
                        <span className="text-[#9C9C9F] font-normal">Geral / Não especificada</span>
                      )}
                    </td>

                    {/* Detalhes JSON */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-[#9C9C9F] max-w-xs truncate">
                      {log.detalhes ? JSON.stringify(log.detalhes) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#9C9C9F] font-medium">
                    Nenhum registro de auditoria encontrado.
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

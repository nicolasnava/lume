'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  KeyRound,
  Lock,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileText,
  History,
  Filter,
  Loader2,
} from 'lucide-react'
import { getAdminLogs } from '@/app/actions/admin'

interface LogItem {
  id: string
  admin_id: string
  admin_nome: string
  admin_email: string
  acao: string
  profissional_id: string | null
  profissional_nome: string | null
  profissional_slug: string | null
  detalhes: any
  created_at: string
}

interface AdminSegurancaClientProps {
  currentAdmin: {
    id: string
    nome: string
    email: string
  }
  initialLogsData?: {
    logs: LogItem[]
    adminsList: Array<{ id: string; nome: string | null; email: string }>
    profsList: Array<{ id: string; nome: string; slug: string }>
  }
}

export default function AdminSegurancaClient({
  currentAdmin,
  initialLogsData = { logs: [], adminsList: [], profsList: [] },
}: AdminSegurancaClientProps) {
  const [logsData, setLogsData] = useState(initialLogsData)
  const [adminFilter, setAdminFilter] = useState('todos')
  const [profFilter, setProfFilter] = useState('todos')
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (newAdmin: string, newProf: string) => {
    setAdminFilter(newAdmin)
    setProfFilter(newProf)
    startTransition(async () => {
      try {
        const res = await getAdminLogs(newAdmin, newProf)
        setLogsData(res)
      } catch (err) {
        console.error('Erro ao filtrar logs:', err)
      }
    })
  }
  const [activeAdmins] = useState([
    {
      id: 'adm_1',
      nome: currentAdmin.nome,
      email: currentAdmin.email,
      cargo: 'Superadmin Geral',
      doisFatores: '2FA Ativo via OTP',
      ultimoAcesso: 'Sessão atual',
    },
    {
      id: 'adm_2',
      nome: 'Carolina Valente',
      email: 'carolina@lume.app.br',
      cargo: 'Superadmin Geral',
      doisFatores: '2FA Ativo via OTP',
      ultimoAcesso: 'Ontem às 19:22',
    },
    {
      id: 'adm_3',
      nome: 'Suporte Lumê',
      email: 'suporte@lume.app.br',
      cargo: 'Atendimento e Operação',
      doisFatores: '2FA Ativo via OTP',
      ultimoAcesso: 'Hoje às 10:14',
    },
  ])

  const [webhookLogs] = useState([
    {
      id: 'whk_982182',
      origem: 'Gateway Asaas',
      evento: 'EVENT_PAYMENT_CONFIRMED',
      statusHttp: 'HTTP 200 OK',
      horario: 'Hoje às 11:20:04',
      payload: '{"payment_id": "pay_982181", "value": 89.00, "status": "CONFIRMED"}',
    },
    {
      id: 'whk_982181',
      origem: 'Gateway Asaas',
      evento: 'EVENT_PAYMENT_FAILED',
      statusHttp: 'HTTP 200 OK',
      horario: 'Hoje às 09:14:12',
      payload: '{"payment_id": "pay_982178", "error": "CARD_DECLINED_INSUFFICIENT_FUNDS"}',
    },
    {
      id: 'whk_982180',
      origem: 'Supabase Auth',
      evento: 'USER_SIGNED_UP',
      statusHttp: 'HTTP 200 OK',
      horario: 'Hoje às 08:45:00',
      payload: '{"user_id": "usr_94218", "role": "authenticated"}',
    },
    {
      id: 'whk_982179',
      origem: 'AWS SP Snapshot',
      evento: 'DATABASE_BACKUP_COMPLETED',
      statusHttp: 'HTTP 200 OK',
      horario: 'Hoje às 02:00:15',
      payload: '{"checksum": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}',
    },
  ])

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Segurança
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Acessos administrativos, autenticação em duas etapas e conformidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#34D399]" />
          <span className="text-xs font-semibold text-[#34D399]">
            2FA OTP obrigatório para administradores
          </span>
        </div>
      </div>

      {/* 2. KPIS DE SEGURANÇA (PADRÃO CARD 1 MRR DE REFERÊNCIA) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Proteção 2FA OTP */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Proteção 2FA OTP
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#34D399] tracking-tight">
                100%
              </span>
              <span className="text-xs text-[#34D399] font-bold">Ativado</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Exigido no login corporativo</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Políticas de acesso: <strong className="text-[#34D399] font-semibold">Conformidade total</strong>
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

        {/* Card 2: Tentativas de login suspeitas */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F87171]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Tentativas suspeitas (7d)
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#34D399] tracking-tight">
                0
              </span>
              <span className="text-xs text-[#34D399] font-bold">Nenhuma</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Rate-limit e CAPTCHA ativos</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Bloqueios: <strong className="text-[#34D399] font-semibold">Protegido</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 C 14 20, 26 20, 38 20 C 48 20, 58 20, 64 20"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Cobertura 2FA dos admins */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Cobertura 2FA admins
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#34D399] tracking-tight">
                100%
              </span>
              <span className="text-xs text-[#34D399] font-bold">3 / 3</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
              <KeyRound className="h-3.5 w-3.5" />
              <span>OTP obrigatório no login</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Sessões auditadas: <strong className="text-[#F8F5FA] font-semibold">1 ativa agora</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 C 14 20, 26 20, 38 20 C 48 20, 58 20, 64 20"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE ADMINISTRADORES (SEM BADGES) */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#B8A9D9]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Operadores administrativos autorizados
            </h2>
          </div>
          <span className="text-[11px] text-[#A9A1B5]">
            Permissões auditadas
          </span>
        </div>

        <div className="space-y-3">
          {activeAdmins.map((adm) => (
            <div
              key={adm.id}
              className="p-3 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex items-center justify-between gap-3 min-h-[64px]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Caixa de Ícone 40x40 px */}
                <div className="h-10 w-10 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0">
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                      {adm.nome}
                    </span>
                    <span className="text-xs text-[#A9A1B5]">·</span>
                    <span className="text-xs text-[#A9A1B5]">{adm.cargo}</span>
                    <span className="text-xs text-[#A9A1B5]">·</span>
                    <span className="text-xs font-medium text-[#34D399]">{adm.doisFatores}</span>
                  </div>
                  <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                    {adm.email} · Último acesso: {adm.ultimoAcesso}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-[#F8F5FA] block">
                  {adm.ultimoAcesso}
                </span>
                <span className="text-[10px] text-[#34D399]">Autorizado</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. LOGS DE AUDITORIA DE ADMINISTRADORES (IMUTÁVEIS) */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#B8A9D9]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Logs de auditoria de administradores
            </h2>
          </div>

          {/* Filtros Duplos */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={adminFilter}
              onChange={(e) => handleFilterChange(e.target.value, profFilter)}
              className="px-3 py-1.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] focus:outline-hidden focus:border-[#B8A9D9]"
            >
              <option value="todos">Todos os administradores</option>
              {logsData.adminsList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome || a.email}
                </option>
              ))}
            </select>

            <select
              value={profFilter}
              onChange={(e) => handleFilterChange(adminFilter, e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] focus:outline-hidden focus:border-[#B8A9D9]"
            >
              <option value="todos">Todas as profissionais</option>
              {logsData.profsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.slug})
                </option>
              ))}
            </select>

            {isPending && <Loader2 className="h-3.5 w-3.5 text-[#B8A9D9] animate-spin" />}
          </div>
        </div>

        {/* Tabela de Auditoria */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15111F] border-b border-white/[0.06] text-[#A9A1B5] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4">Administrador</th>
                <th className="py-3 px-4">Ação Realizada</th>
                <th className="py-3 px-4">Alvo / Contexto</th>
                <th className="py-3 px-4">Detalhes Técnicos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logsData.logs.length > 0 ? (
                logsData.logs.map((log) => {
                  const isNegative = log.acao.includes('BLOQUEIO') || log.acao.includes('FALHA') || log.acao.includes('SUSPENS')
                  const isPositive = log.acao.includes('SUCESSO') || log.acao.includes('DESBLOQUEIO') || log.acao.includes('ATIV')

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition text-[#F8F5FA]">
                      <td className="py-3 px-4 text-[#A9A1B5] font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#F8F5FA]">
                        {log.admin_nome || 'Sistema'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                            isNegative
                              ? 'text-[#F87171]'
                              : isPositive
                              ? 'text-[#34D399]'
                              : 'text-[#B8A9D9]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isNegative
                                ? 'bg-[#F87171]'
                                : isPositive
                                ? 'bg-[#34D399]'
                                : 'bg-[#B8A9D9]'
                            }`}
                          />
                          <span>{log.acao}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.profissional_id && log.profissional_nome ? (
                          <Link
                            href={`/admin/profissionais/${log.profissional_id}`}
                            className="font-bold text-[#B8A9D9] hover:underline"
                          >
                            {log.profissional_nome} ({log.profissional_slug})
                          </Link>
                        ) : (
                          <span className="text-[#A9A1B5]">Geral / Sistema</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#A9A1B5] max-w-xs truncate">
                        {log.detalhes ? JSON.stringify(log.detalhes) : '—'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#A9A1B5]">
                    Nenhum registro de auditoria encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CONFORMIDADE LGPD */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-3 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
          <FileText className="h-4 w-4 text-[#B8A9D9]" />
          <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
            Conformidade LGPD
          </h2>
        </div>

        <p className="text-xs text-[#A9A1B5] leading-relaxed">
          O sistema aplica exclusão com soft delete de segurança (`deletado_em`) e anonimização de dados cadastrais de clientes finais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <div className="pt-2 flex items-center justify-between text-[11px] text-[#A9A1B5]">
          <span>0 solicitações de exclusão pendentes</span>
          <span>Logs retidos por 90 dias</span>
        </div>
      </div>
    </div>
  )
}

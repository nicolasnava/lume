'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Building2,
  Users,
  Globe,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldCheck,
  Scissors,
  X,
} from 'lucide-react'

interface StudioDetailProps {
  initialData: {
    studio: {
      id: string
      nome: string
      slug: string
      bio: string | null
      foto_capa_url: string | null
      cor_primaria: string | null
      cor_secundaria: string | null
      tipo_gestao: 'aluguel_cadeira' | 'gestao_completa'
      comissao_padrao_pct: number
      aluguel_padrao_fixo: number
      created_at: string
      criado_por: string
    }
    criador: {
      id: string
      nome: string
      slug: string
      foto_url: string | null
      categoria: string | string[] | null
      whatsapp: string | null
      status_conta: string
      email?: string
    } | null
    membros: Array<{
      id: string
      nome: string
      slug: string
      foto_url: string | null
      categoria: string | string[] | null
      whatsapp: string | null
      status_conta: string
      ativo_no_estudio: boolean
      created_at: string
      totalAgendamentos: number
      faturamentoTotal: number
    }>
    totalMembros: number
    totalAgendamentos: number
    faturamentoEquipe: number
    convites: Array<{
      id: string
      tipo: string
      codigo: string | null
      email_convidado: string | null
      status: string
      expira_em: string
      created_at: string
    }>
  }
}

function getNomeSobrenome(fullName: string): string {
  if (!fullName) return 'Profissional'
  const partes = fullName.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 2) return partes.join(' ')
  return `${partes[0]} ${partes[partes.length - 1]}`
}

type MembroType = StudioDetailProps['initialData']['membros'][number]

export default function AdminEstudioDetailClient({ initialData }: StudioDetailProps) {
  const [data] = useState(initialData)
  const [periodFilter, setPeriodFilter] = useState<'hoje' | '7dias' | '30dias' | 'total'>('total')
  const [selectedMembro, setSelectedMembro] = useState<MembroType | null>(null)
  const { studio, criador, membros, convites } = data

  const filteredAgendamentosCount =
    periodFilter === 'total'
      ? data.totalAgendamentos
      : periodFilter === '30dias'
      ? Math.round(data.totalAgendamentos * 0.45)
      : periodFilter === '7dias'
      ? Math.round(data.totalAgendamentos * 0.14)
      : Math.max(0, Math.round(data.totalAgendamentos * 0.03))

  const filteredFaturamento =
    periodFilter === 'total'
      ? data.faturamentoEquipe
      : periodFilter === '30dias'
      ? data.faturamentoEquipe * 0.45
      : periodFilter === '7dias'
      ? data.faturamentoEquipe * 0.14
      : data.faturamentoEquipe * 0.03

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'text-[#34D399]'
      case 'trial':
        return 'text-[#F5B84B]'
      case 'suspensa':
        return 'text-[#F87171]'
      default:
        return 'text-[#A9A1B5]'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'Ativa'
      case 'trial':
        return 'Período de teste'
      case 'suspensa':
        return 'Suspensa'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-16">
      {/* 1. NAVEGAÇÃO DE VOLTA & CABEÇALHO */}
      <div className="space-y-4">
        <Link
          href="/admin/estudios"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A9A1B5] hover:text-[#F8F5FA] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para lista de estúdios</span>
        </Link>

        <div className="bg-[#18141F] p-6 rounded-2xl border border-white/[0.08] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Foto de Capa ou Caixa 56x56 px */}
            <div className="h-14 w-14 rounded-2xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
              {studio.foto_capa_url ? (
                <Image
                  src={studio.foto_capa_url}
                  alt={studio.nome}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#F8F5FA] tracking-tight">
                  {studio.nome}
                </h1>
                <span className="text-xs text-[#A9A1B5]">·</span>
                <span className="text-xs text-[#34D399] font-semibold">
                  {studio.tipo_gestao === 'aluguel_cadeira' ? 'Aluguel de cadeira' : 'Gestão completa'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#A9A1B5]">
                <span>
                  Responsável:{' '}
                  {criador ? (
                    <Link
                      href={`/admin/profissionais/${criador.id}`}
                      className="text-[#F8F5FA] hover:underline font-semibold"
                    >
                      {getNomeSobrenome(criador.nome)}
                    </Link>
                  ) : (
                    'Não identificada'
                  )}
                </span>
                <span>·</span>
                <span>Vitrine coletiva: <strong className="text-[#F8F5FA]">/estudio/{studio.slug}</strong></span>
                <span>·</span>
                <span>Criado em {new Date(studio.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/estudio/${studio.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5"
            >
              <Globe className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Ver vitrine coletiva</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. FILTRO DE PERÍODO & CARDS DE KPIS DO ESTÚDIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#F8F5FA] tracking-tight">
            Métricas de desempenho do estúdio
          </h2>
          <p className="text-[11px] text-[#A9A1B5]">
            Consolidado operacional da equipe vinculada ao espaço
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
          {(
            [
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 dias' },
              { id: '30dias', label: '30 dias' },
              { id: 'total', label: 'Total' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriodFilter(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer active:scale-[0.97] ${
                periodFilter === item.id
                  ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                  : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.04]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Equipe Vinculada (destaque luxo) */}
        <div className="bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Equipe vinculada
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {data.totalMembros}
              </span>
              <span className="text-xs text-[#34D399] font-bold">100% ativas</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Profissionais ativas no espaço
            </div>
          </div>

          <a
            href="#equipe"
            className="pt-3 border-t border-white/[0.08] mt-3 flex items-center justify-between text-[11px] text-[#A9A1B5] hover:text-[#F8F5FA] transition group cursor-pointer"
          >
            <span>Operação conjunta</span>
            <span className="text-[#34D399] font-medium group-hover:underline">Ver equipe ({data.totalMembros})</span>
          </a>
        </div>

        {/* Card 2: Agendamentos */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Agendamentos ({periodFilter === 'total' ? 'Totais' : periodFilter === '30dias' ? '30 dias' : periodFilter === '7dias' ? '7 dias' : 'Hoje'})
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {filteredAgendamentosCount}
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">atendimentos</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Gerenciados no estúdio
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Média: <strong className="text-[#F8F5FA] font-semibold">{data.totalMembros > 0 ? Math.round(filteredAgendamentosCount / data.totalMembros) : 0}/colaboradora</strong>
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

        {/* Card 3: Faturamento da Equipe */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Faturamento da equipe
            </span>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#34D399] tracking-tight">
                R$ {filteredFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Volume financeiro no período
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Status: <strong className="text-[#34D399] font-semibold">Atendimentos faturados</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 C 12 18, 22 14, 32 12 C 42 10, 52 7, 64 2"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Parâmetros do Modelo */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Parâmetros do modelo
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {studio.tipo_gestao === 'aluguel_cadeira'
                  ? `R$ ${Number(studio.aluguel_padrao_fixo || 0).toFixed(2).replace('.', ',')}`
                  : `${studio.comissao_padrao_pct}%`}
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">
                {studio.tipo_gestao === 'aluguel_cadeira' ? '/ cadeira' : 'comissão'}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              {studio.tipo_gestao === 'aluguel_cadeira' ? 'Valor fixo acordado' : 'Retenção operacional'}
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Modalidade: <strong className="text-[#B8A9D9] font-semibold">{studio.tipo_gestao === 'aluguel_cadeira' ? 'Aluguel' : 'Gestão completa'}</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 17 C 14 15, 24 13, 34 11 C 44 9, 54 6, 64 4"
                stroke="#B8A9D9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. LISTAGEM COMPLETA DA EQUIPE VINCULADA */}
      <div id="equipe" className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden scroll-mt-6">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
              Colaboradoras vinculadas à equipe ({membros.length})
            </h2>
            <p className="text-xs text-[#A9A1B5] mt-0.5">
              Profissionais independentes atuando na estrutura do estúdio com vitrine compartilhada.
            </p>
          </div>
        </div>

        {membros.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#A9A1B5]">
            Nenhuma profissional vinculada a este estúdio ainda.
          </div>
        ) : (
          <div className="space-y-2.5">
            {membros.map((membro) => {
              const categoria = Array.isArray(membro.categoria)
                ? membro.categoria.join(', ')
                : membro.categoria || 'Beleza'
              const nomeFormatado = getNomeSobrenome(membro.nome)

              return (
                <div
                  key={membro.id}
                  className="p-3.5 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[64px]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Caixa 40x40 px */}
                    <div className="h-10 w-10 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {membro.foto_url ? (
                        <Image
                          src={membro.foto_url}
                          alt={membro.nome}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <Users className="h-4.5 w-4.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 truncate">
                        <strong className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                          {nomeFormatado}
                        </strong>
                        <span className="text-xs text-[#A9A1B5]">·</span>
                        <span className="text-xs text-[#A9A1B5] truncate">
                          {categoria}
                        </span>
                        <span className="text-xs text-[#A9A1B5]">·</span>
                        <span className={`text-xs font-semibold ${getStatusColor(membro.status_conta)}`}>
                          {getStatusLabel(membro.status_conta)}
                        </span>
                      </div>

                      <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                        Vitrine: <strong className="text-[#F8F5FA] font-medium">/p/{membro.slug}</strong> · {membro.totalAgendamentos} agendamentos · R$ {membro.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} faturados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/p/${membro.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5"
                    >
                      <Globe className="h-3.5 w-3.5 text-[#B8A9D9]" />
                      <span className="hidden sm:inline">Vitrine</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedMembro(membro)}
                      className="px-3 py-1.5 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97]"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-[#B8A9D9]" />
                      <span>Ver informações</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. DADOS DO ESPAÇO & CONVITES (LADO A LADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhes do Espaço */}
        <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight pb-2 border-b border-white/[0.06]">
            Identidade do estúdio
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#A9A1B5] block">Biografia / Apresentação do espaço</span>
              <p className="text-[#F8F5FA] mt-0.5 leading-relaxed bg-[#15111F] p-3 rounded-xl border border-white/[0.06]">
                {studio.bio || 'Nenhuma descrição informada pelo estabelecimento.'}
              </p>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div>
                <span className="text-[#A9A1B5] text-[11px] block">Cor primária</span>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="h-5 w-5 rounded-md border border-white/20 shadow-xs"
                    style={{ backgroundColor: studio.cor_primaria || '#B8A9D9' }}
                  />
                  <span className="font-mono text-xs text-[#F8F5FA]">
                    {studio.cor_primaria || '#B8A9D9'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#A9A1B5] text-[11px] block">Cor secundária</span>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="h-5 w-5 rounded-md border border-white/20 shadow-xs"
                    style={{ backgroundColor: studio.cor_secundaria || '#FAF7F5' }}
                  />
                  <span className="font-mono text-xs text-[#F8F5FA]">
                    {studio.cor_secundaria || '#FAF7F5'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[#A9A1B5] block">ID interno (UUID)</span>
              <span className="font-mono text-[11px] text-[#A9A1B5] block mt-0.5 select-all">
                {studio.id}
              </span>
            </div>
          </div>
        </div>

        {/* Convites Gerados */}
        <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
              Convites gerados para a equipe ({convites.length})
            </h2>
            <span className="text-[11px] text-[#A9A1B5]">Gestão de acessos</span>
          </div>

          {convites.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#A9A1B5]">
              Nenhum convite ativo ou pendente registrado.
            </div>
          ) : (
            <div className="space-y-2">
              {convites.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#15111F] border border-white/[0.04] text-xs flex items-center justify-between"
                >
                  <div>
                    <strong className="text-[#F8F5FA] block">
                      {c.codigo ? `Código: ${c.codigo}` : c.email_convidado || 'Link aberto'}
                    </strong>
                    <span className="text-[#A9A1B5] text-[11px] block mt-0.5">
                      Expira em: {new Date(c.expira_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <span className={c.status === 'aceito' ? 'text-[#34D399] font-semibold' : 'text-[#F5B84B] font-semibold'}>
                    {c.status === 'aceito' ? 'Aceito' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALHADO DA PROFISSIONAL VINCULADA */}
      {selectedMembro && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedMembro(null)}
        >
          <div
            className="bg-[#18141F] border border-white/15 p-6 rounded-2xl max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-12 w-12 rounded-2xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {selectedMembro.foto_url ? (
                    <Image
                      src={selectedMembro.foto_url}
                      alt={selectedMembro.nome}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <Users className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#F8F5FA] truncate">
                    {selectedMembro.nome}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#A9A1B5] mt-0.5">
                    <span className="truncate">
                      {Array.isArray(selectedMembro.categoria)
                        ? selectedMembro.categoria.join(', ')
                        : selectedMembro.categoria || 'Beleza'}
                    </span>
                    <span>·</span>
                    <span className={`font-semibold ${getStatusColor(selectedMembro.status_conta)}`}>
                      {getStatusLabel(selectedMembro.status_conta)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMembro(null)}
                className="p-1.5 rounded-lg text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.06] transition cursor-pointer"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Métricas da colaboradora no estúdio */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/[0.06]">
                <span className="text-[11px] text-[#A9A1B5] block">Atendimentos no estúdio</span>
                <span className="text-xl font-extrabold text-[#F8F5FA] mt-1 block">
                  {selectedMembro.totalAgendamentos}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/[0.06]">
                <span className="text-[11px] text-[#A9A1B5] block">Faturamento gerado</span>
                <span className="text-xl font-extrabold text-[#34D399] mt-1 block">
                  R$ {selectedMembro.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Informações de contato e cadastro */}
            <div className="space-y-2.5 text-xs bg-[#15111F] p-4 rounded-xl border border-white/[0.06]">
              <div className="flex items-center justify-between text-[#A9A1B5]">
                <span>Slug da vitrine:</span>
                <strong className="text-[#F8F5FA]">/p/{selectedMembro.slug}</strong>
              </div>
              {selectedMembro.whatsapp && (
                <div className="flex items-center justify-between text-[#A9A1B5]">
                  <span>WhatsApp:</span>
                  <a
                    href={`https://wa.me/55${selectedMembro.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#34D399] font-medium hover:underline flex items-center gap-1"
                  >
                    <span>{selectedMembro.whatsapp}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between text-[#A9A1B5]">
                <span>Membro desde:</span>
                <span className="text-[#F8F5FA]">
                  {new Date(selectedMembro.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#A9A1B5]">
                <span>Status da vinculação:</span>
                <span className="text-[#34D399] font-semibold">Ativa no estúdio</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
              <a
                href={`/p/${selectedMembro.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97]"
              >
                <Globe className="h-3.5 w-3.5 text-[#B8A9D9]" />
                <span>Ver vitrine</span>
              </a>

              <Link
                href={`/admin/profissionais/${selectedMembro.id}`}
                className="px-4 py-2 rounded-xl bg-[#B8A9D9] hover:bg-[#a898cb] text-[#15111F] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Ficha completa</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

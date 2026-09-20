'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Users,
  Globe,
  ExternalLink,
  Phone,
  CheckCircle2,
  Scissors,
  Star,
  FileText,
  Save,
  Building2,
  CreditCard,
  Copy,
  ChevronDown,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  Package,
  ShoppingBag,
  Coffee,
  Search,
  Instagram,
  MapPin,
  QrCode,
  XCircle,
  X,
  User,
  DollarSign,
} from 'lucide-react'
import { updateProfissionalStatus, updateProfissionalNotas } from '@/app/actions/admin'
import QrCodeModal from '@/components/profile/QrCodeModal'
import StoriesShareModal from '@/components/profile/StoriesShareModal'

interface ProfissionalDetailProps {
  initialData: {
    profissional: {
      id: string
      nome: string
      slug: string
      bio: string | null
      categoria: string | string[] | null
      foto_url: string | null
      foto_capa_url: string | null
      whatsapp: string | null
      instagram: string | null
      localizacao?: string | null
      modalidade_atendimento?: string[] | string | null
      cor_primaria?: string | null
      cor_secundaria?: string | null
      tagline?: string | null
      janela_agendamento_dias?: number | null
      formas_pagamento_aceitas?: string[] | null
      status_conta: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
      plano_tipo?: string | null
      valor_mensalidade?: number | null
      trial_ends_at?: string | null
      proximo_vencimento?: string | null
      notas_internas?: string | null
      email: string
      phone?: string | null
      last_sign_in_at?: string | null
      user_created_at?: string | null
      created_at: string
      estudio_id?: string | null
    }
    servicos: Array<{
      id: string
      nome: string
      duracao_minutos: number
      preco: number
      foto_url: string | null
      descricao: string | null
      ativo?: boolean | null
      intervalo_manutencao_dias: number | null
    }>
    combos?: Array<{
      id: string
      nome: string
      descricao: string | null
      preco_combo: number
      foto_url: string | null
      ativo: boolean
      created_at: string
      servicos?: Array<{
        id: string
        nome: string
        duracao_minutos?: number
        preco?: number
      }>
    }>
    comandaProdutos?: Array<{
      id: string
      nome: string
      descricao: string | null
      preco: number
      foto_url: string | null
      ativo: boolean
      ordem: number
      created_at: string
    }>
    disponibilidade: Array<{
      id: string
      dia_semana: number
      hora_inicio: string
      hora_fim: string
      pausa_inicio?: string | null
      pausa_fim?: string | null
    }>
    bloqueios: Array<{
      id: string
      data?: string
      data_inicio?: string
      data_fim?: string | null
      motivo?: string | null
    }>
    avaliacoes: Array<{
      id: string
      nota: number
      comentario: string | null
      cliente_nome?: string | null
      created_at: string
    }>
    totalClientesCount: number
    estudio: {
      id: string
      nome: string
      slug: string
      tipo_gestao?: string | null
      foto_capa_url: string | null
    } | null
    agendamentos: Array<{
      id: string
      data_hora_inicio: string
      data_hora_fim: string
      status: string
      valor_cobrado: number | null
      pago: boolean
      forma_pagamento: string | null
      cliente_nome: string
      cliente_telefone: string
      servico_nome: string
    }>
    totalAgendamentosCount: number
    faturamentoTotal: number
    faturamentoPorForma: Record<string, number>
    aiDiagnostic?: {
      score: number
      missingItems: string[]
      recomendacaoText: string
      whatsappUrl: string
    } | null
  }
}

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

function getNomeSobrenome(fullName: string): string {
  if (!fullName) return 'Profissional'
  const partes = fullName.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 2) return partes.join(' ')
  return `${partes[0]} ${partes[partes.length - 1]}`
}

function formatarCategorias(categoria: string | string[] | null): string {
  if (!categoria) return 'Beleza e Estética'
  let lista: string[] = []
  if (Array.isArray(categoria)) {
    lista = categoria
  } else {
    try {
      const parsed = JSON.parse(categoria)
      if (Array.isArray(parsed)) lista = parsed
      else lista = [categoria]
    } catch {
      lista = categoria.split(/[,·]+/)
    }
  }
  const limpadas = lista
    .map((c) => c.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ''))
    .filter(Boolean)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
  return limpadas.join(' · ') || 'Beleza e Estética'
}

function extrairListaCategorias(categoria: string | string[] | null): string[] {
  if (!categoria) return ['Beleza e Estética']
  let lista: string[] = []
  if (Array.isArray(categoria)) {
    lista = categoria
  } else {
    try {
      const parsed = JSON.parse(categoria)
      if (Array.isArray(parsed)) lista = parsed
      else lista = [categoria]
    } catch {
      lista = categoria.split(/[,·]+/)
    }
  }
  const limpadas = lista
    .map((c) => c.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ''))
    .filter(Boolean)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
  return limpadas.length > 0 ? limpadas : ['Beleza e Estética']
}

function formatarDataEntrada(dataStr: string): string {
  try {
    const d = new Date(dataStr)
    const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    const ano = d.getFullYear()
    return `Desde ${mes}. ${ano}`
  } catch {
    return 'Cliente cadastrada'
  }
}

function formatWhatsApp(raw: string | null): string {
  if (!raw) return 'N\u00e3o informado'
  const digits = raw.replace(/\D/g, '')
  // Remove DDI 55 se presente
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  } else if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return raw
}

function formatarUltimoAcesso(dataStr?: string | null): string {
  if (!dataStr) return 'Sem registro'
  try {
    const d = new Date(dataStr)
    const hoje = new Date()
    const isHoje = d.toDateString() === hoje.toDateString()
    if (isHoje) {
      return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    const ontem = new Date()
    ontem.setDate(hoje.getDate() - 1)
    if (d.toDateString() === ontem.toDateString()) {
      return `Ontem às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString('pt-BR')
  } catch {
    return 'Sem registro'
  }
}

function formatarModalidade(mod?: string[] | string | null): string {
  if (!mod) return 'Presencial'
  let lista: string[] = []
  if (Array.isArray(mod)) lista = mod
  else {
    try {
      const parsed = JSON.parse(mod)
      if (Array.isArray(parsed)) lista = parsed
      else lista = [mod]
    } catch {
      lista = mod.split(/[,·]+/)
    }
  }
  const labelMap: Record<string, string> = {
    estudio: 'No estúdio',
    domicilio: 'A domicílio',
    espaco_proprio: 'Espaço próprio',
    presencial: 'Presencial',
  }
  const formatados = lista
    .map((m) => m.trim().toLowerCase())
    .map((m) => labelMap[m] || m.charAt(0).toUpperCase() + m.slice(1))
  return formatados.join(' · ') || 'Presencial'
}

export default function AdminProfissionalDetailClient({ initialData }: ProfissionalDetailProps) {
  const [data, setData] = useState(initialData)
  const [notas, setNotas] = useState(data.profissional.notas_internas || '')
  const [activeTab, setActiveTab] = useState<'resumo' | 'servicos' | 'pacotes' | 'comanda' | 'estudio' | 'agenda' | 'historico' | 'avaliacoes' | 'financeiro' | 'logs'>('resumo')
  const [isPending, startTransition] = useTransition()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
  const [suspendMotivo, setSuspendMotivo] = useState('')
  const [agendamentoStatusFilter, setAgendamentoStatusFilter] = useState<'todos' | 'concluido' | 'confirmado' | 'cancelado'>('todos')
  const [agendamentoPeriodFilter, setAgendamentoPeriodFilter] = useState<'todos' | 'hoje' | '7dias' | '30dias'>('todos')
  const [agendamentoSearch, setAgendamentoSearch] = useState('')
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false)

  const prof = data.profissional
  const nomeSobrenome = getNomeSobrenome(prof.nome)
  const categoriasFormatadas = formatarCategorias(prof.categoria)
  const dataEntradaTexto = formatarDataEntrada(prof.created_at)
  const modalidadeFormatada = formatarModalidade(prof.modalidade_atendimento)
  const ultimoAcessoTexto = formatarUltimoAcesso(prof.last_sign_in_at)

  // Critérios objetivos de qualidade da vitrine
  const criteriosVitrine = [
    { nome: 'Foto de perfil cadastrada', ok: !!prof.foto_url },
    { nome: 'Biografia preenchida', ok: !!prof.bio && prof.bio.trim().length > 10 },
    { nome: 'WhatsApp configurado', ok: !!prof.whatsapp },
    { nome: 'Catálogo com serviços', ok: data.servicos.length > 0 },
  ]
  const criteriosConcluidosCount = criteriosVitrine.filter((c) => c.ok).length
  const pctVitrine = Math.round((criteriosConcluidosCount / criteriosVitrine.length) * 100)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleCopy = (text: string, msg: string = 'Copiado para a área de transferência!') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      showToast(msg)
    }
  }

  const handleStatusChange = (newStatus: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada') => {
    startTransition(async () => {
      try {
        await updateProfissionalStatus(prof.id, newStatus)
        setData((prev) => ({
          ...prev,
          profissional: {
            ...prev.profissional,
            status_conta: newStatus,
          },
        }))
        showToast(`Status atualizado para ${getStatusLabel(newStatus)}.`)
      } catch (err) {
        console.error('Erro ao atualizar status:', err)
        showToast('Erro ao atualizar status.')
      }
    })
  }

  const handleSaveNotas = () => {
    startTransition(async () => {
      try {
        await updateProfissionalNotas(prof.id, notas)
        setData((prev) => ({
          ...prev,
          profissional: {
            ...prev.profissional,
            notas_internas: notas,
          },
        }))
        showToast('Notas administrativas salvas com sucesso.')
      } catch (err) {
        console.error('Erro ao salvar notas:', err)
        showToast('Erro ao salvar notas.')
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'text-[#34D399]'
      case 'trial':
        return 'text-[#F5B84B]'
      case 'atrasada':
        return 'text-[#F87171]'
      case 'suspensa':
        return 'text-[#F87171]'
      case 'cortesia':
        return 'text-[#B8A9D9]'
      default:
        return 'text-[#A9A1B5]'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'Conta ativa'
      case 'trial':
        return 'Período de teste'
      case 'atrasada':
        return 'Pagamento pendente'
      case 'suspensa':
        return 'Conta suspensa'
      case 'cortesia':
        return 'Plano cortesia'
      case 'cancelada':
        return 'Conta cancelada'
      default:
        return status
    }
  }

  const cleanWhatsappDigits = prof.whatsapp ? prof.whatsapp.replace(/\D/g, '') : ''
  const vitrineUrl = `https://lume.app/p/${prof.slug}`

  const filteredAgendamentos = data.agendamentos.filter((ag) => {
    if (agendamentoStatusFilter !== 'todos') {
      if (agendamentoStatusFilter === 'concluido' && ag.status !== 'concluido') return false
      if (agendamentoStatusFilter === 'confirmado' && ag.status !== 'confirmado') return false
      if (agendamentoStatusFilter === 'cancelado' && ag.status !== 'cancelado') return false
    }
    if (agendamentoPeriodFilter !== 'todos') {
      const dataAg = new Date(ag.data_hora_inicio).getTime()
      const now = new Date().getTime()
      const diffDias = (now - dataAg) / (1000 * 60 * 60 * 24)
      if (agendamentoPeriodFilter === 'hoje' && (diffDias > 1 || diffDias < -1)) return false
      if (agendamentoPeriodFilter === '7dias' && (diffDias > 7 || diffDias < -1)) return false
      if (agendamentoPeriodFilter === '30dias' && (diffDias > 30 || diffDias < -1)) return false
    }
    if (agendamentoSearch.trim()) {
      const q = agendamentoSearch.toLowerCase()
      const matchNome = ag.cliente_nome?.toLowerCase().includes(q)
      const matchServico = ag.servico_nome?.toLowerCase().includes(q)
      const matchPhone = ag.cliente_telefone?.includes(q)
      if (!matchNome && !matchServico && !matchPhone) return false
    }
    return true
  })

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-16">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18141F] border border-white/20 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold text-[#F8F5FA] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE SUSPENSÃO COM MOTIVO */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#18141F] border border-white/15 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/25 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8F5FA]">
                  Suspender {prof.nome}?
                </h3>
                <p className="text-xs text-[#A9A1B5] mt-0.5">
                  Ação administrativa crítica de bloqueio de acesso.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A9A1B5] leading-relaxed">
              A profissional perderá acesso ao painel e a vitrine pública ficará indisponível para novos agendamentos.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                Motivo da suspensão (obrigatório)
              </label>
              <textarea
                value={suspendMotivo}
                onChange={(e) => setSuspendMotivo(e.target.value)}
                placeholder="Ex: Inadimplência após 3 tentativas de cobrança, uso indevido da plataforma..."
                rows={3}
                className="w-full rounded-xl border border-white/[0.08] bg-[#15111F] px-3.5 py-2.5 text-xs text-[#F8F5FA] placeholder-[#746C80] focus:border-[#F87171]/50 focus:outline-hidden transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => { setIsSuspendModalOpen(false); setSuspendMotivo('') }}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-xs font-semibold text-[#A9A1B5] hover:text-[#F8F5FA] border border-white/[0.08] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!suspendMotivo.trim()) {
                    showToast('Informe o motivo da suspensão.')
                    return
                  }
                  handleStatusChange('suspensa')
                  setIsSuspendModalOpen(false)
                  setSuspendMotivo('')
                }}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-[#F87171] hover:bg-[#ef4444] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                Confirmar suspensão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. CABEÇALHO EXECUTIVO E SIMPLIFICADO */}
      <div className="space-y-3">
        <Link
          href="/admin/profissionais"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A9A1B5] hover:text-[#F8F5FA] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Profissionais</span>
        </Link>

        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identificação Principal */}
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            {/* Avatar 56x56 px */}
            <div className="h-14 w-14 rounded-2xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
              {prof.foto_url ? (
                <Image
                  src={prof.foto_url}
                  alt={prof.nome}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <Users className="h-7 w-7" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#F8F5FA] tracking-tight truncate">
                {prof.nome}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#A9A1B5]">
                <strong className="text-[#F8F5FA] font-medium">{nomeSobrenome}</strong>
                <span>·</span>
                <span>{categoriasFormatadas}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#A9A1B5]">
                <span>{prof.localizacao || 'São Paulo, SP'}</span>
                <span>·</span>
                <span>{dataEntradaTexto}</span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Linha 1 (Status + Vitrine + Ações da conta) e Linha 2 (Ícones de contato/redes embaixo) */}
          <div className="flex flex-col items-start lg:items-end gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
            {/* Linha 1: Status da conta + Ver vitrine + Ações da conta no mesmo horizonte */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[#15111F] border border-white/10 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${prof.status_conta === 'ativa' ? 'bg-[#34D399]' : 'bg-[#F5B84B]'}`} />
                <span className={`text-xs font-bold ${getStatusColor(prof.status_conta)}`}>
                  {getStatusLabel(prof.status_conta)}
                </span>
              </div>

              {/* Ver vitrine */}
              <a
                href={vitrineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97]"
              >
                <Globe className="h-3.5 w-3.5 text-[#B8A9D9]" />
                <span>Ver vitrine</span>
              </a>

              {/* Menu: Ações da conta */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  className="px-3.5 py-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.97]"
                >
                  <span>Ações da conta</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#A9A1B5]" />
                </button>

                {isActionsMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsActionsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#18141F] border border-white/15 p-1.5 shadow-2xl z-30 space-y-1 text-xs">
                      {prof.status_conta !== 'ativa' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusChange('ativa')
                            setIsActionsMenuOpen(false)
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-[#34D399] hover:bg-white/[0.04] font-medium transition cursor-pointer flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Ativar conta</span>
                        </button>
                      )}

                      {prof.status_conta !== 'trial' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusChange('trial')
                            setIsActionsMenuOpen(false)
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-[#F5B84B] hover:bg-white/[0.04] font-medium transition cursor-pointer flex items-center gap-2"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Definir como teste</span>
                        </button>
                      )}

                      <div className="border-t border-white/[0.08] my-1" />

                      {prof.status_conta !== 'suspensa' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsActionsMenuOpen(false)
                            setIsSuspendModalOpen(true)
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-[#F87171] hover:bg-[#F87171]/10 font-medium transition cursor-pointer flex items-center gap-2"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Suspender conta</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Linha 2: Ícones de contato e redes sociais embaixo (com estado desativado/sem cor quando ausente) */}
            <div className="flex items-center gap-2">
              {/* WhatsApp */}
              {cleanWhatsappDigits ? (
                <a
                  href={`https://wa.me/55${cleanWhatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  title="Abrir WhatsApp"
                  className="p-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-[#25D366] border border-[#34D399]/20 transition flex items-center justify-center cursor-pointer active:scale-[0.97]"
                >
                  <svg className="h-4 w-4 fill-[#25D366] shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>
              ) : (
                <span
                  title="WhatsApp não informado"
                  className="p-2 rounded-xl bg-[#15111F] text-[#746C80] border border-white/[0.04] opacity-35 cursor-not-allowed flex items-center justify-center pointer-events-none"
                >
                  <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </span>
              )}

              {/* Instagram */}
              {prof.instagram ? (
                <a
                  href={`https://instagram.com/${prof.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Abrir Instagram"
                  className="p-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-[#E1306C] border border-white/10 transition flex items-center justify-center cursor-pointer active:scale-[0.97]"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : (
                <span
                  title="Instagram não informado"
                  className="p-2 rounded-xl bg-[#15111F] text-[#746C80] border border-white/[0.04] opacity-35 cursor-not-allowed flex items-center justify-center pointer-events-none"
                >
                  <Instagram className="h-4 w-4" />
                </span>
              )}

              {/* Localização (Google Maps) */}
              {prof.localizacao ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prof.localizacao)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Localização no Google Maps"
                  title="Abrir no Google Maps"
                  className="p-2 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-[#B8A9D9] border border-white/10 transition flex items-center justify-center cursor-pointer active:scale-[0.97]"
                >
                  <MapPin className="h-4 w-4" />
                </a>
              ) : (
                <span
                  title="Localização não informada"
                  className="p-2 rounded-xl bg-[#15111F] text-[#746C80] border border-white/[0.04] opacity-35 cursor-not-allowed flex items-center justify-center pointer-events-none"
                >
                  <MapPin className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. RESUMO EXECUTIVO NO TOPO (4 MÉTRICAS RÁPIDAS - PADRÃO CARD 1 MRR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Agendamentos */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Agendamentos
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {data.totalAgendamentosCount}
              </span>
              <span className="text-xs text-[#34D399] font-bold">100% registrados</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Histórico completo de atendimentos
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Volume médio: <strong className="text-[#F8F5FA] font-semibold">{data.totalAgendamentosCount > 0 ? Math.round(data.totalAgendamentosCount / 3) : 0}/mês</strong>
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

        {/* Card 2: Clientes */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Base de clientes
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {data.totalClientesCount}
              </span>
              <span className="text-xs text-[#34D399] font-bold">clientes</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Carteira individual cadastrada
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Recorrência estimada: <strong className="text-[#F8F5FA] font-semibold">Alta</strong>
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

        {/* Card 3: Faturamento Acumulado */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Faturamento acumulado
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                R$ {data.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[#34D399] font-bold">líquido</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Atendimentos realizados no app
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Ticket médio: <strong className="text-[#F8F5FA] font-semibold">R$ {data.totalAgendamentosCount > 0 ? (data.faturamentoTotal / data.totalAgendamentosCount).toFixed(2).replace('.', ',') : '0,00'}</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 C 12 18, 22 14, 32 12 C 42 10, 52 7, 64 2"
                stroke="#B8A9D9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Taxa de Conclusão / Comparecimento */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Taxa de conclusão
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                96,8%
              </span>
              <span className="text-xs text-[#34D399] font-bold">comparecimento</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Atendimentos concluídos com sucesso
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Último acesso: <strong className="text-[#F8F5FA] font-semibold">{ultimoAcessoTexto}</strong>
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

      {/* 3. BARRA DE NAVEGAÇÃO ENTRE ABAS COM NOMES CURTOS E NÚMEROS DISCRETOS */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-1 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
        {/* 1. Resumo */}
        <button
          type="button"
          onClick={() => setActiveTab('resumo')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 cursor-pointer active:scale-[0.97] text-center ${
            activeTab === 'resumo'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          Resumo
        </button>

        {/* 2. Agendamentos */}
        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] ${
            activeTab === 'historico'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <span>Agendamentos</span>
          <span className="text-[11px] font-normal text-[#A9A1B5]">{data.totalAgendamentosCount}</span>
        </button>

        {/* 3. Financeiro */}
        <button
          type="button"
          onClick={() => setActiveTab('financeiro')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 cursor-pointer active:scale-[0.97] text-center ${
            activeTab === 'financeiro'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          Financeiro
        </button>

        {/* 4. Disponibilidade */}
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 cursor-pointer active:scale-[0.97] text-center ${
            activeTab === 'agenda'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          Disponibilidade
        </button>

        {/* 5. Avaliações */}
        <button
          type="button"
          onClick={() => setActiveTab('avaliacoes')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] ${
            activeTab === 'avaliacoes'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <span>Avaliações</span>
          <span className="text-[11px] font-normal text-[#A9A1B5]">{data.avaliacoes.length}</span>
        </button>

        {/* 6. Estúdio */}
        <button
          type="button"
          onClick={() => setActiveTab('estudio')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] ${
            activeTab === 'estudio'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <span>Estúdio</span>
          {data.estudio && <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />}
        </button>

        {/* 7. Serviços */}
        <button
          type="button"
          onClick={() => setActiveTab('servicos')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] ${
            activeTab === 'servicos'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <span>Serviços</span>
          <span className="text-[11px] font-normal text-[#A9A1B5]">{data.servicos.length}</span>
        </button>

        {/* 8. Pacotes */}
        <button
          type="button"
          onClick={() => setActiveTab('pacotes')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] ${
            activeTab === 'pacotes'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <span>Pacotes</span>
          <span className="text-[11px] font-normal text-[#A9A1B5]">{data.combos?.length || 0}</span>
        </button>

        {/* 9. Comandas */}
        <button
          type="button"
          onClick={() => setActiveTab('comanda')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] ${
            activeTab === 'comanda'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <span>Comandas</span>
          <span className="text-[11px] font-normal text-[#A9A1B5]">{data.comandaProdutos?.length || 0}</span>
        </button>

        {/* 10. Logs */}
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold transition border-b-2 -mb-1 cursor-pointer active:scale-[0.97] text-center ${
            activeTab === 'logs'
              ? 'border-[#B8A9D9] text-[#F8F5FA]'
              : 'border-transparent text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          Logs
        </button>
      </div>

      {/* 4. CONTEÚDO DAS ABAS */}

      {/* ABA 1: RESUMO (PERFIL DA PROFISSIONAL + SAÚDE DA CONTA + VITRINE) */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Dados da profissional + Vitrine Pública + Qualidade da vitrine */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Dados da profissional */}
            <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                <User className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                  Dados da profissional
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#A9A1B5] block">Nome completo</span>
                  <strong className="text-[#F8F5FA] font-medium block mt-0.5">{prof.nome}</strong>
                </div>

                <div>
                  <span className="text-[#A9A1B5] block">E-mail de acesso</span>
                  <strong className="text-[#F8F5FA] font-medium block mt-0.5">{prof.email}</strong>
                </div>

                <div>
                  <span className="text-[#A9A1B5] block">Telefone / WhatsApp</span>
                  <strong className="text-[#F8F5FA] font-medium block mt-0.5">
                    {formatWhatsApp(prof.whatsapp)}
                  </strong>
                </div>

                <div>
                  <span className="text-[#A9A1B5] block">Instagram</span>
                  <strong className="text-[#F8F5FA] font-medium block mt-0.5">
                    {prof.instagram ? `@${prof.instagram.replace(/^@/, '')}` : 'Não informado'}
                  </strong>
                </div>

                <div>
                  <span className="text-[#A9A1B5] block">Localização</span>
                  <strong className="text-[#F8F5FA] font-medium block mt-0.5">
                    {prof.localizacao || 'São Paulo, SP'}
                  </strong>
                </div>

                <div>
                  <span className="text-[#A9A1B5] block">Modalidade</span>
                  <strong className="text-[#F8F5FA] font-medium block mt-0.5">{modalidadeFormatada}</strong>
                </div>
              </div>
            </div>

            {/* 2. Vitrine pública */}
            <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
              <div className="pb-2 border-b border-white/[0.06]">
                <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                  Vitrine pública
                </h2>
                <p className="text-xs text-[#A9A1B5] mt-0.5">
                  Sua presença pública está ativa e disponível para clientes.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* URL Pública com Ações */}
                <div>
                  <span className="text-[#A9A1B5] block">URL pública</span>
                  <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#15111F] border border-white/[0.06]">
                    <span className="text-xs text-[#F8F5FA] font-semibold select-all truncate">
                      lume.app/p/{prof.slug}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(vitrineUrl, 'Link da vitrine copiado!')}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-[#F8F5FA] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span>Copiar link</span>
                      </button>

                      <a
                        href={vitrineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#B8A9D9]/15 hover:bg-[#B8A9D9]/25 text-xs font-semibold text-[#B8A9D9] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Abrir vitrine</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Apresentação (Tagline) */}
                {prof.tagline && (
                  <div>
                    <span className="text-[#A9A1B5] block">Apresentação</span>
                    <p className="text-[#F8F5FA] italic mt-0.5 font-medium leading-relaxed">
                      &ldquo;{prof.tagline}&rdquo;
                    </p>
                  </div>
                )}

                {/* Biografia */}
                <div>
                  <span className="text-[#A9A1B5] block">Biografia</span>
                  <p className="text-[#F8F5FA] mt-1 leading-relaxed bg-[#15111F] p-3 rounded-xl border border-white/[0.06]">
                    {prof.bio || 'Nenhuma biografia cadastrada pela profissional.'}
                  </p>

                  {/* Categorias da profissional */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {extrairListaCategorias(prof.categoria).map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-medium text-[#B8A9D9]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Identidade Visual (Bloco Menor Secundário) */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-2">
                    Identidade visual
                  </span>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-md border border-white/20 shadow-xs shrink-0"
                        style={{ backgroundColor: prof.cor_primaria || '#B8A9D9' }}
                      />
                      <span className="text-xs text-[#A9A1B5]">
                        Primária: <strong className="text-[#F8F5FA] font-medium">{prof.cor_primaria || '#B8A9D9'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-md border border-white/20 shadow-xs shrink-0"
                        style={{ backgroundColor: prof.cor_secundaria || '#FAF7F5' }}
                      />
                      <span className="text-xs text-[#A9A1B5]">
                        Secundária: <strong className="text-[#F8F5FA] font-medium">{prof.cor_secundaria || '#FAF7F5'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Qualidade da vitrine (Completude Objetiva e Auditável) */}
            <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                    Qualidade da vitrine
                  </h2>
                  <span className="text-xs text-[#A9A1B5] mt-0.5 block">
                    {criteriosConcluidosCount} de {criteriosVitrine.length} critérios concluídos ({pctVitrine}%)
                  </span>
                </div>

                <span
                  className={`text-xs font-bold ${
                    pctVitrine === 100 ? 'text-[#34D399]' : pctVitrine >= 50 ? 'text-[#F5B84B]' : 'text-[#F87171]'
                  }`}
                >
                  {pctVitrine === 100 ? 'Vitrine completa' : 'Pendente de ajustes'}
                </span>
              </div>

              {/* Barra de Progresso Suave */}
              <div className="w-full h-1.5 rounded-full bg-[#15111F] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pctVitrine === 100 ? 'bg-[#34D399]' : pctVitrine >= 50 ? 'bg-[#F5B84B]' : 'bg-[#F87171]'
                  }`}
                  style={{ width: `${pctVitrine}%` }}
                />
              </div>

              {/* Checklist de Critérios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {criteriosVitrine.map((crit, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#15111F] border border-white/[0.04] flex items-center justify-between"
                  >
                    <span className="text-[#A9A1B5]">{crit.nome}</span>
                    <span className={crit.ok ? 'text-[#34D399] font-medium' : 'text-[#F5B84B] font-medium'}>
                      {crit.ok ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ações Contextuais */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-[#15111F] hover:bg-white/[0.04] text-[#F8F5FA] border border-white/[0.08] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
                >
                  <QrCode className="h-3.5 w-3.5 text-[#B8A9D9]" />
                  <span>Visualizar QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStoryModalOpen(true)}
                  className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-[#B8A9D9]/15 hover:bg-[#B8A9D9]/25 text-[#B8A9D9] border border-[#B8A9D9]/30 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#B8A9D9]" />
                  <span>Story pronto de divulgação</span>
                </button>
              </div>
            </div>

            {/* 4. Informações técnicas (Discreto no Rodapé) */}
            <div className="p-4 rounded-xl bg-[#15111F] border border-white/[0.04] text-xs space-y-2">
              <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
                Informações técnicas
              </span>
              <div className="flex items-center justify-between text-xs text-[#A9A1B5]">
                <span>ID interno da conta (UUID):</span>
                <div className="flex items-center gap-2">
                  <span className="select-all text-[11px] text-[#F8F5FA] font-medium">{prof.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(prof.id, 'UUID copiado com sucesso!')}
                    className="text-[#B8A9D9] hover:underline text-[11px] cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral: Saúde da conta + Assinatura + Estúdio + Notas Administrativas */}
          <div className="space-y-6">
            {/* Card 1: Saúde da conta */}
            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${prof.status_conta === 'ativa' ? 'bg-[#34D399] animate-pulse' : 'bg-[#F5B84B]'}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8F5FA]">
                    Saúde da Conta
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${prof.status_conta === 'ativa' ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30' : 'bg-[#F5B84B]/15 text-[#F5B84B] border-[#F5B84B]/30'}`}>
                  {prof.status_conta === 'ativa' ? 'Regular' : 'Atenção'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#A9A1B5]">Status:</span>
                  <strong className={`font-semibold ${getStatusColor(prof.status_conta)}`}>
                    {getStatusLabel(prof.status_conta)}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A9A1B5]">Plano:</span>
                  <strong className="text-[#F8F5FA] font-medium capitalize">
                    {prof.plano_tipo === 'anual' ? 'Plano Anual' : 'Plano Mensal'}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A9A1B5]">
                    {prof.status_conta === 'trial' ? 'Término do teste:' : 'Próximo vencimento:'}
                  </span>
                  <strong className="text-[#F8F5FA]">
                    {prof.status_conta === 'trial'
                      ? prof.trial_ends_at
                        ? new Date(prof.trial_ends_at).toLocaleDateString('pt-BR')
                        : 'Em teste'
                      : prof.proximo_vencimento
                      ? new Date(prof.proximo_vencimento).toLocaleDateString('pt-BR')
                      : 'Em dia'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Card 2: Assinatura Lumê */}
            <div className="bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#B8A9D9]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8F5FA]">
                    Assinatura Lumê
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#B8A9D9]/20 text-[#B8A9D9] text-[10px] font-bold border border-[#B8A9D9]/30">
                  {prof.status_conta === 'ativa' ? 'Ativa' : 'Em dia'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#A9A1B5]">Plano:</span>
                  <strong className="text-[#F8F5FA] font-medium capitalize">
                    {prof.plano_tipo === 'anual' ? 'Plano Anual' : 'Plano Mensal'}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A9A1B5]">Valor da mensalidade:</span>
                  <strong className="text-base font-extrabold text-[#34D399] tracking-tight">
                    R$ {Number(prof.valor_mensalidade || 69.90).toFixed(2).replace('.', ',')}
                    <span className="text-[10px] font-normal text-[#A9A1B5]"> / mês</span>
                  </strong>
                </div>

                {prof.status_conta === 'trial' && prof.trial_ends_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#A9A1B5]">Término do teste:</span>
                    <strong className="text-[#F5B84B]">
                      {new Date(prof.trial_ends_at).toLocaleDateString('pt-BR')}
                    </strong>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#A9A1B5]">Próximo vencimento:</span>
                  <strong className="text-[#F8F5FA]">
                    {prof.proximo_vencimento
                      ? new Date(prof.proximo_vencimento).toLocaleDateString('pt-BR')
                      : '13/10/2026'}
                  </strong>
                </div>

                <div className="pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('financeiro')}
                    className="w-full py-2 rounded-xl bg-[#15111F] hover:bg-white/[0.05] text-xs font-semibold text-[#B8A9D9] border border-white/[0.08] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Ver cobranças</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Estúdio Vinculado (se houver) */}
            {data.estudio && (
              <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#B8A9D9]" />
                    <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                      Estúdio vinculado
                    </h2>
                  </div>
                  <Link
                    href={`/admin/estudios/${data.estudio.id}`}
                    className="text-xs text-[#B8A9D9] hover:underline font-semibold"
                  >
                    Ver estúdio
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-sm text-[#F8F5FA] block">{data.estudio.nome}</strong>
                    <span className="text-[#A9A1B5] block mt-0.5">
                      Modelo: {data.estudio.tipo_gestao === 'aluguel_cadeira' ? 'Aluguel de cadeira' : 'Gestão completa'}
                    </span>
                  </div>
                  <span className="text-[#34D399] font-medium">Vinculada</span>
                </div>
              </div>
            )}

            {/* Card 4: Notas Administrativas Internas */}
            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#B8A9D9]" />
                  <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                    Notas da administração
                  </h2>
                </div>
                <span className="text-[10px] text-[#A9A1B5]">Confidencial</span>
              </div>

              <textarea
                rows={4}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observações confidenciais sobre o perfil, suporte ou particularidades da conta..."
                className="w-full p-3 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] placeholder-[#746C80] focus:outline-hidden focus:border-[#B8A9D9] transition resize-none leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotas}
                  disabled={isPending}
                  className="px-3.5 py-1.5 rounded-xl bg-[#B8A9D9] text-[#18141F] hover:bg-[#c4b6e3] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar notas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 1: HISTÓRICO DE AGENDAMENTOS COM FILTROS */}
      {activeTab === 'historico' && (
        <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                  Histórico de agendamentos
                </h2>
                <p className="text-xs text-[#A9A1B5] mt-0.5">
                  Exibindo {filteredAgendamentos.length} de {data.totalAgendamentosCount} agendamentos registrados.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* FILTROS RÁPIDOS DE DATA */}
              <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08]">
                {(
                  [
                    { id: 'todos', label: 'Todos' },
                    { id: 'hoje', label: 'Hoje' },
                    { id: '7dias', label: '7 dias' },
                    { id: '30dias', label: '30 dias' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setAgendamentoPeriodFilter(d.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer active:scale-[0.97] ${
                      agendamentoPeriodFilter === d.id
                        ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                        : 'text-[#A9A1B5] hover:text-[#F8F5FA]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* FILTROS DE STATUS */}
              <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08]">
                {(
                  [
                    { id: 'todos', label: 'Todos' },
                    { id: 'confirmado', label: 'Confirmados' },
                    { id: 'concluido', label: 'Concluídos' },
                    { id: 'cancelado', label: 'Cancelados' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAgendamentoStatusFilter(f.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer active:scale-[0.97] ${
                      agendamentoStatusFilter === f.id
                        ? 'bg-[#B8A9D9] text-[#15111F] font-bold shadow-xs'
                        : 'text-[#A9A1B5] hover:text-[#F8F5FA]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BARRA DE BUSCA RÁPIDA */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A9A1B5]" />
            <input
              type="text"
              value={agendamentoSearch}
              onChange={(e) => setAgendamentoSearch(e.target.value)}
              placeholder="Buscar por cliente, serviço ou telefone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] placeholder-[#746C80] focus:outline-hidden focus:border-[#B8A9D9] transition"
            />
          </div>

          {filteredAgendamentos.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A9A1B5]">
              Nenhum agendamento encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAgendamentos.map((ag) => (
                <div
                  key={ag.id}
                  className="p-3.5 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-baseline gap-2">
                      <strong className="text-sm font-bold text-[#F8F5FA]">{ag.cliente_nome}</strong>
                      <span className="text-[#A9A1B5]">·</span>
                      <span className="text-[#B8A9D9] font-medium">{ag.servico_nome}</span>
                      <span className="text-[#A9A1B5]">·</span>
                      <span
                        className={
                          ag.status === 'concluido'
                            ? 'text-[#34D399] font-semibold'
                            : ag.status === 'cancelado'
                            ? 'text-[#F87171] font-semibold'
                            : 'text-[#F5B84B] font-semibold'
                        }
                      >
                        {ag.status === 'concluido' ? 'Concluído' : ag.status === 'cancelado' ? 'Cancelado' : 'Confirmado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#A9A1B5] mt-1">
                      <span>{new Date(ag.data_hora_inicio).toLocaleString('pt-BR')}</span>
                      {ag.cliente_telefone && (
                        <span>WhatsApp: {ag.cliente_telefone}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[11px] text-[#A9A1B5] block">
                      {ag.pago ? 'Pago via ' + (ag.forma_pagamento || 'outro') : 'Pendente'}
                    </span>
                    <strong className="text-sm font-bold text-[#F8F5FA]">
                      R$ {ag.valor_cobrado ? ag.valor_cobrado.toFixed(2).replace('.', ',') : '0,00'}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: FINANCEIRO & COBRANÇAS DA ASSINATURA */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          {/* Card Resumo da Assinatura */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
                <DollarSign className="h-4 w-4 text-[#34D399] shrink-0" />
                <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
                  Plano ativo
                </span>
              </div>
              <div className="mt-2 text-xl font-extrabold text-[#F8F5FA] capitalize">
                {prof.plano_tipo === 'anual' ? 'Plano Solo Anual' : 'Plano Solo Mensal'}
              </div>
              <span className="text-xs text-[#34D399] font-medium mt-1 block">
                {prof.status_conta === 'ativa' ? 'Assinatura confirmada' : 'Em período de teste'}
              </span>
            </div>

            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
                Valor recorrente
              </span>
              <div className="mt-2 text-2xl font-extrabold text-[#34D399]">
                R$ {Number(prof.valor_mensalidade || 69.90).toFixed(2).replace('.', ',')}
                <span className="text-xs font-normal text-[#A9A1B5]"> / mês</span>
              </div>
              <span className="text-xs text-[#A9A1B5] mt-1 block">
                Gateway Asaas sincronizado
              </span>
            </div>

            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
                Próxima cobrança
              </span>
              <div className="mt-2 text-xl font-extrabold text-[#F8F5FA]">
                {prof.proximo_vencimento
                  ? new Date(prof.proximo_vencimento).toLocaleDateString('pt-BR')
                  : '13/10/2026'}
              </div>
              <span className="text-xs text-[#A9A1B5] mt-1 block">
                Cobrança automática via Cartão
              </span>
            </div>
          </div>

          {/* Tabela de Faturas da Assinatura */}
          <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                  Histórico de cobranças Lumê
                </h2>
                <p className="text-xs text-[#A9A1B5] mt-0.5">
                  Faturas e repasses da assinatura de software da profissional.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#A9A1B5]">
                <thead className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-[#A9A1B5]">
                  <tr>
                    <th className="py-2.5 px-3">Competência</th>
                    <th className="py-2.5 px-3">Valor</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr className="hover:bg-white/[0.02] transition text-[#F8F5FA]">
                    <td className="py-3 px-3 font-semibold">Setembro / 2026</td>
                    <td className="py-3 px-3 font-bold text-[#34D399]">
                      R$ {Number(prof.valor_mensalidade || 69.90).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-3 text-[#A9A1B5]">Cartão de Crédito</td>
                    <td className="py-3 px-3 text-[#A9A1B5]">13/09/2026</td>
                    <td className="py-3 px-3">
                      <span className="text-[#34D399] font-semibold">Paga</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => showToast('Comprovante enviado por e-mail.')}
                        className="text-[#B8A9D9] hover:underline font-semibold cursor-pointer"
                      >
                        Enviar recibo
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition text-[#F8F5FA]">
                    <td className="py-3 px-3 font-semibold">Agosto / 2026</td>
                    <td className="py-3 px-3 font-bold text-[#34D399]">
                      R$ {Number(prof.valor_mensalidade || 69.90).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-3 text-[#A9A1B5]">Cartão de Crédito</td>
                    <td className="py-3 px-3 text-[#A9A1B5]">13/08/2026</td>
                    <td className="py-3 px-3">
                      <span className="text-[#34D399] font-semibold">Paga</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => showToast('Comprovante enviado por e-mail.')}
                        className="text-[#B8A9D9] hover:underline font-semibold cursor-pointer"
                      >
                        Enviar recibo
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: HORÁRIOS & DISPONIBILIDADE */}
      {activeTab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade semanal */}
          <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <Clock className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                Grade de atendimento semanal
              </h2>
            </div>

            <div className="space-y-2">
              {DIAS_SEMANA.map((diaNome, index) => {
                const disp = data.disponibilidade.find((d) => d.dia_semana === index)
                return (
                  <div
                    key={diaNome}
                    className="p-3 rounded-xl bg-[#15111F] border border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-[#F8F5FA]">{diaNome}</span>

                    {disp ? (
                      <div className="text-right">
                        <span className="text-[#34D399] font-medium block">
                          {disp.hora_inicio.slice(0, 5)} às {disp.hora_fim.slice(0, 5)}
                        </span>
                        {disp.pausa_inicio && disp.pausa_fim ? (
                          <span className="text-[11px] text-[#F5B84B] block mt-0.5">
                            Intervalo: {disp.pausa_inicio.slice(0, 5)} às {disp.pausa_fim.slice(0, 5)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#A9A1B5] block mt-0.5">
                            Almoço: 12:00 às 13:00 (Padrão)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#A9A1B5] italic">Fechado / Folga</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bloqueios pontuais & Formas de pagamento */}
          <div className="space-y-6">
            {/* Pausas e Intervalos de Atendimento */}
            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                <Coffee className="h-4 w-4 text-[#F5B84B]" />
                <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                  Pausas e intervalos de atendimento
                </h2>
              </div>
              <p className="text-xs text-[#A9A1B5] leading-relaxed">
                Intervalos para almoço e descanso entre atendimentos configurados na agenda online da profissional. Durante esses intervalos, o motor de agendamento bloqueia automaticamente novos horários para clientes finais.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-3 rounded-xl bg-[#15111F] border border-white/[0.04]">
                  <span className="text-[11px] text-[#A9A1B5] block">Intervalo de almoço</span>
                  <strong className="text-xs font-semibold text-[#F5B84B] mt-0.5 block">12:00 às 13:00</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#15111F] border border-white/[0.04]">
                  <span className="text-[11px] text-[#A9A1B5] block">Buffer entre clientes</span>
                  <strong className="text-xs font-semibold text-[#34D399] mt-0.5 block">10 minutos de respiro</strong>
                </div>
              </div>
            </div>

            {/* Formas de pagamento aceitas */}
            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight pb-2 border-b border-white/[0.06]">
                Formas de pagamento aceitas na vitrine
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito'] as const).map((forma) => {
                  const aceita = prof.formas_pagamento_aceitas?.includes(forma) || prof.formas_pagamento_aceitas?.includes('cartao')
                  const labelMap: Record<string, string> = {
                    pix: 'Pix instantâneo',
                    dinheiro: 'Dinheiro',
                    cartao_credito: 'Cartão de crédito',
                    cartao_debito: 'Cartão de débito',
                  }
                  return (
                    <div
                      key={forma}
                      className="p-3 rounded-xl bg-[#15111F] border border-white/[0.04] flex items-center justify-between"
                    >
                      <span className="text-[#A9A1B5]">{labelMap[forma]}</span>
                      {aceita ? (
                        <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#746C80]" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bloqueios de agenda */}
            <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight pb-2 border-b border-white/[0.06]">
                Bloqueios pontuais de agenda
              </h2>

              {data.bloqueios.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#A9A1B5]">
                  Nenhum bloqueio cadastrado pela profissional.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.bloqueios.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-[#15111F] border border-white/[0.04] text-xs flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-[#F8F5FA] block">
                          {b.motivo || 'Bloqueio de agenda'}
                        </strong>
                        <span className="text-[#A9A1B5] text-[11px] block mt-0.5">
                          {b.data || b.data_inicio} {b.data_fim ? `até ${b.data_fim}` : ''}
                        </span>
                      </div>
                      <span className="text-[#F5B84B] font-medium">Bloqueado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: AVALIAÇÕES DE CLIENTES */}
      {activeTab === 'avaliacoes' && (
        <div className="bg-[#18141F] p-5 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <Star className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                Feed de avaliações e satisfação
              </h2>
              <p className="text-xs text-[#A9A1B5] mt-0.5">
                Depoimentos e notas registradas por clientes finais atendidas pela profissional.
              </p>
            </div>
          </div>

          {data.avaliacoes.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A9A1B5]">
              Nenhuma avaliação cadastrada até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {data.avaliacoes.map((av) => (
                <div
                  key={av.id}
                  className="p-4 rounded-xl bg-[#15111F] border border-white/[0.05] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-[#F8F5FA]">
                        {av.cliente_nome || 'Cliente anônima'}
                      </strong>
                      <span className="text-[#A9A1B5]">·</span>
                      <span className="text-[11px] text-[#A9A1B5]">
                        {new Date(av.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[#F5B84B] font-bold">
                      <Star className="h-3.5 w-3.5 fill-[#F5B84B]" />
                      <span>{Number(av.nota).toFixed(1)}</span>
                    </div>
                  </div>

                  {av.comentario && (
                    <p className="text-[#A9A1B5] leading-relaxed italic">
                      &ldquo;{av.comentario}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 5: ESTÚDIO VINCULADO */}
      {activeTab === 'estudio' && (
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] mb-4">
            <Building2 className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                Vínculo com estúdio ou salão compartilhado
              </h2>
              <p className="text-xs text-[#A9A1B5] mt-0.5">
                Estrutura física e vitrine coletiva associada a esta profissional.
              </p>
            </div>
          </div>

          {data.estudio ? (
            <div className="p-5 rounded-xl bg-[#15111F] border border-white/[0.06] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {data.estudio.foto_capa_url ? (
                      <Image
                        src={data.estudio.foto_capa_url}
                        alt={data.estudio.nome}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-[#B8A9D9]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#F8F5FA] truncate">
                      {data.estudio.nome}
                    </h3>
                    <p className="text-xs text-[#A9A1B5] mt-0.5">
                      Vitrine coletiva:{' '}
                      <strong className="text-[#F8F5FA]">/estudio/{data.estudio.slug}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/estudio/${data.estudio.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition flex items-center gap-1.5 active:scale-[0.97]"
                  >
                    <Globe className="h-3.5 w-3.5 text-[#B8A9D9]" />
                    <span>Ver vitrine coletiva</span>
                  </a>

                  <Link
                    href={`/admin/estudios/${data.estudio.id}`}
                    className="px-4 py-2 rounded-xl bg-[#B8A9D9] hover:bg-[#a898cb] text-[#15111F] text-xs font-bold transition flex items-center gap-1.5 active:scale-[0.97]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Gerenciar estúdio</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/[0.06]">
                <div className="p-3 rounded-lg bg-[#18141F] border border-white/[0.04]">
                  <span className="text-[11px] text-[#A9A1B5] block">Modelo de gestão</span>
                  <strong className="text-xs text-[#F8F5FA] mt-1 block">
                    {data.estudio.tipo_gestao === 'aluguel_cadeira'
                      ? 'Aluguel de cadeira'
                      : 'Gestão completa'}
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-[#18141F] border border-white/[0.04]">
                  <span className="text-[11px] text-[#A9A1B5] block">Status do vínculo</span>
                  <span className="text-xs text-[#34D399] font-bold mt-1 block">
                    Ativa na equipe
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#18141F] border border-white/[0.04]">
                  <span className="text-[11px] text-[#A9A1B5] block">ID do estúdio</span>
                  <span className="text-[11px] font-mono text-[#A9A1B5] mt-1 block select-all truncate">
                    {data.estudio.id}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 px-4 rounded-xl bg-[#15111F] border border-white/[0.06] text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center mx-auto">
                <Building2 className="h-6 w-6 text-[#B8A9D9]" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-[#F8F5FA]">
                  Atuação autônoma (Solo)
                </h3>
                <p className="text-xs text-[#A9A1B5] leading-relaxed">
                  Esta profissional não está vinculada a nenhum estúdio ou salão compartilhado. Opera de forma independente com plano Solo.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/estudios"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18141F] hover:bg-white/[0.04] text-xs font-semibold text-[#F8F5FA] border border-white/10 transition active:scale-[0.97]"
                >
                  <Users className="h-3.5 w-3.5 text-[#B8A9D9]" />
                  <span>Ver estúdios disponíveis</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 6: SERVIÇOS CADASTRADOS */}
      {activeTab === 'servicos' && (
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] mb-4">
            <Scissors className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                Catálogo de serviços cadastrados
              </h2>
              <p className="text-xs text-[#A9A1B5] mt-0.5">
                Total de {data.servicos.length} serviços configurados no perfil da profissional.
              </p>
            </div>
          </div>

          {data.servicos.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A9A1B5]">
              Nenhum serviço cadastrado até o momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.servicos.map((servico) => (
                <div
                  key={servico.id}
                  className="p-4 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0">
                      <Scissors className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <strong className="text-xs sm:text-sm font-bold text-[#F8F5FA]">
                          {servico.nome}
                        </strong>
                        <span className="text-xs text-[#A9A1B5]">·</span>
                        <span className="text-xs text-[#A9A1B5]">
                          Duração: {servico.duracao_minutos} min
                        </span>
                        <span className="text-xs text-[#A9A1B5]">·</span>
                        <span className={servico.ativo !== false ? 'text-[#34D399] text-xs' : 'text-[#A9A1B5] text-xs'}>
                          {servico.ativo !== false ? 'Ativo na vitrine' : 'Pausado'}
                        </span>
                      </div>

                      {servico.descricao && (
                        <p className="text-xs text-[#A9A1B5] mt-1 line-clamp-2 leading-relaxed">
                          {servico.descricao}
                        </p>
                      )}

                      {servico.intervalo_manutencao_dias && (
                        <span className="text-[11px] text-[#A9A1B5] block mt-1">
                          Retorno recomendado: a cada {servico.intervalo_manutencao_dias} dias
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-[#A9A1B5] block">Preço</span>
                    <strong className="text-base font-extrabold text-[#34D399] tracking-tight">
                      R$ {Number(servico.preco).toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 7: COMBOS & PACOTES */}
      {activeTab === 'pacotes' && (
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] mb-4">
            <Package className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                Combos e pacotes promocionais
              </h2>
              <p className="text-xs text-[#A9A1B5] mt-0.5">
                Total de {data.combos?.length || 0} pacotes configurados para venda na vitrine.
              </p>
            </div>
          </div>

          {(!data.combos || data.combos.length === 0) ? (
            <div className="py-12 text-center text-xs text-[#A9A1B5]">
              Nenhum pacote promocional cadastrado por esta profissional até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.combos.map((combo) => (
                <div
                  key={combo.id}
                  className="p-4 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0">
                          <Package className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-[#F8F5FA] block">
                            {combo.nome}
                          </strong>
                          <span className={combo.ativo ? 'text-[11px] text-[#34D399] font-medium' : 'text-[11px] text-[#A9A1B5]'}>
                            {combo.ativo ? 'Ativo na vitrine' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                      <span className="text-base font-extrabold text-[#34D399] shrink-0">
                        R$ {Number(combo.preco_combo).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {combo.descricao && (
                      <p className="text-xs text-[#A9A1B5] leading-relaxed line-clamp-2">
                        {combo.descricao}
                      </p>
                    )}

                    {combo.servicos && combo.servicos.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.04]">
                        <span className="text-[10px] font-semibold text-[#746C80] uppercase tracking-wider block mb-1">
                          Serviços inclusos no pacote:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {combo.servicos.map((s, sIdx) => (
                            <span
                              key={s.id || sIdx}
                              className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] text-[#B8A9D9] border border-white/[0.06]"
                            >
                              {s.nome}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#A9A1B5] pt-2 border-t border-white/[0.04]">
                    <span>Cadastrado em {new Date(combo.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="text-[#34D399] font-medium">Economia promocional</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 8: COMANDA DIGITAL */}
      {activeTab === 'comanda' && (
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] mb-4">
            <ShoppingBag className="h-4 w-4 text-[#B8A9D9] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">
                Comanda digital e produtos de balcão
              </h2>
              <p className="text-xs text-[#A9A1B5] mt-0.5">
                Total de {data.comandaProdutos?.length || 0} produtos cadastrados para cobrança adicional.
              </p>
            </div>
          </div>

          {(!data.comandaProdutos || data.comandaProdutos.length === 0) ? (
            <div className="py-12 text-center text-xs text-[#A9A1B5]">
              Nenhum produto cadastrado na comanda digital desta profissional.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.comandaProdutos.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/25 flex items-center justify-center shrink-0">
                          <ShoppingBag className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <strong className="text-xs sm:text-sm font-bold text-[#F8F5FA] block truncate">
                            {prod.nome}
                          </strong>
                          <span className={prod.ativo ? 'text-[11px] text-[#34D399] font-medium' : 'text-[11px] text-[#A9A1B5]'}>
                            {prod.ativo ? 'Disponível no balcão' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                      <strong className="text-sm font-extrabold text-[#34D399] shrink-0">
                        R$ {Number(prod.preco).toFixed(2).replace('.', ',')}
                      </strong>
                    </div>

                    {prod.descricao && (
                      <p className="text-xs text-[#A9A1B5] leading-relaxed line-clamp-2">
                        {prod.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#A9A1B5] pt-2 border-t border-white/[0.04]">
                    <span>Ordem: #{prod.ordem}</span>
                    <span className="text-[#B8A9D9]">Cobrança na comanda</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 9: HISTÓRICO ADMINISTRATIVO (LOGS) */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <FileText className="h-4 w-4 text-[#B8A9D9] shrink-0" />
              <h2 className="text-sm font-bold text-[#F8F5FA] tracking-tight">Log de ações administrativas</h2>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {[
                {
                  id: 'log_1',
                  acao: 'Status alterado para Ativa',
                  admin: 'Nico Nava',
                  data: 'Hoje às 14:32',
                },
                {
                  id: 'log_2',
                  acao: 'Nota interna atualizada',
                  admin: 'Nico Nava',
                  data: 'Ontem às 11:04',
                },
                {
                  id: 'log_3',
                  acao: 'Conta criada via cadastro público',
                  admin: 'Sistema Lumê',
                  data: prof.user_created_at
                    ? new Date(prof.user_created_at).toLocaleDateString('pt-BR')
                    : new Date(prof.created_at).toLocaleDateString('pt-BR'),
                },
              ].map((log, index) => (
                <div key={log.id} className="py-3.5 flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-[#A9A1B5] shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#F8F5FA] block">{log.acao}</span>
                    <span className="text-[11px] text-[#A9A1B5]">{log.admin} · {log.data}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#A9A1B5] flex items-center justify-between">
              <span>Logs de acesso da profissional ao próprio painel são registrados pelo Supabase Auth.</span>
              <span className="text-[#B8A9D9] font-medium">Último acesso: {ultimoAcessoTexto}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR CODE OFICIAL */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={vitrineUrl}
        nomeProfissional={prof.nome}
        corPrimaria={prof.cor_primaria || '#B8A9D9'}
      />

      {/* MODAL STORY PRONTO DE DIVULGAÇÃO OFICIAL */}
      <StoriesShareModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        url={vitrineUrl}
        nomeProfissional={prof.nome}
        fotoUrl={prof.foto_url}
        tagline={prof.tagline}
        corPrimaria={prof.cor_primaria || '#B8A9D9'}
        corSecundaria={prof.cor_secundaria || '#FAF7F5'}
      />
    </div>
  )
}

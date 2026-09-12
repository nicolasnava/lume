'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getAdminProfissionalDetail,
  updateProfissionalStatus,
  updateProfissionalNotas,
  deactivateProfissionalAccount,
  restoreProfissionalAccount,
  AdminPeriodFilter,
} from '@/app/actions/admin'
import {
  extendProfissionalTrial,
  toggleProfissionalCortesia,
} from '@/app/actions/adminSaasFinance'
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Loader2,
  Briefcase,
  FileText,
  User,
  Instagram,
  MapPin,
  MessageCircle,
  Gift,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Clock,
  Sparkles,
  Store,
  DollarSign,
  Activity,
  RotateCcw,
} from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'
import { formatPhoneNumber } from '@/lib/utils/phone'
import { resetAndSeedDemoAccountAction } from '@/app/actions/demoSeed'

interface AdminProfissionalDetailClientProps {
  initialData: Awaited<ReturnType<typeof getAdminProfissionalDetail>>
  profissionalId: string
}

export default function AdminProfissionalDetailClient({
  initialData,
  profissionalId,
}: AdminProfissionalDetailClientProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [status, setStatus] = useState<'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'>(
    initialData.profissional.status_conta as 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
  )
  const [notas, setNotas] = useState(initialData.profissional.notas_internas || '')
  const [period, setPeriod] = useState<AdminPeriodFilter['period']>('30dias')

  const [isPendingStatus, startTransitionStatus] = useTransition()
  const [isPendingNotas, startTransitionNotas] = useTransition()
  const [isPendingPeriod, startTransitionPeriod] = useTransition()
  const [isPendingSaaSAction, startTransitionSaaS] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingDemo, setIsResettingDemo] = useState(false)

  const [statusFeedback, setStatusFeedback] = useState<string | null>(null)
  const [notasFeedback, setNotasFeedback] = useState<string | null>(null)

  const prof = data.profissional

  // Diagnóstico por IA do Perfil
  const missingItems: string[] = []
  let aiScore = 100
  if (!prof.foto_url) {
    missingItems.push('Foto de perfil ausente (-20%)')
    aiScore -= 20
  }
  if (!prof.bio || prof.bio.trim().length < 10) {
    missingItems.push('Apresentação / Bio muito curta (-20%)')
    aiScore -= 20
  }
  if (!prof.whatsapp) {
    missingItems.push('WhatsApp de atendimento ausente (-20%)')
    aiScore -= 20
  }
  if (!prof.instagram) {
    missingItems.push('Instagram não informado (-10%)')
    aiScore -= 10
  }
  if (!data.servicos || data.servicos.length === 0) {
    missingItems.push('Nenhum serviço cadastrado (-30%)')
    aiScore -= 30
  }
  aiScore = Math.max(0, aiScore)

  const whatsappHumanMsg = encodeURIComponent(
    `Olá, ${prof.nome}! Tudo bem com você?\n\nPassando aqui para te dar uma dica amigável para movimentar ainda mais o seu perfil no Lumê!\n\nNotamos que você pode adicionar ${
      missingItems.length > 0 ? missingItems.join(', ') : 'algumas informações'
    } no seu perfil para encantar ainda mais suas clientes.\n\nSe precisar de qualquer suporte, estamos à disposição por aqui!`
  )
  const whatsappUrl = prof.whatsapp
    ? `https://wa.me/${prof.whatsapp.replace(/\D/g, '')}?text=${whatsappHumanMsg}`
    : `https://wa.me/?text=${whatsappHumanMsg}`

  const handleStatusChange = (newStatus: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada') => {
    setStatus(newStatus)
    setStatusFeedback(null)
    startTransitionStatus(async () => {
      try {
        await updateProfissionalStatus(profissionalId, newStatus)
        setStatusFeedback('Status da conta atualizado com sucesso!')
        setTimeout(() => setStatusFeedback(null), 3000)
      } catch (err) {
        console.error('Erro ao atualizar status:', err)
        setStatusFeedback('Erro ao atualizar status.')
      }
    })
  }

  const handleExtendTrial = () => {
    setStatusFeedback(null)
    startTransitionSaaS(async () => {
      try {
        await extendProfissionalTrial(profissionalId, 7)
        setStatus('trial')
        setStatusFeedback('+7 Dias de Trial concedidos com sucesso!')
        setTimeout(() => setStatusFeedback(null), 3000)
      } catch (err) {
        console.error('Erro ao estender trial:', err)
        setStatusFeedback('Erro ao estender trial.')
      }
    })
  }

  const handleToggleCortesia = () => {
    const isCurrentlyCortesia = status === 'cortesia'
    setStatusFeedback(null)
    startTransitionSaaS(async () => {
      try {
        await toggleProfissionalCortesia(profissionalId, !isCurrentlyCortesia)
        setStatus(!isCurrentlyCortesia ? 'cortesia' : 'ativa')
        setStatusFeedback(!isCurrentlyCortesia ? 'Conta marcada como Cortesia!' : 'Cortesia removida.')
        setTimeout(() => setStatusFeedback(null), 3000)
      } catch (err) {
        console.error('Erro ao alterar cortesia:', err)
        setStatusFeedback('Erro ao alterar cortesia.')
      }
    })
  }

  const handleSaveNotas = () => {
    setNotasFeedback(null)
    startTransitionNotas(async () => {
      try {
        await updateProfissionalNotas(profissionalId, notas)
        setNotasFeedback('Notas internas salvas com sucesso!')
        setTimeout(() => setNotasFeedback(null), 3000)
      } catch (err) {
        console.error('Erro ao salvar notas:', err)
        setNotasFeedback('Erro ao salvar notas.')
      }
    })
  }

  const handleDeactivateAccount = async () => {
    if (
      !confirm(
        `Tem certeza que deseja DESATIVAR E OCULTAR a conta de "${prof.nome}"?\n\nA conta deixará de aparecer no site público e no login, mas TODO o histórico de agendamentos e faturamento será preservado.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await deactivateProfissionalAccount(profissionalId)
      alert('Conta desativada e ocultada com sucesso (Soft Delete).')
      router.push('/admin/profissionais')
    } catch (err) {
      console.error('Erro ao desativar conta:', err)
      alert('Ocorreu um erro ao desativar a conta.')
      setIsDeleting(false)
    }
  }

  const handleRestoreAccount = async () => {
    if (!confirm(`Deseja RESTAURAR a conta de "${prof.nome}" e reativar o acesso?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await restoreProfissionalAccount(profissionalId)
      alert('Conta restaurada com sucesso!')
      router.refresh()
    } catch (err) {
      console.error('Erro ao restaurar conta:', err)
      alert('Ocorreu um erro ao restaurar a conta.')
      setIsDeleting(false)
    }
  }

  const handleResetDemoData = async () => {
    if (
      !confirm(
        `ATENÇÃO: Deseja resetar todos os dados da conta demo "${prof.nome}"?\n\nIsso apagará agendamentos, clientes, serviços e repovoará com um histórico realista de 3 meses, serviços, avaliações e cupons.`
      )
    ) {
      return
    }

    setIsResettingDemo(true)
    try {
      const res = await resetAndSeedDemoAccountAction(profissionalId)
      if (res.success) {
        alert(res.message)
        router.refresh()
      } else {
        alert(res.message || 'Erro ao resetar conta demo.')
      }
    } catch (err) {
      console.error('Erro ao resetar demo:', err)
      alert('Erro inesperado ao resetar demo.')
    } finally {
      setIsResettingDemo(false)
    }
  }

  const handlePeriodChange = (newPeriod: AdminPeriodFilter['period']) => {
    setPeriod(newPeriod)
    startTransitionPeriod(async () => {
      try {
        const updated = await getAdminProfissionalDetail(profissionalId, { period: newPeriod })
        setData(updated)
      } catch (err) {
        console.error('Erro ao filtrar histórico:', err)
      }
    })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* 1. NAVEGAÇÃO DE VOLTA & HEADER DO PERFIL */}
      <div>
        <Link
          href="/admin/profissionais"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9C9C9F] hover:text-[#F5F5F4] transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para lista de profissionais</span>
        </Link>

        <div className="bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl border border-white/[0.1] bg-[#141416] text-[#F5F5F4] flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0 shadow-xs">
              {prof.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={prof.foto_url} alt={prof.nome} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-[#9C9C9F]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">{prof.nome}</h1>
                <Link
                  href={`/p/${prof.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#2EB886] hover:underline"
                >
                  <span>/p/{prof.slug}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-xs text-[#9C9C9F] font-normal mt-0.5 font-mono">{prof.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[11px] font-semibold bg-[#141416] text-[#F5F5F4] px-3 py-1 rounded-lg border border-white/[0.06]">
                  Categoria: {Array.isArray(prof.categoria) ? prof.categoria.join(', ') : prof.categoria || 'Geral'}
                </span>
                <span className="text-[11px] text-[#9C9C9F] font-mono">
                  Cadastrada em {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* CONTROLE DE STATUS DA CONTA */}
          <div className="bg-[#141416] p-4.5 rounded-xl border border-white/[0.08] space-y-3 shrink-0 md:w-80 shadow-xs">
            <div>
              <label className="text-xs font-semibold text-[#9C9C9F] block mb-1.5">Status da Assinatura SaaS</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CustomSelect
                    options={[
                      { value: 'trial', label: 'Trial (Degustação)' },
                      { value: 'ativa', label: 'Ativa (Em dia)' },
                      { value: 'atrasada', label: 'Atrasada (Aviso)' },
                      { value: 'suspensa', label: 'Suspensa (Bloqueio)' },
                      { value: 'cortesia', label: 'Cortesia / VIP' },
                      { value: 'cancelada', label: 'Cancelada' },
                    ]}
                    value={status}
                    onChange={(val) =>
                      handleStatusChange(
                        val as 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
                      )
                    }
                    disabled={isPendingStatus || isPendingSaaSAction}
                    variant="dark"
                    size="sm"
                  />
                </div>
                {(isPendingStatus || isPendingSaaSAction) && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#B8A9D9]" />
                )}
              </div>
            </div>

            {/* Ações Rápidas de SaaS */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExtendTrial}
                disabled={isPendingSaaSAction}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#242428] hover:bg-[#2D2D32] text-[#D4AF37] border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer"
                title="Conceder mais 7 dias de trial gratuito"
              >
                <Plus className="h-3 w-3" />
                <span>+7d Trial</span>
              </button>

              <button
                type="button"
                onClick={handleToggleCortesia}
                disabled={isPendingSaaSAction}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#242428] hover:bg-[#2D2D32] text-[#E9C3F0] border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer"
                title="Isentar mensalidade (Conta Cortesia)"
              >
                <Gift className="h-3 w-3" />
                <span>{status === 'cortesia' ? 'Remov. Cortesia' : 'Dar Cortesia'}</span>
              </button>
            </div>

            {/* Ação exclusiva para Conta Demo (Prompt 62 Parte 3) */}
            {(prof as any).is_demo && (
              <div className="pt-2.5 border-t border-white/[0.08] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                  <Store className="h-3 w-3 text-amber-400" />
                  <span>CONTA DEMO DE VENDAS</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  disabled={isResettingDemo}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-2 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                  title="Apaga os dados atuais e repovoa com dados fictícios realistas"
                >
                  {isResettingDemo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  <span>Resetar dados da demo</span>
                </button>
              </div>
            )}

            {statusFeedback && (
              <p className="text-[11px] font-semibold text-[#2EB886] transition animate-fade-in">
                {statusFeedback}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. CARD DE DIAGNÓSTICO DE PERFIL POR IA (GLASSMORPHISM LUXO) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#161618]/70 backdrop-blur-[20px] border border-[#1E7F5C]/30 p-6 shadow-[0_0_25px_rgba(30,127,92,0.12)] space-y-4">
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#1E7F5C]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1E7F5C]/20 text-[#2EB886] flex items-center justify-center border border-[#1E7F5C]/40 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#F5F5F4] tracking-tight">
                Diagnóstico de Perfil por Inteligência Artificial
              </h3>
              <p className="text-xs text-[#9C9C9F]">Análise automática de otimização de conversão e atratividade do estúdio</p>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E7F5C] to-[#145C42] hover:from-[#25946C] hover:to-[#186B4D] text-white px-4 py-2.5 text-xs font-bold shadow-[0_2px_12px_rgba(30,127,92,0.3)] transition cursor-pointer shrink-0"
          >
            <MessageCircle className="h-4 w-4 text-white" />
            <span>Enviar Dica no WhatsApp</span>
          </a>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Pontuação de IA */}
          <div className="bg-[#141416] p-4.5 rounded-xl border border-white/[0.06] space-y-2 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block">Nível de Otimização</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${aiScore >= 80 ? 'text-[#2EB886]' : aiScore >= 50 ? 'text-[#D4AF37]' : 'text-rose-400'}`}>
                {aiScore}%
              </span>
              <span className="text-xs text-[#9C9C9F] font-medium">completo</span>
            </div>
            <div className="w-full bg-[#242428] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${aiScore >= 80 ? 'bg-[#2EB886]' : aiScore >= 50 ? 'bg-[#D4AF37]' : 'bg-rose-400'}`}
                style={{ width: `${aiScore}%` }}
              />
            </div>
          </div>

          {/* Itens Faltantes */}
          <div className="md:col-span-2 bg-[#141416] p-4.5 rounded-xl border border-white/[0.06] space-y-2">
            <span className="text-[11px] font-semibold text-[#9C9C9F] uppercase tracking-wider block">
              Oportunidades de Melhoria Identificadas ({missingItems.length})
            </span>
            {missingItems.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-[#F5F5F4]">
                {missingItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[#D4AF37] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#2EB886] font-semibold flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Perfil 100% preenchido! Nenhuma pendência encontrada.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. NOTAS INTERNAS DO ADMIN */}
      <div className="bg-[#1A1A1C] border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-6 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-sm font-bold text-[#F5F5F4]">Notas Internas de Suporte (Visível Apenas para Super Admins)</h3>
          </div>
          {isPendingNotas && <Loader2 className="h-4 w-4 text-[#B8A9D9] animate-spin" />}
        </div>
        <textarea
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Escreva anotações internas sobre a profissional (ex: histórico de atendimento, combinados de mensalidade, suporte prestado)..."
          className="w-full rounded-xl border border-white/[0.08] bg-[#141416] p-3.5 text-xs font-normal text-[#F5F5F4] placeholder-[#9C9C9F] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
        />
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-[#9C9C9F] font-normal">
            {notasFeedback ? <span className="font-semibold text-[#2EB886]">{notasFeedback}</span> : 'Estas anotações não são visíveis para a profissional.'}
          </span>
          <button
            onClick={handleSaveNotas}
            disabled={isPendingNotas}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#242428] hover:bg-[#2D2D32] border border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#F5F5F4] transition cursor-pointer shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Salvar Notas</span>
          </button>
        </div>
      </div>

      {/* 4. DADOS DO PERFIL & RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados de Perfil */}
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <h3 className="text-sm font-bold text-[#F5F5F4] border-b border-white/[0.06] pb-3">
            Dados do Perfil Cadastrado
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[#9C9C9F] font-semibold block text-[11px] uppercase tracking-wider">Bio / Apresentação</span>
              <p className="font-normal text-[#F5F5F4] mt-1 leading-relaxed">{prof.bio || 'Sem bio cadastrada'}</p>
            </div>
            <div>
              <span className="text-[#9C9C9F] font-semibold block text-[11px] uppercase tracking-wider">WhatsApp</span>
              {prof.whatsapp ? (
                <a
                  href={`https://wa.me/${prof.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#2EB886] hover:underline inline-flex items-center gap-1.5 mt-1 font-mono"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-[#2EB886]" />
                  <span>{formatPhoneNumber(prof.whatsapp)}</span>
                  <ExternalLink className="h-3 w-3 text-[#9C9C9F]" />
                </a>
              ) : (
                <p className="font-normal text-[#9C9C9F] mt-1">Não informado</p>
              )}
            </div>
            <div>
              <span className="text-[#9C9C9F] font-semibold block text-[11px] uppercase tracking-wider">Instagram</span>
              {prof.instagram ? (
                <a
                  href={prof.instagram.startsWith('http') ? prof.instagram : `https://instagram.com/${prof.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#D8B4E2] hover:underline inline-flex items-center gap-1.5 mt-1 font-mono"
                >
                  <Instagram className="h-3.5 w-3.5 text-[#D8B4E2]" />
                  <span>{prof.instagram.startsWith('@') ? prof.instagram : `@${prof.instagram}`}</span>
                  <ExternalLink className="h-3 w-3 text-[#9C9C9F]" />
                </a>
              ) : (
                <p className="font-normal text-[#9C9C9F] mt-1">Não informado</p>
              )}
            </div>
            <div>
              <span className="text-[#9C9C9F] font-semibold block text-[11px] uppercase tracking-wider">Localização</span>
              <p className="font-medium text-[#F5F5F4] flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                {prof.localizacao || 'Não informada'}
              </p>
            </div>
            <div>
              <span className="text-[#9C9C9F] font-semibold block text-[11px] uppercase tracking-wider mb-1.5">Cores Personalizadas</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#141416] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                  <div className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: prof.cor_primaria || '#8675A9' }} />
                  <span className="font-mono text-[10px] text-[#F5F5F4]">Primária: {prof.cor_primaria || '#8675A9'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#141416] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                  <div className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: prof.cor_secundaria || '#FAF7F5' }} />
                  <span className="font-mono text-[10px] text-[#F5F5F4]">Secundária: {prof.cor_secundaria || '#FAF7F5'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro da Profissional */}
        <div className="lg:col-span-2 bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-bold text-[#F5F5F4]">Resumo Financeiro da Profissional</h3>
            <span className="text-xs font-mono font-semibold text-[#2EB886] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
              Faturamento Acumulado: {formatCurrency(data.faturamentoTotal)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141416] p-3.5 rounded-xl border border-white/[0.06] text-center">
              <span className="text-[10px] font-semibold text-[#9C9C9F] uppercase block">PIX</span>
              <span className="text-sm font-bold text-[#F5F5F4] mt-1 block font-mono">
                {formatCurrency(data.faturamentoPorForma.pix || 0)}
              </span>
            </div>
            <div className="bg-[#141416] p-3.5 rounded-xl border border-white/[0.06] text-center">
              <span className="text-[10px] font-semibold text-[#9C9C9F] uppercase block">Dinheiro</span>
              <span className="text-sm font-bold text-[#F5F5F4] mt-1 block font-mono">
                {formatCurrency(data.faturamentoPorForma.dinheiro || 0)}
              </span>
            </div>
            <div className="bg-[#141416] p-3.5 rounded-xl border border-white/[0.06] text-center">
              <span className="text-[10px] font-semibold text-[#9C9C9F] uppercase block">Cartão Crédito</span>
              <span className="text-sm font-bold text-[#F5F5F4] mt-1 block font-mono">
                {formatCurrency(data.faturamentoPorForma.cartao_credito || 0)}
              </span>
            </div>
            <div className="bg-[#141416] p-3.5 rounded-xl border border-white/[0.06] text-center">
              <span className="text-[10px] font-semibold text-[#9C9C9F] uppercase block">Débito / Outros</span>
              <span className="text-sm font-bold text-[#F5F5F4] mt-1 block font-mono">
                {formatCurrency(
                  (data.faturamentoPorForma.cartao_debito || 0) + (data.faturamentoPorForma.outro || 0)
                )}
              </span>
            </div>
          </div>

          {/* Serviços Cadastrados */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-[#9C9C9F] mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Briefcase className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Serviços Cadastrados ({data.servicos.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.servicos.map((s) => (
                <div key={s.id} className="bg-[#141416] p-3 rounded-xl border border-white/[0.06] flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-[#F5F5F4] block">{s.nome}</span>
                    <span className="text-[10px] text-[#9C9C9F] font-mono">{s.duracao_minutos} min</span>
                  </div>
                  <span className="font-bold text-[#2EB886] font-mono">{formatCurrency(Number(s.preco))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Programa de Indicação & Árvore de Indicações */}
        <div className="lg:col-span-3 bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-[#B8A9D9]" />
              <h3 className="text-sm font-bold text-[#F5F5F4]">Programa de Indicação</h3>
            </div>
            {data.referralTree?.codigoIndicacao && (
              <span className="text-xs font-mono text-[#9C9C9F] bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                Código: <strong className="text-[#F5F5F4]">{data.referralTree.codigoIndicacao}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#141416] p-4 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] font-semibold text-[#9C9C9F] uppercase block">Indicada por</span>
              {data.referralTree?.indicadaPor ? (
                <Link
                  href={`/admin/profissionais/${data.referralTree.indicadaPor.id}`}
                  className="text-xs font-bold text-[#B8A9D9] hover:underline flex items-center gap-1 mt-1 truncate"
                >
                  <span>{data.referralTree.indicadaPor.nome}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </Link>
              ) : (
                <span className="text-xs font-medium text-[#9C9C9F] mt-1 block">
                  Cadastro direto (sem indicação)
                </span>
              )}
            </div>

            <div className="bg-[#141416] p-4 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] font-semibold text-[#9C9C9F] uppercase block">Indicações Geradas</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-[#F5F5F4] font-mono">
                  {data.referralTree?.totalIndicadas || 0}
                </span>
                <span className="text-[11px] text-[#2EB886] font-semibold">
                  ({data.referralTree?.indicadasAtivas || 0} ativas)
                </span>
              </div>
            </div>

            <div className="bg-[#141416] p-4 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] font-semibold text-[#9C9C9F] uppercase block">Desconto em Mensalidade</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#2EB886] font-mono">
                  {data.referralTree?.descontoAtualPct || 0}% OFF
                </span>
                <span className="text-[11px] text-[#9C9C9F] font-mono">
                  (R$ {Number(prof.valor_mensalidade || 69.90).toFixed(2)}/mês)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. HISTÓRICO DE AGENDAMENTOS */}
      <div className="bg-[#1A1A1C] rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F5F5F4]">
              Histórico de Agendamentos ({data.agendamentos.length})
            </h3>
            <p className="text-xs text-[#9C9C9F] font-normal">Agendamentos realizados pelos clientes no período selecionado</p>
          </div>

          {/* Filtro de Período do Histórico */}
          <div className="flex items-center gap-1 bg-[#141416] p-1.5 rounded-xl border border-white/[0.06] text-xs font-semibold">
            {(
              [
                { id: 'hoje', label: 'Hoje' },
                { id: 'semana', label: '7D' },
                { id: '30dias', label: '30D' },
                { id: 'mes', label: '3M' },
                { id: 'ano', label: '12M' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => handlePeriodChange(item.id)}
                disabled={isPendingPeriod}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  period === item.id ? 'bg-[#242428] text-[#F5F5F4] font-bold border border-white/[0.1]' : 'text-[#9C9C9F] hover:text-[#F5F5F4]'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isPendingPeriod && <Loader2 className="h-3.5 w-3.5 text-[#B8A9D9] animate-spin ml-1" />}
          </div>
        </div>

        {/* TABELA DE AGENDAMENTOS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#141416] border-b border-white/[0.06] text-[#9C9C9F] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5 font-semibold">Data e Hora</th>
                <th className="py-3 px-3.5 font-semibold">Cliente</th>
                <th className="py-3 px-3.5 font-semibold">Serviço</th>
                <th className="py-3 px-3.5 font-semibold">Valor / Pagamento</th>
                <th className="py-3 px-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.agendamentos.length > 0 ? (
                data.agendamentos.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition text-[#F5F5F4]">
                    <td className="py-3 px-3.5 font-mono text-[#9C9C9F]">
                      {formatDate(a.data_hora_inicio)}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-semibold text-[#F5F5F4] block">{a.cliente_nome}</span>
                      <span className="text-[10px] text-[#9C9C9F] font-mono">{a.cliente_telefone}</span>
                    </td>
                    <td className="py-3 px-3.5 font-medium text-[#F5F5F4]">{a.servico_nome}</td>
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-[#F5F5F4] block font-mono">
                        {a.valor_cobrado ? formatCurrency(a.valor_cobrado) : 'N/A'}
                      </span>
                      <span className="text-[10px] text-[#9C9C9F] capitalize font-mono">
                        {a.forma_pagamento ? a.forma_pagamento.replace('_', ' ') : 'Não informado'} •{' '}
                        {a.pago ? (
                          <span className="text-[#2EB886] font-semibold">Pago</span>
                        ) : (
                          <span className="text-[#D4AF37]">Pendente</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                          a.status === 'concluido'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : a.status === 'confirmado'
                            ? 'bg-[#B8A9D9]/10 text-[#D8B4E2] border-[#B8A9D9]/20'
                            : a.status === 'cancelado'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#9C9C9F]">
                    Nenhum agendamento no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MÉTRICAS DE ENGAJAMENTO DA PROFISSIONAL */}
      {data.engagementMetrics && (
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <h3 className="text-sm font-bold text-[#F5F5F4] border-b border-white/[0.06] pb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#2EB886]" />
            <span>Métricas de Engajamento da Profissional (Últimos 30 Dias)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-[#141416] p-4 rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#9C9C9F] block tracking-wider">Último Login Realizado</span>
              <span className="text-xs font-bold text-[#F5F5F4] font-mono block">
                {data.engagementMetrics.ultimoLoginDate
                  ? new Date(data.engagementMetrics.ultimoLoginDate).toLocaleString('pt-BR')
                  : 'Sem registro de login'}
              </span>
            </div>

            <div className="bg-[#141416] p-4 rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#9C9C9F] block tracking-wider">Acessos em 30d</span>
              <span className="text-xl font-extrabold text-[#2EB886] font-mono block">
                {data.engagementMetrics.logins30dCount} login(s)
              </span>
            </div>

            <div className="bg-[#141416] p-4 rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#9C9C9F] block tracking-wider">Manual vs Cliente</span>
              <span className="text-xs font-bold text-[#F5F5F4] font-mono block">
                {data.engagementMetrics.agendamentosManualCount} manuais / {data.engagementMetrics.agendamentosWizardCount} cliente
              </span>
            </div>

            <div className="bg-[#141416] p-4 rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#9C9C9F] block tracking-wider">Último Agendamento</span>
              <span className="text-xs font-bold text-[#F5F5F4] font-mono block">
                {data.engagementMetrics.ultimoAgendamentoDate
                  ? new Date(data.engagementMetrics.ultimoAgendamentoDate).toLocaleDateString('pt-BR')
                  : 'Nenhum agendamento'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7. LINHA DO TEMPO DA CONTA */}
      {data.activityTimeline && data.activityTimeline.length > 0 && (
        <div className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <h3 className="text-sm font-bold text-[#F5F5F4] border-b border-white/[0.06] pb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#B8A9D9]" />
            <span>Linha do Tempo de Atividade Recente da Conta</span>
          </h3>

          <div className="space-y-4 pl-3 border-l-2 border-white/[0.08]">
            {data.activityTimeline.map((item: Record<string, unknown> & { titulo: string; created_at: string; descricao: string }, idx: number) => (
              <div key={idx} className="relative pl-4 space-y-1">
                <div className="absolute -left-[19px] top-1 h-3 w-3 rounded-full bg-[#8C5383] border-2 border-[#1A1A1C] shadow-[0_0_8px_rgba(140,83,131,0.6)]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F5F5F4]">{item.titulo}</span>
                  <span className="text-[10px] font-mono text-[#9C9C9F]">{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-xs text-[#9C9C9F]">{item.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. ZONA DE PERIGO E CONTROLE ADMINISTRATIVO */}
      <div className="bg-[#1A1A1C] border border-rose-500/20 p-6 rounded-2xl space-y-3 shadow-[0_4px_24px_rgba(244,63,94,0.06)]">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h3 className="text-sm font-bold text-[#F5F5F4]">Zona de Perigo & Controle Administrativo</h3>
        </div>
        <p className="text-xs text-[#9C9C9F] font-normal">
          Ações administrativas restritivas para este perfil de profissional.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Botão Paralisar / Suspender Conta por Falta de Pagamento */}
          <button
            type="button"
            onClick={() => handleStatusChange('suspensa')}
            disabled={isPendingStatus || status === 'suspensa'}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 px-4 py-2 text-xs font-semibold hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
          >
            <Ban className="h-4 w-4" />
            <span>{status === 'suspensa' ? 'Acesso Já Paralisado' : 'Paralisar Acesso (Inadimplência)'}</span>
          </button>

          {/* Botão Desativar e Ocultar Conta (Soft Delete) */}
          {prof.deletado_em ? (
            <button
              type="button"
              onClick={handleRestoreAccount}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-4 py-2 text-xs font-semibold hover:bg-emerald-500/20 transition cursor-pointer"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Restaurar Conta Desativada</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeactivateAccount}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/25 px-4 py-2 text-xs font-semibold hover:bg-rose-500/20 transition cursor-pointer"
              title="Desativa a conta ocultando das pesquisas públicas, mas preserva todo o histórico financeiro"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              <span>Desativar e Ocultar Conta (Soft Delete)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

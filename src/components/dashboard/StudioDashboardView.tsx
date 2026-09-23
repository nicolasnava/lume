'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  Link2,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
  LogOut,
  Upload,
  Clock,
  Store,
  Crown,
  User,
  Instagram,
  MapPin,
  Phone,
  TrendingUp,
  Calendar,
  DollarSign,
  SlidersHorizontal,
  Scissors,
  Share2,
  X,
} from 'lucide-react'
import {
  StudioUserStatus,
  StudioMember,
  StudioInvite,
  StudioData,
  criarEstudio,
  atualizarEstudio,
  alternarAtivoNoEstudio,
  alternarDonaComoAtendente,
  gerarConviteLink,
  cancelarConvite,
  removerMembroEstudio,
  sairDoEstudio,
  obterMetricasStudioAction,
  StudioMetricsData,
  MemberPerformance,
  obterAgendamentosStudioAction,
  StudioBookingItem,
  atualizarStatusAgendamentoStudioAction,
  atualizarRegraMembroStudioAction,
  atualizarPermissoesPrivacidadeMembroAction,
} from '@/app/actions/estudio'
import { createClient } from '@/lib/supabase/client'
import { getContrastingTextColor, getLightTint } from '@/lib/utils/contrast'
import { parseCategorias, getCategoryLabel } from '@/lib/utils/categories'
import CustomColorPickerModal from '@/components/ui/CustomColorPickerModal'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import StudioNewBookingModal from './StudioNewBookingModal'
import type { SubscriptionData } from '@/app/actions/subscription'

interface StudioDashboardViewProps {
  status: StudioUserStatus
  planType: SubscriptionData['planoTipo']
  studioPrice: number
}

export default function StudioDashboardView({ status, planType, studioPrice }: StudioDashboardViewProps) {
  // --------------------------------------------------------------------------
  // ESTADO 1: SEM STUDIO
  // --------------------------------------------------------------------------
  if (status.papel === 'nenhum') {
    return <CreateStudioSection defaultSlug={status.userSlug} />
  }

  // --------------------------------------------------------------------------
  // ESTADO 2: MEMBRO (PARCEIRA)
  // --------------------------------------------------------------------------
  if (status.papel === 'membro') {
    return (
      <MemberStudioSection
        estudio={status.estudio}
        dona={status.dona}
        ativoNoEstudio={status.ativoNoEstudio}
        userSlug={status.userSlug}
        initialCompartilharFaturamento={status.compartilhar_faturamento}
        initialCompartilharAgendamentos={status.compartilhar_agendamentos}
        initialPermitirAgendamentoDona={status.permitir_agendamento_dona}
      />
    )
  }

  if (planType !== 'studio' && planType !== 'cortesia') {
    return <StudioUpgradeSection price={studioPrice} />
  }

  // --------------------------------------------------------------------------
  // ESTADO 3: DONA / ADMINISTRADORA
  // --------------------------------------------------------------------------
  return (
    <OwnerStudioSection
      estudio={status.estudio}
      membros={status.membros}
      convites={status.convites}
      ativoNoEstudio={status.ativoNoEstudio}
      donaNaEquipe={status.donaNaEquipe}
    />
  )
}

function StudioUpgradeSection({ price }: { price: number }) {
  const paymentRequestUrl = `https://wa.me/5511965758459?text=${encodeURIComponent(
    'Olá! Quero liberar o acesso ao Lumê Studio. Podem me enviar as instruções oficiais de pagamento integral?'
  )}`

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-[#B8A9D9]/35 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]">
          <Building2 className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#8675A9]">Lumê Studio</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#4A3F5C] sm:text-3xl">Seu salão, em uma só gestão</h1>
        <p className="mt-3 text-sm leading-6 text-[#6D6478]">
          Reúna a equipe em uma vitrine coletiva e acompanhe agenda, permissões e resultados do Studio.
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-xl divide-y divide-[#4A3F5C]/10 border-y border-[#4A3F5C]/10">
        {[
          'Vitrine única para o salão e suas profissionais',
          'Agenda e operação da equipe em um só painel',
          'Permissões individuais para cada profissional',
          'Até 6 profissionais inclusas no plano',
        ].map((benefit) => (
          <div key={benefit} className="flex items-center gap-3 py-3 text-sm text-[#4A3F5C]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>

      <div className="mt-7 text-center">
        <p className="text-sm text-[#6D6478]">Plano Studio</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-[#4A3F5C]">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
          <span className="ml-1 text-sm font-medium text-[#6D6478]">/ mês</span>
        </p>
        <p className="mt-1 text-xs text-[#6D6478]">A cobrança é integral. O acesso e a troca de plano são liberados após a confirmação.</p>
        <a
          href={paymentRequestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#4A3F5C] px-6 text-sm font-semibold text-white transition duration-200 ease-out hover:bg-[#392F49] active:scale-[0.98]"
        >
          Clique aqui para liberar acesso
        </a>
        <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[#81788B]">
          Você falará com o suporte para receber as instruções oficiais. Não alteramos seu plano antes da confirmação do pagamento.
        </p>
      </div>
    </section>
  )
}

// ============================================================================
// COMPONENTE: CRIAR NOVO STUDIO
// ============================================================================
function CreateStudioSection({ defaultSlug }: { defaultSlug: string }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [fotoCapaUrl, setFotoCapaUrl] = useState('')
  const [corPrimaria, setCorPrimaria] = useState('#B8A9D9')
  const [corSecundaria, setCorSecundaria] = useState('#FAF7F5')
  const [colorModalTarget, setColorModalTarget] = useState<'primaria' | 'secundaria' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleNomeChange = (val: string) => {
    setNome(val)
    if (!slug || slug === defaultSlug) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setErrorMessage(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado.')

      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/estudio-capa-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setFotoCapaUrl(publicUrl)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer upload da imagem.'
      setErrorMessage(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await criarEstudio({
        nome,
        slug,
        bio,
        foto_capa_url: fotoCapaUrl || undefined,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
      })
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar studio.'
      setErrorMessage(msg)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300 text-left">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8A9D9]/20 text-[#4A3F5C] text-xs font-bold">
          <Building2 className="h-4 w-4" />
          <span>Gestão & Vitrine Coletiva</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A3F5C] tracking-tight">
          Crie o seu Studio no Lumê
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
          Reúna profissionais parceiras, compartilhe uma vitrine coletiva com link único e gerencie
          agendamentos e repasses em um único painel.
        </p>
        <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#4A3F5C] font-bold">
          <span>Plano Studio: R$ 169/mês</span>
          <span>•</span>
          <span>Até 6 profissionais inclusas</span>
          <span>•</span>
          <span>+R$ 29/mês por vaga extra</span>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-10 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Nome do Studio <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Studio Bella Donna Concept"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C] outline-hidden text-sm font-semibold text-[#4A3F5C] transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Link da Vitrine (URL) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-500 focus-within:border-[#4A3F5C] focus-within:ring-1 focus-within:ring-[#4A3F5C] focus-within:bg-white transition">
              <span className="shrink-0 font-medium text-gray-400">/studio/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="seu-studio"
                className="w-full bg-transparent px-1 outline-hidden font-bold text-gray-900 text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Apresentação / Conceito do Studio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva o conceito do espaço, especialidades da equipe ou diferenciais..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-hidden resize-none leading-relaxed font-medium transition"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !nome || !slug}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#4A3F5C] hover:bg-[#3b324a] text-white text-sm font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Criar meu Studio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE: MEMBRO DA EQUIPE (PARCEIRA)
// ============================================================================
function MemberStudioSection({
  estudio,
  dona,
  ativoNoEstudio,
  userSlug,
  initialCompartilharFaturamento,
  initialCompartilharAgendamentos,
  initialPermitirAgendamentoDona,
}: {
  estudio: StudioData
  dona: { nome: string; foto_url: string | null }
  ativoNoEstudio: boolean
  userSlug: string
  initialCompartilharFaturamento: boolean
  initialCompartilharAgendamentos: boolean
  initialPermitirAgendamentoDona: boolean
}) {
  const router = useRouter()
  const [isLeaving, setIsLeaving] = useState(false)
  const [isTogglingAtivo, setIsTogglingAtivo] = useState(false)
  const [ativoState, setAtivoState] = useState(ativoNoEstudio)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  // Estados de Privacidade da Profissional Membro
  const [compartilharFaturamento, setCompartilharFaturamento] = useState(initialCompartilharFaturamento)
  const [compartilharAgendamentos, setCompartilharAgendamentos] = useState(initialCompartilharAgendamentos)
  const [permitirAgendamentoDona, setPermitirAgendamentoDona] = useState(initialPermitirAgendamentoDona)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [privacySaved, setPrivacySaved] = useState(false)

  const handleToggleAtivo = async () => {
    setIsTogglingAtivo(true)
    try {
      const next = !ativoState
      await alternarAtivoNoEstudio(next)
      setAtivoState(next)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setIsTogglingAtivo(false)
    }
  }

  const handleUpdatePrivacy = async (field: 'faturamento' | 'agendamentos' | 'agendamento_dona', val: boolean) => {
    const nextFaturamento = field === 'faturamento' ? val : compartilharFaturamento
    const nextAgendamentos = field === 'agendamentos' ? val : compartilharAgendamentos
    const nextAgendamentoDona = field === 'agendamento_dona' ? val : permitirAgendamentoDona

    if (field === 'faturamento') setCompartilharFaturamento(val)
    if (field === 'agendamentos') setCompartilharAgendamentos(val)
    if (field === 'agendamento_dona') setPermitirAgendamentoDona(val)

    setIsSavingPrivacy(true)
    try {
      await atualizarPermissoesPrivacidadeMembroAction({
        compartilhar_faturamento: nextFaturamento,
        compartilhar_agendamentos: nextAgendamentos,
        permitir_agendamento_dona: nextAgendamentoDona,
      })
      setPrivacySaved(true)
      setTimeout(() => setPrivacySaved(false), 2500)
    } catch (err) {
      console.error('Erro ao salvar privacidade:', err)
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  const handleLeaveStudio = async () => {
    setIsLeaving(true)
    try {
      await sairDoEstudio()
      setShowLeaveModal(false)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao sair do studio.')
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300 text-left">
      {/* Header do Studio */}
      <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-xs">
        {estudio.foto_capa_url && (
          <div className="relative h-44 sm:h-56 w-full">
            <Image src={estudio.foto_capa_url} alt={estudio.nome} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8A9D9]/20 text-[#4A3F5C] text-xs font-bold mb-2">
                <Building2 className="h-3.5 w-3.5" />
                <span>Profissional Parceira</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#4A3F5C]">{estudio.nome}</h1>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <span>Administrado por:</span>
                <strong className="text-gray-900">{dona.nome}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair do Studio</span>
              </button>
            </div>
          </div>

          {estudio.bio && <p className="text-xs text-gray-600 leading-relaxed">{estudio.bio}</p>}

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-gray-700 block">
                Sua participação nos atendimentos do studio
              </span>
              <p className="text-[11px] text-gray-500">
                {ativoState
                  ? 'Você está visível para agendamento na vitrine do studio.'
                  : 'Você está temporariamente oculta da lista de atendentes do studio.'}
              </p>
            </div>

            <button
              type="button"
              disabled={isTogglingAtivo}
              onClick={handleToggleAtivo}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                ativoState
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isTogglingAtivo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              <span>{ativoState ? 'Atendendo Atualmente' : 'Em Pausa / Oculta'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* NOVO CARD: MINHA PRIVACIDADE & PERMISSÕES NO STUDIO */}
      <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-[#4A3F5C] flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#4A3F5C]">
                Minha Privacidade & Compartilhamento
              </h3>
              <p className="text-[11px] text-gray-500">
                Você escolhe exatamente o que a dona do studio pode visualizar e fazer
              </p>
            </div>
          </div>
          {privacySaved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <Check className="h-3.5 w-3.5" />
              <span>Salvo</span>
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Opção 1: Faturamento */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-gray-50/60 border border-gray-200/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-800 block">
                Compartilhar valores de faturamento
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Permite que a administradora visualize seus valores de atendimento para cálculo de comissões e repasses. Se desativar, seus valores aparecerão como &quot;Privado&quot;.
              </p>
            </div>
            <input
              type="checkbox"
              checked={compartilharFaturamento}
              disabled={isSavingPrivacy}
              onChange={(e) => handleUpdatePrivacy('faturamento', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-[#4A3F5C] focus:ring-[#B8A9D9] h-4 w-4 cursor-pointer"
            />
          </div>

          {/* Opção 2: Agendamentos na Agenda Geral */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-gray-50/60 border border-gray-200/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-800 block">
                Exibir horários na agenda geral do studio
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Permite que seus horários marcados apareçam na visualização unificada de atendimentos do studio.
              </p>
            </div>
            <input
              type="checkbox"
              checked={compartilharAgendamentos}
              disabled={isSavingPrivacy}
              onChange={(e) => handleUpdatePrivacy('agendamentos', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-[#4A3F5C] focus:ring-[#B8A9D9] h-4 w-4 cursor-pointer"
            />
          </div>

          {/* Opção 3: Agendamento pela dona */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-gray-50/60 border border-gray-200/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-800 block">
                Permitir agendamento assistido pela administradora
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                A administradora poderá marcar clientes no seu horário livre caso procurem o WhatsApp ou recepção central do studio.
              </p>
            </div>
            <input
              type="checkbox"
              checked={permitirAgendamentoDona}
              disabled={isSavingPrivacy}
              onChange={(e) => handleUpdatePrivacy('agendamento_dona', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-[#4A3F5C] focus:ring-[#B8A9D9] h-4 w-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Card Informativo sobre a Vitrine */}
      <div className="rounded-3xl bg-purple-50/50 border border-purple-200/70 p-6 space-y-3">
        <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
          <Info className="h-4 w-4 text-purple-700" />
          <span>Como funciona sua página pública</span>
        </h3>
        <p className="text-xs text-purple-800/80 leading-relaxed">
          Enquanto fizer parte da equipe deste studio, clientes que acessarem o seu link individual
          serão direcionadas para o seu perfil integrado ao studio. Todos os seus agendamentos,
          clientes e pagamentos continuam exclusivamente na sua conta do Lumê.
        </p>
      </div>

      {/* Modal de Confirmação de Saída */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-gray-200 shadow-2xl">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">Deseja sair do {estudio.nome}?</h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              Ao sair do studio, sua vitrine individual antiga (
              <strong className="text-gray-900">/p/{userSlug}</strong>) voltará a funcionar
              normalmente sem redirecionamento. Nenhum serviço, cliente ou histórico de atendimento
              será alterado.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLeaving}
                onClick={handleLeaveStudio}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {isLeaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Sim, sair do studio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE: DONA / CENTRAL DE GESTÃO DO STUDIO (4 ABAS)
// ============================================================================
function OwnerStudioSection({
  estudio,
  membros,
  convites,
  ativoNoEstudio,
  donaNaEquipe,
}: {
  estudio: StudioData
  membros: StudioMember[]
  convites: StudioInvite[]
  ativoNoEstudio: boolean
  donaNaEquipe: boolean
}) {
  const router = useRouter()

  // 4 Abas: Visão Geral (Métricas), Agendamentos, Equipe, Vitrine & Dados
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'agendamentos' | 'equipe' | 'vitrine'>('visao_geral')

  // Modo de operação do Studio
  const [tipoGestao, setTipoGestao] = useState<'aluguel_cadeira' | 'gestao_completa'>(
    estudio.tipo_gestao || 'gestao_completa'
  )
  const [comissaoPadraoPct, setComissaoPadraoPct] = useState(estudio.comissao_padrao_pct ?? 30)
  const [aluguelPadraoFixo, setAluguelPadraoFixo] = useState(estudio.aluguel_padrao_fixo ?? 0)
  const [isSavingMode, setIsSavingMode] = useState(false)
  const [modeSaved, setModeSaved] = useState(false)

  // Estados da Aba 1: Visão Geral & Métricas
  const [periodo, setPeriodo] = useState<'mes_atual' | 'mes_anterior' | 'hoje' | 'ultimos_30_dias'>('mes_atual')
  const [metrics, setMetrics] = useState<StudioMetricsData | null>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)

  // Estados da Aba 2: Agendamentos Consolidados
  const [bookings, setBookings] = useState<StudioBookingItem[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [bookingFilterProf, setBookingFilterProf] = useState<string>('todos')
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('todos')
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false)
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null)

  // Estados de convite por link
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modal de edição de regra financeira individual de membro
  const [editingMemberRule, setEditingMemberRule] = useState<StudioMember | null>(null)
  const [customComissaoInput, setCustomComissaoInput] = useState<string>('')
  const [customAluguelInput, setCustomAluguelInput] = useState<string>('')
  const [isSavingRule, setIsSavingRule] = useState(false)

  // Remover membro
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; nome: string; isOwner: boolean } | null>(null)
  const [isRemovingMember, setIsRemovingMember] = useState(false)

  // Alternar dona atendendo
  const [isTogglingAtivo, setIsTogglingAtivo] = useState(false)
  const [isAtendendo, setIsAtendendo] = useState(donaNaEquipe)

  // Dados cadastrais / vitrine
  const [nome, setNome] = useState(estudio.nome)
  const [slug, setSlug] = useState(estudio.slug)
  const [bio, setBio] = useState(estudio.bio || '')
  const [fotoCapaUrl, setFotoCapaUrl] = useState(estudio.foto_capa_url || '')
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState(estudio.foto_perfil_url || '')
  const [instagram, setInstagram] = useState(estudio.instagram || '')
  const [whatsapp, setWhatsapp] = useState(estudio.whatsapp || '')
  const [endereco, setEndereco] = useState(estudio.endereco || '')
  const [corPrimaria, setCorPrimaria] = useState(estudio.cor_primaria || '#B8A9D9')
  const [corSecundaria, setCorSecundaria] = useState(estudio.cor_secundaria || '#FAF7F5')
  const [ownerColorModalTarget, setOwnerColorModalTarget] = useState<'primaria' | 'secundaria' | null>(null)
  const [fotosEspaco, setFotosEspaco] = useState<string[]>(estudio.fotos_espaco || [])
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showStudioSlugModal, setShowStudioSlugModal] = useState(false)

  // 1. Carregar métricas quando periodo ou tab visao_geral mudar
  useEffect(() => {
    let isMounted = true
    setIsLoadingMetrics(true)
    obterMetricasStudioAction(estudio.id, periodo)
      .then((data) => {
        if (!isMounted) return
        setMetrics(data)
      })
      .catch((err) => console.error('Erro ao carregar métricas:', err))
      .finally(() => {
        if (isMounted) setIsLoadingMetrics(false)
      })

    return () => {
      isMounted = false
    }
  }, [estudio.id, periodo, activeTab])

  // 2. Carregar agendamentos quando tab agendamentos ou filtros mudarem
  useEffect(() => {
    if (activeTab !== 'agendamentos') return

    let isMounted = true
    setIsLoadingBookings(true)
    obterAgendamentosStudioAction(estudio.id, {
      profissionalId: bookingFilterProf === 'todos' ? undefined : bookingFilterProf,
      status: bookingFilterStatus === 'todos' ? undefined : bookingFilterStatus,
    })
      .then((data) => {
        if (!isMounted) return
        setBookings(data)
      })
      .catch((err) => console.error('Erro ao carregar agendamentos:', err))
      .finally(() => {
        if (isMounted) setIsLoadingBookings(false)
      })

    return () => {
      isMounted = false
    }
  }, [estudio.id, activeTab, bookingFilterProf, bookingFilterStatus])

  // Gerar link de convite
  const handleGenerateLink = async () => {
    setIsGeneratingLink(true)
    try {
      await gerarConviteLink()
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar link de convite.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  // Copiar link de convite
  const handleCopyLink = (code: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/convite-estudio/${code}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Compartilhar link no WhatsApp
  const handleShareWhatsapp = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/convite-estudio/${code}`
    const text = encodeURIComponent(
      `Olá! Gostaria de convidar você para fazer parte da equipe do ${estudio.nome} no Lumê. Acesse o link para conhecer e aceitar: ${url}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  // Cancelar convite
  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Deseja cancelar este link de convite?')) return
    try {
      await cancelarConvite(inviteId)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  // Atualizar status de agendamento (concluir / cancelar)
  const handleUpdateBookingStatus = async (
    bookingId: string,
    novoStatus: 'confirmado' | 'concluido' | 'cancelado' | 'no_show',
    statusPagamento?: string
  ) => {
    setUpdatingBookingId(bookingId)
    try {
      await atualizarStatusAgendamentoStudioAction(bookingId, novoStatus, statusPagamento)
      // Atualizar lista local
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: novoStatus, statusPagamento: statusPagamento || b.statusPagamento }
            : b
        )
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar agendamento.')
    } finally {
      setUpdatingBookingId(null)
    }
  }

  // Salvar modo de gestão e regras padrão
  const handleSaveMode = async () => {
    setIsSavingMode(true)
    setModeSaved(false)
    try {
      await atualizarEstudio({
        id: estudio.id,
        nome,
        slug,
        tipo_gestao: tipoGestao,
        comissao_padrao_pct: Number(comissaoPadraoPct),
        aluguel_padrao_fixo: Number(aluguelPadraoFixo),
      })
      setModeSaved(true)
      setTimeout(() => setModeSaved(false), 3000)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar modo do studio.')
    } finally {
      setIsSavingMode(false)
    }
  }

  // Abrir modal de edição de regra para membro individual
  const handleOpenEditMemberRule = (m: StudioMember) => {
    setEditingMemberRule(m)
    setCustomComissaoInput(
      m.comissao_personalizada_pct != null ? String(m.comissao_personalizada_pct) : ''
    )
    setCustomAluguelInput(
      m.aluguel_personalizado_fixo != null ? String(m.aluguel_personalizado_fixo) : ''
    )
  }

  // Salvar regra individual de membro
  const handleSaveMemberRule = async () => {
    if (!editingMemberRule) return
    setIsSavingRule(true)
    try {
      const comissaoVal = customComissaoInput.trim() ? Number(customComissaoInput) : null
      const aluguelVal = customAluguelInput.trim() ? Number(customAluguelInput) : null

      await atualizarRegraMembroStudioAction(estudio.id, editingMemberRule.id, {
        comissao_personalizada_pct: comissaoVal,
        aluguel_personalizado_fixo: aluguelVal,
      })

      setEditingMemberRule(null)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar regra da profissional.')
    } finally {
      setIsSavingRule(false)
    }
  }

  // Remover membro
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return
    setIsRemovingMember(true)
    try {
      await removerMembroEstudio(memberToRemove.id)
      setMemberToRemove(null)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao remover membro.')
    } finally {
      setIsRemovingMember(false)
    }
  }

  // Alternar atendimento da dona
  const handleToggleAtendimentoDona = async () => {
    setIsTogglingAtivo(true)
    try {
      const next = !isAtendendo
      await alternarDonaComoAtendente(next)
      setIsAtendendo(next)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setIsTogglingAtivo(false)
    }
  }

  // Salvar edição cadastral da vitrine
  const handleSaveEdit = async (e?: React.FormEvent, force = false) => {
    if (e) e.preventDefault()
    if (!force && slug !== estudio.slug) {
      setShowStudioSlugModal(true)
      return
    }
    setIsSavingEdit(true)
    setSaveSuccess(false)
    try {
      await atualizarEstudio({
        id: estudio.id,
        nome,
        slug,
        bio,
        foto_capa_url: fotoCapaUrl,
        foto_perfil_url: fotoPerfilUrl,
        instagram: instagram.trim() ? (instagram.startsWith('@') ? instagram : `@${instagram}`) : null,
        whatsapp: whatsapp.trim() || null,
        endereco: endereco.trim() || null,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        fotos_espaco: fotosEspaco,
        tipo_gestao: tipoGestao,
        comissao_padrao_pct: Number(comissaoPadraoPct),
        aluguel_padrao_fixo: Number(aluguelPadraoFixo),
      })
      setSaveSuccess(true)
      setShowStudioSlugModal(false)
      setTimeout(() => setSaveSuccess(false), 4000)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar alterações do studio.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300 text-left">
      {/* 1. Header do Studio */}
      <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-xs">
        {estudio.foto_capa_url ? (
          <div className="relative h-44 sm:h-56 w-full">
            <Image src={estudio.foto_capa_url} alt={estudio.nome} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-6 sm:bottom-6 sm:left-8 right-6 sm:right-8 z-10 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Administradora do Studio</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{estudio.nome}</h1>
                <p className="text-xs text-gray-200 mt-0.5 font-mono">/studio/{estudio.slug}</p>
              </div>

              <Link
                href={`/studio/${estudio.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/30 bg-white/20 backdrop-blur-md text-xs font-semibold text-white hover:bg-white/30 transition cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Ver vitrine pública</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-50 via-pink-50/20 to-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B8A9D9]/20 text-[#4A3F5C] border border-[#B8A9D9]/30 text-[11px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#4A3F5C]" />
                <span>Administradora do Studio</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#4A3F5C]">{estudio.nome}</h1>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">/studio/{estudio.slug}</p>
            </div>

            <Link
              href={`/studio/${estudio.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Ver vitrine pública</span>
            </Link>
          </div>
        )}
      </div>

      {/* 2. Abas de Navegação (4 Abas Distribuidas) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gray-200/80 pb-px w-full gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('visao_geral')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'visao_geral'
              ? 'border-[#4A3F5C] text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <TrendingUp className={`h-4 w-4 shrink-0 ${activeTab === 'visao_geral' ? 'text-[#4A3F5C]' : 'text-gray-400'}`} />
          <span className="truncate">Visão Geral</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agendamentos')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'agendamentos'
              ? 'border-[#4A3F5C] text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Calendar className={`h-4 w-4 shrink-0 ${activeTab === 'agendamentos' ? 'text-[#4A3F5C]' : 'text-gray-400'}`} />
          <span className="truncate">Agendamentos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipe')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'equipe'
              ? 'border-[#4A3F5C] text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users className={`h-4 w-4 shrink-0 ${activeTab === 'equipe' ? 'text-[#4A3F5C]' : 'text-gray-400'}`} />
          <span className="truncate">Equipe</span>
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 shrink-0">
            {membros.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vitrine')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'vitrine'
              ? 'border-[#4A3F5C] text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Store className={`h-4 w-4 shrink-0 ${activeTab === 'vitrine' ? 'text-[#4A3F5C]' : 'text-gray-400'}`} />
          <span className="truncate">Vitrine & Dados</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* ABA 1: VISÃO GERAL (MÉTRICAS & REPASSES) */}
      {/* ==================================================================== */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Banner do Modo Atual */}
          <div className="rounded-2xl bg-white border border-gray-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-[#4A3F5C] flex items-center justify-center shrink-0">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">Modo de Operação:</span>
                  <span className="text-xs font-black text-[#4A3F5C]">
                    {tipoGestao === 'gestao_completa'
                      ? 'Gestão Completa (Dona do Studio)'
                      : 'Aluguel de Cadeira (Coworking)'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {tipoGestao === 'gestao_completa'
                    ? `Comissão padrão do estúdio em ${comissaoPadraoPct}% sobre os procedimentos.`
                    : `Aluguel mensal padrão de R$ ${aluguelPadraoFixo.toLocaleString('pt-BR')} por cadeira.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('vitrine')}
              className="text-xs font-bold text-[#8675A9] hover:text-[#4A3F5C] transition cursor-pointer self-start sm:self-auto"
            >
              Configurar modo na aba Vitrine →
            </button>
          </div>

          {/* Seletor de Período */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-gray-500 shrink-0">Período:</span>
            <div className="flex items-center gap-1.5 bg-gray-100/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPeriodo('hoje')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  periodo === 'hoje' ? 'bg-white text-[#4A3F5C] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setPeriodo('mes_atual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  periodo === 'mes_atual' ? 'bg-white text-[#4A3F5C] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => setPeriodo('mes_anterior')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  periodo === 'mes_anterior' ? 'bg-white text-[#4A3F5C] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mês Anterior
              </button>
              <button
                type="button"
                onClick={() => setPeriodo('ultimos_30_dias')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  periodo === 'ultimos_30_dias' ? 'bg-white text-[#4A3F5C] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Últimos 30 Dias
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          {isLoadingMetrics ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#B8A9D9]" />
              <p className="text-xs font-medium">Calculando métricas do studio...</p>
            </div>
          ) : !metrics ? (
            <div className="p-6 text-center text-xs text-gray-500">
              Nenhuma métrica disponível para o período selecionado.
            </div>
          ) : tipoGestao === 'gestao_completa' ? (
            <div className="space-y-6">
              {/* 4 Cards Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Faturamento Bruto */}
                <div className="rounded-3xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold text-gray-600">Faturamento Bruto</span>
                    <TrendingUp className="h-4 w-4 text-[#4A3F5C]" />
                  </div>
                  <div className="text-2xl font-black text-[#4A3F5C]">
                    R$&nbsp;{metrics.faturamentoBrutoTotal.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-[11px] text-gray-400">Total gerado no espaço</p>
                </div>

                {/* 2. Comissão Retida do Studio */}
                <div className="rounded-3xl bg-white border border-emerald-200/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-xs font-bold text-emerald-900">Comissão do Studio</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    R$&nbsp;{metrics.faturamentoStudioTotal.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-[11px] text-emerald-800/70">Receita retida pelo estúdio</p>
                </div>

                {/* 3. Repasses Líquidos da Equipe */}
                <div className="rounded-3xl bg-white border border-purple-200/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-purple-800">
                    <span className="text-xs font-bold text-purple-900">Repasses da Equipe</span>
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-[#4A3F5C]">
                    R$&nbsp;{metrics.repassesEquipeTotal.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-[11px] text-purple-800/70">A repassar para as profissionais</p>
                </div>

                {/* 4. Total de Agendamentos */}
                <div className="rounded-3xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold text-gray-600">Agendamentos</span>
                    <Calendar className="h-4 w-4 text-[#B8A9D9]" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {metrics.totalAgendamentos}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {metrics.agendamentosConcluidos} concluídos · {metrics.agendamentosConfirmados} confirmados
                  </p>
                </div>
              </div>

              {/* Tabela de Desempenho e Repasses por Profissional */}
              <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#4A3F5C]">
                      Desempenho & Repasses por Profissional
                    </h3>
                    <p className="text-xs text-gray-500">
                      Valores apurados com base nos atendimentos concluídos e regras de comissão
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {metrics.membrosDesempenho.length} profissionais
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Profissional</th>
                        <th className="py-3 px-2 text-center">Atendimentos</th>
                        <th className="py-3 px-2 text-right">Faturamento Bruto</th>
                        <th className="py-3 px-2 text-right">Comissão Studio</th>
                        <th className="py-3 px-2 text-right">Repasse Líquido</th>
                        <th className="py-3 px-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metrics.membrosDesempenho.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <div className="relative h-8 w-8 rounded-full bg-purple-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-purple-900">
                                {m.foto_url ? (
                                  <Image src={m.foto_url} alt={m.nome} fill className="object-cover" />
                                ) : (
                                  m.nome.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900 truncate">{m.nome}</span>
                                  {m.isOwner && (
                                    <span title="Dona" className="text-amber-500">
                                      <Crown className="h-3.5 w-3.5 fill-amber-400/25" />
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 block truncate">
                                  {m.categoria.join(', ') || 'Atendente'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center font-semibold text-gray-700">
                            {m.agendamentosConcluidos}
                            <span className="text-[10px] text-gray-400 block">
                              de {m.totalAgendamentos}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-right">
                            {m.faturamentoBruto !== null ? (
                              <span className="font-bold text-gray-900">
                                R$&nbsp;{m.faturamentoBruto.toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">
                                Oculto pela profissional
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-right">
                            {m.comissaoStudio !== null ? (
                              <span className="font-bold text-emerald-700">
                                R$&nbsp;{m.comissaoStudio.toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">—</span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-right">
                            {m.repasseLiquido !== null ? (
                              <span className="font-black text-[#4A3F5C]">
                                R$&nbsp;{m.repasseLiquido.toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">—</span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const fullMember = membros.find((x) => x.id === m.id)
                                if (fullMember) handleOpenEditMemberRule(fullMember)
                              }}
                              className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-[11px] font-bold text-gray-700 transition cursor-pointer"
                            >
                              Ajustar Regra
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // Layout Modo: Aluguel de Cadeira (Coworking)
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-3xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold text-gray-600">Profissionais Ativas</span>
                    <Users className="h-4 w-4 text-[#4A3F5C]" />
                  </div>
                  <div className="text-2xl font-black text-[#4A3F5C]">
                    {metrics.totalProfissionaisAtivas}
                  </div>
                  <p className="text-[11px] text-gray-400">Cadeiras ocupadas no espaço</p>
                </div>

                <div className="rounded-3xl bg-white border border-emerald-200/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-xs font-bold text-emerald-900">Aluguel Previsto</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    R$&nbsp;{metrics.faturamentoStudioTotal.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-[11px] text-emerald-800/70">Receita fixa mensal de cadeiras</p>
                </div>

                <div className="rounded-3xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold text-gray-600">Total de Atendimentos</span>
                    <Calendar className="h-4 w-4 text-[#B8A9D9]" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {metrics.totalAgendamentos}
                  </div>
                  <p className="text-[11px] text-gray-400">Clientes atendidas no espaço</p>
                </div>
              </div>

              {/* Tabela de Cadeiras / Profissionais */}
              <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#4A3F5C]">Profissionais & Cadeiras</h3>
                    <p className="text-xs text-gray-500">
                      Controle das parceiras autônomas e valor fixo de aluguel estipulado
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Profissional</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Aluguel Fixo da Cadeira</th>
                        <th className="py-3 px-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metrics.membrosDesempenho.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <div className="relative h-8 w-8 rounded-full bg-purple-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-purple-900">
                                {m.foto_url ? (
                                  <Image src={m.foto_url} alt={m.nome} fill className="object-cover" />
                                ) : (
                                  m.nome.charAt(0)
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900">{m.nome}</span>
                                <span className="text-[10px] text-gray-400 block">
                                  {m.categoria.join(', ') || 'Parceira Autônoma'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                m.ativo_no_estudio
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {m.ativo_no_estudio ? 'Atendendo' : 'Em Pausa'}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-right font-bold text-emerald-700">
                            R$&nbsp;{(m.aluguelFixo || aluguelPadraoFixo).toLocaleString('pt-BR')}
                            <span className="text-[10px] text-gray-400 font-normal block">/mês</span>
                          </td>

                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const fullMember = membros.find((x) => x.id === m.id)
                                if (fullMember) handleOpenEditMemberRule(fullMember)
                              }}
                              className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-[11px] font-bold text-gray-700 transition cursor-pointer"
                            >
                              Editar Aluguel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 2: AGENDAMENTOS CONSOLIDADOS DO STUDIO */}
      {/* ==================================================================== */}
      {activeTab === 'agendamentos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & Ação de Novo Agendamento */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#4A3F5C]">
                Agenda Integrada do Studio
              </h2>
              <p className="text-xs text-gray-500">
                Centralize o fluxo de atendimentos de todas as profissionais do seu espaço
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewBookingModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4A3F5C] hover:bg-[#3b324a] text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>

          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            {/* Filtro por Profissional */}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Profissional:
              </label>
              <select
                value={bookingFilterProf}
                onChange={(e) => setBookingFilterProf(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C]"
              >
                <option value="todos">Todas as profissionais</option>
                {membros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} {m.isOwner ? '(Dona)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Status */}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Status:
              </label>
              <select
                value={bookingFilterStatus}
                onChange={(e) => setBookingFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C]"
              >
                <option value="todos">Todos os status</option>
                <option value="confirmado">Confirmados</option>
                <option value="concluido">Concluídos</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Lista / Tabela de Agendamentos */}
          <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-xs">
            {isLoadingBookings ? (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#B8A9D9]" />
                <p className="text-xs">Carregando agendamentos da equipe...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-xs font-medium">Nenhum agendamento encontrado para este filtro.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50">
                      <th className="py-3 px-4">Data & Horário</th>
                      <th className="py-3 px-4">Profissional</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Serviço</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((b) => {
                      const dataInicio = new Date(b.dataHoraInicio)
                      const diaStr = dataInicio.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })
                      const horaStr = dataInicio.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })

                      const isUpdating = updatingBookingId === b.id

                      return (
                        <tr key={b.id} className="hover:bg-gray-50/60 transition">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-gray-900 block">{diaStr}</span>
                            <span className="text-[11px] text-gray-500 font-mono">{horaStr}</span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="relative h-7 w-7 rounded-full bg-purple-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-purple-900">
                                {b.profissionalFoto ? (
                                  <Image src={b.profissionalFoto} alt={b.profissionalNome} fill className="object-cover" />
                                ) : (
                                  b.profissionalNome.charAt(0)
                                )}
                              </div>
                              <span className="font-semibold text-gray-800">{b.profissionalNome}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-gray-900 block">{b.clienteNome}</span>
                            {b.clienteTelefone && (
                              <a
                                href={`https://api.whatsapp.com/send?phone=55${b.clienteTelefone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="h-2.5 w-2.5" />
                                <span>{b.clienteTelefone}</span>
                              </a>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-800 block truncate max-w-[180px]">
                              {b.servicoNome}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                            {b.valorCobrado !== null ? (
                              <span className="text-gray-900">
                                R$&nbsp;{b.valorCobrado.toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-normal italic">
                                Oculto
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'concluido'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.status === 'confirmado'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {b.status === 'concluido'
                                ? 'Concluído'
                                : b.status === 'confirmado'
                                ? 'Confirmado'
                                : 'Cancelado'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin text-purple-600 mx-auto" />
                            ) : b.status === 'confirmado' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'concluido', 'pago')}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                  title="Marcar como Concluído e Pago"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelado')}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Cancelar Agendamento"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 3: EQUIPE (LINK DE CONVITE & MEMBROS) */}
      {/* ==================================================================== */}
      {activeTab === 'equipe' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Card de Vagas do Plano Studio (Até 6 inclusas, +R$ 29 por extra) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-purple-50/70 border border-[#B8A9D9]/50 text-[#4A3F5C] shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#B8A9D9]/30 text-[#4A3F5C] flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#4A3F5C]">
                  {membros.length <= 6
                    ? `Plano Studio: ${membros.length} de 6 vagas inclusas`
                    : `Plano Studio: 6 inclusas + ${membros.length - 6} adicionais`}
                </h4>
                <p className="text-[11px] text-gray-500">
                  {membros.length <= 6
                    ? 'Sua assinatura base de R$ 169/mês cobre até 6 profissionais sem custo para a equipe.'
                    : `Base de R$ 169/mês + R$ ${(membros.length - 6) * 29},00/mês pelas ${membros.length - 6} profissionais extras (+R$ 29/mês por vaga).`}
                </p>
              </div>
            </div>

            <div className="self-start sm:self-auto shrink-0">
              {membros.length <= 6 ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200">
                  {6 - membros.length} {6 - membros.length === 1 ? 'vaga restante' : 'vagas restantes'}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-purple-900 bg-purple-100/90 px-3 py-1 rounded-full border border-purple-200">
                  Total Studio: R$ {169 + (membros.length - 6) * 29},00/mês
                </span>
              )}
            </div>
          </div>

          {/* Card Único e Central de Convite por Link (Busca por email removida) */}
          <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-50 text-[#4A3F5C] flex items-center justify-center shrink-0">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#4A3F5C]">
                    Adicionar Novas Profissionais à Equipe
                  </h3>
                  <p className="text-xs text-gray-500">
                    Gere links seguros de convite para enviar no WhatsApp das parceiras
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingLink}
                onClick={handleGenerateLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4A3F5C] hover:bg-[#3b324a] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer self-start sm:self-auto shadow-xs"
              >
                {isGeneratingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Gerar Novo Link de Convite</span>
              </button>
            </div>

            {/* Links Ativos */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Links de Convite Ativos ({convites.filter((c) => c.tipo === 'link').length})
              </h4>

              {convites.filter((c) => c.tipo === 'link').length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-gray-50/80 border border-gray-200/60 text-xs text-gray-500">
                  Nenhum link ativo no momento. Clique no botão &quot;Gerar Novo Link de Convite&quot; acima.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {convites
                    .filter((c) => c.tipo === 'link')
                    .map((convite) => (
                      <div
                        key={convite.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/80"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-gray-700 block truncate">
                            .../convite-estudio/{convite.codigo}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>Válido por 7 dias</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(convite.codigo || '', convite.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 transition cursor-pointer"
                          >
                            {copiedId === convite.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-gray-500" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsapp(convite.codigo || '')}
                            className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            title="Compartilhar no WhatsApp"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCancelInvite(convite.id)}
                            className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Excluir link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Membros da Equipe */}
          <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#4A3F5C]">
                  Profissionais Atuais ({membros.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Gerencie regras financeiras, permissões e status de atendimento de cada parceira
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {membros.map((membro) => (
                <div
                  key={membro.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-200/70"
                >
                  {/* Foto e Nome */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-2xl bg-purple-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm text-purple-900 border border-purple-200">
                      {membro.foto_url ? (
                        <Image src={membro.foto_url} alt={membro.nome} fill className="object-cover" />
                      ) : (
                        membro.nome.charAt(0)
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{membro.nome}</span>
                        {membro.isOwner && (
                          <span title="Dona do Studio" className="text-amber-500">
                            <Crown className="h-4 w-4 fill-amber-400/25" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 block">
                        {membro.categoria.join(' • ') || 'Atendente'}
                      </span>
                    </div>
                  </div>

                  {/* Regra Financeira e Permissões */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                    {/* Regra Financeira */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Regra Financeira:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-700">
                          {tipoGestao === 'gestao_completa'
                            ? `${membro.comissao_personalizada_pct ?? comissaoPadraoPct}% comissão`
                            : `R$ ${(membro.aluguel_personalizado_fixo ?? aluguelPadraoFixo).toLocaleString('pt-BR')}/mês`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditMemberRule(membro)}
                          className="text-[10px] text-[#8675A9] hover:text-[#4A3F5C] font-bold underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    {/* Indicadores de Privacidade */}
                    <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                      <span
                        title={
                          membro.compartilhar_faturamento
                            ? 'Faturamento compartilhado com o studio'
                            : 'Faturamento privado pela parceira'
                        }
                        className={`p-1.5 rounded-lg text-xs ${
                          membro.compartilhar_faturamento ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 bg-gray-100'
                        }`}
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                      </span>

                      <span
                        title={
                          membro.compartilhar_agendamentos
                            ? 'Agenda compartilhada na visão geral'
                            : 'Agenda privada pela parceira'
                        }
                        className={`p-1.5 rounded-lg text-xs ${
                          membro.compartilhar_agendamentos ? 'text-purple-700 bg-purple-50' : 'text-gray-400 bg-gray-100'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </span>

                      <span
                        title={
                          membro.permitir_agendamento_dona
                            ? 'Permite agendamento assistido pela dona'
                            : 'Bloqueou agendamento assistido'
                        }
                        className={`p-1.5 rounded-lg text-xs ${
                          membro.permitir_agendamento_dona ? 'text-blue-700 bg-blue-50' : 'text-gray-400 bg-gray-100'
                        }`}
                      >
                        <Scissors className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {/* Desvincular */}
                    <button
                      type="button"
                      onClick={() =>
                        setMemberToRemove({
                          id: membro.id,
                          nome: membro.nome,
                          isOwner: membro.isOwner,
                        })
                      }
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={membro.isOwner ? 'Desvincular atendimento' : 'Desvincular do studio'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 4: VITRINE & CONFIGURAÇÕES CADASTRAIS */}
      {/* ==================================================================== */}
      {activeTab === 'vitrine' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* SEÇÃO 1: MODO DE OPERAÇÃO DO STUDIO */}
          <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="h-10 w-10 rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C] flex items-center justify-center">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#4A3F5C]">
                  Modo de Operação do Studio
                </h3>
                <p className="text-xs text-gray-500">
                  Defina como o espaço funciona financeiramente com as profissionais parceiras
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opção A: Gestão Completa */}
              <div
                onClick={() => setTipoGestao('gestao_completa')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                  tipoGestao === 'gestao_completa'
                    ? 'border-[#4A3F5C] bg-[#FAF7F5]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">
                    Gestão Completa (Dona do Studio)
                  </span>
                  {tipoGestao === 'gestao_completa' && <Check className="h-4 w-4 text-[#4A3F5C]" />}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Controle centralizado de faturamento, cálculo de comissões, repasses e agenda integrada.
                </p>
              </div>

              {/* Opção B: Aluguel de Cadeira */}
              <div
                onClick={() => setTipoGestao('aluguel_cadeira')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                  tipoGestao === 'aluguel_cadeira'
                    ? 'border-[#4A3F5C] bg-[#FAF7F5]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">
                    Aluguel de Cadeira (Coworking)
                  </span>
                  {tipoGestao === 'aluguel_cadeira' && <Check className="h-4 w-4 text-[#4A3F5C]" />}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Profissionais autônomas pagam taxa/aluguel fixo de cadeira e mantêm faturamento totalmente independente.
                </p>
              </div>
            </div>

            {/* Inputs de Regras Padrão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Comissão Padrão do Studio (%)
                </label>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={comissaoPadraoPct}
                    onChange={(e) => setComissaoPadraoPct(Number(e.target.value))}
                    className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm"
                  />
                  <span className="text-gray-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  Usado na Gestão Completa quando a profissional não tem taxa individual
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Aluguel Mensal Padrão de Cadeira (R$)
                </label>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs">
                  <span className="text-gray-400 font-bold mr-1.5">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={aluguelPadraoFixo}
                    onChange={(e) => setAluguelPadraoFixo(Number(e.target.value))}
                    className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm"
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  Usado no Aluguel de Cadeira como valor mensal padrão por parceira
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              {modeSaved ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  <span>Configurações salvas!</span>
                </span>
              ) : <div />}

              <button
                type="button"
                disabled={isSavingMode}
                onClick={handleSaveMode}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSavingMode && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Salvar Modo & Regras</span>
              </button>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS CADASTRAIS & APRESENTAÇÃO */}
          <form onSubmit={handleSaveEdit} className="space-y-6">
            <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="h-10 w-10 rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C] flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#4A3F5C]">
                    Identificação & Vitrine Coletiva
                  </h3>
                  <p className="text-xs text-gray-500">
                    Dados exibidos na página pública `/studio/{slug}`
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Nome do Studio *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4A3F5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Link (slug) *</label>
                  <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                    <span className="text-gray-400">/studio/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full bg-transparent px-1 font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Biografia do Espaço</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conceito do espaço, diferenciais..."
                  className="w-full rounded-2xl border border-gray-200 p-3 text-xs text-gray-800 focus:outline-none focus:border-[#4A3F5C] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">WhatsApp do Studio</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#4A3F5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Instagram (@)</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@seustudio"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#4A3F5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Endereço Completo</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, Número, Bairro, Cidade"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#4A3F5C]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <Check className="h-4 w-4" />
                    <span>Dados salvos com sucesso!</span>
                  </span>
                ) : <div />}

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Salvar Dados Cadastrais</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: AJUSTAR REGRA FINANCEIRA INDIVIDUAL DE MEMBRO */}
      {/* ==================================================================== */}
      {editingMemberRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Regra Financeira: {editingMemberRule.nome}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Personalize a retenção para esta parceira ou deixe em branco para usar o padrão
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMemberRule(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {tipoGestao === 'gestao_completa' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Comissão Individual do Studio (%)
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder={`Padrão: ${comissaoPadraoPct}%`}
                    value={customComissaoInput}
                    onChange={(e) => setCustomComissaoInput(e.target.value)}
                    className="w-full outline-none font-bold text-gray-900"
                  />
                  <span className="text-gray-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  Deixe vazio para usar a taxa padrão do studio ({comissaoPadraoPct}%).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Aluguel Individual de Cadeira (R$)
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs">
                  <span className="text-gray-400 mr-1.5 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Padrão: ${aluguelPadraoFixo}`}
                    value={customAluguelInput}
                    onChange={(e) => setCustomAluguelInput(e.target.value)}
                    className="w-full outline-none font-bold text-gray-900"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Deixe vazio para usar o aluguel padrão do studio (R$ {aluguelPadraoFixo}).
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingMemberRule(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingRule}
                onClick={handleSaveMemberRule}
                className="px-5 py-2 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {isSavingRule && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                <span>Salvar Regra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: NOVO AGENDAMENTO ASSISTIDO DA DONA */}
      {/* ==================================================================== */}
      <StudioNewBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        estudioId={estudio.id}
        onSuccess={() => {
          // Atualizar agendamentos e métricas
          obterAgendamentosStudioAction(estudio.id, {
            profissionalId: bookingFilterProf === 'todos' ? undefined : bookingFilterProf,
            status: bookingFilterStatus === 'todos' ? undefined : bookingFilterStatus,
          }).then((d) => setBookings(d))
          obterMetricasStudioAction(estudio.id, periodo).then((d) => setMetrics(d))
        }}
      />

      {/* MODAL: CONFIRMAR REMOÇÃO DE MEMBRO */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-gray-200 shadow-2xl">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              Desvincular {memberToRemove.nome}?
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              A profissional deixará de fazer parte da equipe do studio e não aparecerá mais na vitrine pública coletiva. A conta dela e todos os seus agendamentos continuam intactos.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={handleConfirmRemoveMember}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {isRemovingMember && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Sim, desvincular</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  Link2,
  Mail,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  AlertTriangle,
  ExternalLink,
  Plus,
  Loader2,
  Sparkles,
  LogOut,
  Upload,
  Clock,
  Search,
  Palette,
  Camera,
  Store,
  Crown,
  User,
} from 'lucide-react'
import {
  StudioUserStatus,
  criarEstudio,
  atualizarEstudio,
  alternarAtivoNoEstudio,
  alternarDonaComoAtendente,
  gerarConviteLink,
  cancelarConvite,
  buscarProfissionalPorEmail,
  enviarConviteEmail,
  removerMembroEstudio,
  sairDoEstudio,
} from '@/app/actions/estudio'
import { createClient } from '@/lib/supabase/client'
import { parseCategorias, getCategoryLabel } from '@/lib/utils/categories'
import { getContrastingTextColor, getLightTint } from '@/lib/utils/contrast'

interface StudioDashboardViewProps {
  status: StudioUserStatus
}

export default function StudioDashboardView({ status }: StudioDashboardViewProps) {
  const router = useRouter()

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
      />
    )
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
      const ext = file.name.split('.').pop()
      const fileName = `estudio-capa-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setFotoCapaUrl(data.publicUrl)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar foto.'
      setErrorMessage(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await criarEstudio({
        nome,
        slug,
        bio,
        foto_capa_url: fotoCapaUrl,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
      })
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar o studio.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Banner de Apresentação */}
      <div className="rounded-3xl bg-gradient-to-br from-[#4A3F5C] to-[#2D2638] text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-[#B8A9D9]/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#B8A9D9] backdrop-blur-xs">
            <Building2 className="h-4 w-4" />
            <span>Studios com Equipe</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Crie sua Vitrine Coletiva no Lumê
          </h1>
          <p className="text-sm text-gray-200 leading-relaxed">
            Reúna várias profissionais em um único espaço estilo barbearia ou salão de beleza.
            Cada profissional mantém sua própria conta, agenda e financeiro independentes, enquanto
            suas clientes escolhem facilmente com quem desejam agendar.
          </p>
        </div>
      </div>

      {/* Formulário de Criação */}
      <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-[#4A3F5C] mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#B8A9D9]" />
          <span>Informações do seu Studio</span>
        </h2>

        {errorMessage && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Nome do Studio <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: Espaço Divas & Beleza"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C] outline-hidden text-sm"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Link do Studio (slug) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-500 focus-within:border-[#4A3F5C] focus-within:ring-1 focus-within:ring-[#4A3F5C] focus-within:bg-white">
                <span className="shrink-0 font-medium">/studio/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="meu-studio"
                  className="w-full bg-transparent px-1 outline-hidden font-bold text-gray-900 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Bio / Descrição do Studio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva o conceito do espaço, especialidades da equipe ou diferenciais..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C] outline-hidden text-sm resize-none"
            />
          </div>

          {/* Capa */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 block">Foto de Capa do Studio</label>
              <span className="text-[11px] text-gray-400 font-medium">Recomendado 1200x400px (3:1)</span>
            </div>

            <div className="w-full relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-[16/9] sm:aspect-[3/1] flex items-center justify-center group shadow-inner">
              {fotoCapaUrl ? (
                <>
                  <Image src={fotoCapaUrl} alt="Capa do Studio" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 sm:gap-3">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-[#4A3F5C] shadow-md transition cursor-pointer backdrop-blur-xs">
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-[#B8A9D9]" />}
                      <span>Trocar Imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFotoCapaUrl('')}
                      className="p-2 bg-rose-600/90 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer shadow-md backdrop-blur-xs"
                      title="Remover capa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 hover:border-[#B8A9D9] rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-purple-50/20 transition p-6 text-center">
                  <div className="h-11 w-11 rounded-2xl bg-white shadow-2xs border border-gray-100 flex items-center justify-center text-[#4A3F5C] mb-2">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#B8A9D9]" />
                    ) : (
                      <Upload className="h-5 w-5 text-[#B8A9D9]" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-700">
                    {isUploading ? 'Enviando imagem de capa...' : 'Escolher Imagem de Capa do Studio'}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">Formato JPG, PNG ou WEBP até 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Cores Primária e Secundária lado a lado */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Cor Primária (Destaque)</label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  className="h-10 w-10 sm:w-12 rounded-xl border border-gray-200 cursor-pointer p-0.5 shrink-0"
                />
                <input
                  type="text"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  className="w-full max-w-[120px] px-2.5 sm:px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono uppercase font-bold text-[#4A3F5C]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Cor Secundária (Fundo)</label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="color"
                  value={corSecundaria}
                  onChange={(e) => setCorSecundaria(e.target.value)}
                  className="h-10 w-10 sm:w-12 rounded-xl border border-gray-200 cursor-pointer p-0.5 shrink-0"
                />
                <input
                  type="text"
                  value={corSecundaria}
                  onChange={(e) => setCorSecundaria(e.target.value)}
                  className="w-full max-w-[120px] px-2.5 sm:px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono uppercase font-bold text-[#4A3F5C]"
                />
              </div>
            </div>
          </div>

          {/* Prévia da Vitrine Coletiva com as Cores */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#B8A9D9]" />
                <span>Prévia da Vitrine com suas Cores</span>
              </label>
              <span className="text-[11px] text-gray-400 font-medium">Visualização em tempo real</span>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xs space-y-4"
              style={{
                backgroundColor: corSecundaria,
                borderColor: getLightTint(corPrimaria, 40),
              }}
            >
              {/* Header mockup da vitrine */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
                <div className="space-y-1">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: getLightTint(corPrimaria, 20),
                      color: corPrimaria,
                      border: `1px solid ${getLightTint(corPrimaria, 35)}`,
                    }}
                  >
                    <span>Studio</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#4A3F5C]">
                    {nome || 'Nome do seu Studio'}
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md line-clamp-2 font-medium">
                    {bio || 'Descreva aqui o conceito do seu espaço, especialidades da equipe ou diferenciais de atendimento.'}
                  </p>
                </div>

                <div className="text-xs font-mono text-gray-500 bg-white/80 px-2.5 py-1 rounded-lg border border-gray-200/60 shrink-0">
                  /studio/{slug || 'seu-studio'}
                </div>
              </div>

              {/* Mock cards de membros da equipe */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Nossa Equipe
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-white/90 p-3 rounded-xl border border-gray-200/70 flex items-center gap-3 shadow-2xs">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      style={{
                        backgroundColor: getLightTint(corPrimaria, 25),
                        color: corPrimaria,
                      }}
                    >
                      EP
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#4A3F5C] truncate">Exemplo Profissional</p>
                      <p className="text-[10px] text-gray-500 truncate">Especialista & Atendente</p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-lg text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: corPrimaria,
                        color: getContrastingTextColor(corPrimaria),
                      }}
                    >
                      Ver Perfil
                    </span>
                  </div>

                  <div className="bg-white/50 border border-dashed border-gray-300 p-3 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                    + Novas Profissionais da Equipe
                  </div>
                </div>
              </div>

              {/* Botão de destaque coletivo com cor primária */}
              <div className="pt-1 flex justify-center sm:justify-start">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs"
                  style={{
                    backgroundColor: corPrimaria,
                    color: getContrastingTextColor(corPrimaria),
                  }}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Qualquer profissional disponível</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
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
}: {
  estudio: StudioUserStatus & { papel: 'membro' } extends { estudio: infer T } ? T : never
  dona: { nome: string; foto_url: string | null }
  ativoNoEstudio: boolean
  userSlug: string
}) {
  const router = useRouter()
  const [isLeaving, setIsLeaving] = useState(false)
  const [isTogglingAtivo, setIsTogglingAtivo] = useState(false)
  const [ativoState, setAtivoState] = useState(ativoNoEstudio)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

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
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
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
                  ? 'Você está aparecendo como profissional disponível para agendamento no studio.'
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

      {/* Card Informativo sobre a Vitrine */}
      <div className="rounded-3xl bg-purple-50/50 border border-purple-200/70 p-6 space-y-3">
        <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-700" />
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
// COMPONENTE: DONA / GESTÃO DO STUDIO
// ============================================================================
function OwnerStudioSection({
  estudio,
  membros,
  convites,
  ativoNoEstudio,
  donaNaEquipe,
}: {
  estudio: StudioUserStatus & { papel: 'dona' } extends { estudio: infer T } ? T : never
  membros: StudioUserStatus & { papel: 'dona' } extends { membros: infer T } ? T : never
  convites: StudioUserStatus & { papel: 'dona' } extends { convites: infer T } ? T : never
  ativoNoEstudio: boolean
  donaNaEquipe: boolean
}) {
  const router = useRouter()

  // Aba ativa: studio, equipe ou vitrine (igual ao /perfil)
  const [activeTab, setActiveTab] = useState<'studio' | 'equipe' | 'vitrine'>('studio')

  // Estados de edição do studio
  const [nome, setNome] = useState(estudio.nome)
  const [slug, setSlug] = useState(estudio.slug)
  const [bio, setBio] = useState(estudio.bio || '')
  const [fotoCapaUrl, setFotoCapaUrl] = useState(estudio.foto_capa_url || '')
  const [corPrimaria, setCorPrimaria] = useState(estudio.cor_primaria || '#B8A9D9')
  const [corSecundaria, setCorSecundaria] = useState(estudio.cor_secundaria || '#FAF7F5')
  const [fotosEspaco, setFotosEspaco] = useState<string[]>(estudio.fotos_espaco || [])
  const [isUploadingEspaco, setIsUploadingEspaco] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isUploadingEdit, setIsUploadingEdit] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showStudioSlugModal, setShowStudioSlugModal] = useState(false)

  const handleUploadFotoEspaco = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fotosEspaco.length >= 6) {
      alert('Você pode adicionar no máximo 6 fotos do seu espaço.')
      return
    }
    setIsUploadingEspaco(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `espaco-${Date.now()}.${ext}`
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setFotosEspaco((prev) => [...prev, data.publicUrl])
    } catch (err: unknown) {
      console.error('Erro ao enviar foto do espaço:', err)
      alert('Erro ao enviar foto do espaço.')
    } finally {
      setIsUploadingEspaco(false)
    }
  }

  const handleRemoveFotoEspaco = (indexToRemove: number) => {
    setFotosEspaco((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  // Toggle de atendimento
  const [isTogglingAtivo, setIsTogglingAtivo] = useState(false)
  const [ativoState, setAtivoState] = useState(ativoNoEstudio)
  const [isJoiningTeam, setIsJoiningTeam] = useState(false)

  // Convite por Link
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Convite por Email
  const [emailInput, setEmailInput] = useState('')
  const [isSearchingEmail, setIsSearchingEmail] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [foundProf, setFoundProf] = useState<{
    nome: string
    foto_url: string | null
    email: string
  } | null>(null)

  // Remoção de membro ou desvinculação da dona
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string
    nome: string
    isOwner?: boolean
  } | null>(null)
  const [isRemovingMember, setIsRemovingMember] = useState(false)

  // Status unificado de atendimento da dona
  const isAtendendo = donaNaEquipe && ativoState

  // Alternar atendimento da dona de forma simplificada e direta
  const handleToggleAtendimentoDona = async () => {
    setIsTogglingAtivo(true)
    try {
      if (isAtendendo) {
        await alternarAtivoNoEstudio(false)
        setAtivoState(false)
      } else {
        if (!donaNaEquipe) {
          await alternarDonaComoAtendente(true)
        }
        await alternarAtivoNoEstudio(true)
        setAtivoState(true)
      }
      router.refresh()
    } catch (err) {
      console.error('Erro ao alternar status de atendimento:', err)
    } finally {
      setIsTogglingAtivo(false)
    }
  }

  // Gerar link de convite
  const handleGenerateLink = async () => {
    setIsGeneratingLink(true)
    try {
      await gerarConviteLink()
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar link.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  // Copiar link
  const handleCopyLink = (codigo: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/convite-estudio/${codigo}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Cancelar convite
  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Deseja cancelar este convite?')) return
    try {
      await cancelarConvite(inviteId)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  // Buscar profissional por email
  const handleSearchEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput || !emailInput.includes('@')) return

    setIsSearchingEmail(true)
    setEmailFeedback(null)
    setFoundProf(null)

    try {
      const res = await buscarProfissionalPorEmail(emailInput)
      if (res.exists && res.profissional) {
        if (res.profissional.jaNoEstudio) {
          setEmailFeedback({
            type: 'info',
            message: `${res.profissional.nome} já faz parte da equipe deste studio!`,
          })
        } else {
          setFoundProf({
            nome: res.profissional.nome,
            foto_url: res.profissional.foto_url,
            email: res.profissional.email || emailInput,
          })
        }
      } else {
        setEmailFeedback({
          type: 'error',
          message:
            'Nenhuma conta encontrada com este email no Lumê. A profissional precisa ter uma conta criada.',
        })
      }
    } catch (err: unknown) {
      setEmailFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao buscar email.',
      })
    } finally {
      setIsSearchingEmail(false)
    }
  }

  // Enviar convite por email
  const handleSendEmailInvite = async () => {
    if (!emailInput) return
    setIsSendingEmail(true)
    setEmailFeedback(null)

    try {
      const res = await enviarConviteEmail(emailInput)
      setEmailFeedback({
        type: 'success',
        message: `Convite enviado com sucesso para ${res.nomeProfissional}! Ela verá o convite no painel dela.`,
      })
      setEmailInput('')
      setFoundProf(null)
      router.refresh()
    } catch (err: unknown) {
      setEmailFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao enviar convite.',
      })
    } finally {
      setIsSendingEmail(false)
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

  // Salvar edição do studio
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
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        fotos_espaco: fotosEspaco,
      })
      setSaveSuccess(true)
      setShowStudioSlugModal(false)
      setTimeout(() => setSaveSuccess(false), 4000)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* 1. Header do Studio */}
      <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-xs">
        {estudio.foto_capa_url ? (
          <div className="relative h-44 sm:h-60 w-full">
            <Image src={estudio.foto_capa_url} alt={estudio.nome} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
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
                <span>Ver vitrine</span>
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
              <span>Ver vitrine</span>
            </Link>
          </div>
        )}
      </div>

      {/* 2. Abas de Navegação (Igualmente distribuídas preenchendo o espaço, idêntico a /perfil) */}
      <div className="grid grid-cols-3 border-b border-gray-200/80 pb-px w-full">
        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'studio'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Building2 className={`h-4 w-4 shrink-0 ${activeTab === 'studio' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="truncate">Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipe')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'equipe'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users className={`h-4 w-4 shrink-0 ${activeTab === 'equipe' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="truncate">Equipe</span>
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 shrink-0">
            {membros.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vitrine')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'vitrine'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Store className={`h-4 w-4 shrink-0 ${activeTab === 'vitrine' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="truncate">Vitrine</span>
        </button>
      </div>

      {/* ABA 1: STUDIO */}
      {activeTab === 'studio' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card Participação nos atendimentos (Simplificado com Toggle Único) */}
          <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-purple-50/40 border border-purple-100/80">
              <div className="space-y-1">
                <span className="text-sm font-bold text-[#4A3F5C]">
                  Atendimento de Clientes no Studio
                </span>
                <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                  {isAtendendo
                    ? 'Você está disponível na equipe e visível para receber agendamentos na vitrine pública do studio.'
                    : 'Você está atuando apenas na administração do studio e da equipe, sem receber agendamentos na vitrine.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAtendendo}
                    disabled={isTogglingAtivo}
                    onClick={handleToggleAtendimentoDona}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      isAtendendo ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                    title={isAtendendo ? 'Clique para pausar seus atendimentos no studio' : 'Clique para ativar seus atendimentos no studio'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isAtendendo ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-[#4A3F5C] min-w-[145px]">
                    {isTogglingAtivo ? 'Atualizando...' : isAtendendo ? 'Atendendo no Studio' : 'Apenas Administrando'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados Principais do Studio */}
          <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#4A3F5C] border border-[#B8A9D9]/30">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#4A3F5C]">Informações do Studio</h2>
                <p className="text-xs text-gray-500">
                  Personalize o nome, link e apresentação do seu studio
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">
                    Nome do Studio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Maison Lumière Concept"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C] outline-hidden text-sm font-semibold text-[#4A3F5C]"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">
                    Link do Studio (slug) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-500 focus-within:border-[#4A3F5C] focus-within:ring-1 focus-within:ring-[#4A3F5C] focus-within:bg-white">
                    <span className="shrink-0 font-medium">/studio/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full bg-transparent px-1 outline-hidden font-bold text-gray-900 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Biografia / Apresentação do Studio
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Descreva o conceito do espaço, especialidades da equipe ou diferenciais..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-hidden resize-none leading-relaxed font-medium"
                />
              </div>

              {/* Rodapé com botão Salvar */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 animate-in fade-in">
                    <Check className="h-4 w-4" />
                    <span>Informações do Studio salvas com sucesso!</span>
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA 2: EQUIPE */}
      {activeTab === 'equipe' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Membros do Studio */}
          <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#4A3F5C] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#B8A9D9]" />
                  <span>Equipe do Studio</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {membros.length} {membros.length === 1 ? 'profissional' : 'profissionais'} fazendo
                  parte deste espaço
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {membros.map((membro) => (
                <div
                  key={membro.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-gray-100 border border-purple-200">
                      {membro.foto_url ? (
                        <Image src={membro.foto_url} alt={membro.nome} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-purple-700">
                          {membro.nome.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-gray-900">{membro.nome}</h3>
                        {membro.isOwner ? (
                          <span title="Dona / Administradora do Studio" className="inline-flex items-center text-amber-500">
                            <Crown className="h-4 w-4 fill-amber-400/25" />
                          </span>
                        ) : (
                          <span title="Membro da Equipe" className="inline-flex items-center text-gray-400">
                            <User className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      {(() => {
                        const categorias = parseCategorias(membro.categoria)
                        return (
                          <p className="text-xs text-gray-500">
                            {categorias.length > 0
                              ? categorias.map((c) => getCategoryLabel(c, true)).join(' • ')
                              : 'Profissional de beleza'}
                          </p>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        membro.ativo_no_estudio
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          membro.ativo_no_estudio ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                      <span>{membro.ativo_no_estudio ? 'Atendendo' : 'Oculta'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setMemberToRemove({
                          id: membro.id,
                          nome: membro.nome,
                          isOwner: membro.isOwner,
                        })
                      }
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        membro.isOwner
                          ? 'text-gray-400 hover:text-amber-700 hover:bg-amber-50'
                          : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={
                        membro.isOwner
                          ? 'Deixar de atender neste studio (Apenas administrar)'
                          : 'Remover membro do studio'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Convidar Profissionais (Link + Email) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lado A: Convite por Link */}
            <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Convite por Link</h3>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingLink}
                    onClick={handleGenerateLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingLink ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    <span>Gerar Link</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Gere um link temporário seguro. Qualquer profissional que clicar poderá aceitar e se
                  juntar ao studio. O link expira automaticamente em 7 dias.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Links Ativos ({convites.filter((c) => c.tipo === 'link').length})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {convites.filter((c) => c.tipo === 'link').length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      Nenhum link ativo. Clique em &quot;Gerar Link&quot; acima.
                    </p>
                  ) : (
                    convites
                      .filter((c) => c.tipo === 'link')
                      .map((convite) => (
                        <div
                          key={convite.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs"
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate font-mono text-gray-600">
                              .../{convite.codigo}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(convite.codigo || '', convite.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-[11px] font-bold text-gray-700 transition cursor-pointer"
                            >
                              {copiedId === convite.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 text-gray-500" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancelInvite(convite.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Cancelar convite"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Lado B: Convite por Email */}
            <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Convidar por Email</h3>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Digite o email de uma profissional cadastrada no Lumê. Ela receberá um aviso de convite
                  diretamente no painel dela.
                </p>

                <form onSubmit={handleSearchEmail} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value)
                      setEmailFeedback(null)
                      setFoundProf(null)
                    }}
                    placeholder="email@profissional.com"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C] outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingEmail || !emailInput}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isSearchingEmail ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    <span>Buscar</span>
                  </button>
                </form>

                {emailFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      emailFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : emailFeedback.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-purple-50 text-purple-800 border border-purple-200'
                    }`}
                  >
                    {emailFeedback.message}
                  </div>
                )}

                {foundProf && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-white border border-purple-200 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-xs overflow-hidden">
                        {foundProf.foto_url ? (
                          <Image
                            src={foundProf.foto_url}
                            alt={foundProf.nome}
                            width={36}
                            height={36}
                            className="object-cover"
                          />
                        ) : (
                          foundProf.nome.charAt(0)
                        )}
                      </div>
                      <div>
                        <strong className="text-xs text-gray-900 block">{foundProf.nome}</strong>
                        <span className="text-[10px] text-gray-500">{foundProf.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleSendEmailInvite}
                      className="px-3 py-1.5 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                    >
                      {isSendingEmail && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>Enviar Convite</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Convites Pendentes ({convites.filter((c) => c.tipo === 'email').length})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {convites.filter((c) => c.tipo === 'email').length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">Nenhum convite por email pendente.</p>
                  ) : (
                    convites
                      .filter((c) => c.tipo === 'email')
                      .map((convite) => (
                        <div
                          key={convite.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs"
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate text-gray-700 font-medium">
                              {convite.email_convidado}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                              Pendente
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCancelInvite(convite.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Cancelar convite"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: VITRINE */}
      {activeTab === 'vitrine' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Store className="h-6 w-6 text-[#4A3F5C] shrink-0" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#4A3F5C]">Vitrine do Studio</h2>
                  <p className="text-xs text-gray-500">
                    Capa, paleta de cores e fotos do ambiente do seu espaço
                  </p>
                </div>
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

            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* Foto de Capa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 block">Foto de Capa do Studio</label>
                  <span className="text-[11px] text-gray-400">Recomendado: 1200x400 (paisagem)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {fotoCapaUrl ? (
                    <div className="relative h-28 w-full sm:w-60 rounded-2xl overflow-hidden border border-gray-200 shadow-2xs">
                      <Image src={fotoCapaUrl} alt="Capa" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 w-full sm:w-60 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs">
                      <Camera className="h-6 w-6 mb-1 text-gray-300" />
                      <span>Sem foto de capa</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition cursor-pointer">
                      {isUploadingEdit ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{fotoCapaUrl ? 'Alterar Imagem' : 'Enviar Imagem'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingEdit}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setIsUploadingEdit(true)
                          try {
                            const supabase = createClient()
                            const ext = file.name.split('.').pop()
                            const fileName = `estudio-capa-${Date.now()}.${ext}`
                            await supabase.storage
                              .from('avatars')
                              .upload(fileName, file, { upsert: true })
                            const { data } = supabase.storage
                              .from('avatars')
                              .getPublicUrl(fileName)
                            setFotoCapaUrl(data.publicUrl)
                          } finally {
                            setIsUploadingEdit(false)
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {fotoCapaUrl && (
                      <button
                        type="button"
                        onClick={() => setFotoCapaUrl('')}
                        className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Remover capa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Identidade Visual & Cores */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#B8A9D9]" />
                  <span>Identidade Visual do Studio</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Cor Primária */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#4A3F5C]">
                      Cor Primária de Destaque
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={corPrimaria}
                        onChange={(e) => setCorPrimaria(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 p-1"
                      />
                      <input
                        type="text"
                        value={corPrimaria}
                        onChange={(e) => setCorPrimaria(e.target.value)}
                        className="w-28 rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-mono text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-hidden font-bold"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {['#B8A9D9', '#E8C5C8', '#4A3F5C', '#D4B89B', '#A8D5C5', '#E2BDAB'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCorPrimaria(hex)}
                          className={`h-6 w-6 rounded-full border transition-transform cursor-pointer ${
                            corPrimaria.toLowerCase() === hex.toLowerCase()
                              ? 'scale-110 ring-2 ring-[#4A3F5C]'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Cor Secundária */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#4A3F5C]">
                      Cor Secundária (Fundo)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={corSecundaria}
                        onChange={(e) => setCorSecundaria(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 p-1"
                      />
                      <input
                        type="text"
                        value={corSecundaria}
                        onChange={(e) => setCorSecundaria(e.target.value)}
                        className="w-28 rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-mono text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-hidden font-bold"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {['#FAF7F5', '#FFFFFF', '#F5F3FF', '#FFFBEB', '#F0FDF4', '#FDF2F8'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCorSecundaria(hex)}
                          className={`h-6 w-6 rounded-full border transition-transform cursor-pointer ${
                            corSecundaria.toLowerCase() === hex.toLowerCase()
                              ? 'scale-110 ring-2 ring-[#4A3F5C]'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prévia da Vitrine do Studio em Tempo Real */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 block">Prévia da Vitrine do Studio</label>
                    <span className="text-[11px] text-gray-400 font-medium">Atualização em tempo real</span>
                  </div>

                  <div
                    className="p-5 sm:p-6 rounded-3xl border transition-all duration-300 space-y-4 shadow-sm"
                    style={{
                      backgroundColor: corSecundaria || '#FAF7F5',
                      borderColor: corPrimaria || '#B8A9D9',
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-black/5 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: corPrimaria || '#B8A9D9' }}
                        >
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-[#4A3F5C] block">
                            {nome || 'Nome do Studio'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {slug ? `/studio/${slug}` : '/studio/seu-studio'}
                          </span>
                        </div>
                      </div>

                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs"
                        style={{
                          backgroundColor: corPrimaria,
                          color: getContrastingTextColor(corPrimaria),
                        }}
                      >
                        Studio
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2">
                      {bio || 'Conheça nosso espaço e agende com uma de nossas profissionais parceiras.'}
                    </p>

                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Equipe de Atendimento:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="bg-white/90 p-3 rounded-xl border border-gray-200/70 flex items-center gap-3 shadow-2xs">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              backgroundColor: getLightTint(corPrimaria, 25),
                              color: corPrimaria,
                            }}
                          >
                            <Crown className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#4A3F5C] truncate">Dona do Studio</p>
                            <p className="text-[10px] text-gray-500 truncate">Administradora</p>
                          </div>
                        </div>

                        <div className="bg-white/90 p-3 rounded-xl border border-gray-200/70 flex items-center gap-3 shadow-2xs">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-gray-500 bg-gray-100"
                          >
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#4A3F5C] truncate">Profissional Parceira</p>
                            <p className="text-[10px] text-gray-500 truncate">Membro da Equipe</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-center sm:justify-start">
                      <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs"
                        style={{
                          backgroundColor: corPrimaria,
                          color: getContrastingTextColor(corPrimaria),
                        }}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Qualquer profissional disponível</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nosso Espaço (Fotos do Ambiente) */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#B8A9D9]" />
                      <span>Nosso Espaço (Fotos do Ambiente)</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Adicione fotos do seu studio (recepção, macas, iluminação). Se não houver foto cadastrada, o título e seção não aparecerão na vitrine.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {fotosEspaco.length} / 6 fotos
                  </span>
                </div>

                {/* Grid de fotos atuais */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {fotosEspaco.map((foto, index) => (
                    <div
                      key={index}
                      className="relative aspect-4/3 rounded-2xl overflow-hidden border border-gray-200 group bg-gray-100 shadow-2xs"
                    >
                      <Image src={foto} alt={`Espaço ${index + 1}`} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFotoEspaco(index)}
                          className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                          title="Remover foto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Botão de upload se menos de 6 fotos */}
                  {fotosEspaco.length < 6 && (
                    <label className="relative aspect-4/3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#B8A9D9] hover:bg-purple-50/20 transition flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#4A3F5C] cursor-pointer p-2 text-center">
                      {isUploadingEspaco ? (
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-[11px] font-bold">
                        {isUploadingEspaco ? 'Enviando...' : 'Adicionar Foto'}
                      </span>
                      <span className="text-[9px] text-gray-400">Até 6 fotos</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingEspaco}
                        onChange={handleUploadFotoEspaco}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Rodapé com botão Salvar */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 animate-in fade-in">
                    <Check className="h-4 w-4" />
                    <span>Informações da vitrine salvas com sucesso!</span>
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Salvar Alterações da Vitrine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Remoção de Membro ou Desvinculação da Dona */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-gray-200 shadow-2xl">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                memberToRemove.isOwner
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              {memberToRemove.isOwner
                ? 'Deixar a equipe de atendimento do studio?'
                : `Desvincular ${memberToRemove.nome} do studio?`}
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              {memberToRemove.isOwner
                ? 'Você continuará sendo a proprietária e administradora deste studio com controle total da gestão, equipe, convites e configurações. Seu perfil apenas deixará de aparecer na vitrine pública e você não receberá agendamentos através do studio. Você pode voltar a fazer parte da equipe a qualquer momento.'
                : 'Esta ação apenas desvincula a profissional do seu studio. A conta, dados, histórico de agendamentos e clientes dela permanecem 100% seguros e independentes.'}
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
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer ${
                  memberToRemove.isOwner
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isRemovingMember && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {memberToRemove.isOwner
                    ? 'Sim, deixar de atender'
                    : 'Sim, desvincular'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação ao Trocar Slug do Studio */}
      {showStudioSlugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 relative border border-gray-100">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-[#4A3F5C]">
                Confirmar alteração de link do Studio?
              </h3>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              O link atual do seu studio é <strong className="font-bold text-[#4A3F5C]">/studio/{estudio.slug}</strong>.
            </p>

            <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-xs font-medium text-amber-900 space-y-2">
              <p>
                <strong>Tem certeza que deseja mudar? Isso só é possível a cada 30 dias.</strong>
              </p>
              <p>
                Ao confirmar a alteração para <strong className="font-bold text-purple-900">/studio/{slug}</strong>, o link anterior deixará de funcionar imediatamente para todas as profissionais da equipe.
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStudioSlugModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => handleSaveEdit(undefined, true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#4A3F5C] hover:bg-purple-900 transition shadow-md cursor-pointer"
              >
                {isSavingEdit ? 'Salvando...' : 'Confirmar e Salvar Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

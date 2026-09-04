'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  updatePerfilAction,
  checkSlugAvailabilityAction,
  ProfileFormData,
} from '@/app/actions/profile'
import { normalizeSlug } from '@/lib/utils/slug'
import { Database } from '@/lib/supabase/database.types'
import { getContrastingTextColor, getLightTint } from '@/lib/utils/contrast'
import { parseCategorias, parseModalidades } from '@/lib/utils/categories'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { validateImageMagicBytes } from '@/lib/utils/imageValidation'
import Toast from '@/components/ui/Toast'
import CustomSelect from '@/components/ui/CustomSelect'
import {
  User,
  Camera,
  ExternalLink,
  Loader2,
  AlertCircle,
  Palette,
  Calendar,
  Unlink,
  Trash2,
  AlertTriangle,
  X,
  Sparkles,
  LogOut,
  Copy,
  Building2,
  Home,
  Store,
  Check,
  Smartphone,
} from 'lucide-react'

import PaymentIcon from '@/components/common/PaymentIcon'
import ProfileTourModal from '@/components/profile/ProfileTourModal'

type ProfissionalRow = Database['public']['Tables']['profissionais']['Row']

interface ProfileFormProps {
  initialData: ProfissionalRow
  activeTab?: 'perfil' | 'vitrine'
}

const MODALIDADE_OPTIONS = [
  { id: 'studio', label: 'Studio / Sala Própria', desc: 'Atendimento em espaço comercial dedicado', icon: Building2 },
  { id: 'domicilio', label: 'Atendimento a Domicílio', desc: 'Atendimento direto na residência da cliente', icon: Home },
  { id: 'salao', label: 'Salão / Espaço Compartilhado', desc: 'Atendimento em salão parceiro', icon: Store },
]

const PRESET_COLORS = [
  '#B8A9D9', // 1. Lilás Lumê
  '#E8C5C8', // 2. Rosa Suave
  '#4A3F5C', // 3. Cinza / Roxo Escuro
  '#D4B89B', // 4. Nude Warm
  '#A8D5C5', // 5. Verde Menta
  '#E2BDAB', // 6. Dourado Rosé
]

const FORMA_PAGAMENTO_OPTIONS = [
  { id: 'pix', label: 'Pix' },
  { id: 'cartao', label: 'Cartão' },
  { id: 'dinheiro', label: 'Dinheiro' },
]

const CATEGORY_DROPDOWN_OPTIONS = [
  { id: 'cabelo', label: 'Cabeleireira / Hair Stylist' },
  { id: 'estetica', label: 'Esteticista / Cuidados com a Pele' },
  { id: 'cilios', label: 'Lash Designer' },
  { id: 'unhas', label: 'Manicure & Unhas' },
  { id: 'maquiagem', label: 'Maquiadora' },
  { id: 'sobrancelha', label: 'Micropigmentação & Sobrancelhas' },
  { id: 'outro', label: 'Outra Especialidade' },
]

function formatWhatsAppPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) {
    return `(${digits}`
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export default function ProfileForm({ initialData, activeTab = 'perfil' }: ProfileFormProps) {
  const [nome, setNome] = useState(initialData.nome || '')
  const [bio, setBio] = useState(initialData.bio || '')
  const [tagline, setTagline] = useState(initialData.tagline || '')
  const [localizacao, setLocalizacao] = useState(initialData.localizacao || '')
  const initialModalidades = parseModalidades(initialData.modalidade_atendimento)
  const [modalidadeAtendimento, setModalidadeAtendimento] = useState<string[]>(initialModalidades)
  const [whatsapp, setWhatsapp] = useState(formatWhatsAppPhone(initialData.whatsapp || ''))
  const [instagram, setInstagram] = useState(initialData.instagram || '')

  // Link / Slug Personalizado
  const [slugInput, setSlugInput] = useState(initialData.slug || '')
  const [currentSlug, setCurrentSlug] = useState(initialData.slug || '')
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean
    available: boolean
    message: string
  }>({
    checking: false,
    available: true,
    message: 'Seu link atual',
  })
  const [showSlugConfirmModal, setShowSlugConfirmModal] = useState(false)
  const slugDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Categorias de Atuação
  const initialCats = parseCategorias(initialData.categoria)
  const [categoria, setCategoria] = useState<string[]>(initialCats)
  const [newTagInput, setNewTagInput] = useState('')
  const [janelaAgendamentoDias, setJanelaAgendamentoDias] = useState<number>(
    initialData.janela_agendamento_dias || 90
  )

  const initialPayments = (initialData.formas_pagamento_aceitas || ['pix', 'dinheiro', 'cartao']).map(
    (item) => (item === 'cartao_credito' || item === 'cartao_debito' ? 'cartao' : item)
  )
  const [formasPagamentoAceitas, setFormasPagamentoAceitas] = useState<string[]>(
    Array.from(new Set(initialPayments))
  )

  const [corPrimaria, setCorPrimaria] = useState(initialData.cor_primaria || '#B8A9D9')
  const [corSecundaria, setCorSecundaria] = useState(initialData.cor_secundaria || '#FAF7F5')
  const [fotoUrl, setFotoUrl] = useState(initialData.foto_url || '')
  const [fotoCapaUrl, setFotoCapaUrl] = useState(initialData.foto_capa_url || '')

  // Defensive image error handling
  const [avatarError, setAvatarError] = useState(false)
  const [capaError, setCapaError] = useState(false)

  // Upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false)

  // Autosave Status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Refs para controle de debounce e montagem
  const isMountedRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  // Tour Guiado do Perfil
  const [isTourOpen, setIsTourOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const seenProfileTour = localStorage.getItem('lume_profile_tour_seen')

      // Abre automaticamente APENAS na primeira vez que a profissional entra no perfil (ou se passar ?tour=1 na URL)
      if (!seenProfileTour || params.get('tour') === '1') {
        setIsTourOpen(true)
      }
    }
  }, [])

  const handleCloseTour = () => {
    setIsTourOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lume_profile_tour_seen', 'true')
    }
  }

  // Função centralizada para execução do salvamento via Server Action
  const executeSave = useCallback(
    async (overrideData?: Partial<ProfileFormData>) => {
      setSaveStatus('saving')
      setErrorMsg(null)

      const payload: ProfileFormData = {
        nome: overrideData?.nome ?? nome,
        bio: overrideData?.bio !== undefined ? overrideData.bio : bio || null,
        tagline: overrideData?.tagline !== undefined ? overrideData.tagline : tagline || null,
        localizacao: overrideData?.localizacao !== undefined ? overrideData.localizacao : localizacao || null,
        modalidade_atendimento: overrideData?.modalidade_atendimento !== undefined ? overrideData.modalidade_atendimento : modalidadeAtendimento,
        whatsapp: overrideData?.whatsapp !== undefined ? overrideData.whatsapp : whatsapp || null,
        instagram: overrideData?.instagram !== undefined ? overrideData.instagram : instagram || null,
        categoria: overrideData?.categoria ?? categoria,
        formas_pagamento_aceitas: overrideData?.formas_pagamento_aceitas ?? formasPagamentoAceitas,
        cor_primaria: overrideData?.cor_primaria ?? corPrimaria,
        cor_secundaria: overrideData?.cor_secundaria ?? corSecundaria,
        foto_url: overrideData?.foto_url !== undefined ? overrideData.foto_url : fotoUrl || null,
        foto_capa_url: overrideData?.foto_capa_url !== undefined ? overrideData.foto_capa_url : fotoCapaUrl || null,
        janela_agendamento_dias: overrideData?.janela_agendamento_dias ?? janelaAgendamentoDias,
        slug: overrideData?.slug !== undefined ? overrideData.slug : currentSlug || undefined,
      }

      const res = await updatePerfilAction(payload)

      if (res.success) {
        setSaveStatus('saved')
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } else {
        setSaveStatus('idle')
        setErrorMsg(res.message || 'Erro ao salvar alterações.')
      }
    },
    [nome, bio, tagline, localizacao, modalidadeAtendimento, whatsapp, instagram, categoria, formasPagamentoAceitas, corPrimaria, corSecundaria, fotoUrl, fotoCapaUrl, janelaAgendamentoDias, currentSlug]
  )

  // Autosave com debounce de 600ms para campos de texto livres
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave()
    }, 600)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [nome, bio, tagline, localizacao, whatsapp, instagram, executeSave])

  // Validação e Verificação de Disponibilidade de Slug
  const handleSlugInputChange = (val: string) => {
    const clean = normalizeSlug(val)
    setSlugInput(clean)

    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)

    if (!clean) {
      setSlugStatus({ checking: false, available: false, message: 'O link não pode ficar vazio' })
      return
    }

    if (clean === currentSlug) {
      setSlugStatus({ checking: false, available: true, message: 'Seu link atual' })
      return
    }

    if (clean.length < 3) {
      setSlugStatus({ checking: false, available: false, message: 'Mínimo de 3 caracteres' })
      return
    }

    setSlugStatus({ checking: true, available: false, message: 'Verificando disponibilidade...' })

    slugDebounceRef.current = setTimeout(async () => {
      const res = await checkSlugAvailabilityAction(clean, initialData.id)
      setSlugStatus({
        checking: false,
        available: res.available,
        message: res.available ? 'Link disponível!' : res.reason || 'Link indisponível.',
      })
    }, 500)
  }

  // Salvar novo slug após confirmação no modal
  const handleConfirmSlugChange = async () => {
    setShowSlugConfirmModal(false)
    const norm = normalizeSlug(slugInput)
    await executeSave({ slug: norm })
    setCurrentSlug(norm)
    setToast({
      show: true,
      message: 'Link atualizado com sucesso! Lembre-se: uma nova alteração só será permitida em 30 dias.',
      type: 'success',
    })
  }

  // Upload de Avatar
  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    const validation = await validateImageMagicBytes(file)
    if (!validation.valid) {
      setToast({ show: true, message: validation.error || 'Arquivo de imagem inválido.', type: 'error' })
      return
    }

    setUploadingAvatar(true)
    setAvatarError(false)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${initialData.id}/avatar_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setFotoUrl(publicData.publicUrl)
      await executeSave({ foto_url: publicData.publicUrl })
      setToast({ show: true, message: 'Foto de perfil atualizada!', type: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload da foto'
      setToast({ show: true, message, type: 'error' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Upload de Capa
  const handleCoverUpload = async (file: File) => {
    if (!file) return

    const validation = await validateImageMagicBytes(file)
    if (!validation.valid) {
      setToast({ show: true, message: validation.error || 'Arquivo de imagem inválido.', type: 'error' })
      return
    }

    setUploadingCapa(true)
    setCapaError(false)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${initialData.id}/cover_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setFotoCapaUrl(publicData.publicUrl)
      await executeSave({ foto_capa_url: publicData.publicUrl })
      setToast({ show: true, message: 'Foto de capa atualizada!', type: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload da capa'
      setToast({ show: true, message, type: 'error' })
    } finally {
      setUploadingCapa(false)
    }
  }

  // Remover Imagem de Capa
  const handleRemoveCoverPhoto = async () => {
    setFotoCapaUrl('')
    await executeSave({ foto_capa_url: null })
    setToast({ show: true, message: 'Capa removida.', type: 'success' })
  }

  // Gerenciamento de Categorias de Atuação
  const handleSelectCategoryDropdown = (catId: string) => {
    if (!catId) return
    let updated: string[]
    if (categoria.includes(catId)) {
      if (categoria.length === 1) {
        setToast({ show: true, message: 'Mantenha pelo menos uma especialidade selecionada.', type: 'error' })
        return
      }
      updated = categoria.filter((c) => c !== catId)
    } else {
      updated = [...categoria, catId]
    }
    setCategoria(updated)
    executeSave({ categoria: updated })
  }

  const handleRemoveCategoryTag = (catKey: string) => {
    if (categoria.length <= 1) {
      setToast({ show: true, message: 'Mantenha pelo menos uma especialidade selecionada.', type: 'error' })
      return
    }
    const updated = categoria.filter((c) => c !== catKey)
    setCategoria(updated)
    executeSave({ categoria: updated })
  }

  const handleAddCategoryTag = () => {
    const cleanTag = newTagInput.trim().toLowerCase()
    if (!cleanTag) return
    if (!categoria.includes(cleanTag)) {
      const updated = [...categoria, cleanTag]
      setCategoria(updated)
      executeSave({ categoria: updated })
    }
    setNewTagInput('')
  }

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCategoryTag()
    }
  }

  // Toggle Forma de Pagamento
  const toggleFormaPagamento = (id: string) => {
    let updated: string[]
    if (formasPagamentoAceitas.includes(id)) {
      if (formasPagamentoAceitas.length === 1) {
        setToast({ show: true, message: 'Mantenha ao menos uma forma de pagamento aceita.', type: 'error' })
        return
      }
      updated = formasPagamentoAceitas.filter((item) => item !== id)
    } else {
      updated = [...formasPagamentoAceitas, id]
    }
    setFormasPagamentoAceitas(updated)
    executeSave({ formas_pagamento_aceitas: updated })
  }

  // Desconectar Google Agenda
  const handleDisconnectGoogle = async () => {
    if (!confirm('Deseja realmente desconectar sua conta do Google Agenda? Seus novos agendamentos não serão sincronizados automaticamente.')) {
      return
    }

    setDisconnectingGoogle(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profissionais')
        .update({
          google_calendar_token: null,
          google_refresh_token: null,
        } as any)
        .eq('id', initialData.id)

      if (error) throw error

      setToast({ show: true, message: 'Google Agenda desconectado com sucesso.', type: 'success' })
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao desconectar Google Agenda'
      setToast({ show: true, message, type: 'error' })
    } finally {
      setDisconnectingGoogle(false)
    }
  }

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lume.com'
  const publicUrlStr = `${originUrl}/p/${currentSlug}`

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#4A3F5C]">
            {activeTab === 'perfil' ? 'Meu Perfil' : 'Minha Vitrine Pública'}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {activeTab === 'perfil'
              ? 'Gerencie seus dados pessoais, bio, contatos, modalidades e integrações'
              : 'Personalize seu link, banner de capa, cores da marca, especialidades e pagamentos'}
          </p>
        </div>

        {/* Status do Autosave */}
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
              <span>Salvando...</span>
            </>
          ) : (
            <span className="text-[11px] text-gray-400">Salvo automaticamente</span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Conteúdo da Aba 1: PERFIL */}
      {activeTab === 'perfil' && (
        <div className="space-y-6">
          {/* Card: Foto de Perfil & Dados Principais */}
          <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-5">
            <div id="profile-tour-avatar" className="flex items-center gap-4">
              {/* Foto de Perfil Avatar */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full overflow-hidden border-4 border-[#B8A9D9] bg-purple-50 shadow-md">
                {fotoUrl && !avatarError ? (
                  <Image
                    src={fotoUrl}
                    alt={nome || 'Avatar'}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#B8A9D9]">
                    <User className="h-10 w-10" />
                  </div>
                )}

                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 transition cursor-pointer">
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      <span className="text-[9px] font-bold mt-1">Alterar</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleAvatarUpload(file)
                    }}
                  />
                </label>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#4A3F5C]">{nome || 'Seu Nome no Lumê'}</h3>
                <p className="text-xs text-gray-500 font-medium">Foto de perfil exibida para suas clientes</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Tamanho recomendado: mínimo 400x400px (quadrada). JPG, PNG ou WebP até 5MB.
                </p>
              </div>
            </div>

            <div id="profile-tour-basic-info" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                  Nome Completo ou Nome Profissional *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none font-semibold"
                  placeholder="Ex: Dra. Ana Costa"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                  Frase de Destaque / Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none font-medium"
                  placeholder="Ex: Especialista em micropigmentação e sobrancelhas"
                />
              </div>
            </div>

            {/* Biografia / Apresentação */}
            <div>
              <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                Biografia / Apresentação
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                placeholder="Conte um pouco sobre sua formação, experiência e diferenciais no atendimento..."
              />
            </div>
          </div>

          {/* Card: Contatos & Localização */}
          <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <h3 className="text-base font-bold text-[#4A3F5C] border-b border-gray-100 pb-3 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[#B8A9D9]" />
              <span>Contatos & Localização</span>
            </h3>

            <div id="profile-tour-contacts" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                  WhatsApp de Atendimento *
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsAppPhone(e.target.value))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none font-semibold"
                  placeholder="(11) 99999-9999"
                />
                <p className="text-[10px] text-gray-400 mt-1">Formatação automática enquanto você digita</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                  Instagram (@)
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                  placeholder="@seu.perfil"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                  Localização / Cidade
                </label>
                <input
                  type="text"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                  placeholder="São Paulo, SP"
                />
              </div>
            </div>
          </div>

          {/* Modalidades de Atendimento */}
          <div id="profile-tour-modalidades" className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#4A3F5C]">Modalidades de Atendimento</h3>
                <p className="text-xs text-gray-500">Como você realiza os seus atendimentos</p>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Seleção múltipla</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODALIDADE_OPTIONS.map((mod) => {
                const isSelected = modalidadeAtendimento.includes(mod.id)
                const IconComponent = mod.icon
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      let next: string[]
                      if (modalidadeAtendimento.includes(mod.id)) {
                        if (modalidadeAtendimento.length === 1) return
                        next = modalidadeAtendimento.filter((id) => id !== mod.id)
                      } else {
                        next = [...modalidadeAtendimento, mod.id]
                      }
                      setModalidadeAtendimento(next)
                      executeSave({ modalidade_atendimento: next })
                    }}
                    className={`flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-[#B8A9D9] bg-purple-50/60 shadow-xs ring-2 ring-[#B8A9D9]/40'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl mb-1.5 transition ${
                        isSelected ? 'bg-[#4A3F5C] text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-center gap-1 w-full">
                      <span className="text-xs font-bold text-[#4A3F5C]">{mod.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#8675A9]" />}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{mod.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Integração com Google Agenda */}
          <div id="profile-tour-google" className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <h3 className="text-base font-bold text-[#4A3F5C] border-b border-gray-100 pb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#B8A9D9]" />
              <span>Sincronização com Google Agenda</span>
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Conecte sua conta do Google para sincronizar automaticamente seus agendamentos do Lumê com a sua agenda pessoal e evitar conflitos.
            </p>

            {initialData.google_calendar_token ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">Google Agenda Conectado!</h4>
                    <p className="text-[11px] text-emerald-700">
                      Seus novos agendamentos serão adicionados automaticamente à sua agenda.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  disabled={disconnectingGoogle}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  <span>{disconnectingGoogle ? 'Desconectando...' : 'Desconectar'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl bg-purple-50/50 p-4 border border-purple-100 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[#4A3F5C]">Nenhuma conta conectada</h4>
                  <p className="text-[11px] text-gray-500">
                    Clique no botão ao lado para autorizar o acesso à sua agenda do Google.
                  </p>
                </div>

                <a
                  href="/api/auth/google/connect"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#4A3F5C] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-900 transition shrink-0"
                >
                  <Calendar className="h-4 w-4 text-[#B8A9D9]" />
                  <span>Conectar Google Agenda</span>
                </a>
              </div>
            )}
          </div>

          {/* Card: Instalar Aplicativo Lumê no Celular */}
          <div id="profile-tour-app" className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3D2E4D]">
                    Aplicativo Lumê no Celular
                  </h3>
                  <p className="text-[11px] text-[#6B5E7A]">
                    Acesse sua agenda e clientes com 1 toque no seu iPhone ou Android
                  </p>
                </div>
              </div>
              <a
                href="/instalar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8C5383] hover:bg-[#784370] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition shrink-0 cursor-pointer"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Ver como Baixar / Instalar</span>
              </a>
            </div>

            <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
              O Lumê pode ser adicionado à tela inicial do seu celular sem ocupar memória de armazenamento. Assim você consulta seus horários, recebe agendamentos e atende suas clientes com a velocidade de um app nativo.
            </p>
          </div>

          {/* Rodapé: Tutorial, Tour e Sair da Conta (Modo Escuro REMOVIDO) */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-200/80">
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-purple-50 text-purple-900 border border-purple-200/80 text-xs font-bold hover:bg-purple-100 transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>Tutorial do perfil</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const { resetOnboardingAction } = await import('@/app/actions/onboarding')
                await resetOnboardingAction()
                window.location.href = '/dashboard/geral'
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gray-50 text-gray-700 border border-gray-200/80 text-xs font-bold hover:bg-gray-100 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-gray-500" />
              <span>Tour geral da plataforma</span>
            </button>

            <form action="/api/auth/signout" method="POST" className="w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold hover:bg-rose-100 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair da conta</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: VITRINE */}
      {activeTab === 'vitrine' && (
        <div className="space-y-6">
          {/* Link / URL Pública */}
          <div id="profile-tour-slug" className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-3">
            <div>
              <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                Link da sua página (URL pública) *
              </label>
              <p className="text-xs text-gray-500 font-medium">
                Endereço exclusivo onde suas clientes acessam sua vitrine e agendam horários
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  /p/
                </span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => handleSlugInputChange(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-xs font-bold text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                />
              </div>

              {slugInput !== currentSlug && slugStatus.available && (
                <button
                  type="button"
                  onClick={() => setShowSlugConfirmModal(true)}
                  className="px-4 py-3 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-purple-900 transition shrink-0 cursor-pointer shadow-2xs"
                >
                  Salvar Link
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${currentSlug}` : `https://lume.com/p/${currentSlug}`
                  const success = await copyToClipboard(fullUrl)
                  if (success) {
                    setToast({ show: true, message: 'Link copiado com sucesso!', type: 'success' })
                  } else {
                    setToast({ show: true, message: 'Não foi possível copiar o link.', type: 'error' })
                  }
                }}
                className="p-3 rounded-2xl border border-gray-200 bg-white text-[#4A3F5C] hover:bg-gray-50 transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                title="Copiar link público da página"
              >
                <Copy className="h-4 w-4 text-[#B8A9D9]" />
                <span className="hidden sm:inline">Copiar</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">{slugStatus.message}</p>
          </div>

          {/* Foto de Capa (Banner da Vitrine) */}
          <div id="profile-tour-cover" className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                Foto de Capa do Studio (Banner Superior)
              </label>
              <p className="text-xs text-gray-500 font-medium">
                Banner de destaque exibido no topo da sua vitrine pública
              </p>
            </div>

            <div className="relative w-full aspect-[16/9] sm:aspect-[3/1] rounded-2xl overflow-hidden bg-gray-900 border border-gray-200 shadow-inner">
              {fotoCapaUrl && !capaError ? (
                <>
                  <Image
                    src={fotoCapaUrl}
                    alt="Capa do studio"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setCapaError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                </>
              ) : (
                <div className="flex flex-col h-full w-full items-center justify-center bg-gradient-to-tr from-[#4A3F5C] to-[#8675A9] text-white text-center p-4 space-y-1">
                  <p className="text-xs font-bold opacity-90">Nenhuma imagem de capa cadastrada</p>
                  <p className="text-[11px] opacity-80 font-medium max-w-sm">
                    JPG, PNG ou WebP até 5MB. Tamanho recomendado: mínimo 1200x400px (proporção 3:1).
                  </p>
                </div>
              )}

              {/* Ações da Capa */}
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 text-xs font-bold text-[#4A3F5C] shadow-md hover:bg-white transition backdrop-blur-xs">
                  {uploadingCapa ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5 text-[#B8A9D9]" />}
                  <span>{fotoCapaUrl ? 'Trocar Capa' : 'Adicionar Capa'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleCoverUpload(file)
                    }}
                  />
                </label>

                {fotoCapaUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCoverPhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600/90 text-white text-xs font-bold shadow-md hover:bg-red-700 transition backdrop-blur-xs cursor-pointer"
                    title="Remover capa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            {!fotoCapaUrl && (
              <p className="text-[11px] text-gray-500 font-medium">
                Tamanho recomendado: mínimo 1200x400px (proporção 3:1). Formatos JPG, PNG ou WebP até 5MB.
              </p>
            )}
          </div>

          {/* Identidade Visual & Cores Personalizadas */}
          <div id="profile-tour-colors" className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-6">
            <h3 className="text-base font-bold text-[#4A3F5C] border-b border-gray-100 pb-3 flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#B8A9D9]" />
              <span>Identidade Visual da Página Pública</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Esquerda: Cor Primária */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#4A3F5C]">
                  Cor Primária de Destaque
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corPrimaria}
                    onChange={(e) => {
                      setCorPrimaria(e.target.value)
                      executeSave({ cor_primaria: e.target.value })
                    }}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 p-1"
                  />
                  <input
                    type="text"
                    value={corPrimaria}
                    onChange={(e) => {
                      setCorPrimaria(e.target.value)
                      executeSave({ cor_primaria: e.target.value })
                    }}
                    className="w-28 rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-mono text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none font-bold"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {PRESET_COLORS.map((hex) => {
                    const isSelected = corPrimaria.toLowerCase() === hex.toLowerCase()
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          setCorPrimaria(hex)
                          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
                          executeSave({ cor_primaria: hex })
                        }}
                        className={`h-7 w-7 rounded-full border border-black/10 transition transform cursor-pointer hover:scale-110 ${
                          isSelected
                            ? 'ring-2 ring-[#4A3F5C] ring-offset-2 scale-110 shadow-xs'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Direita: Cor Secundária */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#4A3F5C]">
                  Cor Secundária de Fundo
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corSecundaria}
                    onChange={(e) => {
                      setCorSecundaria(e.target.value)
                      executeSave({ cor_secundaria: e.target.value })
                    }}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 p-1"
                  />
                  <input
                    type="text"
                    value={corSecundaria}
                    onChange={(e) => {
                      setCorSecundaria(e.target.value)
                      executeSave({ cor_secundaria: e.target.value })
                    }}
                    className="w-28 rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-mono text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none font-bold"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {PRESET_COLORS.map((hex) => {
                    const isSelected = corSecundaria.toLowerCase() === hex.toLowerCase()
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          setCorSecundaria(hex)
                          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
                          executeSave({ cor_secundaria: hex })
                        }}
                        className={`h-7 w-7 rounded-full border border-black/10 transition transform cursor-pointer hover:scale-110 ${
                          isSelected
                            ? 'ring-2 ring-[#4A3F5C] ring-offset-2 scale-110 shadow-xs'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Prévia Vitrine Pública */}
            <div id="profile-tour-preview" className="pt-4 border-t border-gray-100 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#B8A9D9]" />
                <span>Prévia da Sua Vitrine Pública com estas Cores</span>
              </label>
              <div
                className="rounded-2xl p-5 border transition-all duration-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{
                  backgroundColor: corSecundaria,
                  borderColor: getLightTint(corPrimaria, 40),
                }}
              >
                <div className="space-y-1 text-center sm:text-left">
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider block"
                    style={{ color: corPrimaria }}
                  >
                    Exemplo de Serviço
                  </span>
                  <h4 className="text-sm font-bold text-gray-800">
                    Volume Russo Complete
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    120 min • R$ 180,00
                  </p>
                </div>

                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-default"
                  style={{
                    backgroundColor: corPrimaria,
                    color: getContrastingTextColor(corPrimaria),
                  }}
                >
                  Agendar Horário
                </button>
              </div>
            </div>
          </div>

          {/* Categorias & Regras de Atendimento */}
          <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-5">
            {/* Categorias de Atuação */}
            <div id="profile-tour-categories" className="space-y-3">
              <label className="block text-sm font-bold text-[#4A3F5C]">
                Categorias de Atuação (Seleção Múltipla) *
              </label>

              <CustomSelect
                options={CATEGORY_DROPDOWN_OPTIONS.map((opt) => ({
                  value: opt.id,
                  label: categoria.includes(opt.id) ? `✓ ${opt.label}` : opt.label,
                }))}
                value=""
                onChange={(val) => handleSelectCategoryDropdown(val)}
                placeholder="+ Selecionar Categoria..."
                buttonClassName="font-bold"
              />

              {categoria.includes('outro') && (
                <div className="space-y-2 pt-2 bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                  <label className="block text-xs font-bold text-[#4A3F5C]">
                    Adicionar Tag Personalizada (Outra Especialidade)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleCategoryKeyDown}
                      placeholder="Digite sua especialidade e pressione Enter..."
                      className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategoryTag}
                      className="px-3.5 py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-purple-900 transition shrink-0 cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              {categoria.length > 0 && (
                <div className="bg-[#FAF7F5] p-4 rounded-2xl border border-[#B8A9D9]/40 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A3F5C] border-b border-[#B8A9D9]/20 pb-2">
                    Categorias Selecionadas
                  </h4>
                  <div className="space-y-1.5 pl-0.5">
                    {categoria.map((catKey) => {
                      const label = CATEGORY_DROPDOWN_OPTIONS.find((opt) => opt.id === catKey)?.label || catKey
                      return (
                        <div key={catKey} className="flex items-center justify-between text-xs font-bold text-[#4A3F5C]">
                          <span>{label}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategoryTag(catKey)}
                            className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
                            title="Remover esta categoria"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Formas de Pagamento Aceitas */}
            <div id="profile-tour-payments" className="space-y-2 pt-2 border-t border-gray-100">
              <label className="block text-sm font-bold text-[#4A3F5C] mb-1">
                Formas de Pagamento Aceitas no Atendimento *
              </label>
              <div className="flex flex-wrap gap-2">
                {FORMA_PAGAMENTO_OPTIONS.map((opt) => {
                  const isSelected = formasPagamentoAceitas.includes(opt.id)

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleFormaPagamento(opt.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                        isSelected
                          ? 'shadow-2xs border-transparent font-bold'
                          : 'border-gray-200 bg-gray-50/60 text-gray-600 hover:bg-gray-100/80 hover:border-gray-300'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: corPrimaria,
                              color: getContrastingTextColor(corPrimaria),
                            }
                          : {}
                      }
                    >
                      <PaymentIcon method={opt.id} className="h-3.5 w-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Janela de Agendamento Futuro */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="block text-sm font-bold text-[#4A3F5C]">
                Janela de Agendamento Futuro
              </label>
              <CustomSelect
                options={[
                  { value: '15', label: '15 dias no futuro' },
                  { value: '30', label: '30 dias no futuro (1 mês)' },
                  { value: '60', label: '60 dias no futuro (2 meses)' },
                  { value: '90', label: '90 dias no futuro (3 meses)' },
                ]}
                value={String(janelaAgendamentoDias)}
                onChange={(val) => {
                  const num = Number(val)
                  setJanelaAgendamentoDias(num)
                  executeSave({ janela_agendamento_dias: num })
                }}
                buttonClassName="font-semibold"
              />
            </div>
          </div>

          {/* Link Público Final */}
          <div
            className="rounded-3xl p-5 border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
            style={{
              backgroundColor: corPrimaria,
              borderColor: getLightTint(corPrimaria, 40),
            }}
          >
            <div>
              <span
                className="text-[10px] uppercase font-bold tracking-wider block opacity-80"
                style={{ color: getContrastingTextColor(corPrimaria) }}
              >
                Sua Página Pública de Agendamento
              </span>
              <p
                className="text-xs font-extrabold mt-0.5 truncate max-w-sm"
                style={{ color: getContrastingTextColor(corPrimaria) }}
              >
                {publicUrlStr}
              </p>
            </div>

            <a
              href={`/p/${currentSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-xs font-bold text-[#4A3F5C] shadow-2xs border border-gray-200 hover:bg-gray-50 transition cursor-pointer shrink-0"
            >
              <span>Ver Sua Vitrine Pública</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#B8A9D9]" />
            </a>
          </div>
        </div>
      )}

      {/* Modal do Tour Guiado do Perfil */}
      <ProfileTourModal
        isOpen={isTourOpen}
        onClose={handleCloseTour}
      />

      {/* Modal de Confirmação ao Trocar Slug */}
      {showSlugConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 relative border border-gray-100">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-[#4A3F5C]">
                Confirmar alteração de link?
              </h3>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              Seu link atual é <strong className="font-bold text-[#4A3F5C]">/p/{currentSlug}</strong>.
            </p>

            <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-xs font-medium text-amber-900 space-y-2">
              <p>
                <strong>Atenção:</strong> Ao confirmar a alteração para <strong className="font-bold text-purple-900">/p/{slugInput}</strong>, o seu link atual deixará de funcionar imediatamente.
              </p>
              <p>
                Além disso, você só poderá alterar o seu link novamente após <strong>30 dias</strong>.
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSlugConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSlugChange}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#4A3F5C] hover:bg-purple-900 transition shadow-md cursor-pointer"
              >
                Confirmar e Salvar Link
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

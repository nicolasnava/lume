'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { signUpAction } from '@/app/actions/auth'
import { checkPublicSlugAvailabilityAction } from '@/app/actions/profile'
import { getPasswordStrength } from '@/lib/validations/passwordStrength'
import { normalizeSlug } from '@/lib/utils/slug'
import { getContrastingTextColor, getLightTint } from '@/lib/utils/contrast'
import { getCategoryLabel } from '@/lib/utils/categories'
import Toast from '@/components/ui/Toast'
import PaymentIcon from '@/components/common/PaymentIcon'
import CustomSelect from '@/components/ui/CustomSelect'
import { TIME_OPTIONS_15MIN } from '@/lib/utils/timeOptions'
import {
  Lock,
  Mail,
  User,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  MapPin,
  Palette,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Home,
  Store,
  ShieldCheck,
  CheckCircle2,
  Scissors,
  Smile,
  Heart,
  Plus,
  X,
  ExternalLink,
  MailCheck,
} from 'lucide-react'

// Cores Oficiais da Identidade Lumê
const PRESET_COLORS = [
  '#B8A9D9', // 1. Lilás Lumê
  '#E8C5C8', // 2. Rosa Suave
  '#4A3F5C', // 3. Cinza / Roxo Nobre
  '#D4B89B', // 4. Nude Warm
  '#A8D5C5', // 5. Verde Menta
  '#E2BDAB', // 6. Dourado Rosé
]

// Lista Rica de Especialidades com Ícones e Descrições
const CATEGORY_ITEMS = [
  { id: 'cilios', label: 'Lash Designer', desc: 'Extensão de cílios e lifting', icon: Eye },
  { id: 'unhas', label: 'Manicure & Unhas', desc: 'Alongamento em gel, fibra e esmaltação', icon: Sparkles },
  { id: 'sobrancelha', label: 'Sobrancelhas & Micro', desc: 'Design, henna e micropigmentação', icon: Smile },
  { id: 'cabelo', label: 'Hair Stylist', desc: 'Cortes, coloração e tratamentos', icon: Scissors },
  { id: 'maquiagem', label: 'Maquiadora', desc: 'Maquiagem social, eventos e noivas', icon: Sparkles },
  { id: 'estetica', label: 'Esteticista / Pele', desc: 'Limpeza de pele, massagens e corpo', icon: Heart },
  { id: 'outro', label: 'Outra Especialidade', desc: 'Adicionar especialidade personalizada', icon: Plus },
]

// Modalidades de Atendimento
const MODALIDADES = [
  { id: 'studio', label: 'Studio / Sala Própria', desc: 'Atendimento em espaço comercial dedicado', icon: Building2 },
  { id: 'domicilio', label: 'Atendimento a Domicílio', desc: 'Atendimento direto na residência da cliente', icon: Home },
  { id: 'salao', label: 'Salão / Espaço Compartilhado', desc: 'Atendimento em salão parceiro', icon: Store },
]

// Formas de Pagamento
const FORMAS_PAGAMENTO = [
  { id: 'pix', label: 'Pix' },
  { id: 'cartao', label: 'Cartão de Crédito / Débito' },
  { id: 'dinheiro', label: 'Dinheiro' },
]

// Dias da Semana (0 = Dom, 1 = Seg, ..., 6 = Sáb)
const DIAS_SEMANA = [
  { dia: 0, label: 'Dom' },
  { dia: 1, label: 'Seg' },
  { dia: 2, label: 'Ter' },
  { dia: 3, label: 'Qua' },
  { dia: 4, label: 'Qui' },
  { dia: 5, label: 'Sex' },
  { dia: 6, label: 'Sáb' },
]

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

function CadastroForm() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || undefined

  // Controle de Etapa (1 a 4)
  const [step, setStep] = useState(1)
  const [isCompleted, setIsCompleted] = useState(false)

  // Etapa 1: Acesso & Dados Principais
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Etapa 2: Especialidade & Contato
  const [categorias, setCategorias] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tagline, setTagline] = useState('')

  // Etapa 3: Localização & Pagamento
  const [modalidades, setModalidades] = useState<string[]>(['studio'])
  const [localizacao, setLocalizacao] = useState('')
  const [formasPagamento, setFormasPagamento] = useState<string[]>(['pix', 'cartao', 'dinheiro'])

  // Etapa 4: Link Exclusivo, Visual & Horários Iniciais
  const [slug, setSlug] = useState('')
  const [isSlugManual, setIsSlugManual] = useState(false)
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean
    available: boolean
    message: string
  }>({
    checking: false,
    available: true,
    message: 'Link disponível',
  })
  const slugDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const [corPrimaria, setCorPrimaria] = useState('#B8A9D9')
  const [corSecundaria, setCorSecundaria] = useState('#FAF7F5')
  const [diasAtendimento, setDiasAtendimento] = useState<number[]>([1, 2, 3, 4, 5]) // Seg a Sex
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFim, setHoraFim] = useState('18:00')

  // Feedback & Loading
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  // Força de Senha
  const strength = getPasswordStrength(senha)

  // Auto-gerar slug a partir do nome se o usuário não tiver alterado manualmente
  useEffect(() => {
    if (!isSlugManual && nome.trim()) {
      const generated = normalizeSlug(nome)
      setSlug(generated)
      triggerSlugCheck(generated)
    }
  }, [nome, isSlugManual])

  const triggerSlugCheck = (slugCandidate: string) => {
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)

    const normalized = normalizeSlug(slugCandidate)
    if (normalized.length < 3) {
      setSlugStatus({ checking: false, available: false, message: 'Mínimo de 3 caracteres.' })
      return
    }

    setSlugStatus({ checking: true, available: false, message: 'Verificando disponibilidade...' })

    slugDebounceRef.current = setTimeout(async () => {
      try {
        const res = await checkPublicSlugAvailabilityAction(normalized)
        setSlugStatus({
          checking: false,
          available: res.available,
          message: res.available ? 'Link disponível!' : (res.reason || 'Este link já está em uso.'),
        })
      } catch {
        setSlugStatus({ checking: false, available: true, message: 'Link disponível!' })
      }
    }, 400)
  }

  const handleSlugChange = (val: string) => {
    setIsSlugManual(true)
    const norm = normalizeSlug(val)
    setSlug(norm)
    triggerSlugCheck(norm)
  }

  // Toggle de Categorias
  const toggleCategoria = (catId: string) => {
    if (catId === 'outro') {
      if (categorias.includes('outro')) {
        setCategorias(categorias.filter((c) => c !== 'outro'))
      } else {
        setCategorias([...categorias, 'outro'])
      }
      return
    }

    if (categorias.includes(catId)) {
      setCategorias(categorias.filter((c) => c !== catId))
    } else {
      setCategorias([...categorias, catId])
    }
  }

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (!trimmed) return
    if (!customTags.includes(trimmed)) {
      setCustomTags([...customTags, trimmed])
    }
    setCustomTagInput('')
  }

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag))
  }

  // Toggle de Modalidades de Atendimento
  const toggleModalidade = (modId: string) => {
    let next: string[]
    if (modalidades.includes(modId)) {
      if (modalidades.length === 1) return // manter pelo menos 1
      next = modalidades.filter((id) => id !== modId)
    } else {
      next = [...modalidades, modId]
    }
    setModalidades(next)
  }

  // Toggle de Formas de Pagamento
  const toggleFormaPagamento = (optId: string) => {
    let next: string[]
    if (formasPagamento.includes(optId)) {
      next = formasPagamento.filter((id) => id !== optId)
    } else {
      next = [...formasPagamento, optId]
    }
    if (next.length === 0) next = ['pix']
    setFormasPagamento(next)
  }

  // Toggle de Dias da Semana
  const toggleDiaSemana = (dia: number) => {
    if (diasAtendimento.includes(dia)) {
      if (diasAtendimento.length === 1) return
      setDiasAtendimento(diasAtendimento.filter((d) => d !== dia))
    } else {
      setDiasAtendimento([...diasAtendimento, dia].sort())
    }
  }

  // Validação por Etapa antes de avançar
  const handleNextStep = () => {
    setToast(null)

    if (step === 1) {
      if (!nome.trim() || nome.trim().length < 2) {
        setToast({ show: true, message: 'Informe seu nome ou o nome do seu studio (mínimo 2 caracteres).', type: 'error' })
        return
      }
      if (!email.trim() || !email.includes('@')) {
        setToast({ show: true, message: 'Informe um endereço de e-mail válido.', type: 'error' })
        return
      }
      if (senha.length < 6) {
        setToast({ show: true, message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' })
        return
      }
      if (senha !== confirmarSenha) {
        setToast({ show: true, message: 'As senhas não coincidem. Verifique a confirmação.', type: 'error' })
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      const allSelectedCategories = [...categorias, ...customTags]
      if (allSelectedCategories.length === 0) {
        setToast({ show: true, message: 'Selecione pelo menos uma especialidade do seu trabalho.', type: 'error' })
        return
      }
      const rawPhone = whatsapp.replace(/\D/g, '')
      if (rawPhone.length < 10) {
        setToast({ show: true, message: 'Informe um WhatsApp com DDD válido (ex: 11 99999-9999).', type: 'error' })
        return
      }
      setStep(3)
      return
    }

    if (step === 3) {
      if (formasPagamento.length === 0) {
        setToast({ show: true, message: 'Selecione pelo menos uma forma de pagamento aceita.', type: 'error' })
        return
      }
      setStep(4)
      return
    }
  }

  // Submissão Final do Cadastro (EXECUTADA EXCLUSIVAMENTE AO CLICAR NO BOTÃO DA ETAPA 4)
  const handleSubmitFinal = async () => {
    setToast(null)

    // Validações da etapa final
    if (slug.length < 3) {
      setToast({ show: true, message: 'O link do seu studio deve ter pelo menos 3 caracteres.', type: 'error' })
      return
    }
    if (!slugStatus.available) {
      setToast({ show: true, message: 'Este link já está em uso. Por favor, ajuste o seu link.', type: 'error' })
      return
    }
    if (horaInicio >= horaFim) {
      setToast({ show: true, message: 'O horário de início deve ser anterior ao horário de término.', type: 'error' })
      return
    }

    setLoading(true)

    // Compilar todas as categorias e tags personalizadas
    const finalCategories = Array.from(new Set([...categorias.filter((c) => c !== 'outro'), ...customTags]))
    if (finalCategories.length === 0) {
      finalCategories.push('outro')
    }

    const payload = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      categoria: finalCategories,
      whatsapp: whatsapp.replace(/\D/g, ''),
      instagram: instagram.trim() || null,
      tagline: tagline.trim() || null,
      modalidade_atendimento: modalidades,
      localizacao: localizacao.trim() || null,
      formas_pagamento_aceitas: formasPagamento,
      slug: slug.trim(),
      cor_primaria: corPrimaria,
      cor_secundaria: corSecundaria,
      dias_atendimento: diasAtendimento,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      ref: refCode,
    }

    const res = await signUpAction(payload)
    setLoading(false)

    if (!res.success) {
      setToast({
        show: true,
        message: res.message || 'Erro ao criar conta. Tente novamente.',
        type: 'error',
      })
      return
    }

    // Exibir a tela de confirmação de cadastro
    setIsCompleted(true)
  }

  // Progresso percentual
  const progressPercent = ((step - 1) / 3) * 100
  // ===========================================================================
  // TELA DE CONFIRMAÇÃO DE CADASTRO CONCLUÍDO
  // ===========================================================================
  if (isCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F5] px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-[#B8A9D9]/30 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Logo Lumê com Ícone ao lado (na frente), semelhante ao 2FA */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-[#8675A9] shadow-2xs shrink-0">
              <MailCheck className="w-5 h-5 text-[#8675A9]" />
            </div>
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={110}
              height={35}
              priority
              className="h-auto w-auto max-h-8 object-contain"
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#4A3F5C]">
              Cadastro concluído!
            </h2>
            <p className="text-sm text-[#4A3F5C]/80 leading-relaxed font-medium">
              Um e-mail de verificação foi enviado para <strong className="text-[#4A3F5C] font-bold underline decoration-[#B8A9D9] decoration-2 underline-offset-2">{email}</strong>.
            </p>
            <p className="text-xs text-gray-500 font-medium">
              Abra sua caixa de entrada e confirme o link para ativar sua conta.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B8A9D9] hover:bg-[#a695ca] px-8 py-3.5 text-xs font-bold text-[#4A3F5C] shadow-md hover:shadow-lg transition cursor-pointer w-full"
            >
              <span>Ir para o Login</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F5] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-10 shadow-xl border border-[#B8A9D9]/30 backdrop-blur-md">
        
        {/* CABEÇALHO & LOGO */}
        <div className="text-center">
          <div className="mx-auto flex justify-center mb-2">
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={140}
              height={44}
              priority
              className="h-auto w-auto max-h-12 object-contain"
            />
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#4A3F5C]">
            {step === 1 && 'Crie sua conta no Lumê'}
            {step === 2 && 'Seu Nicho & Contatos'}
            {step === 3 && 'Onde & Como Você Atende'}
            {step === 4 && 'Seu Link & Identidade Visual'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#4A3F5C]/70">
            {step === 1 && 'Configure suas credenciais de acesso seguro ao painel'}
            {step === 2 && 'Personalize as especialidades e redes que suas clientes verão'}
            {step === 3 && 'Defina seu formato de atendimento e pagamentos aceitos'}
            {step === 4 && 'Escolha as cores do seu Studio e seus horários padrão'}
          </p>
        </div>

        {/* INDICADOR DE ETAPAS (STEP PROGRESS BAR) */}
        <div className="mt-8 mb-8">
          <div className="relative flex items-center justify-between">
            {/* Linha de Fundo */}
            <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-gray-100 rounded-full" />
            {/* Linha de Progresso Preenchida */}
            <div
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-[#B8A9D9] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Passo 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => step > 1 && setStep(1)}
                disabled={step === 1}
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-xs font-bold transition-all duration-300 ${
                  step > 1
                    ? 'bg-[#B8A9D9] text-[#4A3F5C] shadow-sm hover:scale-105 cursor-pointer'
                    : step === 1
                    ? 'bg-[#4A3F5C] text-white ring-4 ring-[#B8A9D9]/30 shadow-md'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > 1 ? <Check className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </button>
              <span className="mt-1.5 text-[11px] font-bold text-[#4A3F5C] hidden sm:block">Acesso</span>
            </div>

            {/* Passo 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => step > 2 && setStep(2)}
                disabled={step <= 2}
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-xs font-bold transition-all duration-300 ${
                  step > 2
                    ? 'bg-[#B8A9D9] text-[#4A3F5C] shadow-sm hover:scale-105 cursor-pointer'
                    : step === 2
                    ? 'bg-[#4A3F5C] text-white ring-4 ring-[#B8A9D9]/30 shadow-md'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > 2 ? <Check className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </button>
              <span className="mt-1.5 text-[11px] font-bold text-[#4A3F5C] hidden sm:block">Nicho & Contato</span>
            </div>

            {/* Passo 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => step > 3 && setStep(3)}
                disabled={step <= 3}
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-xs font-bold transition-all duration-300 ${
                  step > 3
                    ? 'bg-[#B8A9D9] text-[#4A3F5C] shadow-sm hover:scale-105 cursor-pointer'
                    : step === 3
                    ? 'bg-[#4A3F5C] text-white ring-4 ring-[#B8A9D9]/30 shadow-md'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > 3 ? <Check className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              </button>
              <span className="mt-1.5 text-[11px] font-bold text-[#4A3F5C] hidden sm:block">Local & Pagamento</span>
            </div>

            {/* Passo 4 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-xs font-bold transition-all duration-300 ${
                  step === 4
                    ? 'bg-[#4A3F5C] text-white ring-4 ring-[#B8A9D9]/30 shadow-md'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Palette className="h-5 w-5" />
              </div>
              <span className="mt-1.5 text-[11px] font-bold text-[#4A3F5C] hidden sm:block">Link & Visual</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mt-2 sm:hidden px-1">
            <span>Etapa {step} de 4</span>
            <span>{Math.round(progressPercent)}% concluído</span>
          </div>
        </div>

        {/* CONTAINER DO FORMULÁRIO (SEM SUBMIT AUTOMÁTICO EM ENTER) */}
        <div
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
            }
          }}
        >
          {/* ========================================================================= */}
          {/* ETAPA 1: CONTA & ACESSO */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                >
                  Nome Completo ou Nome do Studio *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#4A3F5C]/40">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-3 text-sm font-semibold text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9D9]/30"
                    placeholder="Ex: Amanda Silva Beauty"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                >
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#4A3F5C]/40">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-3 text-sm font-semibold text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9D9]/30"
                    placeholder="seuemail@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="senha"
                    className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                  >
                    Senha *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#4A3F5C]/40">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="senha"
                      name="senha"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-10 text-sm font-semibold text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9D9]/30"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#4A3F5C] transition focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Indicador de Força */}
                  {senha.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1.5 h-1.5 w-full">
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= 1 ? strength.bgClass : 'bg-gray-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= 2 ? strength.bgClass : 'bg-gray-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= 3 ? strength.bgClass : 'bg-gray-200'
                          }`}
                        />
                      </div>
                      <p className={`text-[11px] font-bold ${strength.colorClass}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmarSenha"
                    className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                  >
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#4A3F5C]/40">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <input
                      id="confirmarSenha"
                      name="confirmarSenha"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className={`block w-full rounded-2xl border bg-gray-50/50 py-3.5 pl-11 pr-10 text-sm font-semibold text-[#4A3F5C] placeholder-gray-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
                        confirmarSenha && confirmarSenha !== senha
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                          : confirmarSenha && confirmarSenha === senha
                          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                          : 'border-gray-200 focus:border-[#B8A9D9] focus:ring-[#B8A9D9]/30'
                      }`}
                      placeholder="Repita sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#4A3F5C] transition focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {confirmarSenha.length > 0 && (
                    <p
                      className={`text-[11px] font-bold mt-1.5 flex items-center gap-1.5 ${
                        confirmarSenha === senha ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {confirmarSenha === senha ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>As senhas coincidem</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>As senhas não conferem</span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: ESPECIALIDADES & CONTATO */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-2">
                  Especialidades de Atuação * <span className="text-gray-400 font-normal">(escolha 1 ou mais)</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORY_ITEMS.map((item) => {
                    const isSelected = item.id === 'outro' ? categorias.includes('outro') : categorias.includes(item.id)
                    const IconComponent = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCategoria(item.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-[#B8A9D9] bg-purple-50/60 shadow-xs ring-2 ring-[#B8A9D9]/40'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                            isSelected ? 'bg-[#4A3F5C] text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#4A3F5C] truncate">{item.label}</span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-[#8675A9] shrink-0 ml-1" />}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Tag Personalizada se 'Outro' selecionado */}
                {categorias.includes('outro') && (
                  <div className="mt-3 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 space-y-2">
                    <label className="block text-xs font-bold text-[#4A3F5C]">
                      Digite sua especialidade personalizada:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCustomTag()
                          }
                        }}
                        placeholder="Ex: Podologia, Tatuagem Fine Line, Bronzeamento..."
                        className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-semibold text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTag}
                        className="px-3.5 py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-purple-900 transition shrink-0 cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>

                    {customTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {customTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#B8A9D9]/50 text-xs font-bold text-[#4A3F5C]"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomTag(tag)}
                              className="text-gray-400 hover:text-red-500 transition cursor-pointer ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label
                    htmlFor="whatsapp"
                    className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                  >
                    WhatsApp de Atendimento *
                  </label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm font-semibold text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                    placeholder="(11) 99999-9999"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">
                    Suas clientes poderão clicar para falar direto com você.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="instagram"
                    className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                  >
                    Instagram do Studio
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      @
                    </span>
                    <input
                      id="instagram"
                      name="instagram"
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
                      className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-8 pr-3 text-sm font-semibold text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                      placeholder="seu.studio"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">
                    Link do botão do Instagram na vitrine pública.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="tagline"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                >
                  Frase de Destaque / Slogan <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  maxLength={120}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm font-medium text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                  placeholder="Ex: Realçando sua beleza e elevando sua autoestima"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3: LOCALIZAÇÃO & PAGAMENTO */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C]">
                    Modalidades de Atendimento *
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">Pode escolher mais de uma</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODALIDADES.map((mod) => {
                    const isSelected = modalidades.includes(mod.id)
                    const IconComponent = mod.icon
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleModalidade(mod.id)}
                        className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-[#B8A9D9] bg-purple-50/60 shadow-xs ring-2 ring-[#B8A9D9]/40'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl mb-2 transition ${
                            isSelected ? 'bg-[#4A3F5C] text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex items-center justify-center gap-1 w-full">
                          <span className="text-xs font-bold text-[#4A3F5C]">{mod.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#8675A9]" />}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">{mod.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="localizacao"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                >
                  Localização / Endereço / Cidade
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#4A3F5C]/40">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <input
                    id="localizacao"
                    name="localizacao"
                    type="text"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-3 text-sm font-semibold text-[#4A3F5C] placeholder-gray-400 transition focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                    placeholder="Ex: Vila Mariana, São Paulo - SP ou Av. Paulista, 1000"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                  {modalidades.includes('domicilio') && !modalidades.includes('studio')
                    ? 'Informe a cidade ou regiões onde você costuma atender.'
                    : 'Será exibido com atalho para o Google Maps na sua página pública.'}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-2">
                  Formas de Pagamento Aceitas no Studio *
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {FORMAS_PAGAMENTO.map((fp) => {
                    const isChecked = formasPagamento.includes(fp.id)
                    return (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() => toggleFormaPagamento(fp.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                          isChecked
                            ? 'border-[#B8A9D9] bg-purple-50/60 ring-2 ring-[#B8A9D9]/30'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                            isChecked ? 'bg-[#4A3F5C] text-white' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <PaymentIcon method={fp.id} className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-[#4A3F5C] flex-1">{fp.label}</span>
                        {isChecked && <Check className="h-4 w-4 text-[#8675A9]" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 4: LINK EXCLUSIVO, VISUAL & HORÁRIOS */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Link Único / Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1.5"
                >
                  Seu Link Exclusivo no Lumê *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    lume.com/p/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-24 pr-10 text-sm font-bold text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                    placeholder="amanda-beauty"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {slugStatus.checking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    ) : slugStatus.available ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <p className={`text-[11px] font-bold mt-1 ${slugStatus.available ? 'text-emerald-600' : 'text-red-500'}`}>
                  {slugStatus.message}
                </p>
              </div>

              {/* Cores da Marca: Primária e Secundária (Igual ao /perfil) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                {/* Cor Primária */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C]">
                    Cor Primária de Destaque
                  </label>

                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="h-9 w-11 cursor-pointer rounded-lg border border-gray-200 p-1"
                    />
                    <input
                      type="text"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="w-24 rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-mono text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none font-bold"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {PRESET_COLORS.map((hex) => {
                      const isSelected = corPrimaria.toLowerCase() === hex.toLowerCase()
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCorPrimaria(hex)}
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

                {/* Cor Secundária */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C]">
                    Cor Secundária de Fundo
                  </label>

                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={corSecundaria}
                      onChange={(e) => setCorSecundaria(e.target.value)}
                      className="h-9 w-11 cursor-pointer rounded-lg border border-gray-200 p-1"
                    />
                    <input
                      type="text"
                      value={corSecundaria}
                      onChange={(e) => setCorSecundaria(e.target.value)}
                      className="w-24 rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-mono text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none font-bold"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {PRESET_COLORS.map((hex) => {
                      const isSelected = corSecundaria.toLowerCase() === hex.toLowerCase()
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCorSecundaria(hex)}
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

              {/* Prévia da Vitrine Pública Elaborada (Cores em Ação - Primária nos Destaques e Secundária no Fundo) */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#B8A9D9]" />
                  <span>Prévia da Sua Página Pública (Cores em Ação)</span>
                </label>

                <div
                  className="rounded-3xl p-5 border transition-all duration-300 shadow-sm space-y-4"
                  style={{
                    backgroundColor: corSecundaria,
                    borderColor: getLightTint(corPrimaria, 40),
                  }}
                >
                  {/* Topo da Prévia: Avatar e Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white font-bold text-lg shadow-md border-2"
                      style={{
                        backgroundColor: corPrimaria,
                        borderColor: '#FFFFFF',
                        color: getContrastingTextColor(corPrimaria),
                      }}
                    >
                      {nome ? nome.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#4A3F5C] truncate">
                          {nome || 'Seu Nome ou Studio'}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#4A3F5C]/75 font-medium truncate mt-0.5">
                        {tagline || (categorias.length > 0 ? getCategoryLabel(categorias[0]) : 'Especialista em Beleza')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                        lume.com/p/{slug || 'seu-link'}
                      </p>
                    </div>
                  </div>

                  {/* Card Exemplo de Serviço na Vitrine */}
                  <div className="rounded-2xl bg-white/95 p-3.5 border border-black/5 shadow-2xs flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider block"
                        style={{ color: corPrimaria }}
                      >
                        Serviço em Destaque
                      </span>
                      <h5 className="text-xs font-bold text-[#4A3F5C] truncate mt-0.5">
                        {categorias.includes('cilios')
                          ? 'Extensão de Cílios Fio a Fio'
                          : categorias.includes('unhas')
                          ? 'Alongamento de Unhas em Gel'
                          : categorias.includes('cabelo')
                          ? 'Corte & Escova Modelada'
                          : 'Atendimento Personalizado'}
                      </h5>
                      <span className="text-xs font-extrabold text-[#4A3F5C]">
                        R$ 150,00
                      </span>
                    </div>

                    <div
                      className="px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs shrink-0 transition"
                      style={{
                        backgroundColor: corPrimaria,
                        color: getContrastingTextColor(corPrimaria),
                      }}
                    >
                      Agendar
                    </div>
                  </div>
                </div>
              </div>

              {/* Horários de Atendimento Padrão (Sem estilo de card pesado, estilo padronizado) */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C] mb-1">
                    Horários de Atendimento Padrão
                  </label>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Clique nos dias da semana para selecionar:
                  </p>
                </div>

                {/* Seletor de Dias em linha uniforme */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {DIAS_SEMANA.map((d) => {
                    const isSelected = diasAtendimento.includes(d.dia)
                    return (
                      <button
                        key={d.dia}
                        type="button"
                        onClick={() => toggleDiaSemana(d.dia)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#4A3F5C] text-white shadow-xs'
                            : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>

                {/* Faixa de Horário com CustomSelect */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#4A3F5C]">
                      Horário de Abertura
                    </label>
                    <CustomSelect
                      options={TIME_OPTIONS_15MIN}
                      value={horaInicio}
                      onChange={setHoraInicio}
                      size="sm"
                      buttonClassName="font-bold py-2.5"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#4A3F5C]">
                      Horário de Encerramento
                    </label>
                    <CustomSelect
                      options={TIME_OPTIONS_15MIN}
                      value={horaFim}
                      onChange={setHoraFim}
                      size="sm"
                      buttonClassName="font-bold py-2.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BOTÕES DE NAVEGAÇÃO & AÇÕES */}
          {/* ========================================================================= */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-[#4A3F5C] shadow-xs hover:bg-gray-50 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#B8A9D9] px-6 py-3 text-xs font-bold text-[#4A3F5C] shadow-md hover:bg-[#a695ca] hover:shadow-lg transition cursor-pointer"
              >
                <span>Avançar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={loading || !slugStatus.available || slugStatus.checking}
                className="inline-flex items-center justify-center rounded-2xl bg-[#B8A9D9] hover:bg-[#a695ca] px-6 py-3.5 text-xs font-bold text-[#4A3F5C] shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 min-w-[170px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#4A3F5C]" />
                    <span>Criando sua conta...</span>
                  </div>
                ) : (
                  <span>Concluir Cadastro</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* RODAPÉ: LINK PARA LOGIN */}
        <div className="mt-6 text-center text-xs font-medium text-[#4A3F5C]/70">
          Já possui uma conta?{' '}
          <Link href="/login" className="font-bold text-[#4A3F5C] underline hover:text-[#B8A9D9]">
            Fazer login
          </Link>
        </div>
      </div>

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF7F5]">
          <Loader2 className="h-8 w-8 animate-spin text-[#B8A9D9]" />
        </div>
      }
    >
      <CadastroForm />
    </Suspense>
  )
}

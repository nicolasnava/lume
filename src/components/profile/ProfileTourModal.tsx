'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Camera,
  User,
  ExternalLink,
  Palette,
  CreditCard,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Building2,
  Eye,
  Smartphone,
  Store,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

interface TourStep {
  targetId?: string
  title: string
  description: string
  icon: LucideIcon
  isCenterModal?: boolean
}

const PROFILE_TOUR_STEPS: TourStep[] = [
  {
    isCenterModal: true,
    title: 'Personalização Completa no Lumê',
    description:
      'Organizamos tudo em 3 abas práticas: Perfil (seus dados e contatos), Vitrine (sua identidade visual e página pública) e Assinatura (seu plano e suporte).',
    icon: Sparkles,
  },
  {
    targetId: 'profile-tour-avatar',
    title: 'Aba Perfil: Foto & Identificação',
    description:
      'Adicione sua foto de perfil profissional, seu nome e uma frase de destaque (tagline) com sua especialidade.',
    icon: User,
  },
  {
    targetId: 'profile-tour-contacts',
    title: 'Aba Perfil: Contatos & WhatsApp',
    description:
      'O WhatsApp conta com máscara automática enquanto você digita para agilizar o contato. Informe também seu Instagram e localização.',
    icon: Phone,
  },
  {
    targetId: 'profile-tour-modalidades',
    title: 'Aba Perfil: Onde Você Atende',
    description:
      'Indique suas modalidades de atendimento: Studio próprio, a Domicílio ou em Salão parceiro.',
    icon: Building2,
  },
  {
    targetId: 'profile-tour-google',
    title: 'Aba Perfil: Google Agenda & Aplicativo',
    description:
      'Sincronize com o Google Agenda e instale o Lumê direto na tela inicial do seu celular para acesso rápido.',
    icon: Calendar,
  },
  {
    targetId: 'profile-tour-slug',
    title: 'Aba Vitrine: Link Exclusivo',
    description:
      'Endereço direto da sua página pública. Copie e adicione na bio do seu Instagram para receber agendamentos.',
    icon: ExternalLink,
  },
  {
    targetId: 'profile-tour-cover',
    title: 'Aba Vitrine: Foto de Capa & Cores',
    description:
      'Escolha a capa do seu espaço e defina as cores primária e secundária da sua marca posicionadas lado a lado.',
    icon: Palette,
  },
  {
    targetId: 'profile-tour-preview',
    title: 'Aba Vitrine: Prévia em Tempo Real',
    description:
      'Veja instantaneamente como os botões e detalhes da sua vitrine serão exibidos para as clientes.',
    icon: Eye,
  },
  {
    targetId: 'profile-tour-payments',
    title: 'Aba Vitrine: Formas de Pagamento & Categorias',
    description:
      'Defina as especialidades em que você atua e as formas de pagamento que você aceita (Pix, Cartão, Dinheiro).',
    icon: CreditCard,
  },
  {
    isCenterModal: true,
    title: 'Aba Assinatura: Gestão & Suporte',
    description:
      'Acompanhe os detalhes da sua assinatura e fale diretamente com o suporte no WhatsApp com 1 clique sempre que precisar.',
    icon: MessageCircle,
  },
  {
    isCenterModal: true,
    title: 'Tudo Pronto!',
    description:
      'Suas alterações são salvas automaticamente enquanto você navega e personaliza cada aba.',
    icon: CheckCircle2,
  },
]

interface ProfileTourModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileTourModal({ isOpen, onClose }: ProfileTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const currentStep = PROFILE_TOUR_STEPS[currentStepIndex] || PROFILE_TOUR_STEPS[0]
  const totalSteps = PROFILE_TOUR_STEPS.length

  const measureTarget = useCallback(() => {
    if (!isOpen || currentStep.isCenterModal || !currentStep.targetId) {
      setTargetRect(null)
      return
    }

    const el = document.getElementById(currentStep.targetId)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
    } else {
      setTargetRect(null)
    }
  }, [isOpen, currentStep])

  useEffect(() => {
    if (!isOpen) return

    if (currentStep.isCenterModal || !currentStep.targetId) {
      setTargetRect(null)
      return
    }

    const el = document.getElementById(currentStep.targetId)
    if (el) {
      // Posiciona o elemento de forma padronizada no topo do viewport (com 85px de margem)
      // para que o card possa ficar 100% estável e fixo na base da tela sem saltar
      const rect = el.getBoundingClientRect()
      const scrollTargetY = window.scrollY + rect.top - 85

      window.scrollTo({
        top: Math.max(0, scrollTargetY),
        behavior: 'smooth',
      })

      // Atualiza a medição de forma limpa sem efeito pulsante
      measureTarget()
      const timer = setTimeout(measureTarget, 280)
      return () => clearTimeout(timer)
    } else {
      setTargetRect(null)
    }
  }, [isOpen, currentStepIndex, currentStep, measureTarget])

  // Acompanhamento contínuo no scroll
  useEffect(() => {
    if (!isOpen) return

    const handleScroll = () => {
      measureTarget()
    }

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isOpen, measureTarget])

  if (!isOpen) return null

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lume_profile_tour_seen', 'true')
    }
    onClose()
    setCurrentStepIndex(0)
  }

  const IconComponent = currentStep.icon

  // Posicionamento padronizado e estável:
  // - Passos centralizados (início/fim): centro da tela
  // - Todos os passos do formulário: padronizados na BASE da tela (sem saltar de cima pra baixo)
  // - Caso extremo em que o elemento esteja grudado no rodapé: topo
  const getCardStyle = (): React.CSSProperties => {
    if (currentStep.isCenterModal || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800

    // Se o elemento estiver muito colado na base (ex: > 70% da altura da tela), sobe para o topo
    if (targetRect.top > viewportHeight * 0.72) {
      return {
        top: isMobile ? '14px' : '20px',
        bottom: 'auto',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    }

    // Posição padrão e estável para todos os passos: fixa no rodapé
    return {
      top: 'auto',
      bottom: isMobile ? '14px' : '20px',
      left: '50%',
      transform: 'translateX(-50%)',
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
      {/* 1. Spotlight suave e sem pulsar */}
      {targetRect && !currentStep.isCenterModal ? (
        <div
          className="absolute pointer-events-none rounded-3xl ring-3 ring-[#B8A9D9] shadow-[0_0_0_9999px_rgba(74,63,92,0.76)] transition-[top,left,width,height] duration-250 ease-out"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#4A3F5C]/75 backdrop-blur-xs transition-opacity duration-250 pointer-events-auto" />
      )}

      {/* 2. Card Compacto, Slim e Estável */}
      <div
        className="fixed w-[92vw] max-w-sm pointer-events-auto transition-[top,bottom] duration-250 ease-out z-10"
        style={getCardStyle()}
      >
        <div className="relative w-full rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xl border border-[#B8A9D9]/40 space-y-2.5">
          {/* Cabeçalho Compacto */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[#B8A9D9]/25 text-[#4A3F5C] shadow-2xs">
                <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#4A3F5C]" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8675A9] block truncate">
                  Passo {currentStepIndex + 1} de {totalSteps}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-[#4A3F5C] leading-tight truncate">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer shrink-0"
              title="Pular tutorial"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Descrição Curta e Direta ao Ponto */}
          <p
            key={currentStepIndex}
            className="text-[11px] sm:text-xs text-gray-600 leading-relaxed font-medium min-h-[32px]"
          >
            {currentStep.description}
          </p>

          {/* Barra de Progresso com Pontinhos Compactos */}
          <div className="flex items-center justify-center gap-1 py-0.5">
            {PROFILE_TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-200 ${
                  i === currentStepIndex
                    ? 'w-4 bg-[#4A3F5C]'
                    : i < currentStepIndex
                    ? 'w-1.5 bg-[#B8A9D9]'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Botões de Ação Compactos */}
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleFinish}
              className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              Pular
            </button>

            <div className="flex items-center gap-1.5">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-3.5 py-1 rounded-lg bg-[#4A3F5C] text-[11px] font-bold text-white shadow-sm hover:bg-purple-900 transition cursor-pointer"
              >
                <span>{currentStepIndex === totalSteps - 1 ? 'Concluir' : 'Próximo'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  ExternalLink,
  Home,
  Scissors,
  Clock,
  Calendar,
  Plus,
  DollarSign,
  Users,
  Star,
  User,
  MoreHorizontal,
  Building2,
} from 'lucide-react'
import { completeOnboardingAction } from '@/app/actions/onboarding'

export interface TourStep {
  targetId?: string
  title: string
  description: string
  icon: typeof Sparkles
  isCenterModal?: boolean
  requiresMobileMore?: boolean
}

// FLUXO DESKTOP:
// Página Pública ➔ Início ➔ Novo Agendamento ➔ Agenda ➔ Financeiro ➔ Clientes ➔ Avaliações ➔ Serviços ➔ Disponibilidade ➔ Perfil
const DESKTOP_TOUR_STEPS: TourStep[] = [
  {
    isCenterModal: true,
    title: 'Boas-vindas ao Lumê!',
    description:
      'Seja muito bem-vinda! Preparamos um tour rápido de 1 minuto para apresentar as principais ferramentas que vão organizar seus atendimentos e encantar suas clientes.',
    icon: Sparkles,
  },
  {
    targetId: 'tour-public-link',
    title: 'Sua Página Pública & Autoatendimento',
    description:
      'Link direto da sua vitrine. Suas clientes agendam online e contam com autoatendimento para consultar, cancelar ou remarcar seus próprios horários.',
    icon: ExternalLink,
  },
  {
    targetId: 'tour-nav-inicio',
    title: 'Painel Inicial',
    description:
      'Aqui você tem um resumo rápido do dia: contagem de atendimentos de hoje, próximo horário agendado e atalhos rápidos.',
    icon: Home,
  },
  {
    targetId: 'tour-btn-new-booking',
    title: 'Novo Agendamento Manual',
    description:
      'Recebeu uma cliente no WhatsApp ou no balcão? Clique aqui para lançar o agendamento manual na hora e bloquear o horário na sua grade.',
    icon: Plus,
  },
  {
    targetId: 'tour-nav-agenda',
    title: 'Sua Agenda Inteligente',
    description:
      'Acompanhe todos os seus atendimentos organizados por Dia, Semana e Mês. Os agendamentos feitos pelas clientes caem automaticamente aqui!',
    icon: Calendar,
  },
  {
    targetId: 'tour-nav-financeiro',
    title: 'Painel Financeiro & Métricas',
    description:
      'Monitore seu faturamento previsto e realizado, formas de pagamento preferidas e a evolução financeira do seu negócio.',
    icon: DollarSign,
  },
  {
    targetId: 'tour-nav-clientes',
    title: 'Gestão de Clientes',
    description:
      'Consulte sua base de clientes, histórico completo de agendamentos, contatos, frequência de retorno e anotações.',
    icon: Users,
  },
  {
    targetId: 'tour-nav-avaliacoes',
    title: 'Avaliações & Reputação',
    description:
      'Acompanhe as notas e depoimentos deixados pelas suas clientes após cada atendimento concluído no Studio.',
    icon: Star,
  },
  {
    targetId: 'tour-nav-servicos',
    title: 'Catálogo de Serviços',
    description:
      'Cadastre todos os procedimentos que você realiza, com tempo de duração, valores individuais e criação de combos.',
    icon: Scissors,
  },
  {
    targetId: 'tour-nav-disponibilidade',
    title: 'Horários de Atendimento & Pausas',
    description:
      'Defina os dias da semana em que você atende, horários de expediente, intervalo de almoço e bloqueios pontuais para folgas ou férias.',
    icon: Clock,
  },
  {
    targetId: 'tour-nav-estudio',
    title: 'Studio & Equipe',
    description:
      'Crie seu Studio com vitrine coletiva, convide outras profissionais parceiras, compartilhe seu link /studio e adicione fotos do seu espaço.',
    icon: Building2,
  },
  {
    targetId: 'tour-nav-perfil',
    title: 'Perfil, Vitrine & Assinatura',
    description:
      'Organizado em 3 abas: configure seu Nome Exibido e contatos, gere seu QR Code e Stories para divulgação, ative Notificações Push e gerencie seu plano com suporte direto no WhatsApp.',
    icon: User,
  },
  {
    isCenterModal: true,
    title: 'Tudo pronto para começar!',
    description:
      'Seu espaço está configurado. Lembre-se que você pode rever este tutorial a qualquer momento acessando seu Perfil.',
    icon: CheckCircle2,
  },
]

// FLUXO MOBILE:
// Ver Página ➔ Ícone Início ➔ Agenda ➔ Botão "+" de Agendamento ➔ Financeiro ➔ Menu "Mais" ➔ Cada um do Mais (Serviços, Disponibilidade, Clientes, Avaliações, Perfil)
const MOBILE_TOUR_STEPS: TourStep[] = [
  {
    isCenterModal: true,
    title: 'Boas-vindas ao Lumê!',
    description:
      'Seja muito bem-vinda! Preparamos um tour guiado rápido de 1 minuto para você conhecer todos os recursos essenciais do seu painel no celular.',
    icon: Sparkles,
  },
  {
    targetId: 'tour-public-link-mobile',
    title: 'Página Pública & Autoatendimento',
    description:
      'Link direto da sua vitrine. Suas clientes agendam online e contam com autoatendimento para consultar, cancelar ou remarcar seus próprios horários.',
    icon: ExternalLink,
  },
  {
    targetId: 'tour-mobile-inicio',
    title: 'Ícone Início',
    description:
      'Acesse a tela principal com o resumo em tempo real dos seus atendimentos de hoje e próximos horários.',
    icon: Home,
  },
  {
    targetId: 'tour-mobile-agenda',
    title: 'Sua Agenda',
    description:
      'Consulte rapidamente seus agendamentos diários e semanais direto na barra inferior do aplicativo.',
    icon: Calendar,
  },
  {
    targetId: 'tour-btn-new-booking-mobile',
    title: 'Botão "+" de Agendamento',
    description:
      'Toque no botão central "+" para criar um agendamento rápido quando a cliente te chamar no WhatsApp ou balcão.',
    icon: Plus,
  },
  {
    targetId: 'tour-mobile-financeiro',
    title: 'Painel Financeiro',
    description:
      'Acompanhe seu faturamento previsto e realizado e os métodos de pagamento recebidos.',
    icon: DollarSign,
  },
  {
    targetId: 'tour-mobile-more',
    title: 'Menu "Mais Opções"',
    description:
      'No celular, tocando em "Mais" você acessa todos os outros módulos essenciais do Studio. Vamos abrir o menu para você conhecer cada um!',
    icon: MoreHorizontal,
  },
  {
    targetId: 'tour-mobile-clientes',
    requiresMobileMore: true,
    title: 'Gestão de Clientes',
    description:
      'Veja o histórico completo de atendimentos de cada cliente, contatos e frequência de retorno.',
    icon: Users,
  },
  {
    targetId: 'tour-mobile-avaliacoes',
    requiresMobileMore: true,
    title: 'Avaliações & Reputação',
    description:
      'Acompanhe as notas e depoimentos deixados pelas suas clientes após cada atendimento concluído.',
    icon: Star,
  },
  {
    targetId: 'tour-mobile-servicos',
    requiresMobileMore: true,
    title: 'Catálogo de Serviços',
    description:
      'Cadastre todos os procedimentos que você realiza, com tempo de duração, valores individuais e criação de combos.',
    icon: Scissors,
  },
  {
    targetId: 'tour-mobile-disponibilidade',
    requiresMobileMore: true,
    title: 'Horários de Atendimento & Pausas',
    description:
      'Defina os dias da semana em que você atende, horários de expediente, intervalos de almoço e folgas.',
    icon: Clock,
  },
  {
    targetId: 'tour-mobile-estudio',
    requiresMobileMore: true,
    title: 'Studio & Equipe',
    description:
      'Administre seu Studio, convide sua equipe e gerencie a vitrine coletiva com fotos do seu espaço.',
    icon: Building2,
  },
  {
    targetId: 'tour-mobile-perfil',
    requiresMobileMore: true,
    title: 'Perfil, Vitrine & Assinatura',
    description:
      'Acesse suas 3 abas: configure seu Nome Exibido e contatos, gere seu QR Code e Stories, ative Notificações Push e acompanhe sua assinatura.',
    icon: User,
  },
  {
    isCenterModal: true,
    title: 'Tudo pronto para começar!',
    description:
      'Seu espaço está configurado. Lembre-se que você pode rever este tutorial a qualquer momento acessando seu Perfil.',
    icon: CheckCircle2,
  },
]

interface ProductTourModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProductTourModal({ isOpen, onClose }: ProductTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar mobile de forma reativa
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Selecionar conjunto de passos de acordo com o dispositivo
  const activeSteps = useMemo(() => {
    return isMobile ? MOBILE_TOUR_STEPS : DESKTOP_TOUR_STEPS
  }, [isMobile])

  // Ajustar índice seguro
  const safeStepIndex = Math.min(currentStepIndex, activeSteps.length - 1)
  const currentStep = activeSteps[safeStepIndex]
  const isFirstStep = safeStepIndex === 0
  const isLastStep = safeStepIndex === activeSteps.length - 1

  const updateSpotlightPosition = useCallback(() => {
    if (!isOpen || currentStep.isCenterModal) {
      setTargetRect(null)
      return
    }

    const mobileMode = window.innerWidth < 768

    // Controle da gaveta "Mais" no mobile
    if (mobileMode) {
      if (currentStep.requiresMobileMore) {
        window.dispatchEvent(new CustomEvent('lume-tour-open-more'))
      } else {
        window.dispatchEvent(new CustomEvent('lume-tour-close-more'))
      }
    }

    const elementId = currentStep.targetId

    if (elementId) {
      const delay = mobileMode && currentStep.requiresMobileMore ? 180 : 60
      setTimeout(() => {
        const el = document.getElementById(elementId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
          setTargetRect(el.getBoundingClientRect())
          return
        }
        setTargetRect(null)
      }, delay)
      return
    }
    setTargetRect(null)
  }, [isOpen, currentStep])

  useEffect(() => {
    updateSpotlightPosition()
    window.addEventListener('resize', updateSpotlightPosition)
    window.addEventListener('scroll', updateSpotlightPosition, true)
    return () => {
      window.removeEventListener('resize', updateSpotlightPosition)
      window.removeEventListener('scroll', updateSpotlightPosition, true)
    }
  }, [updateSpotlightPosition])

  const handleFinish = async () => {
    window.dispatchEvent(new CustomEvent('lume-tour-close-more'))
    onClose()
    try {
      await completeOnboardingAction()
    } catch (err) {
      console.warn('Erro ao salvar conclusão de onboarding:', err)
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      handleFinish()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  if (!isOpen) return null

  const StepIcon = currentStep.icon

  // Cálculo de coordenadas dinâmicas com transição leve e fluida
  const getCardStyle = (): React.CSSProperties => {
    if (currentStep.isCenterModal) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    if (isMobile) {
      // Se estiver nos passos do painel "Mais" (Passo 8 em diante), sobe suavemente para o topo
      if (currentStep.requiresMobileMore) {
        return {
          top: '16px',
          left: '50%',
          transform: 'translate(-50%, 0)',
        }
      }

      // Se o alvo for a página pública no topo (cabeçalho), posiciona suavemente na base
      if (currentStep.targetId === 'tour-public-link-mobile') {
        return {
          top: 'auto',
          bottom: '88px',
          left: '50%',
          transform: 'translate(-50%, 0)',
        }
      }

      // Para todos os itens da barra inferior (Início, Agenda, "+", Financeiro, Mais), fica confortavelmente no centro
      return {
        top: '46%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    // No desktop:
    // No passo 4 (Novo Agendamento), o botão fica nas "Ações Rápidas" na parte inferior do dashboard.
    // O card sobe suavemente para o TOPO da tela (top: 24px) para não cobrir o botão, e depois volta ao centro!
    if (currentStep.targetId === 'tour-btn-new-booking') {
      return {
        top: '24px',
        left: '50%',
        transform: 'translate(-50%, 0)',
      }
    }

    // Demais passos no desktop: centralizado perfeitamente
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
      {/* 1. Backdrop escurecido com Spotlight animado de transição fluida */}
      {targetRect && !currentStep.isCenterModal ? (
        <div
          className="absolute pointer-events-none rounded-2xl ring-4 ring-[#B8A9D9] shadow-[0_0_0_9999px_rgba(74,63,92,0.72)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#4A3F5C]/75 backdrop-blur-xs transition-opacity duration-500 pointer-events-auto" />
      )}

      {/* 2. Card do Tutorial com Deslocamento Fluido e Leve */}
      <div
        className="fixed pointer-events-auto w-[92vw] max-w-sm sm:max-w-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={getCardStyle()}
      >
        <div className="relative w-full rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-[#B8A9D9]/40 space-y-3 sm:space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
          {/* Topo do Card: Ícone, Etapas e Botão Fechar */}
          <div className="flex items-center justify-between gap-2.5 border-b border-gray-100 pb-2.5 sm:pb-3">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-[#B8A9D9]/25 text-[#4A3F5C] shadow-2xs">
                <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#4A3F5C]" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#8675A9] block truncate">
                  Tutorial Lumê · Passo {safeStepIndex + 1} de {activeSteps.length}
                </span>
                <h3 className="text-xs sm:text-base font-bold text-[#4A3F5C] leading-tight mt-0.5 truncate">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              title="Pular tutorial"
              className="p-1 sm:p-1.5 rounded-xl text-gray-400 hover:text-[#4A3F5C] hover:bg-gray-100 transition cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Descrição do Passo com animação suave de texto */}
          <p
            key={safeStepIndex}
            className="text-xs sm:text-sm text-[#4A3F5C]/85 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-300 min-h-[44px] sm:min-h-[48px]"
          >
            {currentStep.description}
          </p>

          {/* Barra de Progresso com Pontinhos */}
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            {activeSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-400 ${
                  i === safeStepIndex
                    ? 'w-5 sm:w-6 bg-[#4A3F5C]'
                    : i < safeStepIndex
                    ? 'w-1.5 sm:w-2 bg-[#B8A9D9]'
                    : 'w-1 sm:w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Rodapé: Botões de Ação */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            {isFirstStep ? (
              <button
                type="button"
                onClick={handleFinish}
                className="text-[11px] sm:text-xs font-semibold text-gray-400 hover:text-[#4A3F5C] transition cursor-pointer py-1.5 px-2"
              >
                Pular tutorial
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#4A3F5C] bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {!isFirstStep && !isLastStep && (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="text-[10px] sm:text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition cursor-pointer px-1"
                >
                  Pular
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#B8A9D9] hover:bg-[#a695ca] text-[#4A3F5C] font-bold text-[11px] sm:text-xs px-4 sm:px-5 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <span>{isFirstStep ? 'Começar' : isLastStep ? 'Concluir' : 'Próximo'}</span>
                {!isLastStep && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

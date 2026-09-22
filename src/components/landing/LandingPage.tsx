'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Smartphone,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Store,
  Users,
  ChevronDown,
  Lock,
  Check,
  Zap,
  HelpCircle,
  ShieldCheck,
  Scissors,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  CalendarX,
  CalendarDays,
  Play,
  Sparkles,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'
import InteractiveShowcaseSimulator from './InteractiveShowcaseSimulator'
import FinancialSimulator from './FinancialSimulator'
import { Button } from '@/components/ui/button'
import CornerFillButton from '@/components/ui/CornerFillButton'
import CasinoPriceTicker from '@/components/ui/CasinoPriceTicker'

interface LandingPageProps {
  planPrice?: number
}

export default function LandingPage({ planPrice = 69.90 }: LandingPageProps) {
  // Referências para o contexto do GSAP
  const pageRef = useRef<HTMLDivElement | null>(null)
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const heroDesktopMockupRef = useRef<HTMLDivElement | null>(null)
  const heroMobileMockupRef = useRef<HTMLDivElement | null>(null)

  // Estado do FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Estado unificado para expansão simultânea dos detalhes de ambos os planos
  const [showPlanDetails, setShowPlanDetails] = useState(false)

  // Ciclo de cobrança: Mensal ou Anual
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  // Hook GSAP Adaptativo com suporte a prefers-reduced-motion e cleanup automático
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Respeito rigoroso a preferência por redução de movimento
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // 2. Registro seguro do plugin ScrollTrigger
    gsap.registerPlugin(ScrollTrigger)

    const isDesktop = window.innerWidth >= 1024

    const ctx = gsap.context(() => {
      // A. HERO - Entrada suave da composição visual existente
      // O título e o CTA permanecem visíveis imediatamente sem bloquear o conteúdo
      if (heroDesktopMockupRef.current) {
        gsap.fromTo(
          heroDesktopMockupRef.current,
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', delay: 0.1 }
        )

        // Parallax sutil apenas em desktop na composição completa
        if (isDesktop && heroSectionRef.current) {
          gsap.to(heroDesktopMockupRef.current, {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.5,
            },
          })
        }
      }

      if (heroMobileMockupRef.current) {
        gsap.fromTo(
          heroMobileMockupRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.15 }
        )
      }

      // B. DORES DO DIA A DIA - Entrada fluida dos 3 cards existentes
      const doresCards = gsap.utils.toArray<HTMLElement>('.dores-card')
      if (doresCards.length > 0) {
        gsap.fromTo(
          doresCards,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#dores',
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // C. RECURSOS EM AÇÃO - Entrada consistente dos blocos de recursos
      const recursoBlocks = gsap.utils.toArray<HTMLElement>('.recurso-block')
      recursoBlocks.forEach((block) => {
        const visual = block.querySelector('.recurso-visual')
        const content = block.querySelector('.recurso-content')

        if (visual && content) {
          gsap.fromTo(
            [content, visual],
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: block,
                start: 'top 82%',
                toggleActions: 'play none none none',
              },
            }
          )
        }
      })

      // D. GALERIA VISUAL - Cards de fotos
      const galeriaCards = gsap.utils.toArray<HTMLElement>('.galeria-card')
      if (galeriaCards.length > 0) {
        gsap.fromTo(
          galeriaCards,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#galeria',
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // E. PREÇOS E PLANOS - Cards Solo e Studio
      const planCards = gsap.utils.toArray<HTMLElement>('.pricing-card')
      if (planCards.length > 0) {
        gsap.fromTo(
          planCards,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#precos',
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // F. CTA FINAL - Revelação elegante do banner de fechamento
      const ctaBanner = document.querySelector('.cta-final-card')
      if (ctaBanner) {
        gsap.fromTo(
          ctaBanner,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#cta-final',
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, pageRef)

    return () => {
      ctx.revert()
    }
  }, [])

  // FAQ com textos originais
  const faqs = [
    {
      question: 'Como funciona o teste grátis de 30 dias?',
      answer:
        'Você cria sua conta em menos de 1 minuto apenas com seu e-mail e dados básicos. Tem acesso completo a todos os recursos da plataforma por 30 dias sem qualquer cobrança. Não pedimos cartão de crédito para começar.',
    },
    {
      question: 'Como funciona o cancelamento?',
      answer:
        'O cancelamento é 100% livre e descomplicado. Você pode cancelar sua assinatura a qualquer momento com apenas 1 clique no seu painel, sem multas, taxas ou pegadinhas.',
    },
    {
      question: 'Minhas clientes precisam baixar aplicativo ou criar senha?',
      answer:
        'Não! A cliente acessa seu link exclusivo (/p/sua-marca) direto pelo navegador do celular, escolhe o serviço, seleciona o melhor horário disponível e confirma o agendamento em segundos, sem cadastro prévio.',
    },
    {
      question: 'Como funciona o aviso no WhatsApp e redução de faltas?',
      answer:
        'O Lumê envia confirmações instantâneas e lembretes automáticos prévios para o WhatsApp da cliente, garantindo que ela não esqueça do horário marcado e reduzindo drasticamente as faltas e no-shows.',
    },
    {
      question: 'Como funciona a sincronização com o Google Agenda?',
      answer:
        'A sincronização é em duas vias: quando uma cliente agenda no Lumê, o compromisso entra no seu Google Calendar. E quando você adiciona um compromisso pessoal no seu celular, o Lumê bloqueia aquele horário na sua vitrine pública.',
    },
    {
      question: 'O Lumê funciona em qualquer celular (iPhone e Android)?',
      answer:
        'Sim! O Lumê é um Web App moderno e ultra-leve (PWA). Você pode adicioná-lo à tela inicial do seu celular em segundos, acessando sua agenda com 1 toque sem ocupar a memória do aparelho.',
    },
  ]

  return (
    <div ref={pageRef} className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] selection:bg-[#8C5383]/20 font-sans scroll-smooth">
      <LandingHeader />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION (TEXTOS ORIGINAIS + MOCKUPS INTEGRADAS) */}
      {/* ===================================================================== */}
      <section ref={heroSectionRef} className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 bg-[#FAF8F5]">
        {/* Mockup Desktop de Fundo Integrado */}
        <div ref={heroDesktopMockupRef} className="hidden lg:block absolute inset-0 pointer-events-none select-none z-0">
          <Image
            src="/assets/mockup_desktop.webp"
            alt="Lumê"
            fill
            priority
            quality={100}
            className="object-cover object-right xl:object-center"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[460px] lg:min-h-[520px]">
            
            {/* Coluna Esquerda: Headline, Mockup Mobile, Apoio, CTAs e Prova Social */}
            <div className="lg:col-span-7 xl:col-span-6 space-y-6 sm:space-y-7 text-left">
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#3D2E4D] leading-[1.08] tracking-tight">
                Sua cliente agenda.<br />
                <span className="text-[#8C5383]">O Lumê organiza.</span><br />
                Você atende.
              </h1>

              {/* Mockup Mobile no Smartphone */}
              <div ref={heroMobileMockupRef} className="lg:hidden w-full flex justify-center py-2">
                <div className="relative w-full max-w-[340px] sm:max-w-[420px]">
                  <Image
                    src="/assets/mockup_mobile.webp"
                    alt="Lumê no celular - Aplicativo de agendamento"
                    width={380}
                    height={460}
                    priority
                    className="w-full h-auto object-contain drop-shadow-xl"
                  />
                </div>
              </div>

              <p className="text-base sm:text-lg text-[#6B5E7A] font-normal leading-relaxed max-w-xl">
                Uma agenda de beleza feita para reduzir mensagens, evitar horários duplicados e manter seus atendimentos organizados — mesmo quando você está ocupada atendendo.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-3.5 pt-2">
                <CornerFillButton
                  href="/cadastro"
                  variant="dark"
                  className="w-full sm:w-auto"
                  icon={<ArrowRight className="h-4 w-4 shrink-0" />}
                >
                  <span className="whitespace-nowrap">Testar minha agenda grátis</span>
                </CornerFillButton>

                <CornerFillButton
                  href="#como-funciona"
                  variant="light"
                  className="w-full sm:w-auto"
                  icon={<ArrowRight className="h-4 w-4 shrink-0" />}
                >
                  <span className="whitespace-nowrap">Ver como funciona</span>
                </CornerFillButton>
              </div>

              {/* Prova Social */}
              <div className="pt-3 border-t border-[#E8DFD8] flex items-start gap-3.5 max-w-xl">
                <div className="flex -space-x-2 shrink-0 pt-0.5" aria-hidden="true">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF0F5] text-[#8C5383] ring-2 ring-white shadow-2xs">
                    <Scissors className="h-3.5 w-3.5" />
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF0F5] text-[#8C5383] ring-2 ring-white shadow-2xs">
                    <Eye className="h-3.5 w-3.5" />
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F0FA] text-[#3D2E4D] ring-2 ring-white shadow-2xs">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                  Para <strong className="text-[#3D2E4D]">lash designers, manicures, cabeleireiras e esteticistas</strong> que querem cuidar das clientes — não da bagunça da agenda.
                </p>
              </div>
            </div>

            {/* Coluna Direita (espaço para mockup integrado no desktop) */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-6" />

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SIMULADOR DE FATURAMENTO (LOGO APÓS A HERO) */}
      {/* ===================================================================== */}
      <FinancialSimulator planPrice={planPrice} />

      {/* ===================================================================== */}
      {/* 2. DORES DO DIA A DIA COM FOTOS REAIS (TEXTOS ORIGINAIS) */}
      {/* ===================================================================== */}
      <section id="dores" className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8] scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>A rotina de quem atende sozinha</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] max-w-[26ch] sm:max-w-xl lg:max-w-2xl mx-auto [text-wrap:balance]">
              Sua agenda não deveria depender só de você.
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed max-w-2xl mx-auto [text-wrap:pretty]">
              Entre atender, responder mensagens e controlar os pagamentos, pequenos desencontros podem consumir seu tempo e afetar o resultado do mês.
            </p>
          </div>

          {/* Grid de 3 Cards com Fotos Originais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            
            {/* Card Dor 1: Horário vazio */}
            <div className="dores-card bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] overflow-hidden flex flex-col justify-between hover:border-[#8C5383]/40 transition shadow-xs h-full group">
              <div className="w-full aspect-[16/11] relative bg-[#F5F0FA] shrink-0 overflow-hidden border-b border-[#E8DFD8]/70">
                <Image
                  src="/assets/problema/horario.webp"
                  alt="Horários vagos e clientes que esquecem do atendimento"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-5">
                <div className="space-y-2.5">
                  <h3 className="text-lg sm:text-xl font-bold text-[#3D2E4D] tracking-tight leading-snug [text-wrap:balance]">
                    Um esquecimento pode deixar seu horário vazio
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed [text-wrap:pretty]">
                    Sem confirmação ou lembrete, sua cliente pode esquecer o atendimento — e aquele horário que poderia estar preenchido acaba perdido.
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-[#E8DFD8]/80 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span>Faltas e cancelamentos afetam sua rotina.</span>
                </div>
              </div>
            </div>

            {/* Card Dor 2: WhatsApp */}
            <div className="dores-card bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] overflow-hidden flex flex-col justify-between hover:border-[#8C5383]/40 transition shadow-xs h-full group">
              <div className="w-full aspect-[16/11] relative bg-[#F5F0FA] shrink-0 overflow-hidden border-b border-[#E8DFD8]/70">
                <Image
                  src="/assets/problema/mensagens.webp"
                  alt="Mensagens acumuladas no WhatsApp durante atendimentos"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-5">
                <div className="space-y-2.5">
                  <h3 className="text-lg sm:text-xl font-bold text-[#3D2E4D] tracking-tight leading-snug [text-wrap:balance]">
                    Responder mensagens tira você do atendimento
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed [text-wrap:pretty]">
                    Enquanto você trabalha, novas mensagens chegam, horários se cruzam e sua cliente pode desistir antes de conseguir agendar.
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-[#E8DFD8]/80 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span>Organizar tudo pelo WhatsApp pode ser cansativo.</span>
                </div>
              </div>
            </div>

            {/* Card Dor 3: Caixa & Faturamento */}
            <div className="dores-card bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] overflow-hidden flex flex-col justify-between hover:border-[#8C5383]/40 transition shadow-xs h-full group">
              <div className="w-full aspect-[16/11] relative bg-[#F5F0FA] shrink-0 overflow-hidden border-b border-[#E8DFD8]/70">
                <Image
                  src="/assets/problema/financeiro.webp"
                  alt="Falta de clareza no caixa e resultado financeiro"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-5">
                <div className="space-y-2.5">
                  <h3 className="text-lg sm:text-xl font-bold text-[#3D2E4D] tracking-tight leading-snug [text-wrap:balance]">
                    Sem visão do financeiro, fica difícil crescer
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed [text-wrap:pretty]">
                    Quando os atendimentos e pagamentos ficam espalhados, você termina o mês sem saber exatamente quanto faturou ou quais serviços deram mais resultado.
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-[#E8DFD8]/80 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span>Clareza financeira também faz parte do seu negócio.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2.5 COMO FUNCIONA NA PRÁTICA: TESTE A EXPERIÊNCIA DA CLIENTE */}
      {/* ===================================================================== */}
      <InteractiveShowcaseSimulator />

      {/* ===================================================================== */}
      {/* 3. O PRODUTO EM AÇÃO / RECURSOS (SEGUIDOS UM ABAIXO DO OUTRO, SEM FILTROS) */}
      {/* ===================================================================== */}
      <div id="beneficios" className="scroll-mt-16" />
      <section id="recursos" className="scroll-mt-16">
        
        {/* Cabeçalho da Seção em Tela Cheia */}
        <div className="w-full bg-[#FAF8F5] pt-16 sm:pt-24 pb-8 sm:pb-12 text-center">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>O Produto em Ação</span>
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Conheça o Lumê por dentro
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Veja como cada detalhe foi desenhado para você bater o olho, entender na hora e ter total tranquilidade na rotina.
            </p>
          </div>
        </div>

        {/* BLOCO 1: Clientes e Retorno */}
        <div className="recurso-block w-full bg-gradient-to-b from-[#FAF8F5] to-white py-12 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
              <div className="recurso-content lg:col-span-6 space-y-5 text-left order-1">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                    <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                    <span>Clientes e retorno</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                    Lembre suas clientes na hora certa.
                  </h2>
                </div>

                {/* Foto no Mobile: Alinhada à Esquerda */}
                <div className="lg:hidden w-full py-1">
                  <div className="w-full max-w-[440px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                    <Image
                      src="/assets/funcionalidades/clientes.webp"
                      alt="Histórico de clientes e retorno"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                  Veja quem já veio, quem precisa voltar e mantenha seus atendimentos em dia.
                </p>

                <ul className="space-y-2.5 pt-1 text-xs sm:text-sm font-medium text-[#3D2E4D]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Histórico de cada cliente</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Anotações sobre preferências e procedimentos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Lembretes para retorno e manutenção</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Avaliações na sua página</span>
                  </li>
                </ul>

                <div className="pt-2 sm:pt-3">
                  <CornerFillButton
                    href="/cadastro"
                    variant="pill"
                    className="px-4 py-2 text-xs sm:text-sm"
                    icon={<ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                  >
                    <span>Organizar minhas clientes</span>
                  </CornerFillButton>
                </div>
              </div>

              <div className="recurso-visual hidden lg:flex lg:col-span-6 justify-center order-2">
                <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                  <Image
                    src="/assets/funcionalidades/clientes.webp"
                    alt="Histórico de clientes e retorno"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: Controle da Rotina e Financeiro */}
        <div className="recurso-block w-full bg-gradient-to-b from-white to-[#FAF8F5] py-12 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
              <div className="recurso-content lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                    <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                    <span>Rotina e financeiro</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                    Veja tudo o que acontece no seu dia.
                  </h2>
                </div>

                {/* Foto no Mobile: Alinhada à Esquerda */}
                <div className="lg:hidden w-full py-1">
                  <div className="w-full max-w-[440px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                    <Image
                      src="/assets/funcionalidades/financeiro.webp"
                      alt="Visão da rotina e controle financeiro"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                  Acompanhe seus horários, atendimentos e dinheiro em um só lugar.
                </p>

                <ul className="space-y-2.5 pt-1 text-xs sm:text-sm font-medium text-[#3D2E4D]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Agenda e horários livres</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Faturamento do dia e do mês</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Controle de PIX, cartão e dinheiro</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Acesso fácil pelo celular</span>
                  </li>
                </ul>

                <div className="pt-2 sm:pt-3">
                  <CornerFillButton
                    href="/cadastro"
                    variant="pill"
                    className="px-4 py-2 text-xs sm:text-sm"
                    icon={<ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                  >
                    <span>Ver minha rotina</span>
                  </CornerFillButton>
                </div>
              </div>

              <div className="recurso-visual hidden lg:flex lg:col-span-6 justify-center order-2 lg:order-1">
                <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                  <Image
                    src="/assets/funcionalidades/financeiro.webp"
                    alt="Visão da rotina e controle financeiro"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 3: Sincronização Google Calendar em 2 Vias */}
        <div className="recurso-block w-full bg-gradient-to-b from-[#FAF8F5] to-white py-12 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
              <div className="recurso-content lg:col-span-6 space-y-5 text-left order-1">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                    <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                    <span>Google Agenda</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                    Sua agenda pessoal e profissional, juntas.
                  </h2>
                </div>

                {/* Foto no Mobile: Alinhada à Esquerda */}
                <div className="lg:hidden w-full py-1">
                  <div className="w-full max-w-[440px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                    <Image
                      src="/assets/funcionalidades/sync.webp"
                      alt="Sincronização em duas vias com o Google Agenda"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                  O Lumê bloqueia seus compromissos pessoais e evita horários duplicados.
                </p>

                <ul className="space-y-2.5 pt-1 text-xs sm:text-sm font-medium text-[#3D2E4D]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Sem conflito entre compromissos e clientes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Atualização automática</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Tudo em um só lugar</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Mais tranquilidade para organizar o dia</span>
                  </li>
                </ul>

                <div className="pt-2 sm:pt-3">
                  <CornerFillButton
                    href="/cadastro"
                    variant="pill"
                    className="px-4 py-2 text-xs sm:text-sm"
                    icon={<ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                  >
                    <span>Testar agenda grátis</span>
                  </CornerFillButton>
                </div>
              </div>

              <div className="recurso-visual hidden lg:flex lg:col-span-6 justify-center order-2">
                <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                  <Image
                    src="/assets/funcionalidades/sync.webp"
                    alt="Sincronização em duas vias com o Google Agenda"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 4: Agendamento Online (Adicionado antes de Studio) */}
        <div className="recurso-block w-full bg-gradient-to-b from-white to-[#FAF8F5] py-12 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
              <div className="recurso-content lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                    <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                    <span>Agendamento online</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                    Sua cliente escolhe. Você confirma.
                  </h2>
                </div>

                {/* Foto no Mobile: Alinhada à Esquerda */}
                <div className="lg:hidden w-full py-1">
                  <div className="w-full max-w-[440px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                    <Image
                      src="/assets/funcionalidades/agendamento.webp"
                      alt="Agendamento online no Lumê"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                  Envie seu link. Ela vê os horários disponíveis e agenda sozinha — até quando você está atendendo.
                </p>

                <ul className="space-y-2.5 pt-1 text-xs sm:text-sm font-medium text-[#3D2E4D]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Sua agenda fica disponível o dia todo</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>A cliente agenda sem baixar aplicativo</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Horários ocupados são bloqueados automaticamente</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Você recebe a confirmação na hora</span>
                  </li>
                </ul>

                <div className="pt-2 sm:pt-3">
                  <CornerFillButton
                    href="/cadastro"
                    variant="pill"
                    className="px-4 py-2 text-xs sm:text-sm"
                    icon={<ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                  >
                    <span>Liberar agendamento online</span>
                  </CornerFillButton>
                </div>
              </div>

              <div className="recurso-visual hidden lg:flex lg:col-span-6 justify-center order-2 lg:order-1">
                <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                  <Image
                    src="/assets/funcionalidades/agendamento.webp"
                    alt="Agendamento online no Lumê"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 5: Lumê Studio */}
        <div className="recurso-block w-full bg-gradient-to-b from-[#FAF8F5] to-white py-12 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
              <div className="recurso-content lg:col-span-6 space-y-5 text-left order-1">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                    <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                    <span>Lumê Studio</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                    Para salões e espaços compartilhados.
                  </h2>
                </div>

                {/* Foto no Mobile: Alinhada à Esquerda */}
                <div className="lg:hidden w-full py-1">
                  <div className="w-full max-w-[440px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                    <Image
                      src="/assets/funcionalidades/studio.webp"
                      alt="Espaço Lumê Studio para salões e clínicas"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                  Reúna todas as profissionais do seu espaço em uma só vitrine coletiva.
                </p>

                <ul className="space-y-2.5 pt-1 text-xs sm:text-sm font-medium text-[#3D2E4D]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Vitrine unificada para a equipe</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Cálculo automático de comissões</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Aluguel de cadeira e coworking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Privacidade para cada profissional</span>
                  </li>
                </ul>

                <div className="pt-2 sm:pt-3">
                  <CornerFillButton
                    href="/cadastro"
                    variant="pill"
                    className="px-4 py-2 text-xs sm:text-sm"
                    icon={<ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                  >
                    <span>Conhecer o Studio</span>
                  </CornerFillButton>
                </div>
              </div>

              <div className="recurso-visual hidden lg:flex lg:col-span-6 justify-center order-2">
                <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                  <Image
                    src="/assets/funcionalidades/studio.webp"
                    alt="Espaço Lumê Studio para salões e clínicas"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Galeria Visual de Destaque: Ambientes e Procedimentos */}
        <div id="galeria" className="w-full bg-gradient-to-b from-white to-[#FAF8F5] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card Foto 1: Procedimentos de Beleza */}
              <div className="galeria-card group relative rounded-3xl overflow-hidden border border-[#E8DFD8] bg-white shadow-xs aspect-[4/3]">
                <Image
                  src="/assets/galeria/procedimentos.webp"
                  alt="Procedimentos e atendimento de beleza"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3D2E4D]/80 via-transparent to-transparent flex items-end p-5">
                  <p className="text-white text-xs sm:text-sm font-bold leading-snug">
                    Feito sob medida para lash designers, manicures e esteticistas
                  </p>
                </div>
              </div>

              {/* Card Foto 2: Espaços e Salões */}
              <div className="galeria-card group relative rounded-3xl overflow-hidden border border-[#E8DFD8] bg-white shadow-xs aspect-[4/3]">
                <Image
                  src="/assets/galeria/recepcao.webp"
                  alt="Recepção e atendimento no estúdio de beleza"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3D2E4D]/80 via-transparent to-transparent flex items-end p-5">
                  <p className="text-white text-xs sm:text-sm font-bold leading-snug">
                    Ideal para quem atende em estúdio próprio ou compartilha espaço
                  </p>
                </div>
              </div>

              {/* Card Foto 3: Interface no Celular */}
              <div className="galeria-card group relative rounded-3xl overflow-hidden border border-[#E8DFD8] bg-white shadow-xs aspect-[4/3]">
                <Image
                  src="/assets/galeria/mobile.webp"
                  alt="Aplicativo Lumê no celular"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3D2E4D]/80 via-transparent to-transparent flex items-end p-5">
                  <p className="text-white text-xs sm:text-sm font-bold leading-snug">
                    Prático para você acompanhar tudo direto na palma da mão
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* ===================================================================== */}
      {/* ESPAÇO PARA VÍDEO (TOUR / APRESENTAÇÃO DO PRODUTO 16:9) */}
      {/* ===================================================================== */}
      <section id="video-tour" className="py-16 sm:py-24 bg-white border-b border-[#E8DFD8] scroll-mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>Tour em Vídeo</span>
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Veja o Lumê em funcionamento
            </h2>
          </div>

          {/* Player Container 16:9 */}
          <div className="relative mx-auto w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border-2 border-[#E8DFD8] bg-[#2E223B] shadow-2xl flex items-center justify-center group">
            {/* Player limpo pronto para receber <iframe> ou <video> */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 cursor-pointer">
              <Play className="h-7 w-7 sm:h-9 sm:w-9 text-white fill-white translate-x-0.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. PREÇOS E PLANOS (CARDS COM MESMO TAMANHO, SOLO ESCURO, STUDIO CLARO) */}
      {/* ===================================================================== */}
      <section id="precos" className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8] scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Transparência total</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Acesso completo sem taxas escondidas
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Tudo o que sua operação precisa em uma assinatura simples e transparente.
            </p>
          </div>

          {/* Toggle de Ciclo de Faturamento (Mensal / Anual) */}
          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <div className="inline-flex items-center p-1.5 rounded-full bg-white border border-[#E8DFD8] shadow-sm shadow-[#3D2E4D]/5">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  billingCycle === 'monthly'
                    ? 'bg-[#3D2E4D] text-white shadow-md'
                    : 'text-[#6B5E7A] hover:text-[#3D2E4D]'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-[#3D2E4D] text-white shadow-md'
                    : 'text-[#6B5E7A] hover:text-[#3D2E4D]'
                }`}
              >
                <span>Anual</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-colors duration-200 ${
                    billingCycle === 'annual'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#8C5383]/10 text-[#8C5383] border border-[#8C5383]/15'
                  }`}
                >
                  2 meses grátis
                </span>
              </button>
            </div>
            <p className="text-xs text-[#6B5E7A] font-medium">
              {billingCycle === 'annual'
                ? 'Economize 17% com faturamento anual antecipado'
                : 'Pague mês a mês sem fidelidade ou multa rescisória'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto pt-2">
            
            {/* Box 1: Plano Solo (FUNDO ESCURO NOBRE, BORDA LILÁS LUMÊ, MAIS POPULAR) */}
            <div className="pricing-card bg-gradient-to-b from-[#3D2E4D] via-[#362744] to-[#2B1F37] text-white rounded-3xl p-6 sm:p-9 border-2 border-[#B8A9D9] shadow-xl shadow-[#3D2E4D]/20 ring-4 ring-[#B8A9D9]/15 flex flex-col justify-between h-full relative transition-shadow duration-300 hover:shadow-2xl hover:shadow-[#B8A9D9]/20">
              <span className="absolute -top-3.5 right-6 px-4 py-1 rounded-full bg-[#B8A9D9] text-[#3D2E4D] text-[10px] font-black uppercase tracking-wider shadow-md">
                Mais popular
              </span>
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-2 border-b border-white/10 pb-6 text-center">
                  <div className="h-7 flex items-center justify-center">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#B8A9D9]">
                      Para Profissional Autônoma
                    </span>
                  </div>
                  
                  <div className="h-9 sm:h-10 flex items-center justify-center">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Lumê Individual
                    </h3>
                  </div>

                  <div className="pt-2 pb-1 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-[#D5CBDD]/70 line-through">
                      {billingCycle === 'annual' ? 'De R$ 69,90 por' : 'De R$ 97,00 por'}
                    </span>
                    <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                      <CasinoPriceTicker
                        price={billingCycle === 'annual' ? '57,90' : planPrice.toFixed(2).replace('.', ',')}
                        className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
                        suffixClassName="text-sm text-[#D5CBDD] font-semibold ml-1.5"
                      />
                    </div>
                  </div>

                  <div className="h-6 flex items-center justify-center text-center">
                    <p className="text-[11px] text-[#C4B6CE] font-medium">
                      {billingCycle === 'annual'
                        ? 'R$ 694,80 faturados anualmente (2 meses grátis)'
                        : '30 dias de teste grátis · Cancele quando quiser'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-left flex-1 flex flex-col">
                  <div className="h-9 flex items-center border-b border-white/10 pb-2">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Tudo o que está incluído no plano:
                    </h4>
                  </div>

                  {/* Lista de Tópicos Solo */}
                  <ul className="space-y-3 text-xs flex-1">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Página e vitrine exclusiva:</strong> link personalizado pronto para colocar na bio do Instagram e divulgar.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Agendamento disponível 24/7:</strong> clientes marcam sozinhas a qualquer hora sem precisar baixar aplicativo.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Google Agenda integrado:</strong> sincronização em tempo real em duas vias que evita choque de horários.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Lembretes no WhatsApp:</strong> mensagens automáticas de confirmação para clientes reduzindo faltas e esquecimentos.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Ficha completa de clientes:</strong> histórico detalhado de atendimentos, preferências e fotos dos procedimentos.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Painel financeiro:</strong> acompanhe seus ganhos do dia, semana e mês sem depender de planilhas.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Catálogo de procedimentos:</strong> fotos dos seus trabalhos, valores visíveis, duração e prazos de retorno.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Controle de disponibilidade:</strong> defina seus dias de atendimento, horários de folga e intervalos livres.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">Suporte por WhatsApp:</strong> canal direto e ágil para tirar dúvidas sempre que você precisar.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#FAF7F5] leading-snug">
                        <strong className="text-white">E muito mais:</strong> novas ferramentas e atualizações contínuas para o seu crescimento.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 mt-6">
                <Link
                  href={billingCycle === 'annual' ? '/cadastro?plano=anual' : '/cadastro'}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-[#FAF7F5] py-4 text-xs sm:text-sm font-bold text-[#3D2E4D] shadow-sm hover:shadow-md hover:brightness-[1.02] transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">Começar 30 dias de teste grátis</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </Link>

                {/* Gatilho com setinha para ver mais detalhes (sincronizado) */}
                <button
                  type="button"
                  onClick={() => setShowPlanDetails((prev) => !prev)}
                  className="w-full mt-3.5 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#D5CBDD] hover:text-white transition-colors duration-200 active:scale-[0.98] cursor-pointer group"
                >
                  <span>{showPlanDetails ? 'Ocultar detalhes dos planos' : 'Ver mais detalhes dos planos'}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-250 ease-out ${
                      showPlanDetails ? 'rotate-180 text-white' : 'text-[#D5CBDD]'
                    }`}
                  />
                </button>

                {/* Detalhamento que abre ao clicar (Plano Individual) */}
                {showPlanDetails && (
                  <div className="mt-3.5 border-t border-white/15 pt-4 text-left text-xs space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                      <span className="font-extrabold text-white text-xs tracking-wide flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                        <span>Como funciona na rotina da profissional solo:</span>
                      </span>
                      <span className="text-[10px] text-[#D5CBDD] font-bold uppercase tracking-wider">
                        Autônoma
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Bloco 1 */}
                      <div className="space-y-1 border-b border-white/10 pb-3">
                        <span className="font-bold text-white block text-xs">
                          1. Sua cliente agenda sozinha 24h por dia
                        </span>
                        <p className="text-[11px] text-[#FAF7F5]/90 leading-relaxed">
                          Você coloca seu link na bio do Instagram e WhatsApp. A cliente clica, vê seus procedimentos com fotos e marca na hora o horário livre. Você nunca mais para um atendimento nem perde tempo na folga respondendo mensagens.
                        </p>
                      </div>

                      {/* Bloco 2 */}
                      <div className="space-y-1">
                        <span className="font-bold text-white block text-xs">
                          2. Fim das faltas com avisos automáticos no WhatsApp
                        </span>
                        <p className="text-[11px] text-[#FAF7F5]/90 leading-relaxed">
                          O sistema envia mensagem de confirmação para a cliente antes do horário marcado. Reduz faltas e cancelamentos de última hora em mais de 70%, garantindo que você não perca dinheiro com horário vago na sua agenda.
                        </p>
                      </div>
                    </div>

                    {/* Faixa inferior de benefício */}
                    <div className="flex items-center gap-2 border-t border-white/10 pt-3 text-[11px] text-[#FAF7F5]/90">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Google Agenda integrado:</strong> bloqueia horários pessoais e evita duplicidade de atendimentos.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Lumê Studio (FUNDO CLARO LÍMPIDO, BORDA E ACENTOS VINHO LUMÊ) */}
            <div className="pricing-card bg-white text-[#3D2E4D] rounded-3xl p-6 sm:p-9 border-2 border-[#8C5383] shadow-lg shadow-[#8C5383]/10 ring-2 ring-[#8C5383]/10 flex flex-col justify-between h-full relative transition-shadow duration-300 hover:shadow-xl hover:shadow-[#8C5383]/20">
              <span className="absolute -top-3.5 right-6 px-4 py-1 rounded-full bg-[#8C5383] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                Mais Completo para Espaços
              </span>
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-2 border-b border-[#E8DFD8] pb-6 text-center">
                  <div className="h-7 flex items-center justify-center">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8C5383]">
                      Para Salões & Equipes
                    </span>
                  </div>

                  <div className="h-9 sm:h-10 flex items-center justify-center">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#3D2E4D] tracking-tight">
                      Lumê Studio
                    </h3>
                  </div>

                  <div className="pt-2 pb-1 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-[#6B5E7A]/70 line-through">
                      {billingCycle === 'annual' ? 'De R$ 169,00 por' : 'De R$ 249,00 por'}
                    </span>
                    <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                      <CasinoPriceTicker
                        price={billingCycle === 'annual' ? '139,00' : '169,00'}
                        className="text-4xl sm:text-5xl font-extrabold text-[#3D2E4D] tracking-tight"
                        suffixClassName="text-sm text-[#6B5E7A] font-semibold ml-1.5"
                      />
                    </div>
                  </div>

                  <div className="h-6 flex items-center justify-center text-center">
                    <p className="text-[11px] text-[#6B5E7A] font-medium">
                      {billingCycle === 'annual'
                        ? 'R$ 1.668,00 faturados anualmente (2 meses grátis)'
                        : '30 dias de teste grátis · Até 6 profissionais incluídas'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-left flex-1 flex flex-col">
                  <div className="h-9 flex items-center border-b border-[#E8DFD8] pb-2">
                    <h4 className="text-xs font-extrabold text-[#3D2E4D] uppercase tracking-wider">
                      Recursos exclusivos do Studio:
                    </h4>
                  </div>

                  {/* Lista de Tópicos Studio */}
                  <ul className="space-y-3 text-xs flex-1">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Vitrine coletiva unificada:</strong> página única com fotos do espaço e de toda a equipe.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Repasse e comissões automáticas:</strong> porcentagens configuradas individualmente por profissional.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Aluguel de cadeira e coworking:</strong> flexibilidade total para profissionais autônomas do espaço.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Privacidade garantida:</strong> relatórios, agenda e clientes protegidos para cada parceira.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Agenda da recepção unificada:</strong> visualize todos os horários e cadeiras em uma só tela.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Extrato de repasse no WhatsApp:</strong> envie o demonstrativo de comissão direto para a parceira.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Agendamento assistido:</strong> recepção ou dona podem marcar horários por qualquer profissional.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Termo do Salão-Parceiro (LGPD):</strong> respaldo jurídico alinhado à lei e segurança de dados da equipe.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>Suporte prioritário:</strong> canal direto de atendimento para a sua clínica ou estúdio.
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#3D2E4D] leading-snug">
                        <strong>E muito mais:</strong> todos os recursos e inovações da plataforma liberados para o espaço.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E8DFD8] mt-6">
                <Link
                  href={billingCycle === 'annual' ? '/studio?plano=anual' : '/studio'}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#8C5383] hover:bg-[#783F6F] py-4 text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow-md hover:brightness-[1.03] transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">Conhecer o Lumê Studio</span>
                  <ExternalLink className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </Link>

                {/* Gatilho com setinha para ver mais detalhes (sincronizado) */}
                <button
                  type="button"
                  onClick={() => setShowPlanDetails((prev) => !prev)}
                  className="w-full mt-3.5 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#8C5383] hover:text-[#6A3D63] transition-colors duration-200 active:scale-[0.98] cursor-pointer group"
                >
                  <span>{showPlanDetails ? 'Ocultar detalhes dos planos' : 'Ver mais detalhes dos planos'}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-250 ease-out ${
                      showPlanDetails ? 'rotate-180 text-[#6A3D63]' : 'text-[#8C5383]'
                    }`}
                  />
                </button>

                {/* Detalhamento que abre ao clicar (Lumê Studio) */}
                {showPlanDetails && (
                  <div className="mt-3.5 border-t border-[#8C5383]/20 pt-4 text-left text-xs space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#8C5383]/15">
                      <span className="font-extrabold text-[#3D2E4D] text-xs tracking-wide flex items-center gap-2">
                        <Store className="h-4 w-4 text-[#8C5383] shrink-0" />
                        <span>Como funciona nos 2 modelos de salão:</span>
                      </span>
                      <span className="text-[10px] text-[#8C5383] font-bold uppercase tracking-wider">
                        Salões & Equipes
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Bloco 1 */}
                      <div className="space-y-1 border-b border-[#E8DFD8] pb-3">
                        <span className="font-bold text-[#8C5383] block text-xs">
                          1. Salão com equipe comissionada (tradicional)
                        </span>
                        <p className="text-[11px] text-[#5A4F6A] leading-relaxed">
                          O Lumê calcula a comissão de cada profissional automaticamente por porcentagem. No dia do acerto, você envia o extrato de repasse pronto no WhatsApp da parceira com 1 toque, sem calculadora nem confusão.
                        </p>
                      </div>

                      {/* Bloco 2 */}
                      <div className="space-y-1">
                        <span className="font-bold text-[#3D2E4D] block text-xs">
                          2. Espaço compartilhado (aluguel de cadeira ou maca)
                        </span>
                        <p className="text-[11px] text-[#5A4F6A] leading-relaxed">
                          Cada profissional parceira tem seu próprio login no celular com privacidade blindada: uma nunca vê o dinheiro nem os clientes da outra. Ao mesmo tempo, todas aparecem reunidas na vitrine coletiva do salão.
                        </p>
                      </div>
                    </div>

                    {/* Faixa inferior de benefício */}
                    <div className="flex items-center gap-2 border-t border-[#E8DFD8] pt-3 text-[11px] text-[#5A4F6A]">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Custo zero para as parceiras:</strong> a equipe usa de graça e a recepção visualiza tudo em uma só tela.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. SOBRE O LUMÊ (TEXTOS ORIGINAIS) */}
      {/* ===================================================================== */}
      <section id="sobre" className="py-16 sm:py-24 scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
            <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            <span>Nossa Missão</span>
            <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight max-w-2xl mx-auto">
            Desenvolvido para transformar o fluxo real da beleza
          </h2>

          <p className="text-sm sm:text-base text-[#6B5E7A] font-normal leading-relaxed max-w-2xl mx-auto">
            O Lumê nasceu para libertar profissionais da beleza da rotina caótica de mensagens, horários perdidos e contas no caderno. Sua agenda trabalha por você 24h — você cuida só do que faz de melhor.
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. DÚVIDAS FREQUENTES (FAQ COM TEXTOS ORIGINAIS) */}
      {/* ===================================================================== */}
      <section id="faq" className="py-16 sm:py-24 bg-[#FAF8F5] border-t border-[#E8DFD8] scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Dúvidas Frequentes</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Tudo o que você precisa saber
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Tire suas dúvidas e veja como o Lumê simplifica o dia a dia da sua agenda.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white ${
                    isOpen ? 'border-[#8C5383]/50 shadow-md ring-1 ring-[#8C5383]/20' : 'border-[#E8DFD8] hover:border-[#8C5383]/30 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left transition cursor-pointer gap-4 active:scale-[0.995] duration-150"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#3D2E4D] leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-250 ease-out ${
                        isOpen ? 'bg-[#FAF0F5] text-[#8C5383] rotate-180' : 'bg-[#FAF8F5] text-gray-400'
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed border-t border-gray-100 pt-3 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. CTA FINAL (TEXTOS ORIGINAIS) */}
      {/* ===================================================================== */}
      <section id="cta-final" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="cta-final-card relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-6 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              Pronta para simplificar sua rotina e valorizar seu atendimento?
            </h2>
            
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Leva menos de 5 minutos para configurar sua vitrine e liberar os agendamentos online.
            </p>

            <div className="pt-2 flex justify-center">
              <Link
                href="/cadastro"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-[#FAF7F5] px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-[#3D2E4D] shadow-sm hover:shadow-md hover:brightness-[1.02] transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer max-w-full text-center"
              >
                <span className="truncate sm:whitespace-nowrap">Testar minha agenda grátis (30 dias)</span>
                <ArrowRight className="h-4 w-4 text-[#3D2E4D] shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Smartphone,
  ShieldCheck,
  Lock,
  Scissors,
  MessageCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'
import CornerFillButton from '@/components/ui/CornerFillButton'

export default function JornadaClientePage() {
  const [activeStep, setActiveStep] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const progressLineRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const journeyMoments = [
    {
      number: '01',
      badge: 'Primeiro Contato',
      time: '5 segundos',
      title: 'Acesso pelo link',
      desc: 'A cliente clica no seu link exclusivo (lumebr.app/p/sua-marca). A página abre imediatamente no navegador do celular, sem pedir download na loja de aplicativos, sem cadastro e sem exigir criação de senha.',
      icon: Smartphone,
      highlight: 'Zero atrito: 100% no navegador mobile',
      details: [
        'Compatível com qualquer celular (iOS e Android)',
        'Carregamento ultra-rápido em redes móveis',
        'Visual limpo com sua foto, nome e especialidades',
      ],
    },
    {
      number: '02',
      badge: 'Transparência Total',
      time: '20 segundos',
      title: 'Escolha do serviço',
      desc: 'Ela visualiza seu catálogo completo de serviços com fotos reais em alta resolução, tempo de procedimento e valores exatos. Ela decide com calma e autonomia, eliminando de vez o vai-e-vem no direct perguntando "qual o valor?".',
      icon: Scissors,
      highlight: 'Fim das dúvidas de preço no direct',
      details: [
        'Fotos e descrição detalhada do que está incluso',
        'Duração estimada para cada procedimento',
        'Valores claros e opção de pacotes/combos',
      ],
    },
    {
      number: '03',
      badge: 'Disponibilidade Real',
      time: '15 segundos',
      title: 'Escolha de data e horário',
      desc: 'O Lumê consulta sua agenda em tempo real e bloqueia automaticamente seus intervalos de almoço, pausas e compromissos sincronizados com o Google Agenda. Apenas os horários realmente livres aparecem disponíveis.',
      icon: Calendar,
      highlight: 'Sincronizado com o seu Google Agenda',
      details: [
        'Zero risco de dois agendamentos no mesmo horário',
        'Respeito automático aos seus dias e horários de folga',
        'Regras personalizadas de antecedência mínima',
      ],
    },
    {
      number: '04',
      badge: 'Cuidado Contínuo',
      time: '5 segundos',
      title: 'Confirmação instantânea',
      desc: 'A cliente digita apenas Nome e WhatsApp para finalizar. O horário é reservado na mesma fração de segundo, o comprovante fica salvo no celular dela e o sistema agenda o lembrete automático no WhatsApp.',
      icon: CheckCircle2,
      highlight: 'Redução de mais de 70% nas faltas',
      details: [
        'Comprovante digital na hora para a cliente',
        'Notificação em tempo real no seu painel',
        'Lembrete programado no WhatsApp antes do atendimento',
      ],
    },
  ]

  useLayoutEffect(() => {
    const line = progressLineRef.current
    if (!line) return

    gsap.to(line, {
      scaleY: activeStep / (journeyMoments.length - 1),
      duration: shouldReduceMotion ? 0 : 0.3,
      ease: 'power2.out',
      overwrite: true,
    })

    return () => {
      gsap.killTweensOf(line)
    }
  }, [activeStep, shouldReduceMotion, journeyMoments.length])

  return (
    <div className="landing-motion-scope min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* ===================================================================== */}
      {/* 1. HERO EDITORIAL */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-20 sm:pb-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#B8A9D9]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FAF0F5] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3D2E4D] tracking-tight leading-[1.15]">
            Marcar horário com você deve ser um momento de prazer, não um formulário chato.
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] font-normal leading-relaxed max-w-2xl mx-auto">
            Em menos de 45 segundos, sua cliente escolhe o procedimento, encontra o horário ideal e confirma direto pelo celular. Sem downloads, sem senhas e sem atrito.
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. OS 4 MOMENTOS DA EXPERIÊNCIA DA SUA CLIENTE */}
      {/* ===================================================================== */}
      <section id="momentos" className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8] scroll-mt-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-14">

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>Etapa por Etapa</span>
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
              Os 4 momentos da experiência da sua cliente
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Veja como cada segundo foi desenhado para transmitir profissionalismo e economizar horas do seu dia:
            </p>
          </div>

          <div className="grid items-start gap-6 sm:gap-8 md:grid-cols-[minmax(180px,0.7fr)_minmax(0,1.3fr)]">
            <nav aria-label="Etapas da jornada da cliente" className="relative">
              <div className="absolute left-[19px] top-5 bottom-5 w-px bg-[#E8DFD8]" aria-hidden="true" />
              <div
                ref={progressLineRef}
                className="absolute left-[19px] top-5 bottom-5 w-px origin-top bg-[#8C5383]"
                style={{ transform: 'scaleY(0)' }}
                aria-hidden="true"
              />

              <ol className="relative space-y-2">
                {journeyMoments.map((moment, idx) => {
                  const Icon = moment.icon
                  const isActive = activeStep === idx
                  return (
                    <li key={moment.number}>
                      <motion.button
                        type="button"
                        aria-current={isActive ? 'step' : undefined}
                        aria-label={`Etapa ${moment.number}: ${moment.title}`}
                        onClick={() => {
                          setActiveStep(idx)
                          setDetailsOpen(false)
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.16, ease: 'easeOut' }}
                        className={`relative flex min-h-16 w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C5383] ${
                          isActive ? 'bg-[#FAF7F5]' : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors duration-150 ${
                          isActive
                            ? 'border-[#8C5383] bg-[#8C5383] text-white'
                            : idx < activeStep
                              ? 'border-[#B8A9D9] bg-[#B8A9D9] text-[#3D2E4D]'
                              : 'border-[#D9D0E8] bg-white text-[#8C5383]'
                        }`}>
                          {idx < activeStep ? <CheckCircle2 className="h-4 w-4" /> : moment.number}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C5383]">{moment.badge}</span>
                          <span className={`mt-0.5 block truncate text-xs font-semibold ${isActive ? 'text-[#3D2E4D]' : 'text-[#6B5E7A]'}`}>
                            {moment.title}
                          </span>
                        </span>
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#8C5383]' : 'text-[#A99BB8]'}`} aria-hidden="true" />
                      </motion.button>
                    </li>
                  )
                })}
              </ol>
            </nav>

            <div className="min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                {journeyMoments.map((moment, idx) => idx === activeStep && (
                  <motion.article
                    key={moment.number}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                    className="rounded-3xl border border-[#E8DFD8] bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C5383]">
                          Etapa {moment.number} <span className="px-1 text-[#C7BDD4]">/</span> {moment.time}
                        </span>
                        <h3 className="mt-2 text-lg font-bold leading-snug text-[#3D2E4D] sm:text-xl">
                          {moment.title}
                        </h3>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FAF7F5] text-[#8C5383]">
                        <moment.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#6B5E7A]">
                      {moment.desc}
                    </p>

                    <p className="mt-4 border-l-2 border-[#B8A9D9] pl-3 text-sm font-semibold text-[#4A3F5C]">
                      {moment.highlight}
                    </p>

                    <div className="mt-5 border-t border-[#EEE8F1] pt-4">
                      <button
                        type="button"
                        aria-expanded={detailsOpen}
                        onClick={() => setDetailsOpen((open) => !open)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B5E7A] transition-colors hover:text-[#8C5383] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C5383]"
                      >
                        {detailsOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
                        <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}>
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {detailsOpen && (
                          <motion.ul
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                            className="mt-3 space-y-2 overflow-hidden"
                          >
                            {moment.details.map((detail) => (
                              <li key={detail} className="flex items-start gap-2 text-xs leading-relaxed text-[#6B5E7A]">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8C5383]" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={activeStep === 0}
                        onClick={() => {
                          setActiveStep((step) => Math.max(0, step - 1))
                          setDetailsOpen(false)
                        }}
                        className="inline-flex min-h-10 items-center gap-1 rounded-xl pr-3 text-xs font-semibold text-[#6B5E7A] transition-colors hover:text-[#8C5383] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C5383]"
                      >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                      </button>
                      <span className="text-[11px] font-medium text-[#8C5383]">{idx + 1} de {journeyMoments.length}</span>
                      <button
                        type="button"
                        disabled={activeStep === journeyMoments.length - 1}
                        onClick={() => {
                          setActiveStep((step) => Math.min(journeyMoments.length - 1, step + 1))
                          setDetailsOpen(false)
                        }}
                        className="inline-flex min-h-10 items-center gap-1 rounded-xl pl-3 text-xs font-semibold text-[#6B5E7A] transition-colors hover:text-[#8C5383] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C5383]"
                      >
                        Próxima <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Banner de Tempo Total */}
          <div className="rounded-3xl bg-[#FAF0F5] border border-purple-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1 max-w-xl">
              <span className="text-xs font-black uppercase tracking-wider text-[#8C5383]">
                Tempo Total Médio
              </span>
              <h4 className="text-lg sm:text-xl font-bold text-[#3D2E4D]">
                Menos de 45 segundos para a cliente agendar do início ao fim
              </h4>
              <p className="text-xs sm:text-sm text-[#6B5E7A]">
                Sem mensagens perdidas, sem áudios de confirmação e sem estresse durante os atendimentos.
              </p>
            </div>
            <CornerFillButton href="/cadastro" variant="dark" className="w-full shrink-0 px-8 py-4 text-xs font-bold shadow-md sm:w-auto">
              <span>Experimentar 30 dias grátis</span>
            </CornerFillButton>
          </div>

        </div>
      </section>


      {/* ===================================================================== */}
      {/* 3. QUADRO COMPARATIVO EDITORIAL (ANTES vs. COM O LUMÊ) */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>A Diferença na Prática</span>
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
              O fim do vai-e-vem cansativo no WhatsApp
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Veja como o Lumê substitui o estresse diário por elegância e pontualidade:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Coluna 1: Como era antes */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-red-100 shadow-2xs space-y-6">
              <div className="flex items-center gap-2.5 text-red-700">
                <div className="h-9 w-9 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#3D2E4D]">Sem o Lumê</h3>
                  <p className="text-xs text-gray-500">A rotina caótica das mensagens manuais</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-[#6B5E7A]">
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-2 shrink-0" />
                  <span>A cliente pergunta preço no direct e você demora para responder porque está com as mãos ocupadas atendendo.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-2 shrink-0" />
                  <span>Troca de 10 a 15 mensagens só para encontrar um dia livre que dê certo para as duas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-2 shrink-0" />
                  <span>Você precisa lembrar de mandar mensagem na véspera para a cliente não faltar ou esquecer.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-2 shrink-0" />
                  <span>Clientes de madrugada desistem porque você está dormindo e não pode responder na hora.</span>
                </li>
              </ul>
            </div>

            {/* Coluna 2: Com o Lumê */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 border-2 border-[#8C5383]/40 shadow-md space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-[#8C5383] text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                Mais Tempo Livre
              </div>

              <div className="flex items-center gap-2.5 text-emerald-700">
                <div className="h-9 w-9 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#3D2E4D]">Com o Lumê</h3>
                  <p className="text-xs text-gray-500">Agendamento autônomo e profissional</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-[#4A3F5C]">
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>Seu link fica disponível na bio 24 horas por dia com fotos reais, durações e preços atualizados.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>A cliente escolhe o melhor dia e confirma tudo em 45 segundos direto pelo celular dela.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>Lembrete automático com dados do atendimento enviado diretamente para o WhatsApp da cliente.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>Você acorda de manhã com a agenda organizada e preenchida sem ter encostado no celular.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. AUTOMAÇÃO INVISÍVEL (3 DESTAQUES ESSENCIAIS) */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-t border-[#E8DFD8]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D2E4D] tracking-tight">
              O que acontece nos bastidores enquanto você atende
            </h2>
            <p className="text-sm text-[#6B5E7A]">
              Três garantias automáticas que protegem a sua paz de espírito:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Zero Conflito de Horário</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Assim que a vaga é reservada, ela sai da vitrine na mesma fração de segundo e é sincronizada no seu Google Calendar.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Lembretes Antifalta</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Avisos programados com antecedência reduzem faltas e atrasos em mais de 70%, mantendo a cliente informada.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 text-[#3D2E4D] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Regras de Antecedência</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Você define com quantas horas de antecedência permite cancelamentos ou novos agendamentos no mesmo dia.
              </p>
            </div>

          </div>

        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

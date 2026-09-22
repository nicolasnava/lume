'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import {
  CalendarCheck,
  MessageSquare,
  Clock,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'

interface FinancialSimulatorProps {
  planPrice?: number
}

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  className = '',
}: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const spanRef = useRef<HTMLSpanElement | null>(null)
  const prevValueRef = useRef<number>(value)

  useEffect(() => {
    if (!spanRef.current) return
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isReduced) {
      spanRef.current.textContent = `${prefix}${Math.round(value).toLocaleString('pt-BR')}${suffix}`
      prevValueRef.current = value
      return
    }

    const obj = { val: prevValueRef.current }
    const tween = gsap.to(obj, {
      val: value,
      duration: 0.22,
      ease: 'power2.out',
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = `${prefix}${Math.round(obj.val).toLocaleString('pt-BR')}${suffix}`
        }
      },
      onComplete: () => {
        prevValueRef.current = value
      },
    })

    return () => {
      tween.kill()
    }
  }, [value, prefix, suffix])

  return (
    <span ref={spanRef} className={className}>
      {prefix}
      {Math.round(value).toLocaleString('pt-BR')}
      {suffix}
    </span>
  )
}

export default function FinancialSimulator({ planPrice = 69.9 }: FinancialSimulatorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [clientesSemana, setClientesSemana] = useState<number>(20)
  const [ticketMedio, setTicketMedio] = useState<number>(80)
  const [showDisclaimerStep2, setShowDisclaimerStep2] = useState<boolean>(false)
  const [showDisclaimerStep3, setShowDisclaimerStep3] = useState<boolean>(false)

  const simulatorRef = useRef<HTMLElement | null>(null)
  const stepContentRef = useRef<HTMLDivElement | null>(null)
  const finalResultCardRef = useRef<HTMLDivElement | null>(null)

  // Rola suavemente para o início do simulador
  const scrollToSimulator = () => {
    if (simulatorRef.current) {
      const topOffset = 80 // offset do header fixo
      const elementPosition = simulatorRef.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - topOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const goToStep = (newStep: 1 | 2 | 3) => {
    setStep(newStep)
    setTimeout(() => {
      scrollToSimulator()
    }, 50)
  }

  // Animação GSAP adaptativa na troca de etapas (fade + sutil offset vertical)
  useEffect(() => {
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isReduced) return

    if (stepContentRef.current) {
      gsap.fromTo(
        stepContentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }

    if (step === 3 && finalResultCardRef.current) {
      gsap.fromTo(
        finalResultCardRef.current,
        { scale: 0.98, opacity: 0.75 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out', delay: 0.05 }
      )
    }

    return () => {
      if (stepContentRef.current) gsap.killTweensOf(stepContentRef.current)
      if (finalResultCardRef.current) gsap.killTweensOf(finalResultCardRef.current)
    }
  }, [step])

  // Cálculos de Projeção Financeira
  const clientesMes = Math.round(clientesSemana * 4.3)
  const faturamentoBase = clientesMes * ticketMedio
  const faltasRecuperadas = Math.round(faturamentoBase * 0.16) // 16% de faltas evitadas com lembretes automáticos
  const agendamentosNoturnos = Math.round(faturamentoBase * 0.18) // 18% de novas marcações fora do expediente 24h
  const potencialTotal = faltasRecuperadas + agendamentosNoturnos
  const faturamentoComLume = faturamentoBase + potencialTotal
  const horasPoupadas = Math.round((clientesSemana * 15 * 4.3) / 60) // ~15 min por cliente economizados no WhatsApp
  const roiMultiplicador = Math.max(1, Math.round(potencialTotal / (planPrice || 69.9)))

  return (
    <section
      id="simulador"
      ref={simulatorRef}
      className="py-12 sm:py-20 bg-[#FAF7F5] border-b border-[#E5E7EB] scroll-mt-20"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="relative overflow-hidden bg-white p-6 sm:p-10 md:p-12 rounded-3xl sm:rounded-[2.5rem] border border-[#E5E7EB] shadow-xl shadow-[#4A3F5C]/5 space-y-6 sm:space-y-8 text-[#4A3F5C]">
          
          {/* Brilhos suaves decorativos de fundo */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#B8A9D9]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#FAF7F5] rounded-full blur-3xl pointer-events-none" />

          {/* ========================================================================= */}
          {/* CABEÇALHO & INDICADOR DE PROGRESSO (1 de 3 / 2 de 3 / 3 de 3) */}
          {/* ========================================================================= */}
          <div className="relative z-10 space-y-4 border-b border-[#E5E7EB] pb-5 sm:pb-6 text-left">
            
            {/* Linha superior: indicador textual e barras de progresso */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs sm:text-sm font-bold tracking-wide text-[#4A3F5C]">
                {step} de 3
              </span>
              <div
                className="grid grid-cols-3 gap-2 flex-1 max-w-[200px] sm:max-w-[240px]"
                role="progressbar"
                aria-valuenow={step}
                aria-valuemin={1}
                aria-valuemax={3}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step >= 1 ? 'bg-[#4A3F5C]' : 'bg-[#EFE8F4]'
                  }`}
                />
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step >= 2 ? 'bg-[#4A3F5C]' : 'bg-[#EFE8F4]'
                  }`}
                />
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step >= 3 ? 'bg-[#4A3F5C]' : 'bg-[#EFE8F4]'
                  }`}
                />
              </div>
            </div>

            {/* Títulos e Subtítulos Dinâmicos por Etapa */}
            <div className="space-y-2 pt-1">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#4A3F5C] tracking-tight leading-snug">
                {step === 1 && 'Descubra quanto dinheiro sua agenda está deixando escapar'}
                {step === 2 && 'De onde vem o dinheiro que sua agenda está deixando escapar?'}
                {step === 3 && 'Sua agenda pode gerar até:'}
              </h2>
              <p className="text-xs sm:text-sm text-[#4A3F5C]/80 leading-relaxed font-medium">
                {step === 1 &&
                  'Responda 2 perguntas e veja quanto você pode recuperar reduzindo faltas, horários vazios e mensagens manuais.'}
                {step === 2 &&
                  'Pequenas perdas na rotina podem representar milhares de reais no fim do mês.'}
                {step === 3 &&
                  'Clientes confirmadas, menos tempo perdido e faturamento trabalhando mesmo quando você não está online.'}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TELA 1: IDENTIFICAÇÃO DO POTENCIAL */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div
              key="step-1"
              ref={stepContentRef}
              className="relative z-10 space-y-5 sm:space-y-6 text-left"
            >
              {/* Campo 1: Quantos atendimentos por semana */}
              <div className="bg-[#FAF7F5] p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label htmlFor="sim-clientes-slider" className="text-xs sm:text-sm font-bold text-[#4A3F5C]">
                    Quantos atendimentos você realiza por semana?
                  </label>
                  <span className="text-xl sm:text-2xl font-black text-[#4A3F5C] tracking-tight whitespace-nowrap">
                    <AnimatedNumber value={clientesSemana} suffix=" clientes/sem" />
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-[#4A3F5C]/75 font-medium">
                  Aproximadamente <strong className="text-[#4A3F5C] font-bold"><AnimatedNumber value={clientesMes} suffix=" atendimentos" /></strong> por mês na sua rotina.
                </p>

                <div className="pt-2">
                  <input
                    id="sim-clientes-slider"
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={clientesSemana}
                    aria-label="Quantos atendimentos você realiza por semana?"
                    aria-valuemin={5}
                    aria-valuemax={80}
                    aria-valuenow={clientesSemana}
                    aria-valuetext={`${clientesSemana} clientes por semana`}
                    onChange={(e) => setClientesSemana(Number(e.target.value))}
                    className="w-full h-2.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#4A3F5C]"
                  />
                  <div className="flex justify-between text-[11px] text-[#4A3F5C]/70 font-semibold pt-1">
                    <span>5 clientes</span>
                    <span>40 clientes</span>
                    <span>80+ clientes</span>
                  </div>
                </div>
              </div>

              {/* Campo 2: Valor médio por atendimento */}
              <div className="bg-[#FAF7F5] p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label htmlFor="sim-ticket-slider" className="text-xs sm:text-sm font-bold text-[#4A3F5C]">
                    Qual é o valor médio dos seus atendimentos?
                  </label>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight whitespace-nowrap">
                    <AnimatedNumber value={ticketMedio} prefix="R$ " suffix=",00" />
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-[#4A3F5C]/75 font-medium">
                  Considere o valor médio cobrado por procedimento ou serviço realizado.
                </p>

                <div className="pt-2">
                  <input
                    id="sim-ticket-slider"
                    type="range"
                    min="20"
                    max="350"
                    step="5"
                    value={ticketMedio}
                    aria-label="Qual é o valor médio dos seus atendimentos?"
                    aria-valuemin={20}
                    aria-valuemax={350}
                    aria-valuenow={ticketMedio}
                    aria-valuetext={`R$ ${ticketMedio}`}
                    onChange={(e) => setTicketMedio(Number(e.target.value))}
                    className="w-full h-2.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[11px] text-[#4A3F5C]/70 font-semibold pt-1">
                    <span>R$ 20</span>
                    <span>R$ 150</span>
                    <span>R$ 350+</span>
                  </div>
                </div>
              </div>

              {/* Ações da Tela 1 */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="group w-full min-h-[52px] sm:min-h-[56px] flex items-center justify-center gap-2.5 rounded-2xl bg-[#4A3F5C] hover:bg-[#3D2E4D] text-white text-sm sm:text-base font-bold shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
                >
                  <span>Descobrir meu potencial de ganho</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </button>
                <p className="text-center text-[11px] text-[#4A3F5C]/70 font-medium">
                  Leva menos de 30 segundos · Não precisa fazer cadastro
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA 2: DIAGNÓSTICO FINANCEIRO */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div
              key="step-2"
              ref={stepContentRef}
              className="relative z-10 space-y-4 sm:space-y-5 text-left"
            >
              <div className="space-y-3">
                {/* Bloco 1: Faltas e horários vazios */}
                <div className="bg-[#FAF7F5] p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[#4A3F5C]">
                        Faltas e horários vazios
                      </h4>
                      <p className="text-xs text-[#4A3F5C]/80 leading-relaxed font-medium">
                        Lembretes e confirmações automáticas ajudam a reduzir faltas e preencher horários que ficariam vazios.
                      </p>
                    </div>
                  </div>

                  {/* Card do valor comprido de uma extremidade a outra */}
                  <div className="w-full bg-white px-4 sm:px-5 py-3 rounded-xl border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-3">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4A3F5C]/70">
                      Potencial recuperável
                    </span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-700 tracking-tight whitespace-nowrap">
                      + R$ <AnimatedNumber value={faltasRecuperadas} suffix="/mês" />
                    </span>
                  </div>
                </div>

                {/* Bloco 2: Tempo perdido respondendo mensagens */}
                <div className="bg-[#FAF7F5] p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-purple-50 text-[#8675A9] flex items-center justify-center shrink-0 border border-purple-200/80 shadow-2xs">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[#4A3F5C]">
                        Tempo perdido respondendo mensagens
                      </h4>
                      <p className="text-xs text-[#4A3F5C]/80 leading-relaxed font-medium">
                        Sua cliente agenda sozinha, sem você precisar interromper um atendimento para responder perguntas e combinar horários.
                      </p>
                    </div>
                  </div>

                  {/* Card do valor comprido de uma extremidade a outra */}
                  <div className="w-full bg-white px-4 sm:px-5 py-3 rounded-xl border border-purple-200/80 shadow-2xs flex items-center justify-between gap-3">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4A3F5C]/70">
                      Tempo economizado
                    </span>
                    <span className="text-lg sm:text-2xl font-black text-[#4A3F5C] tracking-tight whitespace-nowrap">
                      ~<AnimatedNumber value={horasPoupadas} suffix=" horas/mês" />
                    </span>
                  </div>
                </div>

                {/* Bloco 3: Agendamentos fora do expediente */}
                <div className="bg-[#FAF7F5] p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[#4A3F5C]">
                        Agendamentos fora do expediente
                      </h4>
                      <p className="text-xs text-[#4A3F5C]/80 leading-relaxed font-medium">
                        Sua agenda continua recebendo pedidos à noite e nos fins de semana, mesmo quando você está descansando.
                      </p>
                    </div>
                  </div>

                  {/* Card do valor comprido de uma extremidade a outra */}
                  <div className="w-full bg-white px-4 sm:px-5 py-3 rounded-xl border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-3">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4A3F5C]/70">
                      Potencial recuperável
                    </span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-700 tracking-tight whitespace-nowrap">
                      + R$ <AnimatedNumber value={agendamentosNoturnos} suffix="/mês" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumo financeiro somado */}
              <div className="bg-[#FAF7F5] p-5 rounded-2xl border-2 border-emerald-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#4A3F5C]">
                        Potencial financeiro total estimado
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowDisclaimerStep2(!showDisclaimerStep2)}
                        className="p-1 text-[#4A3F5C]/70 hover:text-[#4A3F5C] transition rounded-full hover:bg-black/5 cursor-pointer inline-flex items-center justify-center"
                        title={showDisclaimerStep2 ? 'Ocultar detalhes' : 'Ver como é calculada a estimativa'}
                        aria-expanded={showDisclaimerStep2}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            showDisclaimerStep2 ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-[#4A3F5C]/75 font-medium">
                      Recuperação de horários vazios
                    </p>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 whitespace-nowrap self-start sm:self-auto">
                    + R$ <AnimatedNumber value={potencialTotal} suffix="/mês" />
                  </span>
                </div>

                {/* Disclaimer revelado pela setinha na etapa 2 */}
                {showDisclaimerStep2 && (
                  <p className="text-[10px] sm:text-[11px] text-[#4A3F5C]/70 pt-2 border-t border-emerald-200/60 leading-relaxed font-normal animate-in fade-in duration-200">
                    Estimativa baseada nos números informados. Os resultados reais variam conforme a demanda, o ticket médio, a taxa de ocupação e o comportamento das clientes.
                  </p>
                )}
              </div>

              {/* Ações da Tela 2 */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="w-full sm:w-auto py-2.5 px-4 text-xs font-bold text-[#4A3F5C]/80 hover:text-[#4A3F5C] transition cursor-pointer text-center"
                >
                  ← Voltar e ajustar números
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="group w-full sm:flex-1 min-h-[52px] sm:min-h-[56px] flex items-center justify-center gap-2 rounded-2xl bg-[#4A3F5C] hover:bg-[#3D2E4D] text-white text-sm sm:text-base font-bold shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
                >
                  <span>Ver meu resultado final</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA 3: RESULTADO FINAL */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div
              key="step-3"
              ref={stepContentRef}
              className="relative z-10 space-y-5 sm:space-y-6 text-left"
            >
              
              {/* Bloco principal de resultado (Destaque em Roxo Profundo com Valor em Verde Esmeralda) */}
              <div
                ref={finalResultCardRef}
                className="bg-[#4A3F5C] p-6 sm:p-10 rounded-3xl text-center space-y-3 shadow-xl text-white"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400">
                    POTENCIAL DE GANHO ESTIMADO
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDisclaimerStep3(!showDisclaimerStep3)}
                    className="p-1 text-emerald-300 hover:text-white transition rounded-full hover:bg-white/10 cursor-pointer inline-flex items-center justify-center"
                    title={showDisclaimerStep3 ? 'Ocultar detalhes' : 'Ver como é calculada a estimativa'}
                    aria-expanded={showDisclaimerStep3}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showDisclaimerStep3 ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Disclaimer revelado pela setinha na etapa 3 */}
                {showDisclaimerStep3 && (
                  <div className="animate-in fade-in duration-200 bg-white/10 rounded-xl p-3 max-w-lg mx-auto border border-white/10 text-left sm:text-center">
                    <p className="text-[11px] sm:text-xs text-[#E8DEF8] leading-relaxed font-normal">
                      Estimativa baseada nos números informados. Os resultados reais variam conforme a demanda, o ticket médio, a taxa de ocupação e o comportamento das clientes.
                    </p>
                  </div>
                )}

                <div className="flex items-baseline justify-center gap-1.5 pt-1 whitespace-nowrap flex-nowrap">
                  <span className="text-4xl sm:text-6xl md:text-7xl font-black text-emerald-300 tracking-tight drop-shadow-sm whitespace-nowrap">
                    + R$ <AnimatedNumber value={potencialTotal} />
                  </span>
                  <span className="text-sm sm:text-2xl font-bold text-[#E8DEF8] whitespace-nowrap">
                    /mês
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#D1C4E9] font-medium max-w-md mx-auto pt-1 leading-relaxed">
                  Um potencial estimado de aproximadamente <strong className="text-white font-black"><AnimatedNumber value={roiMultiplicador} />x</strong> sobre o investimento mensal no Lumê.
                </p>
              </div>

              {/* Três Indicadores Resumidos */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
                <div className="bg-[#FAF7F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] text-center space-y-1">
                  <span className="text-[10px] sm:text-xs font-bold text-[#4A3F5C]/80 block truncate">
                    Faltas evitadas
                  </span>
                  <span className="text-xs sm:text-base font-black text-emerald-700 block whitespace-nowrap">
                    <AnimatedNumber value={faltasRecuperadas} prefix="+ R$ " />
                  </span>
                </div>

                <div className="bg-[#FAF7F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] text-center space-y-1">
                  <span className="text-[10px] sm:text-xs font-bold text-[#4A3F5C]/80 block truncate">
                    Agenda 24h
                  </span>
                  <span className="text-xs sm:text-base font-black text-emerald-700 block whitespace-nowrap">
                    <AnimatedNumber value={agendamentosNoturnos} prefix="+ R$ " />
                  </span>
                </div>

                <div className="bg-[#FAF7F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] text-center space-y-1">
                  <span className="text-[10px] sm:text-xs font-bold text-[#4A3F5C]/80 block truncate">
                    Tempo poupado
                  </span>
                  <span className="text-xs sm:text-base font-black text-[#4A3F5C] block whitespace-nowrap">
                    ~<AnimatedNumber value={horasPoupadas} suffix="h/mês" />
                  </span>
                </div>
              </div>

              {/* Comparativo: Cenário atual x Com o Lumê */}
              <div className="bg-[#FAF7F5] p-4 sm:p-6 rounded-2xl border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-[#4A3F5C]/80 font-medium">
                    Cenário atual, com organização manual:
                  </span>
                  <span className="font-bold text-[#4A3F5C] whitespace-nowrap shrink-0">
                    R$ <AnimatedNumber value={faturamentoBase} suffix="/mês" />
                  </span>
                </div>
                <div className="h-px bg-[#E5E7EB]" />
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-[#4A3F5C] font-bold">
                    Com o Lumê, potencial estimado:
                  </span>
                  <span className="font-black text-emerald-700 text-base sm:text-xl whitespace-nowrap shrink-0">
                    R$ <AnimatedNumber value={faturamentoComLume} suffix="/mês" />
                  </span>
                </div>
              </div>

              {/* CTAs Finais */}
              <div className="space-y-2 pt-2">
                <Link
                  href="/cadastro"
                  className="group w-full min-h-[54px] sm:min-h-[58px] flex items-center justify-center gap-2.5 rounded-2xl bg-[#4A3F5C] hover:bg-[#3D2E4D] text-white text-sm sm:text-base font-bold shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer text-center px-4"
                >
                  <span>Quero recuperar esse potencial</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </Link>

                <p className="text-center text-[11px] text-[#4A3F5C]/75 font-medium">
                  Comece a organizar sua agenda e transforme oportunidades perdidas em faturamento.
                </p>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs sm:text-sm font-bold text-[#4A3F5C]/80 hover:text-[#4A3F5C] transition cursor-pointer"
                  >
                    ← Recalcular com outros números
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}

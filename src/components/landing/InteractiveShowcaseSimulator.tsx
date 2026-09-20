'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import {
  Smartphone,
  Scissors,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Instagram,
  MessageCircle,
  ShieldCheck,
  Lock,
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingBag,
  CalendarCheck,
  ExternalLink,
  User,
} from 'lucide-react'

const DEMO_URL = '/p/camila-duarte'

export type SimulatorStep = 0 | 1 | 2 | 3 | 4 | 5

interface StepItem {
  step: SimulatorStep
  number: string
  shortTitle: string
  subtitle: string
  title: string
  desc: string
  url: string
}

export default function InteractiveShowcaseSimulator() {
  const [screenStep, setScreenStep] = useState<SimulatorStep>(0)
  const stepCardRef = useRef<HTMLDivElement | null>(null)
  const confirmBadgeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isReduced) return

    if (stepCardRef.current) {
      gsap.fromTo(
        stepCardRef.current,
        { opacity: 0, x: 8 },
        { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' }
      )
    }

    if (screenStep === 5 && confirmBadgeRef.current) {
      gsap.fromTo(
        confirmBadgeRef.current,
        { scale: 0.82, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)', delay: 0.1 }
      )
    }

    return () => {
      if (stepCardRef.current) gsap.killTweensOf(stepCardRef.current)
      if (confirmBadgeRef.current) gsap.killTweensOf(confirmBadgeRef.current)
    }
  }, [screenStep])

  const steps: StepItem[] = [
    {
      step: 0,
      number: '01',
      shortTitle: 'Vitrine',
      subtitle: 'Link na bio',
      title: 'Vitrine exclusiva da profissional',
      desc: 'Sua cliente abre o link direto pelo navegador do celular sem precisar baixar aplicativo nem criar senha.',
      url: 'lumebr.app/p/camila-duarte',
    },
    {
      step: 1,
      number: '02',
      shortTitle: 'Escolher serviço',
      subtitle: 'Catálogo com fotos e valores',
      title: 'Escolha do procedimento desejado',
      desc: 'Catálogo limpo com fotos reais, duração e valores visíveis sem precisar perguntar no direct.',
      url: 'lumebr.app/p/camila-duarte/servico',
    },
    {
      step: 2,
      number: '03',
      shortTitle: 'Dia',
      subtitle: 'Datas disponíveis',
      title: 'Seleção do dia no calendário',
      desc: 'Calendário inteligente que exibe apenas as datas com atendimento disponível, bloqueando folgas automaticamente.',
      url: 'lumebr.app/p/camila-duarte/dia',
    },
    {
      step: 3,
      number: '04',
      shortTitle: 'Hora',
      subtitle: 'Horários sem conflito',
      title: 'Escolha do horário de atendimento',
      desc: 'Sincronização em tempo real com o Google Agenda, evitando choques de horário com compromissos pessoais.',
      url: 'lumebr.app/p/camila-duarte/hora',
    },
    {
      step: 4,
      number: '05',
      shortTitle: 'Dados',
      subtitle: 'Nome e WhatsApp',
      title: 'Identificação rápida e sem burocracia',
      desc: 'Apenas nome e telefone para contato. Sem cadastros demorados e sem senhas para lembrar.',
      url: 'lumebr.app/p/camila-duarte/dados',
    },
    {
      step: 5,
      number: '06',
      shortTitle: 'Confirmação',
      subtitle: 'Reserva instantânea',
      title: 'Reserva instantânea e comprovante',
      desc: 'Horário confirmado no mesmo segundo com comprovante oficial e aviso automático no WhatsApp da cliente.',
      url: 'lumebr.app/p/camila-duarte/confirmacao',
    },
  ]

  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [dragDistance, setDragDistance] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const SWIPE_THRESHOLD = 35

  const nextStep = () => {
    setScreenStep((prev) => (prev < 5 ? ((prev + 1) as SimulatorStep) : 0))
  }

  const prevStep = () => {
    setScreenStep((prev) => (prev > 0 ? ((prev - 1) as SimulatorStep) : 5))
  }

  // Handlers para arrastar/deslizar com toque no celular
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
    setDragDistance(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - touchStartX
    const diffY = currentY - touchStartY

    // Se o movimento for predominantemente horizontal, registra a distância do drag
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragDistance(diffX)
    }
  }

  const handleTouchEnd = () => {
    if (touchStartX !== null) {
      if (dragDistance < -SWIPE_THRESHOLD) {
        nextStep()
      } else if (dragDistance > SWIPE_THRESHOLD) {
        prevStep()
      }
    }
    setTouchStartX(null)
    setTouchStartY(null)
    setDragDistance(0)
  }

  // Handlers para arrastar/deslizar com mouse no PC
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setTouchStartX(e.clientX)
    setDragDistance(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStartX === null) return
    setDragDistance(e.clientX - touchStartX)
  }

  const handleMouseUp = () => {
    if (isDragging && touchStartX !== null) {
      if (dragDistance < -SWIPE_THRESHOLD) {
        nextStep()
      } else if (dragDistance > SWIPE_THRESHOLD) {
        prevStep()
      }
    }
    setIsDragging(false)
    setTouchStartX(null)
    setDragDistance(0)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp()
    }
  }

  // Distância efetiva do arraste com amortecimento elástico nas pontas
  const effectiveDrag =
    (screenStep === 0 && dragDistance > 0) || (screenStep === 5 && dragDistance < 0)
      ? dragDistance * 0.22
      : dragDistance

  // Componente que renderiza a tela do iPhone em formato de carrossel deslizante nativo
  const renderPhoneScreen = () => (
    <div className="bg-[#FAF7F5] rounded-[38px] overflow-hidden flex flex-col text-[#4A3F5C] select-none relative h-[490px] xs:h-[530px] sm:h-[590px] w-full shadow-inner">
      
      {/* Dynamic Island do iPhone */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 h-[24px] w-[96px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm pointer-events-none">
        {/* Lente da Câmera Frontal */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#0d0d0f] ring-1 ring-[#1f1f24] flex items-center justify-center">
          <span className="w-1 h-1 rounded-full bg-blue-950/70" />
        </div>
        {/* Sensor / Indicador de Privacidade */}
        <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
      </div>

      {/* Barra de Status Oficial do iPhone */}
      <div className="h-9 bg-white px-6 flex items-center justify-between text-[11px] font-semibold text-[#1a1820] select-none shrink-0 z-30 pt-0.5 border-b border-gray-100">
        <span className="font-bold tracking-tight">09:41</span>
        <div className="flex items-center gap-1.5">
          {/* 4 Barras de Sinal de Celular */}
          <div className="flex items-end gap-[1.5px] h-2.5" aria-hidden="true">
            <span className="w-[2.5px] h-1 bg-[#1a1820] rounded-[0.5px]" />
            <span className="w-[2.5px] h-1.5 bg-[#1a1820] rounded-[0.5px]" />
            <span className="w-[2.5px] h-2 bg-[#1a1820] rounded-[0.5px]" />
            <span className="w-[2.5px] h-2.5 bg-[#1a1820] rounded-[0.5px]" />
          </div>
          <span className="text-[10px] font-bold">5G</span>
          {/* Ícone de Bateria do iPhone */}
          <div className="flex items-center" aria-hidden="true">
            <div className="w-5 h-2.5 rounded-[4px] border border-[#1a1820] p-[1px] flex items-center">
              <div className="h-full w-3.5 bg-[#1a1820] rounded-[2px]" />
            </div>
            <div className="w-[1.5px] h-1 bg-[#1a1820] rounded-r-xs ml-[0.5px]" />
          </div>
        </div>
      </div>

      {/* Barra de Endereço do Navegador Safari */}
      <div className="bg-white px-3 py-1.5 border-b border-gray-200/80 flex items-center justify-between text-[11px] shrink-0 z-30">
        <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1 rounded-full text-[#4A3F5C] font-semibold border border-gray-200/70 w-[205px] truncate shadow-2xs">
          <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
          <span className="truncate text-[10px]">
            {steps[screenStep].url}
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#8C5383] bg-[#FAF0F5] px-2 py-0.5 rounded-full border border-[#8C5383]/20">
          {screenStep + 1}/6
        </span>
      </div>

      {/* Carrossel Horizontal de Telas com Deslize Suave e Fluido */}
      <div className="flex-1 relative overflow-hidden pointer-events-none">
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(calc(-${screenStep * 100}% + ${effectiveDrag}px))`,
            transition: isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {/* SLIDE 0: VITRINE */}
          <div className="w-full h-full shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <header className="w-full bg-white border-b border-gray-200/80">
              <div className="relative w-full">
                <div className="relative h-28 w-full bg-gray-900 overflow-hidden">
                  <Image
                    src="/assets/galeria/recepcao.webp"
                    alt="Capa do Studio Camila Duarte"
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />
                </div>

                <div className="max-w-xl mx-auto px-4 text-center pb-3 pt-0">
                  <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-[#B8A9D9] shadow-xl bg-white -mt-8 z-20 ring-4 ring-white/90">
                    <Image
                      src="/assets/lume_icon.webp"
                      alt="Studio Camila Duarte"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <h1 className="mt-2 text-base font-bold tracking-tight text-[#4A3F5C]">
                    Studio Camila Duarte
                  </h1>

                  <p className="mt-0.5 text-[10px] text-[#4A3F5C]/75 italic font-medium max-w-[240px] mx-auto">
                    &ldquo;Realçando sua beleza natural com exclusividade e arte&rdquo;
                  </p>

                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Aberto
                    </span>

                    <div className="inline-flex items-center justify-center p-1 rounded-full bg-white text-gray-600 border border-gray-200 shadow-2xs">
                      <Clock className="h-3 w-3 text-[#B8A9D9]" />
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
                      <Instagram className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs">
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-[#4A3F5C] shadow-xs">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="p-3.5 space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-tight text-[#4A3F5C] flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5 text-[#B8A9D9]" />
                    <span>Nossos Serviços</span>
                  </h2>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    3 disponíveis
                  </span>
                </div>

                <div
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-0.5 px-0.5 no-scrollbar"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="snap-center shrink-0 w-[84%] flex flex-col rounded-2xl overflow-hidden shadow-xs border border-gray-200/80 bg-white text-left">
                    <div className="relative w-full h-28 shrink-0 overflow-hidden bg-gray-100">
                      <Image
                        src="/assets/galeria/volume_russo.webp"
                        alt="Extensão de Cílios - Volume Russo Premium"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white border border-white/20">
                          <Clock className="h-2.5 w-2.5" />
                          120 min
                        </span>
                      </div>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1 bg-white space-y-2">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-extrabold text-[#4A3F5C] leading-snug line-clamp-1">
                          Extensão Volume Russo Premium
                        </h3>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                          Fans artesanais de 3D a 6D com fios ultrafinos de seda.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-700">
                          R$ 220,00
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#B8A9D9] text-[#4A3F5C] shadow-2xs">
                          <CalendarCheck className="h-3 w-3" />
                          <span>Agendar</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="snap-center shrink-0 w-[84%] flex flex-col rounded-2xl overflow-hidden shadow-xs border border-gray-200/80 bg-white text-left">
                    <div className="relative w-full h-28 shrink-0 overflow-hidden bg-gray-100">
                      <Image
                        src="/assets/galeria/sobrancelhas.webp"
                        alt="Design Estratégico com Henna"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white border border-white/20">
                          <Clock className="h-2.5 w-2.5" />
                          45 min
                        </span>
                      </div>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1 bg-white space-y-2">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-extrabold text-[#4A3F5C] leading-snug line-clamp-1">
                          Design Estratégico com Henna
                        </h3>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                          Mapeamento facial e aplicação de henna de alta fixação.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-700">
                          R$ 75,00
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#B8A9D9] text-[#4A3F5C] shadow-2xs">
                          <CalendarCheck className="h-3 w-3" />
                          <span>Agendar</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 space-y-1.5">
                  <div className="w-full py-2.5 rounded-xl font-extrabold text-xs text-[#4A3F5C] bg-[#B8A9D9] shadow-md flex items-center justify-center gap-1.5">
                    <CalendarCheck className="h-4 w-4 text-[#4A3F5C]" />
                    <span>Agendar Agora</span>
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* SLIDE 1: ESCOLHER SERVIÇO */}
          <div className="w-full h-full shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="p-3.5 space-y-3.5">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A3F5C]">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Voltar para a vitrine</span>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-sm space-y-3">
                <div className="relative w-full h-32 bg-gray-100">
                  <Image
                    src="/assets/galeria/volume_russo.webp"
                    alt="Extensão de Cílios - Volume Russo Premium"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="p-3.5 space-y-2.5 text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8C5383] bg-[#FAF0F5] px-2 py-0.5 rounded-full inline-block">
                      Procedimento Selecionado
                    </span>
                    <h4 className="text-sm font-extrabold text-[#3D2E4D]">Volume Russo Premium</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Fans artesanais de 3D a 6D com fios ultrafinos de seda. Proporciona acabamento aveludado e olhar marcante sem sobrecarregar os fios naturais.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF0F5] text-xs">
                    <span className="flex items-center gap-1 font-semibold text-gray-600 text-[11px]">
                      <Clock className="h-3.5 w-3.5 text-[#8C5383]" /> 2h (120 minutos)
                    </span>
                    <span className="font-black text-emerald-700 text-sm">
                      R$ 220,00
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[10px] text-gray-600">
                    <span className="font-bold text-[#3D2E4D] block">O que está incluso:</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Fans artesanais de alta retenção</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Mapeamento visagista anatômico</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Higienização e kit escovinha</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md mt-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Avançar para Escolher Dia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 2: DIA */}
          <div className="w-full h-full shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="p-3.5 space-y-3.5 text-left">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A3F5C]">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Voltar</span>
                </div>
                <span className="text-[10px] font-bold text-[#8C5383] bg-[#FAF0F5] px-2 py-0.5 rounded-full">
                  Outubro 2026
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Serviço:</span>
                  <strong className="text-[11px] text-[#3D2E4D]">Volume Russo (120 min)</strong>
                </div>
                <span className="text-xs font-black text-emerald-700">R$ 220,00</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3D2E4D]">Selecione a data:</span>
                  <span className="text-[9px] font-bold text-emerald-600">3 datas abertas</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center">
                  <div className="p-2 rounded-xl border-2 border-[#8C5383] bg-[#FAF0F5] text-[#4A3F5C] font-bold shadow-xs">
                    <span className="text-[9px] block text-[#8C5383] font-extrabold uppercase">Sex</span>
                    <strong className="text-sm">18</strong>
                    <span className="block text-[8px] text-emerald-600 font-bold mt-0.5">Vagas</span>
                  </div>
                  <div className="p-2 rounded-xl border bg-white text-gray-700 border-gray-200">
                    <span className="text-[9px] block text-gray-400 uppercase">Sáb</span>
                    <strong className="text-sm">19</strong>
                    <span className="block text-[8px] text-emerald-600 font-bold mt-0.5">Vagas</span>
                  </div>
                  <div className="p-2 rounded-xl border bg-white text-gray-700 border-gray-200">
                    <span className="text-[9px] block text-gray-400 uppercase">Seg</span>
                    <strong className="text-sm">21</strong>
                    <span className="block text-[8px] text-emerald-600 font-bold mt-0.5">Vagas</span>
                  </div>
                  <div className="p-2 rounded-xl border bg-gray-50 text-gray-400 border-gray-200 opacity-40">
                    <span className="text-[9px] block uppercase">Ter</span>
                    <strong className="text-sm">22</strong>
                    <span className="block text-[8px] text-gray-400 font-medium mt-0.5">Folga</span>
                  </div>
                  <div className="p-2 rounded-xl border bg-white text-gray-700 border-gray-200">
                    <span className="text-[9px] block text-gray-400 uppercase">Qua</span>
                    <strong className="text-sm">23</strong>
                    <span className="block text-[8px] text-emerald-600 font-bold mt-0.5">Vagas</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#FAF8F5] border border-gray-200 text-[10px] text-gray-600 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Exibindo apenas datas com horários livres reais.</span>
                </div>

                <div className="w-full py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Avançar para Horários</span>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 3: HORA */}
          <div className="w-full h-full shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="p-3.5 space-y-3.5 text-left">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A3F5C]">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Voltar para dias</span>
                </div>
                <span className="text-[10px] font-bold text-gray-500">
                  Sex, 18 Outubro
                </span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3D2E4D]">Horários disponíveis:</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Google Agenda Sincronizado
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="py-2.5 text-center rounded-xl text-xs font-bold border bg-white border-gray-200 text-gray-700">
                    09:00
                  </div>
                  <div className="py-2.5 text-center rounded-xl text-xs font-bold border-2 border-[#8C5383] bg-[#FAF0F5] text-[#8C5383] shadow-xs flex items-center justify-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    <span>10:30</span>
                  </div>
                  <div className="py-2.5 text-center rounded-xl text-xs font-bold border bg-white border-gray-200 text-gray-700">
                    14:00
                  </div>
                  <div className="py-2.5 text-center rounded-xl text-xs font-bold border bg-white border-gray-200 text-gray-700">
                    16:30
                  </div>
                  <div className="py-2.5 text-center rounded-xl text-xs font-bold border bg-white border-gray-200 text-gray-700">
                    18:00
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 flex items-center gap-1.5 font-medium leading-tight">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>Sem conflitos: horários ocupados são bloqueados na hora.</span>
                </div>

                <div className="w-full py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
                  <User className="h-3.5 w-3.5" />
                  <span>Avançar para Identificação</span>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 4: DADOS */}
          <div className="w-full h-full shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="p-3.5 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A3F5C]">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Voltar para horários</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Quase lá!
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Resumo do seu atendimento:
                </span>
                <div className="flex justify-between font-bold text-[#3D2E4D]">
                  <span>Volume Russo Premium</span>
                  <span className="text-emerald-700">R$ 220,00</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Sexta-feira, 18 Out às 10:30 (120 min)
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs space-y-2.5">
                <span className="text-xs font-bold text-[#3D2E4D] block">
                  Preencha seus dados para receber o comprovante:
                </span>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">
                      Seu Nome Completo
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl border border-[#8C5383]/40 bg-[#FAF0F5] text-xs font-bold text-[#3D2E4D] flex items-center justify-between">
                      <span>Mariana Silva</span>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">
                      Seu WhatsApp
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl border border-[#8C5383]/40 bg-[#FAF0F5] text-xs font-bold text-[#3D2E4D] flex items-center justify-between">
                      <span>(11) 98765-4321</span>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-[10px] text-[#4A3F5C] leading-relaxed">
                  Sem senha e sem cadastro longo. Usamos apenas para enviar o lembrete no WhatsApp.
                </div>

                <div className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirmar Agendamento</span>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 5: CONFIRMAÇÃO */}
          <div className="w-full h-full shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="p-3.5 space-y-3 animate-in fade-in duration-300 text-center">
              <div
                ref={confirmBadgeRef}
                className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs"
              >
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>

              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-[#3D2E4D]">Horário Confirmado com Sucesso!</h4>
                <p className="text-[10px] text-gray-500">Comprovante oficial gerado na hora</p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs space-y-2 text-left text-[11px]">
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-400">Espaço / Studio</span>
                  <strong className="text-[#3D2E4D]">Studio Camila Duarte</strong>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-400">Procedimento</span>
                  <strong className="text-[#3D2E4D]">Volume Russo Premium</strong>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-400">Data e Horário</span>
                  <strong className="text-[#8C5383]">Sex, 18 Out às 10:30</strong>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-400">Duração</span>
                  <span className="font-semibold text-gray-600">120 minutos</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-gray-400">Total a pagar no local</span>
                  <strong className="text-emerald-700 font-extrabold text-xs">R$ 220,00</strong>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px]">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-1.5 font-bold">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Lembrete programado no WhatsApp</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-[#3D2E4D] flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#8C5383]" />
                  <span>Sincronizado na agenda da profissional</span>
                </div>
              </div>

              <div className="w-full py-2 rounded-xl border border-gray-200 bg-white text-[#4A3F5C] text-[11px] font-bold shadow-2xs flex items-center justify-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-[#8C5383]" />
                <span>Adicionar ao Google Agenda</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Barra Inferior: Home Indicator Oficial do iPhone */}
      <div className="w-full bg-white/80 backdrop-blur-xs pt-1.5 pb-2 flex justify-center shrink-0 z-30 border-t border-gray-100/80">
        <div className="w-32 h-1 bg-[#1a1820]/30 rounded-full" />
      </div>

    </div>
  )

  return (
    <section id="como-funciona" className="py-14 sm:py-20 lg:py-24 bg-[#FAF8F5] border-t border-[#E8DFD8] scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16 lg:items-center space-y-8 lg:space-y-0">
          
          {/* COLUNA ESQUERDA: Textos e Informações da Etapa */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-left">
            
            {/* Tag / Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>Simulador de Experiência</span>
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full lg:hidden" />
            </div>

            {/* Título Principal */}
            <h2 className="text-2xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold text-[#3D2E4D] tracking-tight leading-tight [text-wrap:balance]">
              Veja como sua cliente agenda pelo celular
            </h2>

            {/* Subtítulo */}
            <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed max-w-lg mx-auto lg:mx-0">
              <span className="sm:hidden">Arraste para os lados para navegar pelas 6 etapas da experiência.</span>
              <span className="hidden sm:inline">Arraste para os lados ou use as setinhas para navegar pelas 6 etapas da experiência:</span>
            </p>

            {/* Card com a Etapa Atual Ativa (com transição suave) */}
            <div
              key={screenStep}
              ref={stepCardRef}
              className="rounded-2xl bg-white border border-[#E8DFD8] p-5 sm:p-6 shadow-xs space-y-2 text-left transition-all max-w-lg mx-auto lg:mx-0"
            >
              <div className="flex items-center">
                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                  Etapa {screenStep + 1} de 6 · {steps[screenStep].subtitle}
                </span>
              </div>

              <h3 className="text-base sm:text-xl font-bold text-[#3D2E4D] leading-snug">
                {steps[screenStep].title}
              </h3>

              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                {steps[screenStep].desc}
              </p>
            </div>

            {/* Indicadores de Pontinhos e Navegação no Desktop */}
            <div className="hidden lg:flex items-center gap-3 pt-1 text-xs text-[#6B5E7A]">
              <span className="font-medium">Navegue pelas etapas:</span>
              <div className="flex items-center gap-1.5">
                {steps.map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setScreenStep(item.step)}
                    className={`h-2 transition-all rounded-full cursor-pointer ${
                      screenStep === item.step ? 'w-6 bg-[#8C5383]' : 'w-2 bg-[#E8DFD8] hover:bg-gray-300'
                    }`}
                    aria-label={`Ir para etapa ${item.number}`}
                  />
                ))}
              </div>
            </div>

            {/* Botão Ver Vitrine — visível apenas no desktop (lg+) */}
            <div className="hidden lg:flex items-center justify-center lg:justify-start pt-1">
              <Link
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3D2E4D] text-white text-sm font-bold shadow-md hover:bg-[#2E223B] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
              >
                <ExternalLink className="w-4 h-4 text-[#B8A9D9]" />
                Ver vitrine agora
              </Link>
            </div>

          </div>

          {/* COLUNA DIREITA: Smartphone iPhone com as Setinhas no Mesmo Horizonte */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            
            <div className="relative flex items-center justify-center gap-2.5 sm:gap-6 lg:gap-4 xl:gap-6 w-full max-w-md mx-auto">
              
              {/* Setinha Esquerda — visível apenas em sm+ */}
              <button
                type="button"
                onClick={prevStep}
                aria-label="Etapa anterior"
                className="hidden sm:inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-[#3D2E4D] hover:text-[#8C5383] hover:bg-[#FAF0F5] shadow-md hover:shadow-lg border border-[#E8DFD8] transition-all transform hover:-translate-x-0.5 active:scale-95 cursor-pointer shrink-0 z-20 select-none"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Smartphone iPhone com Tamanho Responsivo no Mobile */}
              <div
                className="w-full max-w-[260px] xs:max-w-[290px] sm:max-w-[316px] shrink-0 touch-pan-y select-none cursor-grab active:cursor-grabbing"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {/* Chassi do iPhone: Titânio/Grafite Fosco com botões físicos laterais */}
                <div className="group relative rounded-[48px] p-[9px] bg-gradient-to-b from-[#2d2936] via-[#1a1822] to-[#100f16] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.12)] ring-1 ring-black/80">
                  
                  {/* Botões Físicos Laterais do iPhone (Lado Esquerdo: Ação + Volume) */}
                  <div className="absolute -left-[4px] top-20 w-[4px] h-6 bg-[#3a3746] rounded-l-sm" aria-hidden="true" />
                  <div className="absolute -left-[4px] top-30 w-[4px] h-10 bg-[#3a3746] rounded-l-sm" aria-hidden="true" />
                  <div className="absolute -left-[4px] top-44 w-[4px] h-10 bg-[#3a3746] rounded-l-sm" aria-hidden="true" />
                  
                  {/* Botão Físico Lateral do iPhone (Lado Direito: Botão Liga/Desliga) */}
                  <div className="absolute -right-[4px] top-32 w-[4px] h-14 bg-[#3a3746] rounded-r-sm" aria-hidden="true" />

                  {/* Borda Preta Uniforme da Tela do iPhone (Bezel) */}
                  <div className="rounded-[40px] overflow-hidden bg-black p-[2.5px] shadow-inner">
                    {renderPhoneScreen()}
                  </div>

                </div>
              </div>

              {/* Setinha Direita — visível apenas em sm+ */}
              <button
                type="button"
                onClick={nextStep}
                aria-label="Próxima etapa"
                className="hidden sm:inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3D2E4D] text-white hover:bg-[#2E223B] shadow-md hover:shadow-lg transition-all transform hover:translate-x-0.5 active:scale-95 cursor-pointer shrink-0 z-20 select-none"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

            </div>

            {/* Indicadores de Pontinhos no Mobile (Abaixo do Celular) */}
            <div className="flex lg:hidden items-center justify-center gap-2 pt-4">
              {steps.map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setScreenStep(item.step)}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    screenStep === item.step ? 'w-6 bg-[#8C5383]' : 'w-2 bg-[#E8DFD8] hover:bg-gray-300'
                  }`}
                  aria-label={`Ir para etapa ${item.number}`}
                />
              ))}
            </div>

            {/* Botão Ver Vitrine — visível apenas no mobile (abaixo do celular) */}
            <div className="flex lg:hidden items-center justify-center pt-3">
              <Link
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3D2E4D] text-white text-sm font-bold shadow-md hover:bg-[#2E223B] hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <ExternalLink className="w-4 h-4 text-[#B8A9D9]" />
                Ver vitrine agora
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}

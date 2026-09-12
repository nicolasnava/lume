'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutGrid,
  Eye,
  Link2,
  ArrowRight,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Smartphone,
  HelpCircle,
  Mail,
  CheckCircle2,
  Share2,
  Share,
  Send,
  PlusSquare,
  MoreVertical,
  Check,
  Palette,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  MessageCircle,
  RotateCcw,
  TrendingUp,
  Scissors,
  Heart,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react'

interface LandingPageProps {
  planPrice?: number
}

export default function LandingPage({ planPrice = 69.90 }: LandingPageProps) {
  const currentYear = new Date().getFullYear()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pwaModalOpen, setPwaModalOpen] = useState(false)

  // Estados do Simulador: Etapa (1, 2, 3), Clientes/semana e Ticket Médio
  const [simuladorStep, setSimuladorStep] = useState<1 | 2 | 3>(1)
  const [clientesSemana, setClientesSemana] = useState<number>(20)
  const [ticketMedio, setTicketMedio] = useState<number>(80)

  // Estado do FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cálculos do Simulador Interativo (Regras de negócio preservadas)
  const clientesMes = Math.round(clientesSemana * 4.3)
  const faturamentoBase = clientesMes * ticketMedio
  const faltasRecuperadas = Math.round(faturamentoBase * 0.16) // ~16% de faltas evitadas com lembretes
  const agendamentosNoturnos = Math.round(faturamentoBase * 0.18) // ~18% de marcações fora de hora
  const ganhoAdicional = faltasRecuperadas + agendamentosNoturnos
  const faturamentoComLume = faturamentoBase + ganhoAdicional
  const horasPoupadas = Math.round((clientesSemana * 15 * 4.3) / 60)
  const roiMultiplicador = Math.max(1, Math.round(ganhoAdicional / (planPrice || 69.90)))

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

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] selection:bg-[#8C5383]/20 font-sans scroll-smooth">
      {/* 1. HEADER FIXO COM NAVEGAÇÃO CENTRALIZADA */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DFD8] bg-[#FAF8F5]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          
          {/* Logo Lumê à Esquerda */}
          <div className="flex-1 flex items-center justify-start">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/assets/lume_logo.webp"
                alt="Lumê"
                width={130}
                height={40}
                priority
                className="h-auto w-auto max-h-9 object-contain"
              />
            </Link>
          </div>

          {/* Links Desktop Centralizados */}
          <nav className="hidden md:flex items-center justify-center gap-7 text-xs font-semibold text-[#3D2E4D]">
            <a href="#como-funciona" className="hover:text-[#8C5383] transition">
              Como funciona
            </a>
            <a href="#dores" className="hover:text-[#8C5383] transition">
              Por que usar
            </a>
            <a href="#beneficios" className="hover:text-[#8C5383] transition">
              Recursos
            </a>
            <a href="#simulador" className="hover:text-[#8C5383] transition">
              Simulador
            </a>
            <a href="#precos" className="hover:text-[#8C5383] transition">
              Preços
            </a>

            {/* Dropdown "Mais" */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onMouseEnter={() => setDropdownOpen(true)}
                className="inline-flex items-center gap-1 hover:text-[#8C5383] transition py-1 cursor-pointer"
              >
                <span>Mais</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180 text-[#8C5383]' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-[#E8DFD8] z-50 text-xs space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150 text-left"
                >
                  <Link
                    href="/funcionalidades"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <LayoutGrid className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Funcionalidades</span>
                      <span className="text-[10px] text-[#6B5E7A]">Vitrine, agenda e Google Sync</span>
                    </div>
                  </Link>

                  <Link
                    href="/precos"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <CreditCard className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Plano e Preços</span>
                      <span className="text-[10px] text-[#6B5E7A]">Conheça os detalhes do plano</span>
                    </div>
                  </Link>

                  <Link
                    href="/jornada-cliente"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <Clock className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Jornada da Cliente</span>
                      <span className="text-[10px] text-[#6B5E7A]">Passo a passo simplificado</span>
                    </div>
                  </Link>

                  <Link
                    href="/sobre"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <HelpCircle className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Sobre o Lumê</span>
                      <span className="text-[10px] text-[#6B5E7A]">Nossa proposta para a beleza</span>
                    </div>
                  </Link>

                  <Link
                    href="/contato"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <Mail className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Contato e suporte</span>
                      <span className="text-[10px] text-[#6B5E7A]">Fale com nossa equipe</span>
                    </div>
                  </Link>

                  <Link
                    href="/instalar"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition text-left cursor-pointer border-t border-[#E8DFD8] mt-1 pt-2"
                  >
                    <Smartphone className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block text-[#8C5383]">Instalar no celular</span>
                      <span className="text-[10px] text-[#6B5E7A]">Atalho direto na tela inicial</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Botões de Ação Desktop à Direita */}
          <div className="flex-1 hidden md:flex items-center justify-end gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-xs font-bold text-[#3D2E4D] hover:bg-[#F4EAE4] transition cursor-pointer"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#3D2E4D] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#2E223B] transition cursor-pointer"
            >
              <span>Testar agenda grátis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Ações Mobile: [Entrar] ao lado do [Menu Hamburguer] */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-full border border-[#D8C7BC] bg-white/80 text-xs font-bold text-[#3D2E4D] hover:bg-[#F4EAE4] transition"
            >
              Entrar
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#3D2E4D] hover:bg-[#F4EAE4] rounded-xl transition"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Expansível */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8DFD8] bg-[#FAF8F5] px-4 py-4 space-y-3 text-sm font-semibold text-[#3D2E4D] animate-in fade-in slide-in-from-top-2">
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Como funciona
            </a>
            <a
              href="#dores"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Por que usar
            </a>
            <Link
              href="/funcionalidades"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Recursos
            </Link>
            <a
              href="#simulador"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Simulador
            </a>
            <Link
              href="/precos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Preços
            </Link>
            <Link
              href="/jornada-cliente"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Jornada da Cliente
            </Link>
            <Link
              href="/sobre"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Sobre o Lumê
            </Link>
            <Link
              href="/contato"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Contato e suporte
            </Link>
            <Link
              href="/instalar"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left py-2 text-[#8C5383] font-bold flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              <span>Instalar no celular</span>
            </Link>

            <div className="pt-3 border-t border-[#E8DFD8] flex flex-col gap-2">
              <Link
                href="/cadastro"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-full bg-[#3D2E4D] text-xs font-bold text-white shadow-md"
              >
                Testar minha agenda grátis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28 bg-[#FAF8F5]">
        {/* Imagem de Fundo da Hero no Desktop (Fundo Pastel + Mockup 3D Integrado) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none select-none z-0">
          <Image
            src="/assets/mockup_desktop.webp"
            alt="Lumê - Agenda e Gestão no Celular"
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
              
              {/* Headline Principal Direta Sans-serif (Aumentada) */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#3D2E4D] leading-[1.08] tracking-tight">
                Sua cliente agenda.<br />
                <span className="text-[#8C5383]">O Lumê organiza.</span><br />
                Você atende.
              </h1>

              {/* Mockup dos Celulares no Mobile (Logo após o Título) */}
              <div className="lg:hidden w-full flex justify-center py-2">
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

              {/* Texto de Apoio */}
              <p className="text-base sm:text-lg text-[#6B5E7A] font-normal leading-relaxed max-w-xl">
                Uma agenda de beleza feita para reduzir mensagens, evitar horários duplicados e manter seus atendimentos organizados — mesmo quando você está ocupada atendendo.
              </p>

              {/* CTAs Principal e Secundário */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#3D2E4D] px-7 py-4 text-sm sm:text-base font-bold text-white shadow-xl hover:bg-[#2E223B] transition duration-200 transform hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  <span>Testar minha agenda grátis</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8C7BC] bg-white/80 px-6 py-4 text-sm sm:text-base font-bold text-[#3D2E4D] hover:bg-white hover:border-[#3D2E4D] transition cursor-pointer text-center backdrop-blur-xs"
                >
                  <span>Ver como funciona</span>
                  <span className="text-[#8C5383]">→</span>
                </a>
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

            {/* Coluna Direita: Livre para destacar os celulares na imagem de fundo do desktop */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-6" />

          </div>
        </div>
      </section>

      {/* 3. SEÇÃO DE DORES DO DIA A DIA - #dores */}
      <section id="dores" className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8] scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            {/* Eyebrow Estilizado Sem Card */}
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

          {/* Grid de 3 Cards com Fotos Preenchendo o Topo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            
            {/* Card Dor 1: Horário vazio */}
            <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] overflow-hidden flex flex-col justify-between hover:border-[#8C5383]/40 transition shadow-xs h-full group">
              {/* Imagem Preenchendo o Topo */}
              <div className="w-full aspect-[16/11] relative bg-[#F5F0FA] shrink-0 overflow-hidden border-b border-[#E8DFD8]/70">
                <Image
                  src="/assets/problema/horario.webp"
                  alt="Horários vagos e clientes que esquecem do atendimento"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Conteúdo do Card */}
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
            <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] overflow-hidden flex flex-col justify-between hover:border-[#8C5383]/40 transition shadow-xs h-full group">
              {/* Imagem Preenchendo o Topo */}
              <div className="w-full aspect-[16/11] relative bg-[#F5F0FA] shrink-0 overflow-hidden border-b border-[#E8DFD8]/70">
                <Image
                  src="/assets/problema/mensagens.webp"
                  alt="Mensagens acumuladas no WhatsApp durante atendimentos"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Conteúdo do Card */}
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
            <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] overflow-hidden flex flex-col justify-between hover:border-[#8C5383]/40 transition shadow-xs h-full group">
              {/* Imagem Preenchendo o Topo */}
              <div className="w-full aspect-[16/11] relative bg-[#F5F0FA] shrink-0 overflow-hidden border-b border-[#E8DFD8]/70">
                <Image
                  src="/assets/problema/financeiro.webp"
                  alt="Falta de clareza no caixa e resultado financeiro"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Conteúdo do Card */}
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

      {/* 4. SEÇÕES DE BENEFÍCIOS EM 2 COLUNAS - #beneficios */}
      <section id="beneficios" className="py-16 sm:py-24 bg-[#FAF8F5] scroll-mt-16 space-y-20 lg:space-y-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20 lg:space-y-28">
          
          {/* BENEFÍCIO 1: Agendamento Online */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
            
            {/* Texto e Conteúdo (Desktop Coluna 1 / Mobile Ordem Completa) */}
            <div className="lg:col-span-6 space-y-5 text-left order-1">
              {/* 1. Título & Eyebrow */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                  <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                  <span>Agendamento online</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                  Sua cliente escolhe. Você confirma.
                </h2>
              </div>

              {/* 2. Foto no Mobile (Entre Título e Descrição) */}
              <div className="lg:hidden w-full flex justify-center py-1">
                <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                  <Image
                    src="/assets/funcionalidades/agendamento.webp"
                    alt="Agendamento online prático no Lumê"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* 3. Descrição e Lista */}
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

              {/* 4. Botão por Último */}
              <div className="pt-2 sm:pt-3">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8C5383] hover:text-[#3D2E4D] bg-[#FAF0F5] hover:bg-[#F4EAE4] px-4 py-2 rounded-full border border-[#E8DFD8] transition shadow-2xs group cursor-pointer"
                >
                  <span>Criar minha agenda</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Imagem Funcionalidade 1 (Exibida no Desktop na Coluna Lateral) */}
            <div className="hidden lg:flex lg:col-span-6 justify-center order-2">
              <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-white">
                <Image
                  src="/assets/funcionalidades/agendamento.webp"
                  alt="Agendamento online prático no Lumê"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

          </div>

          {/* BENEFÍCIO 2: Clientes e Retorno */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
            
            {/* Texto e Conteúdo (Desktop Coluna 2 / Mobile Ordem Completa) */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              {/* 1. Título & Eyebrow */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                  <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                  <span>Clientes e retorno</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                  Lembre suas clientes na hora certa.
                </h2>
              </div>

              {/* 2. Foto no Mobile (Entre Título e Descrição) */}
              <div className="lg:hidden w-full flex justify-center py-1">
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

              {/* 3. Descrição e Lista */}
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

              {/* 4. Botão por Último */}
              <div className="pt-2 sm:pt-3">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8C5383] hover:text-[#3D2E4D] bg-[#FAF0F5] hover:bg-[#F4EAE4] px-4 py-2 rounded-full border border-[#E8DFD8] transition shadow-2xs group cursor-pointer"
                >
                  <span>Organizar minhas clientes</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Imagem Funcionalidade 2 (Exibida no Desktop na Coluna Lateral) */}
            <div className="hidden lg:flex lg:col-span-6 justify-center order-2 lg:order-1">
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

          {/* BENEFÍCIO 3: Controle da Rotina e Financeiro */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
            
            {/* Texto e Conteúdo (Desktop Coluna 1 / Mobile Ordem Completa) */}
            <div className="lg:col-span-6 space-y-5 text-left order-1">
              {/* 1. Título & Eyebrow */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                  <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                  <span>Rotina e financeiro</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                  Veja tudo o que acontece no seu dia.
                </h2>
              </div>

              {/* 2. Foto no Mobile (Entre Título e Descrição) */}
              <div className="lg:hidden w-full flex justify-center py-1">
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

              {/* 3. Descrição e Lista */}
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

              {/* 4. Botão por Último */}
              <div className="pt-2 sm:pt-3">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8C5383] hover:text-[#3D2E4D] bg-[#FAF0F5] hover:bg-[#F4EAE4] px-4 py-2 rounded-full border border-[#E8DFD8] transition shadow-2xs group cursor-pointer"
                >
                  <span>Ver minha rotina</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Imagem Funcionalidade 3 (Exibida no Desktop na Coluna Lateral) */}
            <div className="hidden lg:flex lg:col-span-6 justify-center order-2">
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

          {/* BENEFÍCIO 4: Sincronização Google Calendar em 2 Vias */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
            
            {/* Texto e Conteúdo (Desktop Coluna 2 / Mobile Ordem Completa) */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              {/* 1. Título & Eyebrow */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                  <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                  <span>Google Agenda</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                  Sua agenda pessoal e profissional, juntas.
                </h2>
              </div>

              {/* 2. Foto no Mobile (Entre Título e Descrição) */}
              <div className="lg:hidden w-full flex justify-center py-1">
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

              {/* 3. Descrição e Lista */}
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

              {/* 4. Botão por Último */}
              <div className="pt-2 sm:pt-3">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8C5383] hover:text-[#3D2E4D] bg-[#FAF0F5] hover:bg-[#F4EAE4] px-4 py-2 rounded-full border border-[#E8DFD8] transition shadow-2xs group cursor-pointer"
                >
                  <span>Testar agenda grátis</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Imagem Funcionalidade 4 (Exibida no Desktop na Coluna Lateral) */}
            <div className="hidden lg:flex lg:col-span-6 justify-center order-2 lg:order-1">
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
      </section>

      {/* 5. COMO FUNCIONA - TIMELINE ALTERNADA NO MOBILE & GRID NO DESKTOP - #como-funciona */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8] scroll-mt-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
          
          <div className="space-y-4 max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>Simples e sem complicação</span>
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Como funciona o Lumê na prática
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Em apenas 4 passos você sai da troca infinita de mensagens e tem uma rotina organizada.
            </p>
          </div>

          {/* TIMELINE VERTICAL EM COBRINHA COM CARDS DE LARGURA TOTAL (lg:hidden) */}
          <div className="lg:hidden relative w-full max-w-xl mx-auto py-2">
            {/* Linha Serpentine / Cobrinha quase opaca como detalhe visual suave */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <path
                d="M 6 12.5 H 94 C 102 12.5, 102 37.5, 94 37.5 H 6 C -2 37.5, -2 62.5, 6 62.5 H 94 C 102 62.5, 102 87.5, 94 87.5 H 6"
                fill="none"
                stroke="#8C5383"
                strokeOpacity="0.22"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* 4 Cards ocupando toda a largura em sequência vertical */}
            <div className="space-y-6 relative z-10">
              
              {/* Passo 01 */}
              <div className="w-full bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-5 shadow-xs hover:border-[#8C5383] transition group text-left space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-white border border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-105 shrink-0">
                    <Link2 className="h-5 w-5 text-[#8C5383]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#8C5383] bg-white px-3 py-1 rounded-full border border-[#E8DFD8]">
                    Passo 01
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#3D2E4D]">Crie seu link exclusivo</h3>
                <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                  Cadastre seus serviços, preços, fotos e horários de atendimento em menos de 5 minutos.
                </p>

                <div className="pt-2 border-t border-[#E8DFD8]/60 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Configuração rápida</span>
                </div>
              </div>

              {/* Passo 02 */}
              <div className="w-full bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-5 shadow-xs hover:border-[#8C5383] transition group text-left space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-white border border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-105 shrink-0">
                    <Send className="h-5 w-5 text-[#8C5383]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#8C5383] bg-white px-3 py-1 rounded-full border border-[#E8DFD8]">
                    Passo 02
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#3D2E4D]">Compartilhe com as clientes</h3>
                <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                  Coloque seu link na bio do Instagram, envie no WhatsApp ou deixe em mensagens automáticas.
                </p>

                <div className="pt-2 border-t border-[#E8DFD8]/60 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Acesso direto sem app</span>
                </div>
              </div>

              {/* Passo 03 */}
              <div className="w-full bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-5 shadow-xs hover:border-[#8C5383] transition group text-left space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-white border border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-105 shrink-0">
                    <CalendarCheck className="h-5 w-5 text-[#8C5383]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#8C5383] bg-white px-3 py-1 rounded-full border border-[#E8DFD8]">
                    Passo 03
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#3D2E4D]">Cliente escolhe e agenda</h3>
                <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                  Ela visualiza seus horários livres em tempo real e confirma o agendamento em segundos.
                </p>

                <div className="pt-2 border-t border-[#E8DFD8]/60 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Zero conflitos de horários</span>
                </div>
              </div>

              {/* Passo 04 */}
              <div className="w-full bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-5 shadow-xs hover:border-[#8C5383] transition group text-left space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-white border border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-105 shrink-0">
                    <Smartphone className="h-5 w-5 text-[#8C5383]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#8C5383] bg-white px-3 py-1 rounded-full border border-[#E8DFD8]">
                    Passo 04
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#3D2E4D]">Gerencie tudo pelo celular</h3>
                <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                  Acompanhe atendimentos, bloqueie folgas e mantenha sua agenda pessoal do Google Calendar 100% sincronizada.
                </p>

                <div className="pt-2 border-t border-[#E8DFD8]/60 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Sincronização em tempo real</span>
                </div>
              </div>

            </div>
          </div>

          {/* GRID TRADICIONAL PRESERVADO NO DESKTOP (hidden lg:block) */}
          <div className="hidden lg:block relative">
            {/* Linha decorativa no desktop */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-[#E8DFD8] -translate-y-1/2 z-0" />

            <div className="grid grid-cols-4 gap-6 relative z-10">
              
              {/* Passo 1 */}
              <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-6 flex flex-col justify-between hover:border-[#8C5383] transition group relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-white border-2 border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-110">
                      <Link2 className="h-6 w-6 text-[#8C5383]" />
                    </div>
                    <span className="text-xs font-extrabold text-[#8C5383] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                      Passo 01
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#3D2E4D]">Crie seu link exclusivo</h3>
                  <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                    Cadastre seus serviços, preços, fotos e horários de atendimento em menos de 5 minutos.
                  </p>
                </div>

                <div className="pt-2 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Configuração rápida</span>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-6 flex flex-col justify-between hover:border-[#8C5383] transition group relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-white border-2 border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-110">
                      <Send className="h-6 w-6 text-[#8C5383]" />
                    </div>
                    <span className="text-xs font-extrabold text-[#8C5383] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                      Passo 02
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#3D2E4D]">Compartilhe com as clientes</h3>
                  <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                    Coloque seu link na bio do Instagram, envie no WhatsApp ou deixe em mensagens automáticas.
                  </p>
                </div>

                <div className="pt-2 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Acesso direto sem app</span>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-6 flex flex-col justify-between hover:border-[#8C5383] transition group relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-white border-2 border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-110">
                      <CalendarCheck className="h-6 w-6 text-[#8C5383]" />
                    </div>
                    <span className="text-xs font-extrabold text-[#8C5383] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                      Passo 03
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#3D2E4D]">Cliente escolhe e agenda</h3>
                  <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                    Ela visualiza seus horários livres em tempo real e confirma o agendamento em segundos.
                  </p>
                </div>

                <div className="pt-2 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Zero conflitos de horários</span>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] p-6 flex flex-col justify-between hover:border-[#8C5383] transition group relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-white border-2 border-[#E8DFD8] group-hover:border-[#8C5383] shadow-xs flex items-center justify-center text-[#8C5383] transition-transform duration-300 group-hover:scale-110">
                      <Smartphone className="h-6 w-6 text-[#8C5383]" />
                    </div>
                    <span className="text-xs font-extrabold text-[#8C5383] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                      Passo 04
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#3D2E4D]">Gerencie tudo pelo celular</h3>
                  <p className="text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed">
                    Acompanhe atendimentos, bloqueie folgas e mantenha sua agenda pessoal do Google Calendar 100% sincronizada.
                  </p>
                </div>

                <div className="pt-2 text-[11px] font-bold text-[#8C5383] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383]" />
                  <span>Sincronização em tempo real</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6. SIMULADOR INTERATIVO COMPACTO NO MOBILE (JORNADA DE 3 ETAPAS) - #simulador */}
      <section id="simulador" className="py-8 sm:py-20 bg-[#FBF7F3] border-t border-[#E8DFD8] scroll-mt-16 text-[#30203E]">
        <div className="mx-auto max-w-3xl px-3.5 sm:px-6">
          <div className="bg-white p-4 sm:p-10 rounded-2xl sm:rounded-[2rem] border border-[#E8DFD8] shadow-sm space-y-4 sm:space-y-8">
            
            {/* Header Compacto com Indicador de Progresso (3 Segmentos) */}
            <div className="space-y-2.5 sm:space-y-4 border-b border-[#E8DFD8] pb-3.5 sm:pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#8C5383]" />
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#8C5383]">
                    {simuladorStep === 1 && 'SIMULADOR DE POTENCIAL'}
                    {simuladorStep === 2 && 'SUA ROTINA HOJE'}
                    {simuladorStep === 3 && 'SEU POTENCIAL COM O LUMÊ'}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#6B5E7A] bg-[#FBF7F3] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-[#E8DFD8]">
                  {simuladorStep} de 3
                </span>
              </div>

              {/* Barra de Progresso em 3 Segmentos */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5" role="progressbar" aria-valuenow={simuladorStep} aria-valuemin={1} aria-valuemax={3}>
                <div className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${simuladorStep >= 1 ? 'bg-[#3D2E4D]' : 'bg-[#E8DFD8]'}`} />
                <div className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${simuladorStep >= 2 ? 'bg-[#3D2E4D]' : 'bg-[#E8DFD8]'}`} />
                <div className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${simuladorStep >= 3 ? 'bg-[#3D2E4D]' : 'bg-[#E8DFD8]'}`} />
              </div>

              {/* Título & Subtítulo Dinâmicos por Etapa */}
              <div className="space-y-1 text-left pt-1">
                <h3 className="text-lg sm:text-3xl font-bold text-[#30203E] tracking-tight leading-snug sm:leading-tight">
                  {simuladorStep === 1 && 'Descubra quanto sua agenda pode recuperar'}
                  {simuladorStep === 2 && 'Onde sua agenda pode ganhar fôlego'}
                  {simuladorStep === 3 && 'Sua agenda pode recuperar até'}
                </h3>
                <p className="text-[11px] sm:text-sm text-[#6B5E7A] leading-snug sm:leading-relaxed">
                  {simuladorStep === 1 && 'Responda a duas perguntas rápidas e veja o potencial da sua rotina.'}
                  {simuladorStep === 2 && 'Pequenos vazamentos de tempo e organização somam oportunidades no mês.'}
                  {simuladorStep === 3 && 'Mais organização para recuperar oportunidades e focar no atendimento.'}
                </p>
              </div>
            </div>

            {/* ETAPA 1: DADOS DA ROTINA */}
            {simuladorStep === 1 && (
              <div className="space-y-3.5 sm:space-y-6 text-left animate-in fade-in duration-200">
                {/* Card 1: Atendimentos por Semana */}
                <div className="bg-[#FAF8F5] p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-[#E8DFD8] space-y-1.5 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1">
                    <label htmlFor="sim-clientes-slider" className="text-xs sm:text-sm font-bold text-[#30203E]">
                      Atendimentos por semana
                    </label>
                    <span className="text-base sm:text-xl font-extrabold text-[#8C5383]">
                      {clientesSemana} clientes
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#6B5E7A] font-medium">
                    aproximadamente ~{clientesMes} atendimentos por mês
                  </p>

                  <div className="pt-1 sm:pt-2">
                    <input
                      id="sim-clientes-slider"
                      type="range"
                      min="5"
                      max="80"
                      step="5"
                      value={clientesSemana}
                      aria-label="Atendimentos por semana"
                      aria-valuemin={5}
                      aria-valuemax={80}
                      aria-valuenow={clientesSemana}
                      aria-valuetext={`${clientesSemana} clientes por semana`}
                      onChange={(e) => setClientesSemana(Number(e.target.value))}
                      className="w-full h-2.5 sm:h-3 bg-[#E8DFD8] rounded-lg appearance-none cursor-pointer accent-[#8C5383]"
                    />
                    <div className="flex justify-between text-[10px] sm:text-[11px] text-[#6B5E7A] font-semibold pt-0.5 sm:pt-1">
                      <span>5 clientes</span>
                      <span>40 clientes</span>
                      <span>80+ clientes</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Valor Médio por Atendimento */}
                <div className="bg-[#FAF8F5] p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-[#E8DFD8] space-y-1.5 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1">
                    <label htmlFor="sim-ticket-slider" className="text-xs sm:text-sm font-bold text-[#30203E]">
                      Valor médio por atendimento
                    </label>
                    <span className="text-base sm:text-xl font-extrabold text-[#30203E]">
                      R$ {ticketMedio},00
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#6B5E7A] font-medium">
                    ticket médio estimado por serviço
                  </p>

                  <div className="pt-1 sm:pt-2">
                    <input
                      id="sim-ticket-slider"
                      type="range"
                      min="20"
                      max="350"
                      step="5"
                      value={ticketMedio}
                      aria-label="Valor médio por atendimento"
                      aria-valuemin={20}
                      aria-valuemax={350}
                      aria-valuenow={ticketMedio}
                      aria-valuetext={`R$ ${ticketMedio}`}
                      onChange={(e) => setTicketMedio(Number(e.target.value))}
                      className="w-full h-2.5 sm:h-3 bg-[#E8DFD8] rounded-lg appearance-none cursor-pointer accent-[#3D2E4D]"
                    />
                    <div className="flex justify-between text-[10px] sm:text-[11px] text-[#6B5E7A] font-semibold pt-0.5 sm:pt-1">
                      <span>R$ 20</span>
                      <span>R$ 150</span>
                      <span>R$ 350+</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé Etapa 1 */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSimuladorStep(2)}
                    className="w-full min-h-[46px] sm:min-h-[56px] flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#3D2E4D] hover:bg-[#2E223B] text-white text-xs sm:text-base font-bold shadow-md transition transform active:scale-[0.99] cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-center text-[10px] sm:text-[11px] text-[#6B5E7A] font-medium">
                    Leva menos de 1 minuto.
                  </p>
                </div>
              </div>
            )}

            {/* ETAPA 2: ONDE EXISTE POTENCIAL */}
            {simuladorStep === 2 && (
              <div className="space-y-3 sm:space-y-4 text-left animate-in fade-in duration-200">
                {/* 3 Cards Empilhados */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Card 1: Faltas e Cancelamentos */}
                  <div className="bg-[#FAF8F5] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E8DFD8] flex items-start gap-2.5 sm:gap-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center shrink-0 border border-[#E8DFD8]">
                      <CalendarX className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[#30203E]">Faltas e cancelamentos</h4>
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#8C5383] shrink-0">
                          ~R$ {faltasRecuperadas.toLocaleString('pt-BR')}/mês
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#6B5E7A] leading-tight sm:leading-relaxed">
                        Lembretes e confirmações no WhatsApp ajudam a reduzir horários vazios na sua grade.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Tempo no WhatsApp */}
                  <div className="bg-[#FAF8F5] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E8DFD8] flex items-start gap-2.5 sm:gap-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center shrink-0 border border-[#E8DFD8]">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[#30203E]">Tempo no WhatsApp</h4>
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#8C5383] shrink-0">
                          ~{horasPoupadas}h poupadas/mês
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#6B5E7A] leading-tight sm:leading-relaxed">
                        Sua cliente agenda sozinha 24h sem você precisar pausar atendimentos.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Fora do Expediente */}
                  <div className="bg-[#FAF8F5] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E8DFD8] flex items-start gap-2.5 sm:gap-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center shrink-0 border border-[#E8DFD8]">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[#30203E]">Fora do expediente</h4>
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#8C5383] shrink-0">
                          ~R$ {agendamentosNoturnos.toLocaleString('pt-BR')}/mês
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#6B5E7A] leading-tight sm:leading-relaxed">
                        Sua página pública continua recebendo pedidos à noite ou finais de semana.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rodapé Etapa 2 */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-2 sm:pt-4 border-t border-[#E8DFD8]">
                  <button
                    type="button"
                    onClick={() => setSimuladorStep(1)}
                    className="w-full sm:w-auto py-2 sm:py-3 px-3 text-[11px] sm:text-xs font-bold text-[#6B5E7A] hover:text-[#30203E] transition cursor-pointer text-center"
                  >
                    ← Voltar e ajustar dados
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimuladorStep(3)}
                    className="w-full sm:flex-1 min-h-[46px] sm:min-h-[56px] flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#3D2E4D] hover:bg-[#2E223B] text-white text-xs sm:text-base font-bold shadow-md transition cursor-pointer"
                  >
                    <span>Ver meu potencial</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: RESULTADO */}
            {simuladorStep === 3 && (
              <div className="space-y-3.5 sm:space-y-6 text-left animate-in fade-in duration-200">
                {/* Destaque Principal do Potencial */}
                <div className="bg-[#FAF0F5] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#ECCAC0] text-center space-y-1 sm:space-y-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8C5383]">
                    Potencial de Recuperação Mensal
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl sm:text-5xl font-black text-[#30203E] tracking-tight">
                      R$ {ganhoAdicional.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs sm:text-lg font-bold text-[#6B5E7A]">/mês</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#6B5E7A] font-medium max-w-md mx-auto">
                    Retorno estimado de <strong className="text-[#30203E]">~{roiMultiplicador}x</strong> sobre a assinatura mensal do Lumê.
                  </p>
                </div>

                {/* 3 Indicadores de Apoio Compactos */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  <div className="bg-[#FAF8F5] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#E8DFD8] text-center space-y-0.5">
                    <span className="text-[9px] sm:text-[11px] font-bold text-[#6B5E7A] block truncate">Faltas</span>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 block">
                      +R$ {faltasRecuperadas.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="bg-[#FAF8F5] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#E8DFD8] text-center space-y-0.5">
                    <span className="text-[9px] sm:text-[11px] font-bold text-[#6B5E7A] block truncate">24 horas</span>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 block">
                      +R$ {agendamentosNoturnos.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="bg-[#FAF8F5] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#E8DFD8] text-center space-y-0.5">
                    <span className="text-[9px] sm:text-[11px] font-bold text-[#6B5E7A] block truncate">Tempo</span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#8C5383] block">
                      ~{horasPoupadas}h/mês
                    </span>
                  </div>
                </div>

                {/* Comparação Vertical Compacta */}
                <div className="bg-[#FAF8F5] p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-[#E8DFD8] space-y-1.5 sm:space-y-3">
                  <div className="flex items-center justify-between text-[11px] sm:text-sm">
                    <span className="text-[#6B5E7A] font-medium">Cenário atual (manual):</span>
                    <span className="font-bold text-[#30203E]">R$ {faturamentoBase.toLocaleString('pt-BR')}/mês</span>
                  </div>
                  <div className="h-px bg-[#E8DFD8]" />
                  <div className="flex items-center justify-between text-[11px] sm:text-sm">
                    <span className="text-[#8C5383] font-bold">Com o Lumê (potencial):</span>
                    <span className="font-extrabold text-emerald-700 text-xs sm:text-base">
                      R$ {faturamentoComLume.toLocaleString('pt-BR')}/mês
                    </span>
                  </div>
                </div>

                {/* CTAs Finais */}
                <div className="space-y-2 pt-1">
                  <Link
                    href="/cadastro"
                    className="w-full min-h-[46px] sm:min-h-[56px] flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#3D2E4D] hover:bg-[#2E223B] text-white text-xs sm:text-base font-bold shadow-md transition transform active:scale-[0.99] cursor-pointer"
                  >
                    <span>Quero organizar minha agenda</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSimuladorStep(1)}
                    className="w-full text-center text-[10px] sm:text-xs font-bold text-[#6B5E7A] hover:text-[#30203E] transition py-1 cursor-pointer"
                  >
                    ← Recalcular com outros números
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 7. PREÇOS E PLANOS - #precos (LISTA SINTÉTICA SEM CARDS) */}
      <section id="precos" className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8] scroll-mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            {/* Eyebrow Estilizado Sem Card */}
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

          <div className="max-w-2xl mx-auto bg-[#FAF8F5] rounded-3xl p-6 sm:p-10 border border-[#E8DFD8] shadow-xl space-y-8 text-center relative">
            <div className="space-y-2 border-b border-[#E8DFD8] pb-6">
              <h3 className="text-2xl font-bold text-[#3D2E4D]">Assinatura Mensal Completa</h3>
              <div className="flex items-baseline justify-center gap-1 pt-1">
                <span className="text-5xl font-extrabold text-[#3D2E4D]">
                  R$ {planPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-[#6B5E7A] font-semibold">/mês</span>
              </div>
              <p className="text-xs text-[#6B5E7A] font-medium">
                30 dias de teste grátis — cancele a qualquer momento sem custos ou taxa de adesão
              </p>
            </div>

            {/* Lista Sintética de Funcionalidades (Sem Cards) */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-extrabold text-[#3D2E4D] uppercase tracking-wider border-b border-[#E8DFD8] pb-2.5">
                Tudo o que está incluído no seu plano:
              </h4>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Página exclusiva:</strong> seu link personalizado (<code className="text-[10px] bg-white px-1 py-0.5 rounded border border-gray-200">/p/sua-marca</code>).
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Agendamento 24h:</strong> clientes marcam sozinhas sem app ou cadastro prévio.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Bloqueio de choques:</strong> cálculo de duração e intervalo de descanso.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Google Agenda em 2 vias:</strong> sincronização automática com o celular.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Lembretes no WhatsApp:</strong> confirmações automáticas para reduzir faltas.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Manutenção periódica:</strong> avisos inteligentes para cílios, unhas e sobrancelhas.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Catálogo ilimitado:</strong> fotos, valores, durações e descrições dos serviços.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Gestão de clientes:</strong> fichas, histórico e identificação VIP/Frequente.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Painel financeiro:</strong> faturamento do dia/mês e receita futura prevista.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Avaliações e prova social:</strong> depoimentos reais e nota média na vitrine.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Personalização da marca:</strong> foto, bio profissional e capa personalizada.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Controle de jornada:</strong> horários de trabalho, almoço e folgas pontuais.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Atalho no celular:</strong> instalação direta na tela inicial (super leve).
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#3D2E4D] leading-snug">
                    <strong>Suporte humanizado:</strong> time dedicado e especializado no nicho da beleza.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <Link
                href="/cadastro"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#3D2E4D] py-4 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-[#2E223B] transition cursor-pointer"
              >
                <span>Começar 30 dias de teste grátis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 8. SOBRE O LUMÊ - #sobre */}
      <section id="sobre" className="py-16 sm:py-24 scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          {/* Eyebrow Estilizado Sem Card */}
          <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
            <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            <span>Nossa Missão</span>
            <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight max-w-2xl mx-auto">
            Desenvolvido para o fluxo real da beleza autônoma
          </h2>

          <p className="text-sm sm:text-base text-[#6B5E7A] font-normal leading-relaxed max-w-2xl mx-auto">
            O Lumê nasceu para libertar profissionais da beleza da exaustão de responder mensagens manuais enquanto atendem. Sabemos que o seu tempo com o pincel, a pinça ou a tesoura na mão é valioso — e a sua agenda deve trabalhar para você, não o contrário.
          </p>
        </div>
      </section>

      {/* 9. DÚVIDAS FREQUENTES (FAQ) */}
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
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left transition cursor-pointer gap-4"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#3D2E4D] leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
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

      {/* 10. CTA FINAL */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              Pronta para simplificar sua rotina e valorizar seu atendimento?
            </h2>
            
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Leva menos de 5 minutos para configurar sua vitrine e liberar os agendamentos online.
            </p>

            <div className="pt-2">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#3D2E4D] shadow-lg hover:bg-[#F4EAE4] transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Testar minha agenda grátis (30 dias)</span>
                <ArrowRight className="h-4 w-4 text-[#3D2E4D]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. RODAPÉ */}
      <footer className="border-t border-[#E8DFD8] bg-white py-6 sm:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* LAYOUT MOBILE (sm:hidden): Logo grande centralizada, @2026 Lumê e links nas extremidades */}
          <div className="sm:hidden flex flex-col items-center space-y-4 text-center">
            {/* Logo Centralizada Tamanho Grande */}
            <Link href="/" className="inline-block">
              <Image
                src="/assets/lume_logo.webp"
                alt="Lumê"
                width={140}
                height={42}
                className="h-10 w-auto object-contain mx-auto"
              />
            </Link>

            {/* Linha © 2026 Lumê. Desenvolvido para profissionais autônomas da beleza. */}
            <p className="text-xs text-[#6B5E7A] font-medium leading-relaxed max-w-xs mx-auto">
              © {currentYear} Lumê. Desenvolvido para profissionais autônomas da beleza.
            </p>

            {/* Extremidades: Esquerda (Termos de Serviço) e Direita (Política de Privacidade) */}
            <div className="flex items-center justify-between w-full pt-3 border-t border-[#E8DFD8]/70 text-xs font-semibold text-[#3D2E4D]">
              <Link href="/termos" className="hover:text-[#8C5383] transition">
                Termos de Serviço
              </Link>
              <Link href="/privacidade" className="hover:text-[#8C5383] transition">
                Política de Privacidade
              </Link>
            </div>
          </div>

          {/* LAYOUT DESKTOP (hidden sm:flex): Linha única limpa */}
          <div className="hidden sm:flex items-center justify-between gap-4 text-xs text-[#6B5E7A]">
            {/* Lado Esquerdo: Logo + Desenvolvido por */}
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-block shrink-0">
                <Image
                  src="/assets/lume_logo.webp"
                  alt="Lumê"
                  width={80}
                  height={24}
                  className="h-auto w-auto max-h-6 object-contain"
                />
              </Link>
              <span className="text-[#E8DFD8]" aria-hidden="true">•</span>
              <span className="font-medium text-[#6B5E7A]">
                © {currentYear} Lumê. Desenvolvido para profissionais autônomas da beleza.
              </span>
            </div>

            {/* Lado Direito: Links de Termos e Privacidade */}
            <div className="flex items-center gap-5 text-xs font-semibold text-[#3D2E4D]">
              <Link href="/termos" className="hover:text-[#8C5383] transition">
                Termos de Serviço
              </Link>
              <span className="text-[#E8DFD8]" aria-hidden="true">•</span>
              <Link href="/privacidade" className="hover:text-[#8C5383] transition">
                Política de Privacidade
              </Link>
            </div>
          </div>

        </div>
      </footer>

      {/* 11. MODAL DE INSTRUÇÕES DE INSTALAÇÃO NO CELULAR */}
      {pwaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E8DFD8] space-y-5 text-left">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#F4EAE4] flex items-center justify-center text-[#8C5383]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#3D2E4D]">Instalar o Lumê no Celular</h4>
                  <p className="text-[11px] text-[#6B5E7A] font-medium">Atalho direto na sua tela inicial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPwaModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* iPhone (iOS) */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8DFD8] space-y-2">
                <div className="flex items-center gap-2 text-[#3D2E4D] font-bold">
                  <Smartphone className="h-3.5 w-3.5 text-[#8C5383]" aria-hidden="true" />
                  <span>No iPhone (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[#6B5E7A] font-medium leading-relaxed">
                  <li>
                    Toque no botão <strong>Compartilhar</strong> (<Share className="h-3 w-3 inline text-[#8C5383]" aria-hidden="true" />) na barra inferior do Safari.
                  </li>
                  <li>
                    Role para baixo e selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong> (<PlusSquare className="h-3 w-3 inline text-[#8C5383]" aria-hidden="true" />).
                  </li>
                  <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                </ol>
              </div>

              {/* Android (Chrome) */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8DFD8] space-y-2">
                <div className="flex items-center gap-2 text-[#3D2E4D] font-bold">
                  <Smartphone className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span>No Android (Chrome)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[#6B5E7A] font-medium leading-relaxed">
                  <li>
                    Toque no menu de <strong>3 pontos</strong> (<MoreVertical className="h-3 w-3 inline text-[#8C5383]" />) no canto superior.
                  </li>
                  <li>
                    Selecione <strong>&quot;Adicionar à tela inicial&quot;</strong> ou <strong>&quot;Instalar aplicativo&quot;</strong>.
                  </li>
                  <li>Confirme tocando em <strong>Adicionar</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPwaModalOpen(false)}
                className="w-full py-2.5 bg-[#3D2E4D] text-white font-bold rounded-xl text-xs shadow-md hover:bg-[#2E223B] transition cursor-pointer"
              >
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

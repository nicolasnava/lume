'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Smartphone,
  ShieldCheck,
  Lock,
  Scissors,
  Clock,
  MessageCircle,
  XCircle,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function JornadaClientePage() {
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
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

          {/* Timeline Vertical */}
          <div className="relative">
            {/* Linha vertical conectora */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[#B8A9D9] via-[#B8A9D9]/50 to-transparent pointer-events-none" aria-hidden="true" />

            <div className="space-y-10">
              {journeyMoments.map((moment, idx) => {
                const Icon = moment.icon
                const isLast = idx === journeyMoments.length - 1
                return (
                  <div key={moment.number} className="relative flex gap-6 sm:gap-8">
                    {/* Ponto da timeline */}
                    <div className="relative flex flex-col items-center shrink-0">
                      <div className="h-10 w-10 rounded-full bg-white border-2 border-[#B8A9D9] flex items-center justify-center z-10 shadow-sm">
                        <span className="text-xs font-black text-[#8C5383] tracking-tight">{moment.number}</span>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className={`pb-2 flex-1 space-y-2 ${isLast ? '' : 'pb-4'}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-[#8C5383] uppercase tracking-widest">{moment.badge}</span>
                        <span className="text-[11px] text-[#6B5E7A] font-medium bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E8DFD8]">
                          {moment.time}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#3D2E4D] leading-snug">
                        {moment.title}
                      </h3>

                      <p className="text-sm text-[#6B5E7A] leading-relaxed">
                        {moment.desc}
                      </p>

                      <ul className="pt-1 space-y-1">
                        {moment.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#6B5E7A]">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#B8A9D9] shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
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
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3D2E4D] hover:bg-[#2E223B] px-8 py-4 text-xs sm:text-sm font-bold text-white shadow-md transition shrink-0 cursor-pointer w-full sm:w-auto"
            >
              <span>Experimentar 30 dias grátis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
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

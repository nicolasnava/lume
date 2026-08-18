'use client'

import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Smartphone,
  Check,
  Bell,
  MessageCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function JornadaClientePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* Hero da Página de Jornada da Cliente */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight max-w-3xl mx-auto leading-tight">
            Um jeito simples de marcar. Um dia mais tranquilo para você.
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] max-w-2xl mx-auto leading-relaxed">
            Sua cliente escolhe o serviço, encontra um horário disponível e confirma o atendimento pelo celular, sem precisar baixar aplicativo.
          </p>

          <div className="pt-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3D2E4D] px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-[#2E223B] transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Criar minha agenda grátis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Fluxo em 4 Etapas Visuais */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Passo a passo simplificado</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Como sua cliente agenda em menos de 1 minuto
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Sem login, sem download e sem atritos. Apenas o que interessa para marcar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Etapa 1 */}
            <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E8DFD8] space-y-4 hover:border-[#8C5383] transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#3D2E4D] shadow-xs">
                    <Smartphone className="h-6 w-6 text-[#3D2E4D]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#3D2E4D] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                    01
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#3D2E4D]">Acessa seu link exclusivo</h3>
                <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                  A cliente clica no link personalizado (<code className="bg-white px-1 py-0.5 rounded text-[10px] border border-gray-200">/p/sua-marca</code>) na sua bio do Instagram ou no WhatsApp.
                </p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 text-[11px] text-[#3D2E4D] font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Abre direto em qualquer celular</span>
              </div>
            </div>

            {/* Etapa 2 */}
            <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E8DFD8] space-y-4 hover:border-[#8C5383] transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#8C5383] shadow-xs">
                    <Sparkles className="h-6 w-6 text-[#8C5383]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#8C5383] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                    02
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#3D2E4D]">Escolhe o procedimento</h3>
                <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                  Visualiza as fotos reais dos seus trabalhos, descrições detalhadas, duração exata e o valor de cada serviço.
                </p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 text-[11px] text-[#3D2E4D] font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Transparência e profissionalismo</span>
              </div>
            </div>

            {/* Etapa 3 */}
            <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E8DFD8] space-y-4 hover:border-[#8C5383] transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#8C5383] shadow-xs">
                    <Calendar className="h-6 w-6 text-[#8C5383]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#8C5383] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                    03
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#3D2E4D]">Seleciona data e horário</h3>
                <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                  O sistema calcula seus intervalos de descanso, expediente e bloqueios, exibindo apenas horários realmente livres.
                </p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 text-[11px] text-[#3D2E4D] font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Zero risco de horários duplicados</span>
              </div>
            </div>

            {/* Etapa 4 */}
            <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E8DFD8] space-y-4 hover:border-[#8C5383] transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#8C5383] shadow-xs">
                    <Check className="h-6 w-6 text-[#8C5383]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#8C5383] bg-white px-2.5 py-1 rounded-full border border-[#E8DFD8]">
                    04
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#3D2E4D]">Confirmação imediata</h3>
                <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                  A cliente preenche apenas Nome e WhatsApp. O agendamento é registrado na hora e o comprovante é exibido na tela.
                </p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 text-[11px] text-[#3D2E4D] font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Pronto! Tudo organizado</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Seção "O que acontece depois do agendamento?" */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Automação e tranquilidade</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              O que acontece depois que a cliente marca?
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              O Lumê cuida dos detalhes nos bastidores para que você não precise se preocupar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#3D2E4D]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Horário Bloqueado</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                O horário sai da vitrine imediatamente e entra no seu Google Calendar em tempo real.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#8C5383]">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Aviso no seu Celular</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Você recebe uma notificação com o nome da cliente, serviço escolhido e horário marcado.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-emerald-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Lembrete Automático</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Avisos automáticos prévios enviados no WhatsApp para garantir o comparecimento da cliente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#8C5383]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Auto-Cancelamento</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Se imprevistos acontecerem, a cliente consulta ou cancela seu horário com antecedência mínima de 4h.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Destaque dos Benefícios para a Profissional */}
      <section className="py-16 sm:py-24 bg-white border-t border-[#E8DFD8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              O impacto direto no seu dia a dia
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Menos interrupções durante os atendimentos e mais pontualidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] space-y-2 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#3D2E4D] block font-sans">
                -85%
              </span>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Menos conversas manuais</h3>
              <p className="text-xs text-[#6B5E7A]">Sem precisar negociar horários pelo WhatsApp.</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] space-y-2 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#8C5383] block font-sans">
                0
              </span>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Horários duplicados</h3>
              <p className="text-xs text-[#6B5E7A]">Bloqueio automático e preciso de conflitos.</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] space-y-2 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block font-sans">
                -70%
              </span>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Faltas e no-shows</h3>
              <p className="text-xs text-[#6B5E7A]">Confirmações e lembretes automáticos.</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] space-y-2 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#8C5383] block font-sans">
                100%
              </span>
              <h3 className="text-sm font-bold text-[#3D2E4D]">Experiência profissional</h3>
              <p className="text-xs text-[#6B5E7A]">Sua marca transmitindo confiança e autoridade.</p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              Deixe sua cliente encontrar o melhor horário sozinha.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Crie sua conta em poucos minutos e comece a receber agendamentos hoje mesmo.
            </p>
            <div className="pt-2">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#3D2E4D] shadow-lg hover:bg-[#F4EAE4] transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Criar minha agenda grátis</span>
                <ArrowRight className="h-4 w-4 text-[#3D2E4D]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

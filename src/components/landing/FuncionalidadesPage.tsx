'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  TrendingUp,
  MessageCircle,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function FuncionalidadesPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* Hero da Página de Funcionalidades */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight max-w-3xl mx-auto leading-tight">
            Tudo para organizar sua agenda, suas clientes e sua rotina
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] max-w-2xl mx-auto leading-relaxed">
            Do primeiro agendamento ao retorno da cliente, o Lumê deixa seu dia mais leve, profissional e previsível.
          </p>

          <div className="pt-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3D2E4D] px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-[#2E223B] transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Conhecer o Lumê grátis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pilares Principais em Seções Alternadas */}
      <section className="py-12 sm:py-20 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24">
          
          {/* Pilar 1: Agendamento Online */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-5 text-left order-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                <span>Agendamento online</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                Sua cliente escolhe. Você confirma.
              </h2>
              <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                Envie seu link. Ela vê os horários disponíveis e agenda sozinha — até quando você está atendendo.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#3D2E4D] pt-2">
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
            </div>
            <div className="lg:col-span-6 flex justify-center order-2">
              <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-[#FAF8F5]">
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

          {/* Pilar 2: Clientes e Retorno */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                <span>Clientes e retorno</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                Lembre suas clientes na hora certa.
              </h2>
              <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                Veja quem já veio, quem precisa voltar e mantenha seus atendimentos em dia.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#3D2E4D] pt-2">
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
            </div>
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-[#FAF8F5]">
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

          {/* Pilar 3: Rotina e Financeiro */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-5 text-left order-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                <span>Rotina e financeiro</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                Veja tudo o que acontece no seu dia.
              </h2>
              <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                Acompanhe seus horários, atendimentos e dinheiro em um só lugar.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#3D2E4D] pt-2">
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
            </div>
            <div className="lg:col-span-6 flex justify-center order-2">
              <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-md relative bg-[#FAF8F5]">
                <Image
                  src="/assets/funcionalidades/financeiro.webp"
                  alt="Painel financeiro do Lumê"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Pilar 4: Google Agenda em 2 Vias */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
                <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
                <span>Google Agenda</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2E4D] tracking-tight leading-[1.18] [text-wrap:balance]">
                Sua agenda pessoal e profissional, juntas.
              </h2>
              <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed [text-wrap:pretty]">
                O Lumê bloqueia seus compromissos pessoais e evita horários duplicados.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#3D2E4D] pt-2">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Sem conflito entre compromissos e clientes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Atualização automática</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Tudo em um só lugar</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Mais tranquilidade para organizar o dia</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
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

      {/* Seção "Feito para a sua rotina" */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Feito para a sua rotina</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              A tranquilidade que seu atendimento merece
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Menos tempo administrando mensagens e mais foco no cuidado com cada cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF1EE] flex items-center justify-center text-[#C86D51]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Menos mensagens repetitivas</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Suas clientes agendam sozinhas pelo seu link sem depender de 10 mensagens de áudio enquanto você atende.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF1EE] flex items-center justify-center text-[#8C5383]">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Zero conflitos de horário</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Intervalos e durações calculados com precisão, integrados aos seus compromissos particulares.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF1EE] flex items-center justify-center text-[#3D2E4D]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Mais controle do seu dia</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Saiba exatamente quantos atendimentos tem hoje, quanto vai faturar no mês e quem precisa de manutenção.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF1EE] flex items-center justify-center text-emerald-700">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Mais tempo para atender</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Foque na sua arte e no relacionamento com as clientes sem a ansiedade constante de mensagens acumuladas.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              Sua agenda pode trabalhar por você.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Leva menos de 3 minutos para cadastrar seus serviços e compartilhar seu link exclusivo.
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  TrendingUp,
  ChevronDown,
  HelpCircle,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

interface PrecosPageProps {
  planPrice?: number
  trialDays?: number
}

export default function PrecosPage({ planPrice = 69.90, trialDays = 30 }: PrecosPageProps) {
  // Estado do FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Preciso cadastrar cartão de crédito para fazer o teste grátis?',
      answer:
        'Não! Você cria sua conta em menos de 1 minuto apenas com seu e-mail e dados básicos. Não pedimos cartão de crédito para você começar seu teste gratuito.',
    },
    {
      question: 'Como funciona o cancelamento?',
      answer:
        'O cancelamento é 100% livre e descomplicado. Você pode cancelar sua assinatura a qualquer momento com apenas 1 clique no seu painel, sem multas, taxas ou pegadinhas.',
    },
    {
      question: 'Existe limite de clientes ou agendamentos mensais?',
      answer:
        'Não há limites. Você pode cadastrar quantos serviços quiser, receber agendamentos ilimitados 24 horas por dia e ter sua base completa de clientes sem qualquer cobrança extra.',
    },
    {
      question: 'Como funciona a integração com o WhatsApp?',
      answer:
        'O Lumê envia confirmações imediatas de agendamento e lembretes automáticos prévios para o WhatsApp da cliente, garantindo que ela não esqueça do horário marcado e reduzindo drasticamente as faltas.',
    },
    {
      question: 'Como funciona a sincronização com o Google Agenda?',
      answer:
        'A sincronização é em duas vias: quando uma cliente agenda no Lumê, o compromisso entra no seu Google Calendar. E quando você adiciona um compromisso pessoal no seu celular, o Lumê bloqueia aquele horário na sua vitrine pública.',
    },
    {
      question: 'O Lumê funciona em iPhone e Android?',
      answer:
        'Sim! O Lumê foi desenvolvido como uma aplicação web ultra-leve (PWA). Você pode adicioná-lo à tela inicial do seu celular em segundos, acessando sua agenda com 1 toque sem ocupar memória do aparelho.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* Hero da Página de Preços */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight max-w-3xl mx-auto leading-tight">
            Tudo o que você precisa, sem complicar
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] max-w-2xl mx-auto leading-relaxed">
            Uma agenda profissional para organizar seus atendimentos, suas clientes e seu financeiro em um só lugar.
          </p>

        </div>
      </section>

      {/* Grid de Planos: Solo vs Studio */}
      <section className="py-8 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* CARD 1: PLANO SOLO */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DFD8] shadow-lg space-y-7 flex flex-col justify-between relative">
              <div className="space-y-6">
                <div className="space-y-2 border-b border-[#E8DFD8] pb-6 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F0F7] text-[#4A3F5C] text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>Profissional Autônoma</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D]">Plano Solo</h2>
                  <p className="text-xs sm:text-sm text-[#6B5E7A]">
                    Tudo o que você precisa para atender de forma individual com excelência.
                  </p>
                  <div className="flex items-baseline justify-center gap-1 pt-3">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#3D2E4D]">
                      R$ {planPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm text-[#6B5E7A] font-semibold">/mês</span>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#6B5E7A] font-medium">
                    <span>Teste grátis por {trialDays} dias</span>
                    <span>•</span>
                    <span>Sem taxa de adesão</span>
                    <span>•</span>
                    <span>Cancele quando quiser</span>
                  </div>
                </div>

                {/* Lista Solo */}
                <div className="space-y-3 text-left">
                  <h3 className="text-xs font-bold text-[#3D2E4D] uppercase tracking-wider">
                    Recursos incluídos no Solo:
                  </h3>
                  <ul className="space-y-3 text-xs font-medium text-[#3D2E4D]">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>1 Profissional:</strong> acesso completo à sua conta e agenda pessoal.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Vitrine digital individual:</strong> link exclusivo com suas fotos e serviços.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Agendamentos e clientes ilimitados:</strong> sem surpresas no fim do mês.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Lembretes e confirmações no WhatsApp:</strong> redução de faltas e no-show.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Controle financeiro pessoal:</strong> faturamento, despesas e metas mensais.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Google Calendar em 2 vias:</strong> sincronização direta no seu celular.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Gestão de combos, cupons e avaliações:</strong> fidelização completa.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8DFD8]">
                <Link
                  href="/cadastro"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4A3F5C] py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#393047] transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Começar Teste Grátis Solo</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* CARD 2: PLANO STUDIO */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-[#B8A9D9] shadow-xl space-y-7 flex flex-col justify-between relative ring-2 ring-[#B8A9D9]/20">
              <span className="absolute -top-3.5 right-6 px-4 py-1 rounded-full bg-[#4A3F5C] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                Mais Completo para Espaços
              </span>

              <div className="space-y-6">
                <div className="space-y-2 border-b border-[#E8DFD8] pb-6 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B8A9D9]/30 text-[#4A3F5C] text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>Para Salões, Esmalterias & Studios</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D]">Plano Studio</h2>
                  <p className="text-xs sm:text-sm text-[#6B5E7A]">
                    Controle total da sua equipe, repasses automáticos e recepção unificada.
                  </p>
                  <div className="flex items-baseline justify-center gap-1 pt-3">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#3D2E4D]">
                      R$ 169,00
                    </span>
                    <span className="text-sm text-[#6B5E7A] font-semibold">/mês</span>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#4A3F5C] font-semibold">
                    <span>Até 6 profissionais inclusas</span>
                    <span>•</span>
                    <span>+R$ 29/mês por profissional extra</span>
                  </div>
                </div>

                {/* Lista Studio */}
                <div className="space-y-3 text-left">
                  <h3 className="text-xs font-bold text-[#3D2E4D] uppercase tracking-wider">
                    Tudo do Solo mais recursos exclusivos de Studio:
                  </h3>
                  <ul className="space-y-3 text-xs font-medium text-[#3D2E4D]">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Equipe inclusa:</strong> até 6 profissionais (sem custo para as profissionais da equipe).</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Fechamento de comissões automático:</strong> cálculo exato de repasses em 1 clique.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Extrato no WhatsApp:</strong> envie o demonstrativo de comissão para a parceira.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Agenda da recepção unificada:</strong> visualize todos os horários e cadeiras do espaço.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Vitrine coletiva do Studio:</strong> link único (<code className="text-[10px] bg-[#FAF8F5] px-1 rounded border border-[#E8DFD8]">/studio/seu-espaco</code>) com agendamento por profissional ou serviço.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Agendamento assistido:</strong> recepção ou dona podem marcar horários pela equipe.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Dois modelos de negócio:</strong> Gestão Completa (Comissões) ou Aluguel de Cadeira (Coworking).</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Termo de integração digital (LGPD):</strong> respaldo jurídico alinhado à Lei do Salão-Parceiro.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8DFD8]">
                <Link
                  href="/cadastro?plano=studio"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B8A9D9] hover:bg-[#a695ca] py-3.5 text-xs sm:text-sm font-bold text-[#4A3F5C] shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Criar Meu Studio no Lumê</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Seção "O que você ganha com o Lumê" */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Retorno real para seu trabalho</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              O que você ganha com o Lumê
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Mais do que uma agenda: uma parceira diária para valorizar seu atendimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#E8DFD8] space-y-4 hover:border-[#8C5383]/40 transition">
              <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#3D2E4D] shadow-xs">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#3D2E4D]">Mais horários organizados</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed font-medium">
                Sua vitrine trabalha por você 24h por dia. A cliente agenda à noite ou no final de semana sem você precisar parar o que está fazendo para responder.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#E8DFD8] space-y-4 hover:border-[#8C5383]/40 transition">
              <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#8C5383] shadow-xs">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#3D2E4D]">Clientes mais bem acompanhadas</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed font-medium">
                Saiba quem são suas melhores clientes, veja a data do último atendimento e lembre cada uma do momento ideal de retocar o procedimento.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#E8DFD8] space-y-4 hover:border-[#8C5383]/40 transition">
              <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#8C5383] shadow-xs">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#3D2E4D]">Visão clara do seu dinheiro</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed font-medium">
                Acompanhe o faturamento do dia, previsões da semana e seu ticket médio sem precisar de cadernos confusos ou planilhas difíceis.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Seção de Perguntas Frequentes (FAQ) */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <HelpCircle className="h-4 w-4 text-[#8C5383]" />
              <span>Dúvidas comuns</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Perguntas frequentes
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Tudo o que você precisa saber antes de começar seu teste gratuito.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-[#E8DFD8] overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#3D2E4D] hover:text-[#8C5383] transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 text-[#8C5383] ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#6B5E7A] leading-relaxed border-t border-gray-100 pt-3 animate-in fade-in duration-200 font-medium">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              Você cuida do atendimento. O Lumê cuida da organização.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Experimente por {trialDays} dias grátis e transforme a rotina da sua agenda.
            </p>
            <div className="pt-2">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#3D2E4D] shadow-lg hover:bg-[#F4EAE4] transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Testar agenda grátis</span>
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

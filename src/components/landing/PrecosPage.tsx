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

      {/* Card Principal de Preço */}
      <section className="py-8 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8DFD8] shadow-2xl space-y-8 text-center relative">
            <div className="space-y-3 border-b border-[#E8DFD8] pb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D]">Assinatura Mensal Completa</h2>
              <p className="text-xs sm:text-sm text-[#6B5E7A]">
                Desenvolvido especialmente para o fluxo de quem atende de forma autônoma.
              </p>
              <div className="flex items-baseline justify-center gap-1 pt-2">
                <span className="text-5xl sm:text-6xl font-extrabold text-[#3D2E4D]">
                  R$ {planPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-base text-[#6B5E7A] font-semibold">/mês</span>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[#6B5E7A] font-medium">
                <span>Teste grátis por {trialDays} dias</span>
                <span>•</span>
                <span>Sem taxa de adesão</span>
                <span>•</span>
                <span>Cancelamento simples</span>
              </div>
            </div>

            {/* Lista Escaneável de Funcionalidades */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-extrabold text-[#3D2E4D] uppercase tracking-wider border-b border-[#E8DFD8] pb-2.5">
                Tudo incluído no seu plano:
              </h3>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 text-xs font-medium text-[#3D2E4D]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Agendamento online:</strong> vitrine pública 24h sem exigir login da cliente.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Vitrine personalizada:</strong> seu link exclusivo (<code className="text-[10px] bg-[#FAF8F5] px-1 rounded border border-[#E8DFD8]">/p/sua-marca</code>), foto e capa.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Lembretes no WhatsApp:</strong> avisos automáticos prévios para evitar no-show.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Histórico de clientes:</strong> ficha com atendimentos anteriores e preferências.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Classificação inteligente:</strong> clientes VIPs, Frequentes e Inativas.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Retorno de clientes:</strong> alertas para manutenção periódica de procedimentos.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Gestão de serviços:</strong> cadastro ilimitado com fotos, durações e preços.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Disponibilidade:</strong> controle de expediente, almoço e bloqueios de folgas.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Controle financeiro:</strong> faturamento do dia/mês e receita futura estimada.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Avaliações e reputação:</strong> depoimentos reais e nota média na vitrine.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Google Calendar em 2 vias:</strong> sincronização direta com sua agenda pessoal.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Acesso pelo celular:</strong> instalação direta na tela inicial (PWA ultra-leve).</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <Link
                href="/cadastro"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#3D2E4D] py-4 text-sm font-bold text-white shadow-xl hover:bg-[#2E223B] transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Começar teste grátis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
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

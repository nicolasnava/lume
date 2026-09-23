'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'
import { CasinoPriceTicker, CornerFillButton } from '@/components/ui'
import BillingCycleToggle from './BillingCycleToggle'
import PlanComparisonDialog from './PlanComparisonDialog'

interface PrecosPageProps {
  planPrice?: number
  trialDays?: number
}

export default function PrecosPage({ planPrice = 69.90, trialDays = 30 }: PrecosPageProps) {
  // Estado do FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Ciclo de cobrança: Mensal ou Anual
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [showPlanDetails, setShowPlanDetails] = useState(false)

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
    <div className="landing-motion-scope min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Toggle de Ciclo de Faturamento (Mensal / Anual) */}
          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
            <p className="text-xs text-[#6B5E7A] font-medium">
              {billingCycle === 'annual'
                ? 'Economize 17% com faturamento anual antecipado'
                : 'Pague mês a mês sem fidelidade ou multa rescisória'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto pt-2">
            
            {/* CARD 1: PLANO SOLO (FUNDO ESCURO, BORDA LILÁS LUMÊ, MAIS POPULAR) */}
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
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Lumê Individual</h2>
                  </div>
                  <div className="pt-2 pb-1 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-[#D5CBDD]/70 line-through">{billingCycle === 'annual' ? 'De R$ 69,90 por' : 'De R$ 97,00 por'}</span>
                    <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                    <CasinoPriceTicker
                      price={billingCycle === 'annual' ? '57,90' : planPrice.toFixed(2).replace('.', ',')}
                      className="text-4xl sm:text-5xl font-extrabold text-white"
                      suffixClassName="text-sm text-[#D5CBDD] font-semibold ml-1.5"
                    />
                    </div>
                  </div>
                  <div className="h-6 flex items-center justify-center text-center">
                    <p className="text-[11px] text-[#C4B6CE] font-medium">
                      {billingCycle === 'annual' ? 'R$ 694,80 faturados anualmente (2 meses grátis)' : `${trialDays} dias de teste grátis · Cancele quando quiser`}
                    </p>
                  </div>
                </div>

                {/* Lista Solo */}
                <div className="space-y-4 text-left flex-1 flex flex-col">
                  <div className="h-9 flex items-center border-b border-white/10 pb-2">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Tudo o que está incluído no plano:</h3>
                  </div>
                  <ul className="space-y-3 text-xs font-medium text-[#FAF7F5] flex-1">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">1 Profissional:</strong> acesso completo à sua conta e agenda pessoal.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Vitrine digital individual:</strong> link exclusivo com suas fotos e serviços.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Agendamentos e clientes ilimitados:</strong> sem surpresas no fim do mês.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Lembretes e confirmações no WhatsApp:</strong> redução de faltas e no-show.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Controle financeiro pessoal:</strong> faturamento, despesas e metas mensais.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Google Calendar em 2 vias:</strong> sincronização direta no seu celular.</span>
                    </li>
                    <li className="flex items-start gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong className="text-white">Ficha completa de clientes:</strong> histórico de atendimentos, preferências e fotos.</span></li>
                    <li className="flex items-start gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong className="text-white">Controle de disponibilidade:</strong> organize expediente, folgas e intervalos.</span></li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Gestão de combos, cupons e avaliações:</strong> fidelização completa.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">E muito mais:</strong> novos recursos e melhorias contínuas sem custo adicional.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 mt-6">
                <CornerFillButton
                  href={billingCycle === 'annual' ? '/cadastro?plano=anual' : '/cadastro'}
                  variant="light"
                  className="w-full py-4 text-xs sm:text-sm"
                >
                  <span className="whitespace-nowrap">Começar 30 dias de teste grátis</span>
                </CornerFillButton>
                <button type="button" onClick={() => setShowPlanDetails((open) => !open)} aria-expanded={showPlanDetails} className="w-full mt-3.5 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#D5CBDD] transition-colors duration-200 hover:text-white active:scale-[0.98]">
                  <span>{showPlanDetails ? 'Ocultar detalhes dos planos' : 'Ver detalhes dos planos'}</span><ChevronDown className={`h-4 w-4 transition-transform duration-250 ease-out ${showPlanDetails ? 'rotate-180 text-white' : 'text-[#D5CBDD]'}`} />
                </button>
              </div>
            </div>

            {/* CARD 2: PLANO STUDIO (FUNDO CLARO LÍMPIDO, BORDA E ACENTOS VINHO LUMÊ) */}
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
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3D2E4D]">Lumê Studio</h2>
                  </div>
                  <div className="pt-2 pb-1 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-[#6B5E7A]/70 line-through">{billingCycle === 'annual' ? 'De R$ 169,00 por' : 'De R$ 249,00 por'}</span>
                    <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                    <CasinoPriceTicker
                      price={billingCycle === 'annual' ? '139,00' : '169,00'}
                      className="text-4xl sm:text-5xl font-extrabold text-[#3D2E4D]"
                      suffixClassName="text-sm text-[#6B5E7A] font-semibold ml-1.5"
                    />
                    </div>
                  </div>
                  <div className="h-6 flex items-center justify-center text-center">
                    <p className="text-[11px] text-[#6B5E7A] font-medium">
                      {billingCycle === 'annual' ? 'R$ 1.668,00 faturados anualmente (2 meses grátis)' : '30 dias de teste grátis · Até 6 profissionais incluídas'}
                    </p>
                  </div>
                </div>

                {/* Lista Studio */}
                <div className="space-y-4 text-left flex-1 flex flex-col">
                  <div className="h-9 flex items-center border-b border-[#E8DFD8] pb-2">
                    <h3 className="text-xs font-extrabold text-[#3D2E4D] uppercase tracking-wider">Recursos exclusivos do Studio:</h3>
                  </div>
                  <ul className="space-y-3 text-xs font-medium text-[#3D2E4D] flex-1">
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
                    <li className="flex items-start gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /><span><strong>Suporte prioritário:</strong> canal direto de atendimento para o espaço.</span></li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>E muito mais:</strong> infraestrutura completa e atualizada para seu estúdio.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E8DFD8] mt-6">
                <CornerFillButton
                  href={billingCycle === 'annual' ? '/studio?plano=anual' : '/studio'}
                  variant="dark"
                  className="w-full bg-[#8C5383] py-4 text-xs sm:text-sm"
                >
                  <span className="whitespace-nowrap">Conhecer o Lumê Studio</span>
                </CornerFillButton>
                <button type="button" onClick={() => setShowPlanDetails((open) => !open)} aria-expanded={showPlanDetails} className="w-full mt-3.5 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#8C5383] transition-colors duration-200 hover:text-[#6A3D63] active:scale-[0.98]">
                  <span>{showPlanDetails ? 'Ocultar detalhes dos planos' : 'Ver detalhes dos planos'}</span><ChevronDown className={`h-4 w-4 transition-transform duration-250 ease-out ${showPlanDetails ? 'rotate-180 text-[#6A3D63]' : 'text-[#8C5383]'}`} />
                </button>
              </div>
            </div>

          </div>
          <PlanComparisonDialog open={showPlanDetails} onClose={() => setShowPlanDetails(false)} />
        </div>
      </section>

      {/* Seção Editorial: O que você ganha com o Lumê */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="space-y-3 max-w-2xl mx-auto text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C5383]">
              Retorno real para seu trabalho
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              O que muda no seu dia a dia
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Mais do que uma agenda: uma parceira para valorizar seu tempo e seu atendimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div className="border-t-2 border-[#3D2E4D] pt-6 space-y-3">
              <span className="text-xs font-mono font-bold text-[#8C5383]">01 / AGENDAMENTO 24H</span>
              <h3 className="text-lg font-bold text-[#3D2E4D]">Mais horários organizados</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Sua vitrine trabalha por você 24h por dia. A cliente agenda à noite ou no fim de semana sem você precisar parar o que está fazendo para responder mensagens.
              </p>
            </div>

            <div className="border-t-2 border-[#8C5383] pt-6 space-y-3">
              <span className="text-xs font-mono font-bold text-[#8C5383]">02 / FIDELIZAÇÃO</span>
              <h3 className="text-lg font-bold text-[#3D2E4D]">Clientes acompanhadas</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Saiba quem são suas clientes mais fiéis, veja a data do último atendimento e mande um lembrete no momento ideal para ela retocar o procedimento.
              </p>
            </div>

            <div className="border-t-2 border-emerald-600 pt-6 space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-700">03 / CONTROLE REAL</span>
              <h3 className="text-lg font-bold text-[#3D2E4D]">Visão clara do seu dinheiro</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Acompanhe o faturamento do dia, previsões da semana e seu ticket médio sem depender de cadernos desorganizados ou anotações perdidas.
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
              <CornerFillButton href={billingCycle === 'annual' ? '/cadastro?plano=anual' : '/cadastro'} variant="light" className="px-8 py-4 text-sm font-bold shadow-lg" icon={<ArrowRight className="h-4 w-4" />}>
                <span>Testar agenda grátis</span>
              </CornerFillButton>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

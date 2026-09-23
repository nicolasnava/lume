'use client'

import { useState } from 'react'
import {
  MessageCircle,
  Phone,
  Mail,
  Settings2,
  ChevronDown,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'
import CornerFillButton from '@/components/ui/CornerFillButton'

export default function ContatoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const suporteFaqs = [
    {
      q: 'Como recuperar minha senha de acesso?',
      a: 'Na tela de login (/login), clique em "Esqueci minha senha" e informe seu e-mail cadastrado. Um link seguro de redefinição será enviado imediatamente para sua caixa de entrada.',
    },
    {
      q: 'Como alterar o link da minha vitrine pública?',
      a: 'No seu painel, acesse o menu "Perfil" no topo direito. No campo "Link exclusivo", digite o nome desejado (/p/seu-nome) e clique em "Salvar alterações".',
    },
    {
      q: 'Como funciona a sincronização com o Google Agenda?',
      a: 'Acesse o menu "Perfil", localize o card "Google Agenda" e clique em "Conectar Google Agenda". Conceda a permissão da sua conta Gmail e a sincronização em duas vias funcionará automaticamente.',
    },
    {
      q: 'Uma cliente quer cancelar o horário, o que fazer?',
      a: 'A cliente pode cancelar diretamente pela vitrine no botão "Meus Agendamentos", respeitando o limite de horas que você configurou, ou você pode abrir o atendimento na sua agenda (/dashboard/agenda) e cancelá-lo em 1 clique.',
    },
    {
      q: 'Vocês me ajudam a cadastrar meus procedimentos e fotos?',
      a: 'Sim! Se você não tiver tempo ou achar trabalhoso cadastrar um por um, mande sua tabela de preços ou cardápio de serviços no nosso WhatsApp que nós ajudamos a deixar sua vitrine pronta.',
    },
  ]

  return (
    <div className="landing-motion-scope min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* ===================================================================== */}
      {/* 1. HERO REFINADO */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-20 sm:pb-16">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#B8A9D9]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FAF0F5] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3D2E4D] tracking-tight leading-[1.15]">
            Você nunca está sozinha na sua rotina.
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] font-normal leading-relaxed max-w-2xl mx-auto">
            Sem robôs impessoais e sem menus que fazem você perder tempo. Aqui você conversa de verdade com a equipe que desenvolve o Lumê.
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. FALE DIRETAMENTE COM QUEM CONSTRÓI O LUMÊ (REFEITO DO ZERO) */}
      {/* ===================================================================== */}
      <section className="py-8 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Card Principal VIP de Contato Direto */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white to-[#FAF8F5] border-2 border-[#E8DFD8] shadow-xl p-6 sm:p-12 space-y-10">
            
            {/* Cabeçalho do Card */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
                Fale diretamente com quem constrói o Lumê
              </h2>

              <p className="text-sm sm:text-base text-[#6B5E7A] leading-relaxed">
                Entendemos na pele a pressa e o valor do seu tempo entre um atendimento e outro. Seja para tirar uma dúvida rápida, dar uma sugestão ou pedir ajuda para organizar sua agenda:
              </p>
            </div>

            {/* Grid dos 3 Meios de Contato Diretos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Opção 1: WhatsApp Oficial */}
              <div className="rounded-3xl bg-white p-6 border border-[#E8DFD8] shadow-2xs space-y-5 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      Mais Rápido
                    </span>
                    <h3 className="text-lg font-bold text-[#3D2E4D]">WhatsApp Oficial</h3>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Converse direto pelo celular com nossa equipe. Resposta ágil e personalizada.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <CornerFillButton
                    href="https://wa.me/5511965758459?text=Olá!%20Sou%20usuária%20do%20Lumê%20e%20gostaria%20de%20ajuda%20para%20configurar%20minha%20agenda."
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="pill"
                    className="w-full px-4 py-3 text-xs"
                    icon={<MessageCircle className="h-4 w-4 text-emerald-600" />}
                  >
                    <span>Iniciar no WhatsApp</span>
                  </CornerFillButton>
                  <span className="text-[11px] text-gray-400 text-center block font-medium">
                    (11) 96575-8459
                  </span>
                </div>
              </div>

              {/* Opção 2: E-mail Corporativo */}
              <div className="rounded-3xl bg-white p-6 border border-[#E8DFD8] shadow-2xs space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center border border-purple-100 shadow-xs">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8C5383] block">
                      Oficial
                    </span>
                    <h3 className="text-lg font-bold text-[#3D2E4D]">E-mail de Suporte</h3>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Ideal para dúvidas detalhadas, notas fiscais, parcerias ou solicitações formais.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href="mailto:contato@lumebr.app"
                    className="w-full py-3 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#FAF0F5] border border-[#E8DFD8] text-[#3D2E4D] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="h-4 w-4 text-[#8C5383]" />
                    <span>contato@lumebr.app</span>
                  </a>
                  <span className="text-[11px] text-gray-400 text-center block font-medium">
                    Retorno em até 24 horas úteis
                  </span>
                </div>
              </div>

              {/* Opção 3: Atendimento Telefônico */}
              <div className="rounded-3xl bg-white p-6 border border-[#E8DFD8] shadow-2xs space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-purple-50 text-[#3D2E4D] flex items-center justify-center border border-purple-100 shadow-xs">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#3D2E4D] block">
                      Voz Direta
                    </span>
                    <h3 className="text-lg font-bold text-[#3D2E4D]">Ligação Direta</h3>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Atendimento telefônico direto para clientes e profissionais cadastrados.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-2xl bg-[#FAF8F5]/80 border border-[#E8DFD8] text-gray-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed select-none"
                  >
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>Indisponível no momento</span>
                  </button>
                  <span className="text-[11px] text-gray-400 text-center block font-medium">
                    Atendimento via WhatsApp ou E-mail
                  </span>
                </div>
              </div>

            </div>

            {/* Destaque Extra de Compromisso de Atendimento */}
            <div className="rounded-3xl bg-[#FAF0F5] p-6 sm:p-8 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#8C5383]">
                  <Settings2 className="h-4 w-4" />
                  <span>Configuração Acompanhada</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#3D2E4D]">
                  Prefere que nossa equipe configure toda a sua conta?
                </h4>
                <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                  Solicite um orçamento para que nossa equipe técnica cadastre todos os seus serviços, produtos, fotos e valores. Entregamos sua vitrine e agenda 100% configuradas e prontas para receber agendamentos.
                </p>
              </div>

              <CornerFillButton
                href="https://wa.me/5511965758459?text=Olá!%20Gostaria%20de%20um%20orçamento%20para%20a%20equipe%20cadastrar%20meus%20serviços%20e%20configurar%20minha%20conta%20no%20Lumê."
                target="_blank"
                rel="noopener noreferrer"
                variant="dark"
                className="shrink-0 px-6 py-3.5 text-xs w-full sm:w-auto whitespace-nowrap"
              >
                <span>Orçar configuração e cadastro</span>
              </CornerFillButton>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. DÚVIDAS FREQUENTES DE SUPORTE */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10 text-left">
          
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">Dúvidas Rápidas</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D] tracking-tight">Perguntas comuns sobre sua conta</h2>
            <p className="text-xs sm:text-sm text-[#6B5E7A]">Respostas diretas para as configurações mais frequentes:</p>
          </div>

          <div className="space-y-3">
            {suporteFaqs.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-[#FAF8F5] ${
                    isOpen ? 'border-[#8C5383]/50 shadow-xs' : 'border-[#E8DFD8] hover:border-[#8C5383]/30'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition cursor-pointer gap-4"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#3D2E4D] leading-snug">
                      {item.q}
                    </span>
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'bg-[#FAF0F5] text-[#8C5383] rotate-180' : 'bg-white text-gray-400'
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-[#6B5E7A] font-medium leading-relaxed border-t border-gray-200/50 pt-3 animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. CTA FINAL */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl mx-auto leading-tight tracking-tight">
              Pronta para simplificar seus atendimentos?
            </h2>
            <p className="text-sm sm:text-base text-[#D5CBDD] max-w-md mx-auto leading-relaxed">
              Crie sua conta em 1 minuto e veja como o Lumê cuida da sua agenda para você focar na sua arte.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <CornerFillButton
                href="/cadastro"
                variant="light"
                className="w-full px-8 py-4 text-sm font-bold shadow-lg sm:w-auto"
              >
                <span>Criar minha agenda grátis</span>
              </CornerFillButton>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

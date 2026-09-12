'use client'

import Link from 'next/link'
import {
  Heart,
  ArrowRight,
  MessageCircle,
  Headphones,
  CheckCircle2,
  HelpCircle,
  Phone,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function ContatoPage() {
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
      q: 'Como sincronizar o Google Agenda?',
      a: 'Acesse o menu "Disponibilidade" no painel, localize o card "Google Calendar" e clique em "Conectar Google Agenda". Conceda a permissão da sua conta Google e a sincronização em 2 vias começará automaticamente.',
    },
    {
      q: 'Uma cliente quer cancelar o horário, o que fazer?',
      a: 'A cliente pode cancelar diretamente pela vitrine no botão "Meus Agendamentos", ou você pode abrir o agendamento no seu painel (/dashboard/agenda), clicar no atendimento e selecionar "Cancelar Agendamento".',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* Hero da Página de Contato */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight max-w-3xl mx-auto leading-tight">
            Você não precisa resolver tudo sozinha
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] max-w-2xl mx-auto leading-relaxed">
            Durante a fase Beta, nosso canal principal e mais ágil de atendimento é direto pelo WhatsApp com o time Lumê.
          </p>

        </div>
      </section>

      {/* Destaque Principal do WhatsApp Beta */}
      <section className="py-8 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8DFD8] shadow-xl text-center space-y-8 relative overflow-hidden">
            
            <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
              <MessageCircle className="h-10 w-10" />
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/80">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Suporte Beta Direto no WhatsApp</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D]">
                Fale diretamente com nossa equipe
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Tire dúvidas sobre a sua vitrine, receba ajuda na configuração da agenda ou compartilhe feedbacks sobre o aplicativo.
              </p>
            </div>

            {/* Ações de Contato WhatsApp */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/5511965758459?text=Olá!%20Sou%20usuária%20do%20Lumê%20e%20gostaria%20de%20ajuda."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 px-8 py-4 text-sm font-bold text-white shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Iniciar Conversa no WhatsApp</span>
              </a>

              <a
                href="tel:5511965758459"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-gray-50 px-6 py-4 text-xs font-bold text-[#3D2E4D] border border-[#E8DFD8] transition"
              >
                <Phone className="h-4 w-4 text-[#8C5383]" />
                <span>(11) 96575-8459</span>
              </a>
            </div>

            {/* Informações de Disponibilidade */}
            <div className="pt-6 border-t border-[#E8DFD8] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs text-[#6B5E7A]">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD8]">
                <Clock className="h-4 w-4 text-[#8C5383] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3D2E4D] block font-bold">Horário de Atendimento</strong>
                  <span>Segunda a Sábado, das 08h às 20h</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD8]">
                <Heart className="h-4 w-4 text-[#8C5383] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3D2E4D] block font-bold">Atendimento Humanizado</strong>
                  <span>Sem bots confusos ou menus infinitos</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD8]">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3D2E4D] block font-bold">Resposta Ágil</strong>
                  <span>Prioridade total para profissionais beta</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ Rápido de Suporte */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10 text-left">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D]">Ajuda rápida para o seu dia</h2>
            <p className="text-xs sm:text-sm text-[#6B5E7A]">Dúvidas frequentes de configuração e uso da plataforma.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suporteFaqs.map((item, idx) => (
              <div key={idx} className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E8DFD8] space-y-2 shadow-2xs">
                <h3 className="text-xs sm:text-sm font-bold text-[#3D2E4D] flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-[#8C5383] shrink-0" />
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">{item.a}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              Estamos aqui para deixar sua rotina mais leve.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Conte com nossa equipe para tirar qualquer dúvida e colocar sua agenda no ar com confiança.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/5511965758459?text=Olá!%20Preciso%20de%20suporte%20com%20o%20Lumê."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#3D2E4D] shadow-lg hover:bg-[#FAF0F5] transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>Falar com o suporte</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

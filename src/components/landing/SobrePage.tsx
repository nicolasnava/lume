'use client'

import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  Heart,
  Zap,
  Users,
  Smile,
  Scissors,
  Palette,
  CalendarDays,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function SobrePage() {
  const valores = [
    {
      icon: Zap,
      title: 'Simplicidade antes da complexidade',
      description:
        'Acreditamos que uma boa ferramenta não exige treinamento de semanas. O Lumê foi desenhado para ser intuitivo e direto ao ponto.',
    },
    {
      icon: Heart,
      title: 'Tecnologia para a rotina real da beleza',
      description:
        'Não somos um software corporativo adaptado. Pensamos no fluxo de procedimentos com intervalos, fotos, manutenções periódicas e atendimento próximo.',
    },
    {
      icon: Users,
      title: 'Mais autonomia para a profissional',
      description:
        'Seu espaço, suas regras e seu link exclusivo. O Lumê dá o controle total do seu negócio nas suas mãos, sem intermediários.',
    },
    {
      icon: Smile,
      title: 'Relacionamento acima de mensagens frias',
      description:
        'A automação deve libertar seu tempo para o que você faz de melhor: encantar sua cliente com uma experiência acolhedora e humana.',
    },
  ]

  const especialidades = [
    { icon: Sparkles, color: 'text-[#8C5383]', bg: 'bg-[#FAF0F5]', title: 'Lash Designers', desc: 'Controle exato de tempo para extensões e manutenção periódica de 15 a 21 dias.' },
    { icon: Palette, color: 'text-[#8C5383]', bg: 'bg-[#FAF0F5]', title: 'Nail Designers & Manicures', desc: 'Catálogo de procedimentos, esmaltação em gel e blindagens sem choques de agenda.' },
    { icon: Smile, color: 'text-[#3D2E4D]', bg: 'bg-[#F5F0FA]', title: 'Designers de Sobrancelhas', desc: 'Agendamentos rápidos de henna, micropigmentação e alinhamentos faciais.' },
    { icon: Scissors, color: 'text-[#8C5383]', bg: 'bg-[#FAF0F5]', title: 'Cabeleireiras & Terapeutas', desc: 'Intervalos calculados para químicas, cortes, escovas e tratamentos profundos.' },
    { icon: Heart, color: 'text-emerald-700', bg: 'bg-emerald-50', title: 'Esteticistas & Cosmiatras', desc: 'Organização de protocolos, sessões de skincare e cuidados corporais.' },
    { icon: CalendarDays, color: 'text-[#8C5383]', bg: 'bg-[#FAF0F5]', title: 'Maquiadoras & Barbeiros', desc: 'Atendimentos para eventos, datas especiais e rotina semanal sem mensagens perdidas.' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* Hero da Página Sobre */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight max-w-3xl mx-auto leading-tight">
            Tecnologia para você cuidar do que realmente importa
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] max-w-2xl mx-auto leading-relaxed">
            O Lumê nasceu para deixar a rotina de profissionais autônomas da beleza mais organizada, leve e humana.
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

      {/* Nossa História & Propósito */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8 text-left">
          
          <div className="space-y-3 text-center sm:text-left">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383] justify-center sm:justify-start">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>Nossa Origem</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              A beleza não cabe em uma planilha confusa
            </h2>
          </div>

          <div className="prose prose-sm sm:prose-base text-[#6B5E7A] leading-relaxed space-y-5 font-medium">
            <p>
              Quem trabalha com beleza autônoma sabe como a rotina pode ser exaustiva. Entre um atendimento e outro — muitas vezes com a pinça, o pincel ou a tesoura na mão —, chegam dezenas de mensagens no WhatsApp perguntando valores, disponibilidade e formas de pagamento.
            </p>
            <p>
              O resultado dessa dinâmica costuma ser conhecido: intervalos de almoço engolidos, horários marcados duas vezes por engano, no-shows sem aviso e a sensação constante de nunca conseguir desligar a cabeça do trabalho.
            </p>
            <p>
              O <strong>Lumê</strong> foi criado para quebrar esse ciclo. Desenvolvemos uma plataforma que valoriza o seu trabalho, dando à sua cliente a facilidade de agendar pelo celular em segundos, enquanto você mantém o controle total da sua rotina, do seu financeiro e dos seus horários pessoais.
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-6 sm:p-8 rounded-3xl border border-[#E8DFD8] flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-[#FAF0F5] border border-[#E8DFD8] flex items-center justify-center text-[#8C5383] shrink-0" aria-hidden="true">
              <Sparkles className="h-7 w-7 text-[#8C5383]" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-[#3D2E4D]">Nossa Missão</h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Empoderar profissionais autônomas da beleza com tecnologia simples, elegante e eficiente, para que cada atendimento seja valorizado e cada minuto de descanso seja respeitado.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Seção "No que acreditamos" */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Nossos Princípios</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              No que acreditamos
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Quatro pilares fundamentais que guiam cada detalhe desenvolvido no Lumê.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {valores.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3 hover:border-[#8C5383]/40 transition"
                >
                  <div className="h-11 w-11 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#8C5383]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#3D2E4D]">{item.title}</h3>
                  <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* Seção "Feito para quem faz acontecer" */}
      <section className="py-16 sm:py-24 bg-white border-t border-[#E8DFD8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Feito para quem faz acontecer
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Especialidades que encontram no Lumê a solução exata para sua rotina.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {especialidades.map((esp, index) => {
              const Icon = esp.icon
              return (
                <div
                  key={index}
                  className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E8DFD8] space-y-3 hover:border-[#8C5383]/40 transition"
                >
                  <div className={`h-10 w-10 rounded-2xl ${esp.bg} ${esp.color} flex items-center justify-center`} aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#3D2E4D]">{esp.title}</h3>
                  <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">{esp.desc}</p>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              A sua rotina merece uma ferramenta que entenda você.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Junte-se às profissionais que transformaram a gestão de suas agendas com o Lumê.
            </p>
            <div className="pt-2">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#3D2E4D] shadow-lg hover:bg-[#F4EAE4] transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Conhecer o Lumê</span>
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

'use client'

import Link from 'next/link'
import {
  ArrowRight,
  HeartHandshake,
  Heart,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function SobrePage() {
  const principios = [
    {
      numero: '01',
      icone: Zap,
      titulo: 'Simplicidade Radical',
      subtitulo: 'Sem manual de 50 páginas',
      descricao:
        'Se uma ferramenta precisa de semanas de treinamento, ela falhou. O Lumê foi criado para que você configure sua agenda no celular em 5 minutos e já possa colocar seu link na bio no mesmo dia.',
    },
    {
      numero: '02',
      icone: Heart,
      titulo: 'Desconectar Sem Culpa',
      subtitulo: 'Sua paz no domingo à noite',
      descricao:
        'A automação existe para devolver a sua tranquilidade. A cliente agenda às 23h de domingo, a vaga é reservada com segurança e você descansa com a família sem precisar encostar no telefone.',
    },
    {
      numero: '03',
      icone: ShieldCheck,
      titulo: 'Autonomia Verdadeira',
      subtitulo: 'Seu espaço, suas regras',
      descricao:
        'Não cobramos porcentagem por cliente agendada nem retemos seu dinheiro. O Lumê é uma ferramenta de apoio à sua marca pessoal e ao seu espaço, nunca uma intermediária querendo lucrar em cima do seu trabalho.',
    },
    {
      numero: '04',
      icone: HeartHandshake,
      titulo: 'Acolhimento desde o Clique',
      subtitulo: 'Sua cliente se sente cuidada',
      descricao:
        'Nossa vitrine pública não pede download pesado de app nem cadastro burocrático. A cliente tem a sensação de ser atendida com carinho, estética e sofisticação desde o primeiro segundo.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* ===================================================================== */}
      {/* 1. HERO EDITORIAL & MANIFESTO */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-20 sm:pb-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#B8A9D9]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FAF0F5] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3D2E4D] tracking-tight leading-[1.14]">
            Tecnologia com respeito pela rotina real de quem vive da beleza.
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] font-normal leading-relaxed max-w-2xl mx-auto">
            Criado para devolver o tempo, a tranquilidade e a dignidade de quem vive da própria arte e não aguenta mais passar a vida inteira presa no WhatsApp.
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. A HISTÓRIA & PROVOCAÇÃO AUTÊNTICA (EDITORIAL STORYTELLING) */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-12 text-left">
          
          {/* Citação Editorial de Destaque */}
          <blockquote className="border-l-4 border-[#8C5383] pl-6 sm:pl-8 py-2">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#3D2E4D] italic leading-snug tracking-tight">
              &ldquo;Quem atende com as mãos não deveria ser obrigada a ser recepcionista 24 horas por dia.&rdquo;
            </p>
          </blockquote>

          {/* Texto Narrativo em Prosa Limpa */}
          <div className="space-y-6 text-base sm:text-lg text-[#5A4F6A] leading-relaxed font-normal">
            <p>
              A ideia do Lumê não nasceu em uma sala de reuniões corporativa. Ela nasceu observando a rotina real de manicures, lash designers, cabeleireiras e esteticistas que saem de casa cedo, passam o dia inteiro concentradas em procedimentos milimétricos e, mesmo assim, nunca conseguem descansar a mente.
            </p>

            <p>
              O celular vibra sem parar durante um procedimento. Se você para para responder, perde a concentração e atrasa o atendimento seguinte. Se não responde, a cliente busca outra pessoa. Quando a noite chega, restam dezenas de mensagens acumuladas: <em>&quot;Tem horário quinta?&quot;</em>, <em>&quot;Quanto tá a manutenção?&quot;</em>, <em>&quot;Posso trocar o meu horário?&quot;</em>.
            </p>

            <p>
              Percebemos que as ferramentas tradicionais de agendamento tentavam forçar essas profissionais a usar sistemas burocráticos feitos para grandes clínicas médicas ou planilhas frias de computador. <strong>Faltava uma ferramenta acolhedora, que compreendesse a sensibilidade, o valor e o ritmo da beleza.</strong>
            </p>
          </div>

          {/* Destaque Visual Minimalista da Missão */}
          <div className="pt-4">
            <div className="bg-[#FAF8F5] rounded-3xl p-7 sm:p-9 border border-[#E8DFD8] shadow-2xs space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#8C5383] block">
                Nossa Missão
              </span>
              <p className="text-lg sm:text-xl font-bold text-[#3D2E4D] leading-snug">
                Organizar o trabalho de quem faz acontecer com as próprias mãos, garantindo que cada cliente seja bem atendida e que cada minuto de descanso seja plenamente respeitado.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. NOSSOS PRINCÍPIOS (CARDS ORGÂNICOS E ACOLHEDORES) */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12 text-left">
          
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>Nossos Pilares</span>
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
              O que nos guia todos os dias
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Princípios que definem como construímos cada detalhe da plataforma:
            </p>
          </div>

          {/* Grade 2x2 Suave e Acolhedora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {principios.map((p, idx) => {
              const Icon = p.icone
              return (
                <div
                  key={idx}
                  className="rounded-3xl p-6 sm:p-8 bg-white border border-[#E8DFD8] hover:border-[#8C5383]/40 transition duration-200 space-y-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-2xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-black text-gray-400">
                      {p.numero}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#8C5383] block">
                      {p.subtitulo}
                    </span>
                    <h3 className="text-lg font-bold text-[#3D2E4D]">
                      {p.titulo}
                    </h3>
                  </div>

                  <p className="text-sm text-[#6B5E7A] leading-relaxed">
                    {p.descricao}
                  </p>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. CTA FINAL ACOLHEDOR */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-white border-t border-[#E8DFD8]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl mx-auto leading-tight tracking-tight">
              Venha fazer parte de uma rotina com mais paz e valorização.
            </h2>
            <p className="text-sm sm:text-base text-[#D5CBDD] max-w-md mx-auto leading-relaxed">
              Crie sua conta em 1 minuto e experimente por 30 dias gratuitos. Sem necessidade de cartão.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#3D2E4D] shadow-lg hover:bg-[#F4EAE4] transition transform hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto"
              >
                <span>Começar meu teste grátis</span>
                <ArrowRight className="h-4 w-4 text-[#3D2E4D]" />
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white hover:bg-white/20 transition cursor-pointer w-full sm:w-auto"
              >
                <span>Falar com o time</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

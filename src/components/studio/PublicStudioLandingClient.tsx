'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Crown,
  HeartHandshake,
  Percent,
  Briefcase,
  ExternalLink,
  Building2,
} from 'lucide-react'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import CornerFillButton from '@/components/ui/CornerFillButton'

export interface PublicFeaturedStudio {
  id: string
  nome: string
  slug: string
  bio: string | null
  foto_capa_url: string | null
  cor_primaria: string
  cor_secundaria: string
  membrosCount: number
}

interface PublicStudioLandingClientProps {
  studios: PublicFeaturedStudio[]
  currentUser?: {
    id: string
    nome: string
    estudio_id: string | null
  } | null
}

export default function PublicStudioLandingClient({
  studios,
  currentUser,
}: PublicStudioLandingClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Eu não entendo de tecnologia. Minha equipe vai conseguir usar?',
      answer:
        'Sim! O Lumê Studio foi feito para quem vive com o celular na mão. Não precisa de computador, não exige instalação pesada e funciona direto pelo navegador com botões grandes e linguagem clara.',
    },
    {
      question: 'As profissionais parceiras precisam pagar assinatura?',
      answer:
        'Não. As profissionais convidadas entram com custo zero. Elas recebem um link no WhatsApp, conectam seus serviços e já começam a receber agendamentos sem qualquer mensalidade individual.',
    },
    {
      question: 'Uma profissional consegue ver o faturamento ou a agenda da outra?',
      answer:
        'De jeito nenhum. A privacidade é blindada: cada parceira só enxerga a própria agenda, seus próprios clientes e seus próprios valores. Nenhuma profissional vê o financeiro da outra.',
    },
    {
      question: 'Como a cliente escolhe com quem quer ser atendida?',
      answer:
        'Ao abrir o link do salão, a cliente vê as fotos de todas as especialistas e pode escolher a sua favorita ou selecionar "Primeira profissional disponível" para marcar no horário mais rápido.',
    },
    {
      question: 'Como funciona para cancelar ou alterar se uma profissional sair?',
      answer:
        'Você pode desativar ou adicionar novas profissionais com 1 toque no painel do salão. A vitrine é atualizada instantaneamente sem burocracia.',
    },
  ]

  return (
    <div className="landing-motion-scope min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* BANNER SE USUÁRIO JÁ ESTIVER LOGADO */}
      {currentUser && (
        <div className="bg-[#3D2E4D] text-white py-2.5 px-4 text-xs border-b border-[#2E223B]">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D8C7BC] shrink-0" />
              <span>
                Olá, <strong>{currentUser.nome}</strong>! Você já possui cadastro ativo no Lumê.
              </span>
            </div>
            <Link
              href="/dashboard/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#3D2E4D] font-bold text-xs hover:bg-[#F4EAE4] transition-colors shrink-0"
            >
              <span>Acessar Meu Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. HERO AUTÊNTICA: SALÃO UNIFICADO NO CELULAR */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-14 pb-16 lg:pt-24 lg:pb-24">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#B8A9D9]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FAF0F5] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#3D2E4D] tracking-tight leading-[1.12]">
            Toda a sua equipe reunida em um <span className="text-[#8C5383]">só link</span>.
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] font-normal leading-relaxed max-w-xl mx-auto">
            A cliente escolhe a profissional e agenda pelo WhatsApp. As comissões já saem calculadas, sem contas manuais.
          </p>



        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. ARQUITETURA DO STUDIO: COMO FUNCIONA EM 3 PASSOS LINEARES */}
      {/* ===================================================================== */}
      <section id="arquitetura" className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16 text-left">
          
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383] justify-center sm:justify-start">
              <span className="w-5 h-0.5 bg-[#8C5383] rounded-full" />
              <span>Como Funciona</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
              A rotina do seu salão sem atrito
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A] max-w-xl">
              Tudo simples e automático, do link da bio até o acerto de contas:
            </p>
          </div>

          {/* 3 Pilares em Sequência Editorial Elegante */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="space-y-2 border-t-2 border-[#8C5383] pt-5">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#8C5383]">
                01. Link Único
              </span>
              <h3 className="text-lg font-bold text-[#3D2E4D]">
                Todos os serviços reunidos
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                A cliente abre o link do salão e encontra manicure, lash, cabelo e estética em uma vitrine limpa.
              </p>
            </div>

            <div className="space-y-2 border-t-2 border-[#3D2E4D] pt-5">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#3D2E4D]">
                02. Notificação
              </span>
              <h3 className="text-lg font-bold text-[#3D2E4D]">
                A cliente marca, o celular avisa
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                O horário cai direto na agenda da profissional certa com lembrete automático no WhatsApp.
              </p>
            </div>

            <div className="space-y-2 border-t-2 border-emerald-600 pt-5">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                03. Comissões
              </span>
              <h3 className="text-lg font-bold text-[#3D2E4D]">
                Contas feitas na hora
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Sem calculadora ou anotações manuais. O sistema soma a parte do salão e a parte da profissional.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. DONA E PARCEIRA: HARMONIA E BENEFÍCIOS LADO A LADO */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
              Feito para valorizar a dona e a parceira
            </h2>
            <p className="text-base text-[#6B5E7A]">
              Sem jogos de poder e sem invasão de privacidade. Cada lado ganha autonomia e respeito:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            {/* Lado da Dona */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DFD8] space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#3D2E4D]">Para a Dona do Salão</h3>
                  <span className="text-xs text-[#8C5383] font-bold">Controle da operação & paz de espírito</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-[#5A4F6A]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Fim das mensagens na sua folga:</strong> clientes marcam sozinhas a qualquer hora.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Relatório de repasses pronto:</strong> saiba exatamente quanto pagar para cada parceira.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Menos faltas e buracos:</strong> avisos no WhatsApp evitam clientes esquecidas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Gestão flexível da equipe:</strong> convide ou desative profissionais com 1 toque.</span>
                </li>
              </ul>
            </div>

            {/* Lado da Parceira */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DFD8] space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#3D2E4D]">Para a Profissional Parceira</h3>
                  <span className="text-xs text-emerald-700 font-bold">Autonomia, privacidade e custo zero</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-[#5A4F6A]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Privacidade blindada:</strong> nenhuma outra profissional vê o seu dinheiro ou seus clientes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Sua agenda no seu bolso:</strong> acompanhe seus atendimentos pelo celular em tempo real.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Link individual mantido:</strong> você continua tendo seu link exclusivo para mandar para clientes fiéis.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Adesão gratuita:</strong> você não paga mensalidade nenhuma para participar do salão.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. MODELOS FINANCEIROS: COMISSÃO VS ALUGUEL DE CADEIRA */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10 text-left">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              <span className="w-5 h-0.5 bg-emerald-700 rounded-full" />
              <span>Sem Complicação</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
              O Lumê funciona do jeito que você já combina
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Não importa como você divide o dinheiro com as suas parceiras. O sistema faz as contas por você:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Modelo 1: Comissão */}
            <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 border border-[#E8DFD8] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center font-bold">
                  <Percent className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#3D2E4D]">Por Porcentagem (Comissão)</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                Você escolhe a porcentagem de cada uma (ex: 50/50 ou 60/40). Conforme os atendimentos acontecem, o sistema já separa o que é seu e o que é delas. No fim da semana, a conta tá pronta.
              </p>
              <div className="pt-2 border-t border-[#E8DFD8] text-xs font-bold text-[#8C5383]">
                Para salões que dividem o valor dos serviços
              </div>
            </div>

            {/* Modelo 2: Aluguel de Cadeira */}
            <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 border border-[#E8DFD8] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#3D2E4D]">Por Aluguel de Cadeira (Fixo)</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed">
                A parceira paga um valor fixo por mês para usar a cadeira ou sala e fica com 100% do que cobra das clientes. O salão tem o valor garantido todo mês sem dor de cabeça.
              </p>
              <div className="pt-2 border-t border-[#E8DFD8] text-xs font-bold text-emerald-700">
                Para estúdios e espaços compartilhados
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. VITRINE DE STUDIOS REAIS (SE HOUVER) */}
      {/* ===================================================================== */}
      {studios.length > 0 && (
        <section className="py-16 sm:py-24 bg-[#FAF8F5]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10 text-left">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D2E4D] tracking-tight">
                Espaços reais no Lumê Studio
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5E7A]">
                Veja como fica a vitrine compartilhada de equipes ativas na plataforma:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {studios.map((s) => (
                <Link
                  key={s.id}
                  href={`/studio/${s.slug}`}
                  target="_blank"
                  className="group bg-white rounded-3xl border border-[#E8DFD8] overflow-hidden hover:border-[#8C5383]/40 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="h-32 w-full relative bg-[#FAF1EE]">
                    {s.foto_capa_url ? (
                      <Image
                        src={s.foto_capa_url}
                        alt={s.nome}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8C5383]/40">
                        <Store className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-[#3D2E4D] text-base group-hover:text-[#8C5383] transition-colors">
                        {s.nome}
                      </h3>
                      <p className="text-xs text-[#6B5E7A] mt-1 line-clamp-2 leading-relaxed">
                        {s.bio || 'Espaço multi-profissional no Lumê.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E8DFD8] flex items-center justify-between text-xs">
                      <span className="text-[#6B5E7A] font-medium">
                        {s.membrosCount} especialistas
                      </span>
                      <span className="font-bold text-[#8C5383] flex items-center gap-1">
                        <span>Ver vitrine</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 6. PERGUNTAS FREQUENTES & CTA */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-white border-t border-[#E8DFD8]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3D2E4D] tracking-tight">
              Dúvidas frequentes sobre o Studio
            </h2>
            <p className="text-sm text-[#6B5E7A]">
              Tudo o que você precisa saber antes de convidar sua equipe.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#E8DFD8] bg-[#FAF8F5] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-[#3D2E4D] hover:text-[#8C5383] cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 text-[#8C5383] ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#6B5E7A] leading-relaxed border-t border-[#E8DFD8] pt-3">
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
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl mx-auto leading-tight tracking-tight">
              Sua equipe de beleza mais organizada hoje mesmo.
            </h2>
            <p className="text-sm sm:text-base text-[#D5CBDD] max-w-md mx-auto leading-relaxed">
              Crie o link exclusivo do seu espaço e experimente por 30 dias gratuitos.
            </p>
            <div className="pt-2 flex items-center justify-center">
              <CornerFillButton
                href="/cadastro"
                variant="light"
                className="w-full px-8 py-4 text-sm font-bold shadow-lg sm:w-auto"
              >
                <span>Criar meu Studio grátis</span>
              </CornerFillButton>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

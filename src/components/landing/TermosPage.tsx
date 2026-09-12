'use client'

import Link from 'next/link'
import { FileCheck, AlertCircle, CreditCard, Shield } from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      <main className="py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383] bg-[#FAF0F5] px-3.5 py-1.5 rounded-full border border-[#ECCAC0]">
              <FileCheck className="h-4 w-4 text-[#8C5383]" />
              <span>Termos Gerais de Uso</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight leading-tight">
              Termos de Serviço
            </h1>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Última atualização: 17 de Agosto de 2026. Regras claras, transparentes e justas para a utilização da plataforma Lumê.
            </p>
          </div>

          {/* Conteúdo Institucional */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-[#E8DFD8] shadow-sm space-y-10 text-left text-sm sm:text-base text-[#6B5E7A] leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-[#8C5383]" />
                <span>1. Aceitação dos Termos</span>
              </h2>
              <p>
                Ao criar uma conta ou utilizar a plataforma <strong>Lumê</strong>, você concorda expressamente com estes Termos de Serviço. O Lumê é um software como serviço (SaaS) projetado para auxiliar profissionais autônomas do setor de beleza e estética na gestão de agendamentos, organização de clientes e controle financeiro.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#8C5383]" />
                <span>2. Período de Testes e Assinatura</span>
              </h2>
              <ul className="space-y-2 pt-1 pl-4 list-disc marker:text-[#8C5383]">
                <li><strong>30 Dias Grátis:</strong> Toda nova profissional cadastrada tem direito a 30 dias de acesso gratuito e irrestrito a todos os recursos da plataforma, sem necessidade de informar cartão de crédito no momento do cadastro.</li>
                <li><strong>Plano Mensal Lumê:</strong> Após o término do período de avaliação, o valor da mensalidade é de <strong>R$ 69,90/mês</strong>, garantindo continuidade do serviço, suporte e atualizações.</li>
                <li><strong>Cancelamento sem Multa:</strong> Não há contrato de fidelidade. Você pode cancelar sua assinatura a qualquer momento através do seu painel de perfil, sem multas, taxas ocultas ou burocracia.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#8C5383]" />
                <span>3. Responsabilidade das Partes</span>
              </h2>
              <p>
                O Lumê é responsável pela disponibilidade da infraestrutura técnica, segurança dos dados e funcionamento das ferramentas de agendamento e sincronização. A profissional é responsável pela veracidade dos serviços, preços e horários cadastrados, bem como pela execução física e técnica dos procedimentos oferecidos às suas clientes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#8C5383]" />
                <span>4. Uso Adequado da Plataforma</span>
              </h2>
              <p>
                A profissional compromete-se a utilizar a plataforma para finalidades lícitas relacionadas à sua atividade de estética e beleza, não praticando envio de mensagens abusivas (SPAM) ou inserção de dados fraudulentos.
              </p>
            </section>

            <section className="space-y-3 border-t border-[#E8DFD8] pt-6">
              <h2 className="text-xl font-bold text-[#3D2E4D]">5. Atendimento e Suporte</h2>
              <p>
                Nosso suporte está disponível via WhatsApp <a href="https://wa.me/5511965758459" target="_blank" rel="noopener noreferrer" className="text-[#8C5383] font-bold hover:underline">(11) 96575-8459</a> para auxiliar você em qualquer necessidade técnica ou operacional.
              </p>
            </section>

          </div>

          <div className="text-center pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3D2E4D] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#2E223B] transition cursor-pointer"
            >
              <span>Voltar para a página inicial</span>
            </Link>
          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  )
}

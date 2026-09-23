'use client'

import Link from 'next/link'
import {
  FileCheck,
  AlertCircle,
  CreditCard,
  Shield,
  Scale,
  Layers,
  Lock,
  Clock,
  HelpCircle,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function TermosPage() {
  return (
    <div className="landing-motion-scope min-h-screen bg-[#FAF7F5] text-[#4A3F5C] font-sans selection:bg-[#B8A9D9]/30">
      <LandingHeader />

      <main className="py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Institucional */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4A3F5C] bg-[#FAF7F5] px-4 py-1.5 rounded-full border border-[#B8A9D9]/40 shadow-2xs">
              <FileCheck className="h-4 w-4 text-[#8675A9]" />
              <span>Contrato de Licença & Uso da Plataforma</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4A3F5C] tracking-tight leading-tight">
              Termos de Serviço
            </h1>
            <p className="text-sm sm:text-base text-[#4A3F5C]/80 font-medium leading-relaxed">
              Última atualização: Setembro de 2026. Diretrizes jurídicas, direitos e responsabilidades para o uso seguro da plataforma Lumê.
            </p>
          </div>

          {/* Conteúdo Jurídico Estruturado */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-200/80 shadow-xs space-y-10 text-left text-sm sm:text-base text-[#4A3F5C]/80 leading-relaxed font-normal">
            
            {/* 1. Natureza do Serviço */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <Scale className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>1. Objeto e Natureza da Plataforma</span>
              </h2>
              <p>
                O <strong>Lumê</strong> é um software como serviço (SaaS — <em>Software as a Service</em>) que disponibiliza ferramentas digitais de gestão operacional, catálogo de serviços, comanda eletrônica, agendamento online e sincronização de horários para profissionais autônomas e estúdios do setor de beleza e bem-estar.
              </p>
              <p>
                A plataforma Lumê atua única e exclusivamente como <strong>provedora de tecnologia e infraestrutura digital</strong>. O Lumê <strong>NÃO É</strong> clínica de estética, salão de beleza, empregador, agência, intermediador de mão de obra ou franqueador das profissionais cadastradas, não havendo qualquer relação de subordinação, representação comercial, sociedade ou vínculo empregatício entre a plataforma e suas usuárias.
              </p>
            </section>

            {/* 2. Isenção Total de Responsabilidade por Procedimentos */}
            <section className="space-y-3 rounded-2xl bg-amber-50/60 p-5 border border-amber-200/70">
              <h2 className="text-lg sm:text-xl font-bold text-amber-950 flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-amber-700 shrink-0" />
                <span>2. Isenção de Responsabilidade sobre Procedimentos Estéticos</span>
              </h2>
              <p className="text-amber-900 font-medium">
                Toda e qualquer responsabilidade civil, técnica, administrativa, sanitária ou criminal decorrente da realização de procedimentos estéticos, cosméticos, capilares, químicos, corporais ou dermatológicos (incluindo, mas não se limitando a extensão de cílios, micropigmentação, depilação, unhas e corte/tintura) é de <strong>EXCLUSIVA E INTEGRAL RESPONSABILIDADE DA PROFISSIONAL OU ESTÚDIO EXECUTANTE</strong>.
              </p>
              <p className="text-amber-900/90 text-xs sm:text-sm">
                O Lumê não fiscaliza, não avalia a capacitação técnica, não prescreve produtos e não garante os resultados estéticos contratados. Eventuais danos materiais, corporais, alergias ou insatisfações com os procedimentos executados deverão ser tratados e dirimidos diretamente entre a cliente final e a profissional responsável.
              </p>
            </section>

            {/* 3. Agendamentos, Pagamentos e Relação com a Cliente Final */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <CreditCard className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>3. Agendamentos, Políticas de Pagamento e Cancelamento</span>
              </h2>
              <p>
                A definição de preços, duração de serviços, horários de disponibilidade, formas de pagamento aceitas e eventuais exigências de adiantamento (sinal/reserva) são estipuladas autonomamente pela profissional.
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-[#B8A9D9]">
                <li>
                  <strong>Ausência de Custódia Financeira:</strong> O Lumê fornece informações de fechamento e comanda, mas <strong>não retém nem custodia valores transacionados</strong> entre clientes e profissionais, os quais são liquidados via Pix direto, dinheiro ou maquineta particular da profissional.
                </li>
                <li>
                  <strong>Cancelamentos e No-Show (Faltas):</strong> O Lumê fornece lembretes e confirmações automatizadas via WhatsApp para minimizar faltas, mas não garante a presença das clientes e não é responsável por ressarcimento de horários não comparecidos.
                </li>
              </ul>
            </section>

            {/* 4. Planos, Período de Testes e Assinatura SaaS */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>4. Assinatura SaaS, Degustação e Cancelamento</span>
              </h2>
              <ul className="space-y-2 pl-4 list-disc marker:text-[#B8A9D9]">
                <li>
                  <strong>30 Dias de Teste Gratuito:</strong> Toda nova conta possui 30 dias de acesso gratuito completo para avaliar a plataforma, sem necessidade de inserção de cartão de crédito no momento do cadastro.
                </li>
                <li>
                  <strong>Planos e Modalidades de Pagamento:</strong> Após o período experimental, a continuidade do acesso ao painel e à vitrine pública requer a assinatura do plano contratado (Lumê Individual ou Lumê Studio), disponibilizado nas modalidades de cobrança <strong>Mensal</strong> (recorrência a cada 30 dias) ou <strong>Anual</strong> (faturamento único com desconto proporcional equivalente a 2 meses bonificados), conforme tabela de valores vigentes na plataforma.
                </li>
                <li>
                  <strong>Cancelamento Sem Burocracia:</strong> A profissional pode desativar a renovação de sua assinatura a qualquer momento com apenas 1 clique diretamente no painel da sua conta. Não há cláusulas de fidelidade forçada nem aplicação de multas rescisórias.
                </li>
                <li>
                  <strong>Direito de Arrependimento e Estorno:</strong> Para contratações de planos anuais ou faturas pagas pela primeira vez, assegura-se o prazo legal de 7 (sete) dias corridos a contar da confirmação do pagamento para solicitação de estorno integral dos valores pagos, em consonância com o artigo 49 do Código de Defesa do Consumidor.
                </li>
                <li>
                  <strong>Inadimplência e Tolerância:</strong> O não pagamento da fatura da mensalidade ou anuidade após o término do prazo de tolerância acarretará a suspensão provisória da vitrine pública de agendamentos e das notificações automáticas até a devida regularização.
                </li>
              </ul>
            </section>

            {/* 5. Integrações de Terceiros */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>5. Integrações com Serviços de Terceiros</span>
              </h2>
              <p>
                O Lumê integra-se com serviços de terceiros (como Google Calendar, gateways de pagamento e provedores de infraestrutura de mensageria). O Lumê não se responsabiliza por instabilidades técnicas externas, manutenções, interrupções globais ou bloqueios de contas promovidos por empresas terceiras (como Google LLC ou Meta Platforms Inc.).
              </p>
            </section>

            {/* 6. Obrigações e Uso Adequado da Plataforma */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <Lock className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>6. Uso Adequado e Segurança da Conta</span>
              </h2>
              <p>Ao utilizar o Lumê, a profissional compromete-se a:</p>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-[#B8A9D9]">
                <li>Manter o sigilo absoluto de sua senha de acesso e credenciais de login;</li>
                <li>Inserir apenas dados verídicos, legítimos e condizentes com sua atividade profissional;</li>
                <li>Possuir os devidos direitos autorais ou consentimento para publicação de fotos de trabalhos e fotos de clientes em sua vitrine pública;</li>
                <li>Não utilizar a plataforma para envio de mensagens invasivas, difamatórias, fraudulentas ou SPAM não solicitado.</li>
              </ul>
              <p className="text-xs sm:text-sm text-[#4A3F5C]/75">
                O Lumê reserva-se o direito de suspender ou banir contas que violem a legislação vigente, pratiquem golpes ou utilizem a plataforma para finalidades ilícitas.
              </p>
            </section>

            {/* 7. Propriedade Intelectual */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <FileCheck className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>7. Propriedade Intelectual</span>
              </h2>
              <p>
                A marca Lumê, seu logotipo, domínio, código-fonte, arquitetura de software, design system, textos institucionais e algoritmos são de propriedade exclusiva dos desenvolvedores da plataforma Lumê, protegidos pela Lei de Propriedade Intelectual e de Direitos Autorais. É vedada a engenharia reversa, cópia ou reprodução não autorizada.
              </p>
            </section>

            {/* 8. Suporte e Foro */}
            <section className="space-y-3 border-t border-gray-200/80 pt-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <HelpCircle className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>8. Atendimento e Legislação Aplicável</span>
              </h2>
              <p>
                Dúvidas operacionais ou solicitações contratuais podem ser encaminhadas diretamente ao nosso canal oficial de atendimento via WhatsApp no número <a href="https://wa.me/5511965758459" target="_blank" rel="noopener noreferrer" className="text-[#8675A9] font-bold underline decoration-[#B8A9D9] decoration-2 underline-offset-2 hover:text-[#4A3F5C]">(11) 96575-8459</a> ou pelo e-mail oficial de suporte.
              </p>
              <p className="text-xs sm:text-sm text-[#4A3F5C]/70">
                Estes Termos são regidos pelas leis da República Federativa do Brasil, em conformidade com o Código de Defesa do Consumidor e o Marco Civil da Internet (Lei nº 12.965/2014).
              </p>
            </section>

          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4A3F5C] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#3D2E4D] transition cursor-pointer"
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

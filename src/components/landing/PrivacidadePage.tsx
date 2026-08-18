'use client'

import Link from 'next/link'
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      <main className="py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Conformidade LGPD • Lei nº 13.709/2018</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight leading-tight">
              Política de Privacidade
            </h1>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Última atualização: 17 de Agosto de 2026. Transparência total sobre como tratamos e protegemos os seus dados e os dados das suas clientes.
            </p>
          </div>

          {/* Conteúdo Institucional & Jurídico */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-[#E8DFD8] shadow-sm space-y-10 text-left text-sm sm:text-base text-[#6B5E7A] leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#8C5383]" />
                <span>1. Nosso Compromisso com a sua Privacidade</span>
              </h2>
              <p>
                O <strong>Lumê</strong> (&quot;nós&quot;, &quot;nossa plataforma&quot;) respeita a sua privacidade e valoriza a confiança depositada por cada profissional de beleza e suas respectivas clientes. Esta Política de Privacidade descreve de forma clara quais dados coletamos, por que coletamos, como são armazenados e os direitos que você possui sobre suas informações, em total conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#8C5383]" />
                <span>2. Dados Coletados e Finalidade</span>
              </h2>
              <p>Coletamos estritamente os dados necessários para o funcionamento e prestação dos nossos serviços:</p>
              <ul className="space-y-2 pt-1 pl-4 list-disc marker:text-[#8C5383]">
                <li><strong>Dados da Profissional:</strong> Nome completo, e-mail, telefone/WhatsApp, nome do studio ou marca, especialidade e dados de faturamento para gestão da assinatura.</li>
                <li><strong>Dados da Cliente Final:</strong> Nome e número de telefone/WhatsApp inseridos durante o fluxo de agendamento online para fins exclusivos de confirmação, lembretes e histórico de atendimento no painel da profissional.</li>
                <li><strong>Dados de Integração Google Calendar:</strong> Quando autorizado explicitamente pela profissional, acessamos e criamos eventos de calendário para evitar choques de agenda. Nós <em>nunca</em> lemos o conteúdo de e-mails, contatos ou outros arquivos da sua conta Google.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#8C5383]" />
                <span>3. Não Comercialização de Dados</span>
              </h2>
              <p>
                O Lumê <strong>nunca comercializa, aluga ou compartilha seus dados pessoais nem a lista de contatos das suas clientes com terceiros para fins publicitários</strong>. Os dados cadastrados na plataforma pertencem exclusivamente a você e são utilizados apenas para a operação da sua agenda.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#8C5383]" />
                <span>4. Armazenamento Seguro e Criptografia</span>
              </h2>
              <p>
                Todos os dados são transmitidos via conexão segura criptografada (HTTPS/TLS 256-bit) e armazenados em servidores de nuvem de alta segurança com controle de acesso rigoroso, backups automáticos diários e isolamento de banco de dados por usuário.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#8C5383]" />
                <span>5. Seus Direitos como Titular dos Dados</span>
              </h2>
              <p>De acordo com a LGPD, você tem o direito de solicitar a qualquer momento:</p>
              <ul className="space-y-1.5 pt-1 pl-4 list-disc marker:text-[#8C5383]">
                <li>A confirmação da existência de tratamento dos seus dados.</li>
                <li>Acesso facilitado aos seus dados armazenados.</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
                <li>A anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                <li>A exclusão definitiva da sua conta e de todos os registros vinculados.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#3D2E4D] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#8C5383]" />
                <span>6. Uso de Cookies e Tecnologias Semelhantes</span>
              </h2>
              <p>
                Utilizamos cookies e armazenamento local exclusivamente para garantir o funcionamento técnico essencial da plataforma, manter a segurança de sua sessão autenticada e lembrar suas preferências de navegação. Não utilizamos cookies invasivos de rastreamento de terceiros para publicidade comportamental.
              </p>
            </section>

            <section className="space-y-3 border-t border-[#E8DFD8] pt-6">
              <h2 className="text-xl font-bold text-[#3D2E4D]">7. Contato com o Encarregado de Dados (DPO)</h2>
              <p>
                Caso tenha dúvidas sobre esta política ou queira exercer qualquer um dos seus direitos de privacidade, fale diretamente com nossa equipe de suporte pelo WhatsApp <a href="https://wa.me/5511965758459" target="_blank" rel="noopener noreferrer" className="text-[#8C5383] font-bold hover:underline">(11) 96575-8459</a> ou pelo e-mail oficial de atendimento.
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

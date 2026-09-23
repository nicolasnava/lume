'use client'

import Link from 'next/link'
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  CheckCircle2,
  Database,
  Calendar,
  MessageSquare,
  HelpCircle,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

export default function PrivacidadePage() {
  return (
    <div className="landing-motion-scope min-h-screen bg-[#FAF7F5] text-[#4A3F5C] font-sans selection:bg-[#B8A9D9]/30">
      <LandingHeader />

      <main className="py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Institucional */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Conformidade com a LGPD • Lei nº 13.709/2018</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4A3F5C] tracking-tight leading-tight">
              Política de Privacidade
            </h1>
            <p className="text-sm sm:text-base text-[#4A3F5C]/80 font-medium leading-relaxed">
              Última atualização: Setembro de 2026. Transparência integral sobre o tratamento, proteção e privacidade dos dados da sua empresa e das suas clientes.
            </p>
          </div>

          {/* Conteúdo Jurídico Estruturado */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-200/80 shadow-xs space-y-10 text-left text-sm sm:text-base text-[#4A3F5C]/80 leading-relaxed font-normal">
            
            {/* 1. Compromisso e Escopo */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
                <span>1. Nosso Compromisso com a Privacidade</span>
              </h2>
              <p>
                A plataforma <strong>Lumê</strong> valoriza e respeita a privacidade de cada profissional assinante e de suas respectivas clientes. Esta Política de Privacidade explica com clareza como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais, em estrita observância à <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei Federal nº 13.709/2018)</strong> e ao <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
              </p>
            </section>

            {/* 2. Papéis na LGPD: Controlador vs. Operador */}
            <section className="space-y-3 rounded-2xl bg-purple-50/50 p-5 border border-purple-200/70">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <Database className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>2. Papéis de Tratamento de Dados (LGPD)</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#4A3F5C]/90">
                Para fins jurídicos e de conformidade com a LGPD, os papéis são claramente delimitados:
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-[#8675A9] text-xs sm:text-sm text-[#4A3F5C]/90">
                <li>
                  <strong>Lumê como Controlador:</strong> Em relação aos dados cadastrais da profissional assinante (nome, e-mail, telefone, dados cadastrais de cobrança e histórico da assinatura), o Lumê atua como Controlador, tratando tais dados para a prestação dos serviços e cumprimento de obrigações legais.
                </li>
                <li>
                  <strong>Profissional como Controladora & Lumê como Operador:</strong> Em relação aos dados das clientes finais (nome, telefone/WhatsApp, serviços agendados, observações e histórico de atendimento), <strong>a Profissional assinante é a Controladora dos Dados</strong>, e o Lumê atua estritamente como <strong>Operador</strong>, processando essas informações sob instruções e em benefício da profissional para viabilizar a agenda digital.
                </li>
              </ul>
            </section>

            {/* 3. Dados Coletados e Finalidades */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <Eye className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>3. Dados Coletados e Finalidade do Tratamento</span>
              </h2>
              <p>Coletamos estritamente os dados essenciais para o funcionamento seguro da plataforma:</p>
              <ul className="space-y-2 pl-4 list-disc marker:text-[#B8A9D9]">
                <li>
                  <strong>Dados da Profissional:</strong> Nome completo, e-mail, telefone/WhatsApp, nome do estúdio ou marca, especialidade, foto de perfil, fotos de vitrine autorizadas e preferências visuais. Finalidade: criação da conta de acesso, autenticação e publicação da vitrine de serviços.
                </li>
                <li>
                  <strong>Dados da Cliente Final:</strong> Nome e telefone/WhatsApp inseridos no momento do agendamento online. Finalidade: reserva do horário na agenda da profissional e envio de confirmações e lembretes automáticos.
                </li>
                <li>
                  <strong>Logs de Acesso e Metadados Técnicos:</strong> Endereço IP, data/hora de acesso e identificador do navegador, conforme obrigação legal prevista no Art. 15 da Lei nº 12.965/2014 (Marco Civil da Internet).
                </li>
              </ul>
            </section>

            {/* 4. Notificações via WhatsApp e E-mail */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <MessageSquare className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>4. Notificações e Mensagens Automatizadas</span>
              </h2>
              <p>
                Os contatos fornecidos pelas clientes finais durante o agendamento são utilizados <strong>exclusivamente para mensagens transacionais e operacionais</strong> (confirmação imediata do agendamento, lembrete prévio para evitar faltas e avisos em caso de alteração de horário).
              </p>
              <p>
                O Lumê <strong>NÃO realiza disparos de mala-direta comercial não autorizada, SPAM ou mensagens de terceiros</strong> para a base de clientes da profissional. A cliente pode solicitar o cancelamento de avisos diretamente à profissional a qualquer momento.
              </p>
            </section>

            {/* 5. Integração com Google Agenda (Google API Services User Data Policy) */}
            <section className="space-y-3 rounded-2xl bg-emerald-50/50 p-5 border border-emerald-200/70">
              <h2 className="text-lg sm:text-xl font-bold text-emerald-950 flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-emerald-700 shrink-0" />
                <span>5. Integração Google Calendar & Dados de Usuários Google</span>
              </h2>
              <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
                Quando a profissional opta voluntariamente por conectar sua conta Google Agenda ao Lumê:
              </p>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-emerald-700 text-xs sm:text-sm text-emerald-900">
                <li>Acessamos exclusivamente a API do Google Calendar para criar novos compromissos agendados e verificar horários ocupados, evitando choques de agenda;</li>
                <li><strong>Não lemos nem acessamos</strong> e-mails do Gmail, arquivos do Google Drive, contatos do Google ou fotos;</li>
                <li>O uso e a transferência de informações recebidas de APIs do Google pelo Lumê para qualquer outro aplicativo aderem estritamente à <strong>Google API Services User Data Policy</strong>, incluindo os requisitos de Uso Limitado (<em>Limited Use requirements</em>);</li>
                <li>Os dados obtidos via Google Calendar <strong>nunca são vendidos, nunca são transferidos a terceiros</strong> e <strong>nunca são utilizados para treinamento de modelos de inteligência artificial generalistas</strong>;</li>
                <li>A profissional pode desconectar sua conta Google a qualquer momento com 1 clique nas configurações do Lumê ou no painel de permissões de segurança de sua conta Google.</li>
              </ul>
            </section>

            {/* 6. Não Comercialização e Segurança dos Dados */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <Lock className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>6. Não Comercialização e Segurança da Informação</span>
              </h2>
              <p>
                O Lumê <strong>NUNCA comercializa, aluga, troca ou monetiza dados de profissionais ou clientes finais</strong>. Os dados pertencem à profissional e aos respectivos titulares.
              </p>
              <p>
                Adotamos rigorosas medidas técnicas e administrativas de segurança, incluindo:
              </p>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-[#B8A9D9]">
                <li>Criptografia de ponta a ponta em trânsito através de protocolos modernos (HTTPS / TLS 1.3);</li>
                <li>Senhas com hash criptográfico irreversível (Bcrypt);</li>
                <li>Políticas de segurança em nível de linha no banco de dados (Row Level Security - RLS), impedindo que qualquer usuária acesse dados de outra profissional;</li>
                <li>Servidores em nuvem de nível empresarial com monitoramento de integridade e backups automáticos.</li>
              </ul>
            </section>

            {/* 7. Direitos dos Titulares dos Dados */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>7. Seus Direitos como Titular de Dados (Art. 18 da LGPD)</span>
              </h2>
              <p>Você e suas clientes têm o direito de solicitar a qualquer tempo:</p>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-[#B8A9D9]">
                <li>Confirmação da existência de tratamento e acesso aos dados;</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
                <li>Portabilidade dos dados em formato legível por máquina;</li>
                <li>Eliminação definitiva dos dados pessoais tratados com base no consentimento;</li>
                <li>Revogação do consentimento concedido anteriormente.</li>
              </ul>
            </section>

            {/* 8. Retenção e Exclusão Definitiva */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>8. Retenção e Exclusão Definitiva</span>
              </h2>
              <p>
                Os dados são armazenados apenas pelo período estritamente necessário para o cumprimento das finalidades contratadas. Caso decida encerrar sua conta no Lumê, você pode solicitar a exclusão de todos os seus dados cadastrais e do histórico de agendamentos pelo painel ou suporte, ressalvada a guarda de registros pelo prazo mínimo obrigatório estabelecido em lei (como os 6 meses de logs de conexão do Marco Civil da Internet).
              </p>
            </section>

            {/* 9. Encarregado de Proteção de Dados (DPO) e Contato */}
            <section className="space-y-3 border-t border-gray-200/80 pt-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#4A3F5C] flex items-center gap-2.5">
                <HelpCircle className="h-5 w-5 text-[#8675A9] shrink-0" />
                <span>9. Canal de Atendimento e DPO</span>
              </h2>
              <p>
                Para exercer seus direitos de titular, tirar dúvidas sobre o tratamento de informações ou contatar nosso Encarregado de Proteção de Dados (DPO), envie mensagem para o WhatsApp oficial de suporte <a href="https://wa.me/5511965758459" target="_blank" rel="noopener noreferrer" className="text-[#8675A9] font-bold underline decoration-[#B8A9D9] decoration-2 underline-offset-2 hover:text-[#4A3F5C]">(11) 96575-8459</a> ou pelo e-mail institucional de atendimento.
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

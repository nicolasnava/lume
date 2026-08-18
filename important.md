# Projeto: Lumê — Agendamento para Profissionais de Beleza

## Visão geral
SaaS de agendamento voltado para profissionais autônomas de beleza (lash designer,
manicure, sobrancelha, etc). Cada profissional tem uma página pública própria
(link único) onde clientes agendam horários sem precisar de app ou login.

Diferencial: pensado para o fluxo real desse nicho (serviços com manutenção
recorrente, identidade visual própria da profissional, sincronização com a
agenda pessoal do celular) — não é uma agenda genérica adaptada.

## Identidade visual do produto (marca Lumê — não confundir com a
personalização de cor de cada profissional na página pública, que é
configurável por ela)
- Primária: #B8A9D9 (lilás suave)
- Secundária: #FAF7F5 (off-white, fundo)
- Destaque/texto: #4A3F5C (roxo escuro)

## Stack
- Frontend + Backend: Next.js (App Router), TypeScript
- Banco de dados / Auth / Storage: Supabase (Postgres)
- Calendário: Google Calendar API (OAuth2)
- WhatsApp: Z-API (ou Twilio, a definir) para confirmações e lembretes
- Deploy: Vercel
- Estilo: Tailwind CSS

## Modelo de dados (Supabase / Postgres)

### profissionais
- id (uuid, pk)
- nome
- bio
- foto_url
- categoria (lash, unha, sobrancelha, etc)
- slug (usado no link público: /p/[slug])
- cor_primaria, cor_secundaria (identidade visual da página pública)
- google_calendar_token (criptografado)
- created_at

### servicos
- id (uuid, pk)
- profissional_id (fk -> profissionais)
- nome
- duracao_minutos
- preco
- foto_url
- intervalo_manutencao_dias (nullable — usado no lembrete de manutenção)

### disponibilidade
- id (uuid, pk)
- profissional_id (fk -> profissionais)
- dia_semana (0-6)
- hora_inicio, hora_fim

### clientes
- id (uuid, pk)
- profissional_id (fk -> profissionais)
- nome
- telefone (whatsapp)
- created_at

### agendamentos
- id (uuid, pk)
- profissional_id (fk -> profissionais)
- cliente_id (fk -> clientes)
- servico_id (fk -> servicos)
- data_hora_inicio, data_hora_fim
- status (confirmado, cancelado, concluido, no_show)
- google_event_id (nullable)
- lembrete_confirmacao_enviado (bool)
- lembrete_manutencao_enviado (bool)
- created_at

## Regras de negócio importantes
1. Um agendamento nunca pode sobrepor outro da mesma profissional (bloqueio
   automático de horário) — validar no backend antes de gravar, não só no front.
2. Ao confirmar um agendamento, criar evento correspondente no Google Calendar
   da profissional (se ela tiver conectado a conta) e salvar o google_event_id.
3. Ao cancelar/remarcar, atualizar ou remover o evento correspondente no Google
   Calendar.
4. Lembretes são disparados por job agendado (cron), não em tempo real:
   - Confirmação: 24h antes e 2h antes do agendamento.
   - Manutenção: X dias após a conclusão do atendimento, conforme
     intervalo_manutencao_dias do serviço.
5. A página pública (/p/[slug]) deve carregar rápido e funcionar bem em mobile
   — é o ponto de entrada da cliente final, geralmente vindo de um link do
   Instagram/WhatsApp.

## Convenções de código
- Componentes em português ou inglês? -> definir e manter consistência
  (sugestão: nomes de arquivos/funções em inglês, textos de UI em português)
- Usar Server Components do Next.js sempre que possível; Client Components
  só onde há interatividade real (formulário de agendamento, calendário).
- Validação de dados com Zod em toda entrada de formulário e API route.

## Fora de escopo por enquanto
- Transformar em PWA
- Multi-profissional por conta (salões com equipe) — fase 2
- Sistema de pagamento pra usar a aplicação
- Painel admin supremo
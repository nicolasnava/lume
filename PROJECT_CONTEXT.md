# PROJECT_CONTEXT.md — Lumê (Guia Completo de Contexto da Plataforma)

> **Documento Mestre de Contexto:** Este arquivo contém o mapeamento integral do ecossistema **Lumê**. Foi estruturado para ser lido no início de novos chats por IAs (ou por desenvolvedores) para fornecer contexto instantâneo e profundo sobre a arquitetura, regras de negócio, convenções de código e diretrizes visuais.

---

## 1. Visão Geral & Proposta de Valor

O **Lumê** é um SaaS moderno focado na gestão, agendamento e posicionamento digital de **profissionais autônomas e estúdios de beleza** (lash designers, manicures, designers de sobrancelhas, micropigmentadoras, esteticistas e cabeleireiras).

### 1.1 Principais Diferenciais
- **Página Pública Dedicada (`/p/[slug]`):** Link único e elegante para biografia no Instagram/WhatsApp, onde as clientes agendam serviços sem necessidade de download de aplicativo ou criação de conta/login.
- **Prevenção Real de Conflitos (*Double Booking*):** Trava a nível de banco de dados com índice PostgreSQL GiST (`tstzrange`), impedindo sobreposição de horários mesmo com acessos concorrentes simultâneos.
- **Sincronização com Google Calendar:** Integração OAuth2 bidirecional automática (cria, atualiza e remove eventos na agenda pessoal da profissional).
- **Módulo Studio (Multi-Profissional):** Gestão de salões/estúdios compartilhados com equipes, permissões diferenciadas (dono vs membro) e distribuição inteligente de agendamentos por rodízio (*round-robin*).
- **Notificações Web Push & WhatsApp:** Notificações nativas no navegador/celular para novas marcações e links diretos prontos para envio de confirmações e lembretes de manutenção via WhatsApp.
- **Inteligência Artificial Integrada:** Painel administrativo conectado à API Google Gemini para análise de retenção, ticket médio e diagnósticos operacionais.

---

## 2. Identidade Visual & Design System Oficial

A estética do Lumê é sofisticada, limpa e acolhedora, transmitindo elegância e alto valor percebido.

### 2.1 Paleta de Cores Institucional
| Elemento | Hex | Descrição |
| :--- | :--- | :--- |
| **Primária** | `#B8A9D9` | Lilás suave / lavanda elegante (badges, destaques, botões primários) |
| **Secundária / Fundo** | `#FAF7F5` | Off-white acolhedor (background geral da aplicação e cards suaves) |
| **Texto Principal / Títulos** | `#4A3F5C` | Roxo escuro profundo (alto contraste e tipografia refinada) |
| **Bordas & Divisores** | `#E5E7EB` / `gray-100` | Cinza claríssimo e delicado |
| **Status Positivo / Dinheiro**| `#047857` / `emerald-700`| Verde esmeralda para valores financeiros e status concluído |
| **Status Alerta** | `#B45309` / `amber-700` | Âmbar suave para pendências |
| **Status Atenção / Falta** | `#B91C1C` / `red-700` | Vermelho sofisticado para cancelamentos e no-shows |

### 2.2 Diretrizes Estritas de Design & UI
1. **PROIBIDO O USO DE EMOJIS NO CÓDIGO E NA INTERFACE:**
   - **Regra absoluta do projeto:** Nunca utilize emojis na interface gráfica (nem em botões, títulos, cards, badges ou labels).
   - Use sempre ícones da biblioteca **`lucide-react`** (`Scissors`, `Calendar`, `Clock`, `User`, `Sparkles`, `TrendingUp`, `Target`, etc.) com tamanho e cores harmoniosas (`h-4 w-4 text-[#8675A9]`).
2. **Cantos Arredondados & Elevações:**
   - Cards e modais utilizam `rounded-2xl` ou `rounded-3xl`.
   - Sombras sutis (`shadow-sm`, `shadow-md`, `shadow-2xs`), evitando sombras pretas duras.
3. **Menu Lateral Desktop:**
   - O menu lateral no desktop foi padronizado para caber 100% no viewport sem barra de rolagem (scroll vertical).
   - O espaçamento entre itens de navegação é de `space-y-1` (4px), com `rounded-2xl` nos botões de link e padding confortável `px-3.5 py-2.5`.

---

## 3. Stack Tecnológica

- **Framework:** Next.js 15 (App Router com Server Components e Server Actions tipadas).
- **Linguagem:** TypeScript 5 (modo strict, sem `any` deliberado).
- **Biblioteca de UI:** React 19.
- **Estilização:** Tailwind CSS v4.
- **Ícones:** Lucide React (`lucide-react`).
- **Banco de Dados & Auth:** Supabase (PostgreSQL 15 com Row Level Security ativo em 100% das tabelas).
- **Validação de Dados:** Zod (`zod`).
- **Gráficos Financeiros:** Recharts (`recharts`).
- **Calendário Pessoal:** Google Calendar API via OAuth2 (`googleapis`).
- **Notificações:** Web Push API (`web-push`) + PWA instalável.
- **IA Consultiva:** Google Gemini API (`@google/genai`).
- **Hospedagem & CI/CD:** Vercel integrada ao GitHub (`nicolasnava/lume` na branch `main`).

---

## 4. Estrutura de Diretórios do Projeto

```text
lume/
├── .env.local                    # Variáveis de ambiente secretas (Supabase, Google, Gemini, Vercel)
├── public/                       # Assets estáticos, logos, ícones e service-worker do PWA
├── scripts/                      # Scripts utilitários ativos de teste e manutenção
│   ├── clean-test-data.mjs       # Limpeza segura de dados de teste (npm run clean:test)
│   ├── seed-mockup-profile.mjs   # Geração de perfil de demonstração (npm run seed:mockup)
│   ├── seed-studio-showcase.mjs  # População de estúdio de vitrine
│   └── verify-all-roadmap.mjs    # Bateria de testes de regras de negócio (npm run test:roadmap)
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (protected)/          # Área logada da profissional
│   │   │   ├── layout.tsx        # Layout mestre com Sidebar Desktop e Bottom Nav Mobile
│   │   │   ├── dashboard/        # Telas: geral, agenda, financeiro, relatorios, clientes, servicos, etc.
│   │   │   └── perfil/           # Edição de perfil, fotos, cores, bio, expediente e push
│   │   ├── actions/              # Server Actions seguras ('use server')
│   │   │   ├── auth.ts           # Login, cadastro, redefinição de senha e signout
│   │   │   ├── booking.ts        # Criação pública/manual, cálculo de slots e listagem
│   │   │   ├── reports.ts        # Relatórios, métricas financeiras e metas mensais
│   │   │   ├── estudio.ts        # Gestão de estúdios, membros e rodízio
│   │   │   ├── push.ts           # Subscrição e envio de Web Push
│   │   │   └── ...
│   │   ├── admin/                # Painel de Superadmin da plataforma (com 2FA via OTP)
│   │   ├── api/                  # Endpoints REST (callbacks OAuth, 2FA, webhooks)
│   │   ├── p/[slug]/             # Página pública individual da profissional
│   │   │   └── agendar/          # Fluxo público de agendamento em passos
│   │   ├── estudio/[slug]/       # Página pública do estúdio compartilhado
│   │   ├── avaliar/[id]/         # Página de avaliação pós-atendimento
│   │   └── globals.css           # Variáveis CSS, Tailwind v4 e classes utilitárias
│   ├── components/               # Componentes React modulares
│   │   ├── dashboard/            # NewBookingModal, RelatoriosViewClient, DashboardNav, etc.
│   │   ├── booking/              # Wizard de agendamento público
│   │   ├── ui/                   # CustomSelect, CustomDatePicker, modais base
│   │   └── common/               # Componentes compartilhados (PaymentIcon, StatusBadge)
│   ├── lib/                      # Utilitários, clientes e regras puras
│   │   ├── supabase/             # Clientes Supabase (server, client, admin)
│   │   ├── booking/              # availability.ts (cálculo complexo de slots)
│   │   ├── google-calendar.ts    # Sincronização Google Calendar
│   │   ├── validations.ts        # Schemas de validação Zod
│   │   ├── rateLimit.ts          # Rate limiter persistente no Postgres
│   │   └── push/                 # pushService.ts para envio de Web Push
│   └── middleware.ts             # Proteção de rotas, verificação de sessão e redirecionamentos
└── PROJECT_CONTEXT.md            # Este documento mestre de contexto
```

---

## 5. Modelo de Dados (Supabase / PostgreSQL)

Todas as tabelas contam com **Row Level Security (RLS)** ativado. Abaixo estão as entidades centrais:

### 5.1 `profissionais`
- Representa a conta da profissional cadastrada (vinculada ao `auth.users`).
- **Colunas chave:** `id`, `nome`, `slug` (único, usado em `/p/[slug]`), `telefone`, `foto_url`, `categoria`, `cor_primaria`, `cor_secundaria`, `bio`, `google_calendar_token`, `google_calendar_id`, `onboarding_concluido`, `created_at`.

### 5.2 `servicos`
- Procedimentos oferecidos pela profissional.
- **Colunas chave:** `id`, `profissional_id` (FK), `nome`, `descricao`, `preco` (numeric), `duracao_minutos` (int), `foto_url` (imagem real do procedimento), `intervalo_manutencao_dias` (dias para lembrete de retorno), `ativo` (boolean).

### 5.3 `clientes`
- CRM de clientes da profissional.
- **Colunas chave:** `id`, `profissional_id` (FK), `nome`, `telefone` (normalizado sem formatação), `email`, `observacoes`, `total_agendamentos`, `created_at`.

### 5.4 `agendamentos`
- Agendamentos realizados (tanto online quanto manuais).
- **Colunas chave:** `id`, `profissional_id` (FK), `cliente_id` (FK), `servico_id` (FK), `data_hora_inicio` (timestamptz), `data_hora_fim` (timestamptz), `status` (`confirmado`, `cancelado`, `concluido`, `no_show`), `status_pagamento`, `forma_pagamento_preferida`, `valor_cobrado`, `google_event_id`, `created_at`.
- **Restrição de Concorrência:** Índice GiST que impede qualquer sobreposição de intervalo `[data_hora_inicio, data_hora_fim]` para o mesmo `profissional_id` quando status não for `cancelado`.

### 5.5 `disponibilidade` & `bloqueios`
- `disponibilidade`: Grade semanal padrão da profissional (`dia_semana` 0 a 6, `hora_inicio`, `hora_fim`).
- `bloqueios`: Pausas pontuais, folgas, almoço, férias ou cursos (`data_hora_inicio`, `data_hora_fim`, `motivo`).

### 5.6 `metas_profissionais`
- Guarda as metas de faturamento mensal estipuladas pela profissional.
- **Colunas:** `id`, `profissional_id` (FK), `mes_ano` (`YYYY-MM`), `meta_faturamento` (numeric), `created_at`, `updated_at`.

### 5.7 `estudios` & `estudio_profissionais`
- Suporte a salões e estúdios compartilhados.
- Relaciona um estúdio a múltiplos profissionais com papéis (`owner` vs `member`) e controle de percentual de comissão e rodízio.

---

## 6. Regras de Negócio & Fluxos Críticos

### 6.1 Modal de Novo Agendamento Manual (`NewBookingModal.tsx`)
- **Título:** Deve ser estritamente **"Novo Agendamento"**.
- **Seleção de Serviços:**
  - No mesmo alinhamento horizontal (extremidade direita do label "Serviço"), existe o botão **"Selecionar vários"**.
  - Ao ativar, permite escolher múltiplos procedimentos simultaneamente.
  - O dropdown customizado exibe **foto na esquerda**, **nome em negrito à direita**, **preço em verde** e **tempo em minutos com ícone de relógio**.
  - A duração somada de todos os serviços selecionados é repassada automaticamente para o cálculo de horários vagos e para a gravação no backend.
- **Autocomplete de Clientes:** Ao digitar o nome da cliente, busca no CRM local da profissional e autocompleta nome e WhatsApp com um clique.

### 6.2 Página Pública de Agendamento (`/p/[slug]/agendar`)
- Wizard limpo em passos:
  1. Escolha de um ou múltiplos serviços (com fotos reais).
  2. Escolha de data e horário disponível (slots calculados dinamicamente em tempo real).
  3. Dados da cliente (Nome, WhatsApp) e forma preferencial de pagamento (Pix, Cartão, Dinheiro).
- Ao confirmar:
  - Cria ou atualiza o registro na tabela `clientes`.
  - Insere o agendamento com trava GiST atômica.
  - Sincroniza com o Google Calendar se houver token ativo.
  - Dispara notificação Web Push instantânea para o celular da profissional.
  - Exibe tela de sucesso com botão direto para enviar mensagem de confirmação no WhatsApp da profissional.

### 6.3 Relatórios & Metas Mensais (`/dashboard/relatorios`)
- Apresenta faturamento acumulado, ticket médio, total de atendimentos e taxa de comparecimento (*no-show*).
- Card de Meta do Mês: Permite salvar/editar a meta de receita do mês corrente diretamente no Supabase (`metas_profissionais`), exibindo a barra de progresso e o indicador de ritmo ("Excelente ritmo", "Dentro do esperado", etc.).
- Gráficos por método de pagamento (Pix, Cartão, Dinheiro) usando Recharts.
- Design alinhado aos padrões da plataforma: sem emojis, cards com bordas suaves e badges de ícones padronizados.

---

## 7. Comandos de Terminal & Workflows Frequentes

### 7.1 Desenvolvimento Local
```bash
# Iniciar servidor de desenvolvimento local
npm run dev

# Checagem de tipagem estrita (executar antes de qualquer commit)
npx tsc --noEmit

# Build de produção (validação idêntica à Vercel)
npm run build
```

### 7.2 Scripts de Teste e Limpeza
```bash
# Executar bateria de testes automatizados do roadmap
npm run test:roadmap

# Limpar dados e clientes fictícios criados em testes
npm run clean:test

# Limpeza completa de todas as contas e agendamentos de teste
npm run clean:all

# Popular um perfil completo com fotos e métricas para fotos/demonstração
npm run seed:mockup
```

### 7.3 Deploy para Produção
- O projeto está conectado ao GitHub (`https://github.com/nicolasnava/lume.git`) e à **Vercel**.
- Qualquer alteração enviada para a branch `main` via `git push origin main` dispara o deploy automático em produção na Vercel:
```bash
git add -A
git commit -m "feat/fix: descricao objetiva"
git push origin main
```

---

## 8. Diretrizes para IAs & Desenvolvedores em Novos Chats

Ao iniciar qualquer tarefa neste projeto:
1. **Consulte este arquivo (`PROJECT_CONTEXT.md`)** para entender o impacto das mudanças no ecossistema antes de alterar arquivos.
2. **Nunca introduza emojis na interface ou no código.** Substitua sempre por ícones do `lucide-react`.
3. **Preserve a harmonia visual:** Utilize a paleta institucional (`#B8A9D9`, `#FAF7F5`, `#4A3F5C`), bordas suaves (`rounded-2xl`) e evite quebras de layout ou barras de rolagem desnecessárias no desktop.
4. **Valide a tipagem:** Sempre rode `npx tsc --noEmit` após modificações em componentes ou Server Actions.
5. **Mantenha este documento atualizado:** Se adicionar novas tabelas, rotas ou módulos críticos, atualize este arquivo para preservar a memória do projeto nos próximos chats.

# ✨ Lumê — Plataforma de Gestão & Agendamento para Profissionais da Beleza

<div align="center">
  <img src="public/assets/lume_logo.webp" alt="Lumê Logo" width="220" />
  <br /><br />
  <p><strong>A plataforma completa, elegante e inteligente para transformar a gestão de studios, lash designers, micropigmentadoras e profissionais da estética.</strong></p>
</div>

---

## 🌟 Visão Geral

O **Lumê** é um SaaS moderno e focado na experiência de profissionais autônomas e estúdios de beleza. A plataforma resolve os maiores gargalos do atendimento diário: perda de tempo respondendo mensagens repetitivas no WhatsApp, erros de horários duplicados (*double booking*), desorganização financeira e falta de posicionamento profissional na internet.

---

## 🚀 Principais Recursos

### 1. 🛍️ Vitrine Pública Personalizada (`/p/[slug]`)
- **Página de Perfil Exclusiva:** Identidade visual customizável (cores primária/secundária, fotos de capa e avatar).
- **Catálogo de Procedimentos:** Visualização de fotos reais, tempos estimados, faixas de preço e descrições detalhadas.
- **Wizard de Agendamento em 3 Passos:** Seleção inteligente de serviços múltiplos, cálculo automático de tempo total e confirmação rápida via WhatsApp.
- **Prova Social:** Mural público de avaliações verificadas de clientes atendidas.

### 2. 📅 Gestão de Agenda & Concorrência Atômica
- **Trava GiST no PostgreSQL:** Restrição `no_overlapping_agendamentos` com índice `tstzrange` que impede fisicamente qualquer choque de horários na base de dados.
- **Sincronização com Google Calendar:** Criação, atualização e cancelamento automático de eventos na agenda pessoal da profissional.
- **Bloqueios Flexíveis:** Bloqueio pontual de folgas, cursos, feriados e workshops.
- **Grade Semanal Personalizada:** Configuração de turnos, dias de atendimento e janelas de antecedência.

### 3. 📊 Painel de Controle & Financeiro
- **Métricas em Tempo Real:** Faturamento bruto, ticket médio, taxa de ocupação e serviços mais rentáveis.
- **Relatórios Gráficos:** Distribuição de receita por método de pagamento (PIX, Cartão, Dinheiro) construída com **Recharts**.
- **CRM de Clientes:** Histórico completo de atendimentos, frequência e canais de contato.

### 4. 🔒 Segurança de Nível Empresarial
- **Row Level Security (RLS):** 100% das 20 tabelas protegidas com políticas granulares no Supabase.
- **Rate Limiting Persistente:** Proteção contra ataques de negação de serviço e força bruta diretamente no PostgreSQL.
- **Autenticação com 2FA:** Painel administrativo protegido por autenticação em dois fatores com tokens assinados via HMAC-SHA256 vinculados ao IP.
- **Validação de Assinatura Binária:** Verificação de *magic bytes* em uploads de fotos (JPEG, PNG, WebP, GIF).

### 5. 📱 PWA (Progressive Web App)
- Totalmente instalável no smartphone (Android e iOS) ou Desktop.
- Estratégia de cache *Network-First* com suporte offline para assets essenciais.

### 6. 🤖 Assistente Consultivo de IA (Google Gemini)
- Painel administrativo integrado à API Gemini para geração de diagnósticos consolidados, insights de crescimento e métricas anonimizadas da plataforma.

---

## 🛠️ Stack Tecnológica

- **Frontend & Framework:** [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Banco de Dados & Auth:** [Supabase](https://supabase.com/) (PostgreSQL 15 + RLS)
- **Validação de Esquemas:** [Zod](https://zod.dev/)
- **Gráficos & Visualização:** [Recharts](https://recharts.org/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **IA:** [Google Gemini API](https://ai.google.dev/)

---

## 💻 Começando Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/nicolasnava/lume.git
cd lume
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com o seguinte modelo:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta

# Domínio da Aplicação
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Segurança Admin (Mínimo 16 caracteres)
ADMIN_2FA_SECRET=seu-segredo-de-assinatura-hmac-2fa

# Google Calendar OAuth (Opcional para testes locais)
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# EmailJS (Para envio de OTP e notificações)
EMAILJS_SERVICE_ID=seu-service-id
EMAILJS_TEMPLATE_ID=seu-template-id
EMAILJS_PRIVATE_KEY=sua-private-key

# Google Gemini AI (Para assistente do painel admin)
GEMINI_API_KEY=sua-gemini-api-key
```

### 4. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🧪 Bateria de Testes Automatizados

O projeto inclui suíte de testes de integridade e regras de negócio:

```bash
npm run test:roadmap
```

---

## 📄 Licença

Projeto desenvolvido sob direitos proprietários da marca **Lumê**.

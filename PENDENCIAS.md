# 📋 Pendências e Checklist Pré-Lançamento (Lumê)

Este documento registra itens de configuração, segurança e infraestrutura que estão intencionalmente simplificados durante a fase de testes fechados e que **devem ser reativados/configurados antes da divulgação pública ampla**.

---

## 🔒 Segurança e Autenticação

### 1. Reativar "Confirm email" no Supabase Auth
- **Status Atual:** Desativado para facilitar testes rápidos e criação de contas de teste sem validação de caixa de entrada.
- **Ação Obrigatória:**
  1. Acessar o painel do Supabase (`Authentication > Providers > Email Auth`).
  2. Ativar a opção **"Confirm email"**.
  3. Configurar os templates de e-mail de confirmação e recuperação de senha com a identidade visual do Lumê.
- **Comportamento no Código:** A aplicação já está 100% preparada. Quando ativado, o método `signUpAction` detecta a exigência e instrui a usuária a verificar o link recebido no e-mail antes do primeiro login.

### 2. Configurar SMTP Customizado para Disparo Transacional
- **Ação:** Configurar serviço de envio de e-mails em produção (ex: Resend, Postmark, SendGrid) no Supabase para evitar limites de taxa e garantir alta entregabilidade nas caixas de entrada.

### 3. Rate Limiting em Produção (Edge / Reverse Proxy)
- **Status Atual:** Rate limiter em memória no servidor Next.js para criação de agendamento (5 req/min).
- **Ação:** Ativar regras de WAF/Rate Limiting no provedor de borda (Cloudflare / Vercel Firewall) para rotas sensíveis (`/api/auth/*`, `/login`, `/cadastro`).

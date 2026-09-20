# Pendências e Próximos Passos (Backlog Lumê)

Este documento registra as configurações e melhorias pendentes para execução posterior.

---

## 📬 E-mails & Comunicação (Resend & Supabase)

### 1. Configurar Domínio Próprio de Remetente no Resend
- [ ] **Definir/Adquirir o domínio oficial do Lumê** (ex: `lumee.com.br` ou similar).
- [ ] **Cadastrar o domínio no Resend:**
  - Acessar `https://resend.com/domains` e clicar em **Add Domain**.
  - Copiar os registros DNS gerados (DKIM, SPF e DMARC).
  - Adicionar as entradas DNS no provedor onde o domínio foi registrado (Registro.br, Cloudflare, Hostinger, etc.).
  - Aguardar validação (status *Verified*).
- [ ] **Atualizar o remetente oficial no `.env.local`:**
  - Alterar `RESEND_FROM_EMAIL` de `Lumê <onboarding@resend.dev>` para `Lumê <contato@seudominio.com.br>` (ou `agenda@...` / `nao-responda@...`).
- [ ] **Atualizar o remetente no Supabase SMTP:**
  - Alterar o campo **Sender email address** de `onboarding@resend.dev` para o e-mail do seu domínio verificado.

---

### 2. Ativação dos Templates no Painel do Supabase
- [ ] **Salvar SMTP do Resend no Supabase:**
  - Acessar `Supabase > Project Settings > Authentication > SMTP Settings` (ou `Authentication > Emails`).
  - Confirmar o preenchimento:
    - **Sender email:** `onboarding@resend.dev` (provisório) ou o oficial verificado
    - **Sender name:** `Lumê`
    - **Host:** `smtp.resend.com`
    - **Port:** `465`
    - **User:** `resend`
    - **Password:** `sua_chave_resend_aqui` (chave da API Resend)
  - Clicar em **Save**.
- [ ] **Colar os Templates HTML no Supabase:**
  - Acessar `Authentication > Email Templates`:
    - **Confirm signup:**
      - Subject: `Confirme seu cadastro no Lumê ✨`
      - Body: copiar conteúdo de `src/lib/email/templates/confirmSignupSupabase.html`
    - **Reset password:**
      - Subject: `Redefinição de senha Lumê 🔒`
      - Body: copiar conteúdo de `src/lib/email/templates/resetPasswordSupabase.html`

---

## 🛡️ Status Atual do que já está Pronto e Ativo:
- SDK do Resend instalado e testado com sucesso (teste entregue em `nicolasnava.senai@gmail.com`).
- Chave `RESEND_API_KEY` salva no `.env.local`.
- 2FA de Administrador integrado nativamente com o Resend no código (`src/lib/admin/twoFactor.ts`).
- Templates HTML responsivos com a identidade visual do Lumê criados em `src/lib/email/templates/`.

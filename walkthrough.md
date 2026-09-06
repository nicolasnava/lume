# Walkthrough — Prompt 59: Reagendar, QR Code, Stories e Notificações Push

Todas as 4 funcionalidades do **Prompt 59** foram desenvolvidas, integradas e validadas com sucesso sem erros de compilação TypeScript (`npx tsc --noEmit` retornou código 0).

---

## 1. Reagendamento Self-Service para Clientes ("Meus Agendamentos")

### O que mudou
- No modal de consulta de agendamentos (`ClientBookingsModal.tsx`), ao clicar em "Gerenciar / Cancelar" num agendamento futuro confirmado, o sistema exibe primeiro a escolha interativa:
  > **"O que você deseja fazer?"**
  > - **Opção 1:** *Remarcar para outro horário*
  > - **Opção 2:** *Cancelar agendamento*

### Regras e Fluxo Implementados
1. **Regra de Antecedência de 4h:**
   - Se o agendamento estiver a menos de 4 horas do horário marcado, o reagendamento e o cancelamento online são bloqueados com aviso e botão direto para o WhatsApp da profissional.
2. **Seleção de Data e Horário (`VerticalDayList` e `fetchAvailableSlotsAction`):**
   - Abre o calendário horizontal por semanas, respeitando a disponibilidade real da profissional.
   - Calcula os horários vagos preservando a duração exata do(s) serviço(s) originalmente contratados.
3. **Card de Comparação:**
   - Exibe claramente a comparação:
     - Horário Anterior (tachado)
     - Novo Horário Escolhido (destaque em verde com dia da semana)
     - Nome do serviço e duração
4. **Server Action `rescheduleClientBookingAction` (`src/app/actions/booking.ts`):**
   - Valida titularidade do cliente (telefone) e slug da profissional.
   - Validação contra conflito de agenda (Exclusion / Overlapping check).
   - Atualiza `data_hora_inicio` e `data_hora_fim`.
   - Sincroniza o novo horário com o Google Calendar (`updateGoogleCalendarEvent`).
   - Dispara Notificação Push em tempo real para a profissional.
5. **Tela de Confirmação:**
   - Feedback visual imediato de sucesso e atualização da lista em tempo real.

---

## 2. QR Code da Vitrine em `/perfil`

### O que mudou
- Na aba **Vitrine** de `/perfil` (`ProfileForm.tsx`), ao lado do campo do link público e do botão de copiar, foi adicionado o botão **"QR Code"**.
- O botão abre o modal interativo `QrCodeModal.tsx`:
  - Gera QR code client-side de alta resolução (1024x1024) com a biblioteca `qrcode`.
  - Aponta automaticamente para a URL pública da profissional (`/p/[slug]` ou `/studio/[studioSlug]/[membroSlug]` caso ela faça parte de um studio).
  - Exibe prévia do QR Code na tela.
  - Botão **"Baixar QR Code (PNG de Alta Resolução)"** pronto para impressão em balcões, cartões de visita e adesivos.
  - Botão para copiar o link público.

---

## 3. Compartilhamento para Instagram Stories (1080x1920)

### O que mudou
- Na aba **Vitrine** de `/perfil` (`ProfileForm.tsx`), foi adicionado o botão **"Stories"**.
- O botão abre o modal `StoriesShareModal.tsx`:
  - **Geração Client-Side via HTML5 Canvas:** Renderiza uma arte em proporção 9:16 (1080x1920) em segundos, sem sobrecarregar o servidor.
  - **Composição Visual:**
    - Fundo em degradê elegante nas cores da profissional (`corSecundaria` e `corPrimaria`).
    - Logo Lumê sutil no topo.
    - Foto de perfil (Avatar) em moldura circular com anel de destaque (com fallback para iniciais se não houver foto).
    - Nome da profissional em tipografia elegante.
    - Tagline / chamada (*"Agende seu horário comigo!"*).
    - Card branco arredondado centralizado com o QR code em alta nitidez para leitura pela câmera de outros smartphones.
    - Pílula inferior com o link legível da vitrine (`lume.com.br/p/slug`).
  - **Ações:**
    - **Baixar Imagem (PNG):** Baixa o arquivo pronto para upload manual nos Stories.
    - **Compartilhar Direto:** Usa a Web Share API (`navigator.share`) em smartphones (iOS/Android) para enviar diretamente para o Instagram ou WhatsApp.

---

## 4. Notificações Push em Tempo Real (PWA Web Push)

### Infraestrutura Criada
1. **Nova Migration SQL:**
   - `supabase/migrations/00037_create_push_subscriptions.sql`:
     - Tabela `public.push_subscriptions` (`id`, `profissional_id`, `endpoint`, `p256dh`, `auth`, `created_at`).
     - Índice em `profissional_id` e restrição única `(profissional_id, endpoint)`.
     - RLS habilitada garantindo que cada profissional gerencie apenas suas inscrições.
2. **Serviço de Envio (`src/lib/push/pushService.ts`):**
   - Utiliza a biblioteca `web-push`.
   - Envia push assíncrono para todos os dispositivos registrados da profissional.
   - Limpeza automática de subscriptions expiradas (status 410 Gone / 404 Not Found).
3. **Disparos Automáticos nas Server Actions (`src/app/actions/booking.ts`):**
   - **Novo agendamento:** Disparado em `createBookingAction`.
   - **Cancelamento pelo cliente:** Disparado em `cancelClientBookingAction`.
   - **Remarcação pelo cliente:** Disparado em `rescheduleClientBookingAction`.
4. **Service Worker (`public/sw.js`):**
   - Listener de `push`: exibe notificação com título, corpo, ícone Lumê e vibração.
   - Listener de `notificationclick`: foca ou abre `/dashboard/agenda`.
5. **Gerenciador no Perfil (`src/components/profile/PushNotificationToggle.tsx`):**
   - Inserido na aba **Perfil** de forma não intrusiva.
   - Solicita permissão do navegador e salva a inscrição no Supabase.
   - Botão **"Testar Push"** para validar o recebimento imediato no dispositivo.

---

## Migrations para Rodar no Supabase

Execute a migration abaixo no **SQL Editor** do seu painel Supabase:

### `supabase/migrations/00037_create_push_subscriptions.sql`
```sql
-- Migration 00037: Criar tabela para armazenar Push Subscriptions da Web Push API (PWA)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_push_sub_profissional_endpoint UNIQUE (profissional_id, endpoint)
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profissional 
  ON public.push_subscriptions (profissional_id);

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Profissional autenticada gerencia suas próprias subscriptions
DROP POLICY IF EXISTS "Profissional gerencia suas próprias push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Profissional gerencia suas próprias push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (profissional_id = auth.uid())
  WITH CHECK (profissional_id = auth.uid());

-- Permitir que service_role tenha acesso total para envio assíncrono em server actions
GRANT ALL ON public.push_subscriptions TO service_role;
```

---

## Variáveis de Ambiente (VAPID Keys)

As chaves VAPID foram geradas e já configuradas no arquivo `.env.local`:

```env
# Web Push API (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BFgvxWm6W2GeFpPByZi-vuBvdreMBENs100PEaQhhHpf8aAw7PK25fej67_3XrRlZJ8eYg0Pm-5hrQHVoOMIpOk
VAPID_PRIVATE_KEY=ED8OJvoyc2N1Zb9klO5N1rlTUJkE5wYK3SMwGVNCpf4
VAPID_SUBJECT=mailto:suporte@lume.com.br
```

> **Nota para Produção (Vercel / Hosting):** Configure essas três variáveis de ambiente no painel do seu provedor de hospedagem quando for realizar o deploy.

---

## 5. Micro-Alterações de Layout e Textos em `/perfil`

Conforme solicitado:
1. **Remoção de Texto de Tamanho de Imagem:** Removido o texto *"Tamanho recomendado: mínimo 400x400px (quadrada)..."* abaixo da foto de perfil.
2. **Novos Rótulos Simplificados:**
   - *"Nome Completo ou Nome Profissional \*"* ➔ **"Nome Exibido"**
   - *"Frase de Destaque / Tagline"* ➔ **"Frase de Destaque"**
   - *"Biografia / Apresentação"* ➔ **"Apresentação"**
3. **Localização Simplificada:**
   - *"Localização / Cidade"* ➔ **"Localização"**
4. **Modalidades de Atendimento:**
   - O título *"Modalidades de Atendimento"* agora tem `whitespace-nowrap` para evitar quebras desnecessárias.
   - Removido o badge *"Seleção múltipla"*.
5. **Tutoriais Atualizados:**
   - [`ProfileTourModal.tsx`](file:///c:/Users/user/Documents/Projetos/lume/src/components/profile/ProfileTourModal.tsx) e [`ProductTourModal.tsx`](file:///c:/Users/user/Documents/Projetos/lume/src/components/dashboard/ProductTourModal.tsx) atualizados com a nova nomenclatura, autoatendimento de reagendamento para clientes, geração de QR Code/Stories e notificações push.

---

## Verificação de Build

- `node ./node_modules/typescript/bin/tsc --noEmit`: **0 erros de tipagem**.
- Dependências instaladas: `qrcode`, `web-push`, `@types/qrcode`, `@types/web-push`.

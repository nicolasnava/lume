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

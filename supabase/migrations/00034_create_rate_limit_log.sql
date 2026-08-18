-- Migration 00034: Tabela de rate limiting persistente no PostgreSQL para proteção contra abuso em ambiente serverless
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL,
  acao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup ON public.rate_limit_log (chave, acao, created_at DESC);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Política RLS: Acesso administrativo e operações via service_role / AdminClient
DROP POLICY IF EXISTS "Admins total rate_limit_log" ON public.rate_limit_log;
CREATE POLICY "Admins total rate_limit_log"
  ON public.rate_limit_log
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

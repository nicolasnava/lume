-- Migration 00030: Tabela de códigos OTP e tokens de 1 clique de 2FA para administradores

CREATE TABLE IF NOT EXISTS public.admin_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  codigo_hash TEXT NOT NULL,
  token_link_hash TEXT,
  expira_em TIMESTAMPTZ NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_otp_codes_admin_id ON public.admin_otp_codes(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_otp_codes_token_link ON public.admin_otp_codes(token_link_hash);
CREATE INDEX IF NOT EXISTS idx_admin_otp_codes_expira_em ON public.admin_otp_codes(expira_em);

ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Apenas administradores autenticados ou service_role podem consultar/operar
DROP POLICY IF EXISTS "Admins leitura proprios codigos otp" ON public.admin_otp_codes;
CREATE POLICY "Admins leitura proprios codigos otp"
  ON public.admin_otp_codes
  FOR ALL
  USING (admin_id = auth.uid() AND public.is_admin())
  WITH CHECK (admin_id = auth.uid() AND public.is_admin());

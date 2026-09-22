-- Portfólio, enquadramento do banner, pacotes independentes e itens da comanda no atendimento.

ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS banner_position_y SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE public.profissionais
  DROP CONSTRAINT IF EXISTS profissionais_portfolio_max_6,
  ADD CONSTRAINT profissionais_portfolio_max_6 CHECK (cardinality(portfolio_urls) <= 6),
  DROP CONSTRAINT IF EXISTS profissionais_banner_position_y_range,
  ADD CONSTRAINT profissionais_banner_position_y_range CHECK (banner_position_y BETWEEN 0 AND 100);

ALTER TABLE public.combos
  ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER;

ALTER TABLE public.combos
  DROP CONSTRAINT IF EXISTS combos_duracao_positiva,
  ADD CONSTRAINT combos_duracao_positiva CHECK (duracao_minutos IS NULL OR duracao_minutos > 0);

CREATE TABLE IF NOT EXISTS public.agendamento_comanda_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.comanda_produtos(id) ON DELETE SET NULL,
  nome_no_momento TEXT NOT NULL,
  preco_no_momento NUMERIC(10,2) NOT NULL CHECK (preco_no_momento >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agendamento_comanda_produtos_agendamento
  ON public.agendamento_comanda_produtos(agendamento_id);

ALTER TABLE public.agendamento_comanda_produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissional gerencia produtos dos seus atendimentos" ON public.agendamento_comanda_produtos;
CREATE POLICY "Profissional gerencia produtos dos seus atendimentos"
  ON public.agendamento_comanda_produtos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id AND a.profissional_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id AND a.profissional_id = auth.uid()
    )
  );

DROP VIEW IF EXISTS public.profissionais_publico CASCADE;

CREATE VIEW public.profissionais_publico
WITH (security_invoker = false) AS
SELECT
  id,
  nome,
  bio,
  foto_url,
  foto_capa_url,
  portfolio_urls,
  banner_position_y,
  categoria,
  slug,
  cor_primaria,
  cor_secundaria,
  localizacao,
  whatsapp,
  instagram,
  tagline,
  modalidade_atendimento,
  janela_agendamento_dias,
  formas_pagamento_aceitas,
  estudio_id,
  ativo_no_estudio,
  created_at
FROM public.profissionais
WHERE deletado_em IS NULL
  AND status_conta != 'suspensa';

GRANT SELECT ON public.profissionais_publico TO anon, authenticated;

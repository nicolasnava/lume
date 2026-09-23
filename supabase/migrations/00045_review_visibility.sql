ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS oculta BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional_visiveis
  ON public.avaliacoes (profissional_id, created_at DESC)
  WHERE oculta = false;

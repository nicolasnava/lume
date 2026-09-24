-- Supports soft deletion after linked appointments are completed.
ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ DEFAULT NULL;

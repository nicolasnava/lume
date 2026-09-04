-- Migration 00036: Adicionar fotos_espaco para galeria Nosso Espaço nos Studios
-- Permite que a dona do studio adicione até 6 fotos do ambiente

ALTER TABLE public.estudios
  ADD COLUMN IF NOT EXISTS fotos_espaco TEXT[] DEFAULT '{}';

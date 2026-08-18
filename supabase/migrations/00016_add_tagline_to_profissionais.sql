-- Migration 00016: Adiciona a coluna tagline na tabela profissionais
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS tagline text NULL;

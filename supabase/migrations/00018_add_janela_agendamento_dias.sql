-- Migration 00018: Adiciona a coluna janela_agendamento_dias na tabela profissionais
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS janela_agendamento_dias integer DEFAULT 90 NOT NULL;

-- Migration 00041: Gestão Completa de Studio, Modos de Operação e Privacidade da Equipe
-- Permite que a dona gerencie faturamento, comissões/repasses e agenda centralizada,
-- ou atue no modelo de aluguel de cadeira/coworking, com total consentimento da profissional.

-- 1. Campos de Gestão no Estúdio
ALTER TABLE public.estudios
  ADD COLUMN IF NOT EXISTS tipo_gestao TEXT NOT NULL DEFAULT 'gestao_completa' CHECK (tipo_gestao IN ('aluguel_cadeira', 'gestao_completa')),
  ADD COLUMN IF NOT EXISTS comissao_padrao_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS aluguel_padrao_fixo NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- 2. Permissões de Privacidade e Regras Financeiras da Profissional Membro
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS compartilhar_faturamento BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS compartilhar_agendamentos BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS permitir_agendamento_dona BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS termo_aceito_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comissao_personalizada_pct NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aluguel_personalizado_fixo NUMERIC(10,2) DEFAULT NULL;

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_profissionais_compartilhar_faturamento ON public.profissionais (compartilhar_faturamento);
CREATE INDEX IF NOT EXISTS idx_profissionais_compartilhar_agendamentos ON public.profissionais (compartilhar_agendamentos);

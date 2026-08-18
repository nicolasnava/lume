-- Migration 00031: Adicionar coluna modalidade_atendimento na tabela profissionais e atualizar a view pública

ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS modalidade_atendimento text DEFAULT 'studio';

-- Atualizar a view pública segura para incluir modalidade_atendimento
CREATE OR REPLACE VIEW public.profissionais_publico
WITH (security_invoker = false) AS
SELECT
  id,
  nome,
  bio,
  foto_url,
  foto_capa_url,
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
  created_at
FROM public.profissionais
WHERE deletado_em IS NULL
  AND status_conta != 'suspensa';

GRANT SELECT ON public.profissionais_publico TO anon, authenticated;

-- Migration 00032: Suporte a Múltiplas Modalidades de Atendimento (Array text[]) e Ajuste da Trigger
ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS modalidade_atendimento text[] DEFAULT ARRAY['studio']::text[];

-- 2. Atualizar a view pública segura para refletir modalidade_atendimento
DROP VIEW IF EXISTS public.profissionais_publico CASCADE;

CREATE VIEW public.profissionais_publico
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

-- Atualizar trigger de criação de novos usuários para não forçar 'outro' em categorias
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_nome text;
  prof_slug text;
BEGIN
  raw_nome := COALESCE(new.raw_user_meta_data->>'nome', 'Profissional de Beleza');
  prof_slug := 'profissional-' || substring(new.id::text from 1 for 6);

  INSERT INTO public.profissionais (
    id,
    nome,
    categoria,
    slug,
    modalidade_atendimento,
    cor_primaria,
    cor_secundaria
  )
  VALUES (
    new.id,
    raw_nome,
    ARRAY[]::text[],
    prof_slug,
    ARRAY['studio']::text[],
    '#B8A9D9',
    '#FAF7F5'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

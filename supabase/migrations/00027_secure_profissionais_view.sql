-- Migration 00027: View pública segura de profissionais e remoção de RLS público na tabela base
-- Esta migration corrige a exposição de colunas sensíveis (google_calendar_token, notas_internas, mensalidade, etc.)
-- criando uma VIEW pública com colunas estritamente seguras e revogando o SELECT público direto na tabela 'profissionais'.

-- ============================================================================
-- 1. CRIAR VIEW PÚBLICA SEGURA 'profissionais_publico'
-- ============================================================================
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
  janela_agendamento_dias,
  formas_pagamento_aceitas,
  created_at
FROM public.profissionais
WHERE deletado_em IS NULL
  AND status_conta != 'suspensa';

-- Conceder permissão de leitura pública à VIEW
GRANT SELECT ON public.profissionais_publico TO anon, authenticated;

-- ============================================================================
-- 2. RESTRINGIR A POLÍTICA DE LEITURA PÚBLICA NA TABELA BASE 'profissionais'
-- ============================================================================

-- Remover a política permissiva de leitura pública
DROP POLICY IF EXISTS "Profissionais leitura publica" ON public.profissionais;

-- Garantir que a própria profissional possa ler os seus dados completos (incluindo sensíveis) na tabela base
DROP POLICY IF EXISTS "Profissionais leitura propria" ON public.profissionais;
CREATE POLICY "Profissionais leitura propria"
  ON public.profissionais FOR SELECT
  USING (auth.uid() = id);

-- Garantir política de leitura total para administradores
DROP POLICY IF EXISTS "Admins leitura total profissionais" ON public.profissionais;
CREATE POLICY "Admins leitura total profissionais"
  ON public.profissionais FOR SELECT
  USING (public.is_admin());

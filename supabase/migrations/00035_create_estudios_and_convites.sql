-- Migration 00035: Criação de Studios com Equipe e Convites
-- Permite que profissionais independentes se agrupem em um studio com vitrine coletiva

-- ============================================================================
-- 1. CRIAR TABELA DE ESTÚDIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.estudios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  foto_capa_url TEXT,
  cor_primaria TEXT NOT NULL DEFAULT '#B8A9D9',
  cor_secundaria TEXT NOT NULL DEFAULT '#FAF7F5',
  criado_por UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  round_robin_ultimo_membro_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_estudios_slug ON public.estudios (slug);
CREATE INDEX IF NOT EXISTS idx_estudios_criado_por ON public.estudios (criado_por);

-- ============================================================================
-- 2. ALTERAÇÕES NA TABELA PROFISSIONAIS
-- ============================================================================
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS estudio_id UUID REFERENCES public.estudios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ativo_no_estudio BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profissionais_estudio_id ON public.profissionais (estudio_id);

-- ============================================================================
-- 3. CRIAR TABELA DE CONVITES DO ESTÚDIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.estudio_convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudio_id UUID NOT NULL REFERENCES public.estudios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('link', 'email')),
  codigo TEXT UNIQUE,
  email_convidado TEXT,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'aceito', 'expirado', 'cancelado')) DEFAULT 'pendente',
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estudio_convites_estudio_id ON public.estudio_convites (estudio_id);
CREATE INDEX IF NOT EXISTS idx_estudio_convites_codigo ON public.estudio_convites (codigo);
CREATE INDEX IF NOT EXISTS idx_estudio_convites_email ON public.estudio_convites (lower(email_convidado));

-- ============================================================================
-- 4. ATUALIZAR VIEW PÚBLICA SEGURA 'profissionais_publico'
-- ============================================================================
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
  estudio_id,
  ativo_no_estudio,
  created_at
FROM public.profissionais
WHERE deletado_em IS NULL
  AND status_conta != 'suspensa';

GRANT SELECT ON public.profissionais_publico TO anon, authenticated;

-- ============================================================================
-- 5. FUNÇÃO DE BUSCA SEGURA DE PROFISSIONAL POR EMAIL (Para convites)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.buscar_profissional_por_email(search_email text)
RETURNS TABLE (
  id uuid,
  nome text,
  foto_url text,
  slug text,
  email text,
  estudio_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.foto_url,
    p.slug,
    u.email::text,
    p.estudio_id
  FROM auth.users u
  JOIN public.profissionais p ON p.id = u.id
  WHERE lower(u.email) = lower(trim(search_email))
    AND p.deletado_em IS NULL
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_profissional_por_email(text) TO authenticated;

-- ============================================================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.estudios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_convites ENABLE ROW LEVEL SECURITY;

-- Políticas para 'estudios'
DROP POLICY IF EXISTS "Estudios leitura publica" ON public.estudios;
CREATE POLICY "Estudios leitura publica"
  ON public.estudios FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Profissionais autenticadas podem criar estudio" ON public.estudios;
CREATE POLICY "Profissionais autenticadas podem criar estudio"
  ON public.estudios FOR INSERT
  WITH CHECK (auth.uid() = criado_por);

DROP POLICY IF EXISTS "Criador pode atualizar estudio" ON public.estudios;
CREATE POLICY "Criador pode atualizar estudio"
  ON public.estudios FOR UPDATE
  USING (auth.uid() = criado_por)
  WITH CHECK (auth.uid() = criado_por);

DROP POLICY IF EXISTS "Criador pode excluir estudio" ON public.estudios;
CREATE POLICY "Criador pode excluir estudio"
  ON public.estudios FOR DELETE
  USING (auth.uid() = criado_por);

-- Políticas para 'estudio_convites'
DROP POLICY IF EXISTS "Dona do estudio pode ler convites" ON public.estudio_convites;
CREATE POLICY "Dona do estudio pode ler convites"
  ON public.estudio_convites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.estudios
      WHERE estudios.id = estudio_convites.estudio_id
        AND estudios.criado_por = auth.uid()
    )
    OR (
      email_convidado IS NOT NULL 
      AND lower(email_convidado) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "Dona do estudio pode criar convites" ON public.estudio_convites;
CREATE POLICY "Dona do estudio pode criar convites"
  ON public.estudio_convites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estudios
      WHERE estudios.id = estudio_convites.estudio_id
        AND estudios.criado_por = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Dona ou convidada pode atualizar convite" ON public.estudio_convites;
CREATE POLICY "Dona ou convidada pode atualizar convite"
  ON public.estudio_convites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.estudios
      WHERE estudios.id = estudio_convites.estudio_id
        AND estudios.criado_por = auth.uid()
    )
    OR (
      email_convidado IS NOT NULL 
      AND lower(email_convidado) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "Dona do estudio pode excluir convites" ON public.estudio_convites;
CREATE POLICY "Dona do estudio pode excluir convites"
  ON public.estudio_convites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.estudios
      WHERE estudios.id = estudio_convites.estudio_id
        AND estudios.criado_por = auth.uid()
    )
  );

-- Permitir que a dona do estúdio desvincule membros do seu estúdio (set estudio_id = null)
DROP POLICY IF EXISTS "Dona estudio pode desvincular membros" ON public.profissionais;
CREATE POLICY "Dona estudio pode desvincular membros"
  ON public.profissionais FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.estudios
      WHERE estudios.id = profissionais.estudio_id
        AND estudios.criado_por = auth.uid()
    )
  );

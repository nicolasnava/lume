-- Migration 00028: Isolamento de pastas de Storage por usuário e RLS de slugs_antigos
-- Corrige vulnerabilidade de sobrescrita/deleção de imagens entre profissionais no Storage
-- Adiciona políticas de isolamento baseadas no auth.uid() para os buckets avatars, servicos e profissionais_fotos

-- ============================================================================
-- 1. BUCKET: avatars
-- ============================================================================
DROP POLICY IF EXISTS "Avatares leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "Avatares insercao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Avatares edicao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Avatares delecao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Leitura publica avatars" ON storage.objects;
DROP POLICY IF EXISTS "Escrita autenticada avatars" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao autenticada avatars" ON storage.objects;
DROP POLICY IF EXISTS "Delecao autenticada avatars" ON storage.objects;

-- Leitura pública para exibição de avatares na aplicação e páginas públicas
CREATE POLICY "Leitura publica avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Inserção permitida apenas dentro da pasta com o UUID do próprio usuário autenticado
CREATE POLICY "Escrita autenticada avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Atualização restrita à pasta do próprio usuário
CREATE POLICY "Atualizacao autenticada avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deleção restrita à pasta do próprio usuário
CREATE POLICY "Delecao autenticada avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 2. BUCKET: servicos
-- ============================================================================
DROP POLICY IF EXISTS "Leitura publica servicos" ON storage.objects;
DROP POLICY IF EXISTS "Escrita autenticada servicos" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao autenticada servicos" ON storage.objects;
DROP POLICY IF EXISTS "Delecao autenticada servicos" ON storage.objects;

-- Leitura pública das fotos dos serviços
CREATE POLICY "Leitura publica servicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'servicos');

-- Inserção permitida apenas na pasta com o UUID da profissional
CREATE POLICY "Escrita autenticada servicos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'servicos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Atualização restrita à pasta da própria profissional
CREATE POLICY "Atualizacao autenticada servicos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'servicos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deleção restrita à pasta da própria profissional
CREATE POLICY "Delecao autenticada servicos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'servicos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 3. BUCKET: profissionais_fotos
-- ============================================================================
DROP POLICY IF EXISTS "Leitura publica profissionais_fotos" ON storage.objects;
DROP POLICY IF EXISTS "Escrita autenticada profissionais_fotos" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao autenticada profissionais_fotos" ON storage.objects;
DROP POLICY IF EXISTS "Delecao autenticada profissionais_fotos" ON storage.objects;

-- Leitura pública
CREATE POLICY "Leitura publica profissionais_fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profissionais_fotos');

-- Inserção restrita à pasta da própria profissional
CREATE POLICY "Escrita autenticada profissionais_fotos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profissionais_fotos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Atualização restrita à pasta da própria profissional
CREATE POLICY "Atualizacao autenticada profissionais_fotos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profissionais_fotos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deleção restrita à pasta da própria profissional
CREATE POLICY "Delecao autenticada profissionais_fotos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profissionais_fotos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 4. TABELA: slugs_antigos (Políticas Explícitas de RLS)
-- ============================================================================
ALTER TABLE public.slugs_antigos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins total slugs_antigos" ON public.slugs_antigos;
CREATE POLICY "Admins total slugs_antigos"
  ON public.slugs_antigos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Profissional leitura proprios slugs antigos" ON public.slugs_antigos;
CREATE POLICY "Profissional leitura proprios slugs antigos"
  ON public.slugs_antigos FOR SELECT
  USING (auth.uid() = profissional_id);

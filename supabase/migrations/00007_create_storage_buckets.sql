-- Migration 00007: Criar buckets de Storage 'avatars' e 'servicos' com políticas RLS

-- 1. Criar bucket 'avatars' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Criar bucket 'servicos' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'servicos',
  'servicos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Habilitar RLS e criar políticas de leitura pública e escrita para usuários autenticados
DROP POLICY IF EXISTS "Leitura publica avatars" ON storage.objects;
DROP POLICY IF EXISTS "Escrita autenticada avatars" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao autenticada avatars" ON storage.objects;
DROP POLICY IF EXISTS "Delecao autenticada avatars" ON storage.objects;

CREATE POLICY "Leitura publica avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Escrita autenticada avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Atualizacao autenticada avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Delecao autenticada avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- 4. Políticas para bucket 'servicos'
DROP POLICY IF EXISTS "Leitura publica servicos" ON storage.objects;
DROP POLICY IF EXISTS "Escrita autenticada servicos" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao autenticada servicos" ON storage.objects;
DROP POLICY IF EXISTS "Delecao autenticada servicos" ON storage.objects;

CREATE POLICY "Leitura publica servicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'servicos');

CREATE POLICY "Escrita autenticada servicos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'servicos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Atualizacao autenticada servicos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'servicos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Delecao autenticada servicos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'servicos'
    AND auth.role() = 'authenticated'
  );

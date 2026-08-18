-- Migration 00005: Garantir buckets de Storage 'avatars' e 'profissionais_fotos' e RLS

-- 1. Bucket 'avatars' (usado no upload do perfil)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- Limite de 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Bucket 'profissionais_fotos' (compatibilidade)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissionais_fotos',
  'profissionais_fotos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Remover políticas antigas de storage para evitar duplicidade de nomes
DROP POLICY IF EXISTS "Avatares leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "Avatares insercao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Avatares edicao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Avatares delecao autenticado" ON storage.objects;

-- 4. Criar Políticas de RLS para o bucket 'avatars'
CREATE POLICY "Avatares leitura publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatares insercao autenticado"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Avatares edicao autenticado"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Avatares delecao autenticado"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

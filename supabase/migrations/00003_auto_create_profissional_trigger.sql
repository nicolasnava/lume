-- Migration 00003: Trigger no Postgres para criação automática do perfil profissional
-- Esta função garante que qualquer inserção em auth.users crie uma linha na tabela 'profissionais'

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
    cor_primaria,
    cor_secundaria
  )
  VALUES (
    new.id,
    raw_nome,
    'outro',
    prof_slug,
    '#B8A9D9',
    '#FAF7F5'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar o trigger à tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

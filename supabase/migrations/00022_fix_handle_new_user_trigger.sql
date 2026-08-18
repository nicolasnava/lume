-- Migration 00022: Corrigir a função trigger handle_new_user para o tipo ARRAY de categoria (TEXT[])

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
    ARRAY['outro']::text[],
    prof_slug,
    '#B8A9D9',
    '#FAF7F5'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar/Re-criar a trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

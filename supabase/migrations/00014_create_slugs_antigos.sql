-- Migration 00014: Criar tabela slugs_antigos para redirecionamento automático de URLs antigas da profissional

CREATE TABLE IF NOT EXISTS slugs_antigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  slug_antigo text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Índice para acelerar a busca de redirecionamento em /p/[slug]
CREATE INDEX IF NOT EXISTS idx_slugs_antigos_slug_antigo ON slugs_antigos(slug_antigo);

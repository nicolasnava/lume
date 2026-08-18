-- Migration 00006: Alterar a coluna categoria da tabela profissionais para TEXT[] (array de texto)

ALTER TABLE profissionais 
  ALTER COLUMN categoria TYPE TEXT[] 
  USING CASE 
    WHEN categoria IS NULL THEN ARRAY[]::TEXT[]
    ELSE ARRAY[categoria]
  END;

ALTER TABLE profissionais 
  ALTER COLUMN categoria SET DEFAULT ARRAY['cilios']::TEXT[];

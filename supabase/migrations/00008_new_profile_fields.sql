-- Migration 00008: Adicionar colunas localizacao, whatsapp e foto_capa_url na tabela profissionais

ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS localizacao text;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS foto_capa_url text;

-- Migration 00010: Adicionar coluna instagram na tabela profissionais

ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS instagram text;

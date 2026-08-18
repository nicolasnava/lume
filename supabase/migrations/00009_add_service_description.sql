-- Migration 00009: Adicionar coluna descricao na tabela servicos

ALTER TABLE servicos ADD COLUMN IF NOT EXISTS descricao text;

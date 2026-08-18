-- Migration 00015: Adicionar coluna slug_alterado_em na tabela profissionais para controle da trava de 30 dias

ALTER TABLE profissionais 
ADD COLUMN IF NOT EXISTS slug_alterado_em timestamptz;

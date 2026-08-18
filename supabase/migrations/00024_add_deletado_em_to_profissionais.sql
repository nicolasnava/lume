-- Migration 00024: Adiciona coluna deletado_em para suporte a Soft Delete na tabela profissionais

ALTER TABLE profissionais 
ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ DEFAULT NULL;

-- Índice para acelerar consultas filtradas por contas ativas/desativadas
CREATE INDEX IF NOT EXISTS idx_profissionais_deletado_em ON profissionais(deletado_em);

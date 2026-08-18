-- Migration 00004: Dados de pagamento e conclusão em agendamentos

ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'outro')),
  ADD COLUMN IF NOT EXISTS valor_cobrado NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS pago BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS observacao_pagamento TEXT;

-- Índice para acelerar consultas financeiras por profissional e status
CREATE INDEX IF NOT EXISTS idx_agendamentos_financeiro 
  ON agendamentos (profissional_id, status, pago);

-- Migration 00012: Criar tabela agendamento_servicos para suporte a combos/múltiplos serviços

CREATE TABLE IF NOT EXISTS agendamento_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos (id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos (id) ON DELETE SET NULL,
  preco_no_momento NUMERIC(10,2) NOT NULL,
  duracao_no_momento_minutos INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agendamento_servicos_agendamento_id ON agendamento_servicos (agendamento_id);
CREATE INDEX IF NOT EXISTS idx_agendamento_servicos_servico_id ON agendamento_servicos (servico_id);

-- Politicas de RLS para a tabela agendamento_servicos
ALTER TABLE agendamento_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica de agendamento_servicos"
  ON agendamento_servicos FOR SELECT
  USING (true);

CREATE POLICY "Insercao publica de agendamento_servicos"
  ON agendamento_servicos FOR INSERT
  WITH CHECK (true);

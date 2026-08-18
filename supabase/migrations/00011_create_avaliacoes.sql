-- Migration 00011: Criar tabela avaliacoes para avaliações de agendamentos concluídos

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID UNIQUE NOT NULL REFERENCES agendamentos (id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais (id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional_id ON avaliacoes (profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_agendamento_id ON avaliacoes (agendamento_id);

-- Politicas de RLS para a tabela avaliacoes
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica de avaliacoes"
  ON avaliacoes FOR SELECT
  USING (true);

CREATE POLICY "Insercao publica de avaliacoes"
  ON avaliacoes FOR INSERT
  WITH CHECK (true);

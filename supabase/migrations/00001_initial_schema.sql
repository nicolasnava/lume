-- Lumê Initial Database Schema Migration
-- Enable btree_gist extension for exclusion constraints on time ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Profissionais
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  bio TEXT,
  foto_url TEXT,
  categoria TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cor_primaria TEXT NOT NULL DEFAULT '#B8A9D9',
  cor_secundaria TEXT NOT NULL DEFAULT '#FAF7F5',
  google_calendar_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on slug for fast public landing page lookups
CREATE INDEX IF NOT EXISTS idx_profissionais_slug ON profissionais (slug);

-- 2. Serviços
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais (id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  foto_url TEXT,
  intervalo_manutencao_dias INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicos_profissional_id ON servicos (profissional_id);

-- 3. Disponibilidade
CREATE TABLE IF NOT EXISTS disponibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais (id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disponibilidade_profissional_id ON disponibilidade (profissional_id);

-- 4. Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais (id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_profissional_id ON clientes (profissional_id);

-- 5. Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais (id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos (id) ON DELETE SET NULL,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmado', 'cancelado', 'concluido', 'no_show')) DEFAULT 'confirmado',
  google_event_id TEXT,
  lembrete_confirmacao_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  lembrete_manutencao_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_data_hora_valid Check (data_hora_fim > data_hora_inicio),
  -- Exclusion constraint / GIST index preventing overlapping appointments for the same professional
  CONSTRAINT no_overlapping_agendamentos EXCLUDE USING gist (
    profissional_id WITH =,
    tstzrange(data_hora_inicio, data_hora_fim) WITH &&
  ) WHERE (status != 'cancelado')
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_id ON agendamentos (profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON agendamentos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_inicio ON agendamentos (data_hora_inicio);

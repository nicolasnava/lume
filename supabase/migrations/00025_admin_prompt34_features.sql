-- Migration 00025: Suporte às funcionalidades do Prompt 34 (Feedbacks, Logins, Avisos, NPS e Novidades)

-- 1. Tabela de Feedbacks das Profissionais
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('sugestao', 'bug', 'elogio', 'outro')),
  mensagem TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'resolvido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Registros de Logins (Login Logs)
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_logs_prof_created ON login_logs(profissional_id, created_at DESC);

-- 3. Tabela de Avisos da Plataforma
CREATE TABLE IF NOT EXISTS avisos_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  tipo VARCHAR(30) NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'alerta', 'manutencao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Respostas NPS
CREATE TABLE IF NOT EXISTS nps_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  nota INT2 NOT NULL CHECK (nota >= 0 AND nota <= 10),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Novidades / Changelog
CREATE TABLE IF NOT EXISTS novidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

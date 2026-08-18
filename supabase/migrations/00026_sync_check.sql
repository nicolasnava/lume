-- Migration 00026: Script único e idempotente de auditoria e sincronização completa do banco Lumê
-- Este script pode ser executado com total segurança no SQL Editor do Supabase quantas vezes for necessário.
-- Qualquer elemento existente é ignorado silenciosamente e qualquer tabela, coluna, índice ou política faltante é criada.

-- ============================================================================
-- 1. EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- 2. TABELAS E ESTRUTURAS PRINCIPAIS
-- ============================================================================

-- 2.1 Profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  bio TEXT,
  foto_url TEXT,
  categoria TEXT[] NOT NULL DEFAULT ARRAY['cilios']::TEXT[],
  slug TEXT UNIQUE NOT NULL,
  cor_primaria TEXT NOT NULL DEFAULT '#B8A9D9',
  cor_secundaria TEXT NOT NULL DEFAULT '#FAF7F5',
  google_calendar_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir colunas adicionadas ao longo da evolução do projeto em 'profissionais'
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS localizacao TEXT;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS foto_capa_url TEXT;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS formas_pagamento_aceitas TEXT[] DEFAULT ARRAY['pix', 'dinheiro', 'cartao'];
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS slug_alterado_em TIMESTAMPTZ;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS tagline TEXT NULL;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS janela_agendamento_dias INTEGER DEFAULT 90 NOT NULL;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS status_conta TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS notas_internas TEXT;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS plano_tipo TEXT NOT NULL DEFAULT 'mensal';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS valor_mensalidade NUMERIC(10,2) NOT NULL DEFAULT 69.90;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days');
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS proximo_vencimento TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days');
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ DEFAULT NULL;

-- Atualizar/Garantir a constraint de status_conta em 'profissionais'
ALTER TABLE public.profissionais DROP CONSTRAINT IF EXISTS profissionais_status_conta_check;
ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_status_conta_check 
  CHECK (status_conta IN ('trial', 'ativa', 'atrasada', 'suspensa', 'cortesia', 'cancelada'));

-- Atualizar/Garantir a constraint de plano_tipo em 'profissionais'
ALTER TABLE public.profissionais DROP CONSTRAINT IF EXISTS profissionais_plano_tipo_check;
ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_plano_tipo_check 
  CHECK (plano_tipo IN ('mensal', 'anual', 'cortesia'));

-- 2.2 Serviços
CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais (id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  foto_url TEXT,
  intervalo_manutencao_dias INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir colunas adicionais na tabela 'servicos'
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- 2.3 Disponibilidade Semanal
CREATE TABLE IF NOT EXISTS public.disponibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais (id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais (id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais (id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes (id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos (id) ON DELETE SET NULL,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmado', 'cancelado', 'concluido', 'no_show')) DEFAULT 'confirmado',
  google_event_id TEXT,
  lembrete_confirmacao_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  lembrete_manutencao_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir colunas financeiras e de pagamento na tabela 'agendamentos'
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS valor_cobrado NUMERIC(10, 2);
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS pago BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS observacao_pagamento TEXT;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS forma_pagamento_preferida TEXT;

-- 2.6 Avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID UNIQUE NOT NULL REFERENCES public.agendamentos (id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.profissionais (id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Agendamento Serviços (Combos)
CREATE TABLE IF NOT EXISTS public.agendamento_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos (id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos (id) ON DELETE SET NULL,
  preco_no_momento NUMERIC(10,2) NOT NULL,
  duracao_no_momento_minutos INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Slugs Antigos (Redirecionamento)
CREATE TABLE IF NOT EXISTS public.slugs_antigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  slug_antigo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.9 Bloqueios de Disponibilidade
CREATE TABLE IF NOT EXISTS public.bloqueios_disponibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  motivo TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.bloqueios_disponibilidade ADD COLUMN IF NOT EXISTS data_fim DATE NULL;
ALTER TABLE public.bloqueios_disponibilidade ADD COLUMN IF NOT EXISTS hora_inicio TIME NULL;
ALTER TABLE public.bloqueios_disponibilidade ADD COLUMN IF NOT EXISTS hora_fim TIME NULL;

-- 2.10 Admin Users & Admin Logs
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 Módulo SaaS (Planos, Faturas e Cupons)
CREATE TABLE IF NOT EXISTS public.saas_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  intervalo TEXT NOT NULL CHECK (intervalo IN ('mensal', 'anual')),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.saas_planos (nome, slug, preco, intervalo, descricao)
VALUES 
  ('Plano Mensal Lumê', 'mensal', 69.90, 'mensal', 'Acesso completo com cobrança recorrente mensal'),
  ('Plano Anual Lumê', 'anual', 629.10, 'anual', 'Acesso completo com desconto anual')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.saas_faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  plano_slug TEXT NOT NULL DEFAULT 'mensal',
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'vencido', 'cancelado', 'reembolsado')),
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'cartao_credito', 'boleto', 'manual', 'cortesia')),
  data_vencimento TIMESTAMPTZ NOT NULL,
  data_pagamento TIMESTAMPTZ,
  link_pagamento TEXT,
  codigo_pix TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saas_cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  desconto_pct INTEGER CHECK (desconto_pct IS NULL OR (desconto_pct BETWEEN 0 AND 100)),
  desconto_valor NUMERIC(10,2),
  dias_trial_extra INTEGER DEFAULT 0,
  valido_ate TIMESTAMPTZ,
  usado_count INTEGER NOT NULL DEFAULT 0,
  limite_usos INTEGER,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.saas_cupons (codigo, desconto_pct, dias_trial_extra, limite_usos)
VALUES 
  ('LUMEBEAUTY', 20, 0, 100),
  ('MAISTRIAL', NULL, 7, 50)
ON CONFLICT (codigo) DO NOTHING;

-- 2.12 Funcionalidades do Prompt 34 (Feedbacks, Logins, Avisos, NPS e Novidades)
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('sugestao', 'bug', 'elogio', 'outro')),
  mensagem TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'resolvido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.avisos_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  tipo VARCHAR(30) NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'alerta', 'manutencao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nps_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  nota INT2 NOT NULL CHECK (nota >= 0 AND nota <= 10),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.novidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. ÍNDICES DE DESEMPENHO E CONSULTA
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profissionais_slug ON public.profissionais (slug);
CREATE INDEX IF NOT EXISTS idx_profissionais_status_conta ON public.profissionais (status_conta);
CREATE INDEX IF NOT EXISTS idx_profissionais_deletado_em ON public.profissionais (deletado_em);

CREATE INDEX IF NOT EXISTS idx_servicos_profissional_id ON public.servicos (profissional_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidade_profissional_id ON public.disponibilidade (profissional_id);
CREATE INDEX IF NOT EXISTS idx_clientes_profissional_id ON public.clientes (profissional_id);

CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_id ON public.agendamentos (profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON public.agendamentos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_inicio ON public.agendamentos (data_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_financeiro ON public.agendamentos (profissional_id, status, pago);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional_id ON public.avaliacoes (profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_agendamento_id ON public.avaliacoes (agendamento_id);

CREATE INDEX IF NOT EXISTS idx_agendamento_servicos_agendamento_id ON public.agendamento_servicos (agendamento_id);
CREATE INDEX IF NOT EXISTS idx_agendamento_servicos_servico_id ON public.agendamento_servicos (servico_id);

CREATE INDEX IF NOT EXISTS idx_slugs_antigos_slug_antigo ON public.slugs_antigos (slug_antigo);
CREATE INDEX IF NOT EXISTS idx_bloqueios_prof_data ON public.bloqueios_disponibilidade (profissional_id, data);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_profissional_id ON public.admin_logs (profissional_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saas_faturas_profissional ON public.saas_faturas (profissional_id);
CREATE INDEX IF NOT EXISTS idx_saas_faturas_status ON public.saas_faturas (status);
CREATE INDEX IF NOT EXISTS idx_saas_faturas_vencimento ON public.saas_faturas (data_vencimento DESC);

CREATE INDEX IF NOT EXISTS idx_login_logs_prof_created ON public.login_logs (profissional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_prof ON public.feedbacks (profissional_id);
CREATE INDEX IF NOT EXISTS idx_nps_respostas_prof ON public.nps_respostas (profissional_id);

-- ============================================================================
-- 4. FUNÇÕES E TRIGGERS DO SISTEMA
-- ============================================================================

-- Função Helper para verificação de Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
$$;

-- Trigger para Criação Automática do Perfil do Profissional
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_nome text;
  prof_slug text;
BEGIN
  raw_nome := COALESCE(new.raw_user_meta_data->>'nome', 'Profissional de Beleza');
  prof_slug := 'profissional-' || substring(new.id::text from 1 for 6);

  INSERT INTO public.profissionais (
    id,
    nome,
    categoria,
    slug,
    cor_primaria,
    cor_secundaria
  )
  VALUES (
    new.id,
    raw_nome,
    ARRAY['outro']::text[],
    prof_slug,
    '#B8A9D9',
    '#FAF7F5'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. BUCKETS DE STORAGE E POLÍTICAS RLS DE MEDIA
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissionais_fotos',
  'profissionais_fotos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'servicos',
  'servicos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Políticas de Storage para 'avatars'
DROP POLICY IF EXISTS "Avatares leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "Avatares insercao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Avatares edicao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Avatares delecao autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Leitura publica avatars" ON storage.objects;
DROP POLICY IF EXISTS "Escrita autenticada avatars" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao autenticada avatars" ON storage.objects;
DROP POLICY IF EXISTS "Delecao autenticada avatars" ON storage.objects;

CREATE POLICY "Leitura publica avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Escrita autenticada avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Atualizacao autenticada avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Delecao autenticada avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Políticas de Storage para 'servicos'
DROP POLICY IF EXISTS "Leitura publica servicos" ON storage.objects;
DROP POLICY IF EXISTS "Escrita autenticada servicos" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao autenticada servicos" ON storage.objects;
DROP POLICY IF EXISTS "Delecao autenticada servicos" ON storage.objects;

CREATE POLICY "Leitura publica servicos" ON storage.objects FOR SELECT USING (bucket_id = 'servicos');
CREATE POLICY "Escrita autenticada servicos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'servicos' AND auth.role() = 'authenticated');
CREATE POLICY "Atualizacao autenticada servicos" ON storage.objects FOR UPDATE USING (bucket_id = 'servicos' AND auth.role() = 'authenticated');
CREATE POLICY "Delecao autenticada servicos" ON storage.objects FOR DELETE USING (bucket_id = 'servicos' AND auth.role() = 'authenticated');

-- ============================================================================
-- 6. POLÍTICAS RLS NAS TABELAS DA APLICAÇÃO (IDEMPOTENTES)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamento_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slugs_antigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novidades ENABLE ROW LEVEL SECURITY;

-- 6.1 Profissionais Policies
DROP POLICY IF EXISTS "Profissionais leitura publica" ON public.profissionais;
DROP POLICY IF EXISTS "Profissionais insercao propria" ON public.profissionais;
DROP POLICY IF EXISTS "Profissionais edicao propria" ON public.profissionais;
DROP POLICY IF EXISTS "Profissionais exclusao propria" ON public.profissionais;
DROP POLICY IF EXISTS "Admins leitura total profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Admins edicao total profissionais" ON public.profissionais;

CREATE POLICY "Profissionais leitura publica" ON public.profissionais FOR SELECT USING (true);
CREATE POLICY "Profissionais insercao propria" ON public.profissionais FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profissionais edicao propria" ON public.profissionais FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profissionais exclusao propria" ON public.profissionais FOR DELETE USING (auth.uid() = id);
CREATE POLICY "Admins leitura total profissionais" ON public.profissionais FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins edicao total profissionais" ON public.profissionais FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.2 Serviços Policies
DROP POLICY IF EXISTS "Servicos leitura publica" ON public.servicos;
DROP POLICY IF EXISTS "Servicos criacao propria" ON public.servicos;
DROP POLICY IF EXISTS "Servicos edicao propria" ON public.servicos;
DROP POLICY IF EXISTS "Servicos exclusao propria" ON public.servicos;
DROP POLICY IF EXISTS "Admins leitura total servicos" ON public.servicos;

CREATE POLICY "Servicos leitura publica" ON public.servicos FOR SELECT USING (true);
CREATE POLICY "Servicos criacao propria" ON public.servicos FOR INSERT WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Servicos edicao propria" ON public.servicos FOR UPDATE USING (auth.uid() = profissional_id) WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Servicos exclusao propria" ON public.servicos FOR DELETE USING (auth.uid() = profissional_id);
CREATE POLICY "Admins leitura total servicos" ON public.servicos FOR SELECT USING (public.is_admin());

-- 6.3 Disponibilidade Policies
DROP POLICY IF EXISTS "Disponibilidade leitura publica" ON public.disponibilidade;
DROP POLICY IF EXISTS "Disponibilidade criacao propria" ON public.disponibilidade;
DROP POLICY IF EXISTS "Disponibilidade edicao propria" ON public.disponibilidade;
DROP POLICY IF EXISTS "Disponibilidade exclusao propria" ON public.disponibilidade;

CREATE POLICY "Disponibilidade leitura publica" ON public.disponibilidade FOR SELECT USING (true);
CREATE POLICY "Disponibilidade criacao propria" ON public.disponibilidade FOR INSERT WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Disponibilidade edicao propria" ON public.disponibilidade FOR UPDATE USING (auth.uid() = profissional_id) WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Disponibilidade exclusao propria" ON public.disponibilidade FOR DELETE USING (auth.uid() = profissional_id);

-- 6.4 Clientes Policies
DROP POLICY IF EXISTS "Clientes leitura profissional" ON public.clientes;
DROP POLICY IF EXISTS "Clientes insercao profissional" ON public.clientes;
DROP POLICY IF EXISTS "Clientes edicao profissional" ON public.clientes;
DROP POLICY IF EXISTS "Clientes exclusao profissional" ON public.clientes;
DROP POLICY IF EXISTS "Admins leitura total clientes" ON public.clientes;

CREATE POLICY "Clientes leitura profissional" ON public.clientes FOR SELECT USING (auth.uid() = profissional_id);
CREATE POLICY "Clientes insercao profissional" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Clientes edicao profissional" ON public.clientes FOR UPDATE USING (auth.uid() = profissional_id) WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Clientes exclusao profissional" ON public.clientes FOR DELETE USING (auth.uid() = profissional_id);
CREATE POLICY "Admins leitura total clientes" ON public.clientes FOR SELECT USING (public.is_admin());

-- 6.5 Agendamentos Policies
DROP POLICY IF EXISTS "Agendamentos leitura profissional" ON public.agendamentos;
DROP POLICY IF EXISTS "Agendamentos insercao publica" ON public.agendamentos;
DROP POLICY IF EXISTS "Agendamentos edicao profissional" ON public.agendamentos;
DROP POLICY IF EXISTS "Agendamentos exclusao profissional" ON public.agendamentos;
DROP POLICY IF EXISTS "Admins leitura total agendamentos" ON public.agendamentos;

CREATE POLICY "Agendamentos leitura profissional" ON public.agendamentos FOR SELECT USING (auth.uid() = profissional_id);
CREATE POLICY "Agendamentos insercao publica" ON public.agendamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Agendamentos edicao profissional" ON public.agendamentos FOR UPDATE USING (auth.uid() = profissional_id) WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Agendamentos exclusao profissional" ON public.agendamentos FOR DELETE USING (auth.uid() = profissional_id);
CREATE POLICY "Admins leitura total agendamentos" ON public.agendamentos FOR SELECT USING (public.is_admin());

-- 6.6 Avaliações Policies
DROP POLICY IF EXISTS "Leitura publica de avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Insercao publica de avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Admins leitura total avaliacoes" ON public.avaliacoes;

CREATE POLICY "Leitura publica de avaliacoes" ON public.avaliacoes FOR SELECT USING (true);
CREATE POLICY "Insercao publica de avaliacoes" ON public.avaliacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins leitura total avaliacoes" ON public.avaliacoes FOR SELECT USING (public.is_admin());

-- 6.7 Agendamento Serviços Policies
DROP POLICY IF EXISTS "Leitura publica de agendamento_servicos" ON public.agendamento_servicos;
DROP POLICY IF EXISTS "Insercao publica de agendamento_servicos" ON public.agendamento_servicos;

CREATE POLICY "Leitura publica de agendamento_servicos" ON public.agendamento_servicos FOR SELECT USING (true);
CREATE POLICY "Insercao publica de agendamento_servicos" ON public.agendamento_servicos FOR INSERT WITH CHECK (true);

-- 6.8 Bloqueios Disponibilidade Policies
DROP POLICY IF EXISTS "Profissional pode ler seus bloqueios" ON public.bloqueios_disponibilidade;
DROP POLICY IF EXISTS "Profissional pode criar bloqueios" ON public.bloqueios_disponibilidade;
DROP POLICY IF EXISTS "Profissional pode deletar bloqueios" ON public.bloqueios_disponibilidade;
DROP POLICY IF EXISTS "Leitura pública de bloqueios para agendamento" ON public.bloqueios_disponibilidade;

CREATE POLICY "Profissional pode ler seus bloqueios" ON public.bloqueios_disponibilidade FOR SELECT USING (auth.uid() = profissional_id);
CREATE POLICY "Profissional pode criar bloqueios" ON public.bloqueios_disponibilidade FOR INSERT WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Profissional pode deletar bloqueios" ON public.bloqueios_disponibilidade FOR DELETE USING (auth.uid() = profissional_id);
CREATE POLICY "Leitura pública de bloqueios para agendamento" ON public.bloqueios_disponibilidade FOR SELECT USING (true);

-- 6.9 Admin Users & Admin Logs Policies
DROP POLICY IF EXISTS "Admins podem visualizar admin_users" ON public.admin_users;
CREATE POLICY "Admins podem visualizar admin_users" ON public.admin_users FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem visualizar admin_logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins podem inserir admin_logs" ON public.admin_logs;
CREATE POLICY "Admins podem visualizar admin_logs" ON public.admin_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins podem inserir admin_logs" ON public.admin_logs FOR INSERT WITH CHECK (public.is_admin());

-- 6.10 SaaS Tables Policies
DROP POLICY IF EXISTS "Admins total saas_planos" ON public.saas_planos;
DROP POLICY IF EXISTS "Todos leitura saas_planos ativos" ON public.saas_planos;
CREATE POLICY "Admins total saas_planos" ON public.saas_planos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Todos leitura saas_planos ativos" ON public.saas_planos FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "Admins total saas_faturas" ON public.saas_faturas;
CREATE POLICY "Admins total saas_faturas" ON public.saas_faturas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins total saas_cupons" ON public.saas_cupons;
CREATE POLICY "Admins total saas_cupons" ON public.saas_cupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.11 Prompt 34 Features Policies (Feedbacks, Login Logs, Avisos, NPS, Novidades)
DROP POLICY IF EXISTS "Inserção de feedback profissional" ON public.feedbacks;
DROP POLICY IF EXISTS "Admins total feedbacks" ON public.feedbacks;
CREATE POLICY "Inserção de feedback profissional" ON public.feedbacks FOR INSERT WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Admins total feedbacks" ON public.feedbacks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Inserção de login log profissional" ON public.login_logs;
DROP POLICY IF EXISTS "Admins total login_logs" ON public.login_logs;
CREATE POLICY "Inserção de login log profissional" ON public.login_logs FOR INSERT WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Admins total login_logs" ON public.login_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Leitura publica de avisos ativos" ON public.avisos_plataforma;
DROP POLICY IF EXISTS "Admins total avisos_plataforma" ON public.avisos_plataforma;
CREATE POLICY "Leitura publica de avisos ativos" ON public.avisos_plataforma FOR SELECT USING (ativo = true);
CREATE POLICY "Admins total avisos_plataforma" ON public.avisos_plataforma FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Inserção de NPS resposta profissional" ON public.nps_respostas;
DROP POLICY IF EXISTS "Admins total nps_respostas" ON public.nps_respostas;
CREATE POLICY "Inserção de NPS resposta profissional" ON public.nps_respostas FOR INSERT WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Admins total nps_respostas" ON public.nps_respostas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Leitura publica de novidades" ON public.novidades;
DROP POLICY IF EXISTS "Admins total novidades" ON public.novidades;
CREATE POLICY "Leitura publica de novidades" ON public.novidades FOR SELECT USING (true);
CREATE POLICY "Admins total novidades" ON public.novidades FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- FIM DA MIGRATION 00026_sync_check.sql
-- ============================================================================

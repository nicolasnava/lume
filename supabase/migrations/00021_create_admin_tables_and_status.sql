-- Migration 00021: Painel Admin - Tabelas admin_users, admin_logs, status_conta e RLS Policies

-- 1. Criar tabela admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adicionar colunas status_conta e notas_internas na tabela profissionais
ALTER TABLE public.profissionais 
  ADD COLUMN IF NOT EXISTS status_conta TEXT NOT NULL CHECK (status_conta IN ('trial', 'ativa', 'suspensa')) DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- 3. Criar tabela admin_logs para auditoria de ações do admin
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para otimização de consultas administrativas
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_profissional_id ON public.admin_logs(profissional_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profissionais_status_conta ON public.profissionais(status_conta);

-- 4. Função helper para verificar se o auth.uid() atual é admin
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

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para admin_users
DROP POLICY IF EXISTS "Admins podem visualizar admin_users" ON public.admin_users;
CREATE POLICY "Admins podem visualizar admin_users"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

-- 7. Políticas RLS para admin_logs
DROP POLICY IF EXISTS "Admins podem visualizar admin_logs" ON public.admin_logs;
CREATE POLICY "Admins podem visualizar admin_logs"
  ON public.admin_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem inserir admin_logs" ON public.admin_logs;
CREATE POLICY "Admins podem inserir admin_logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- 8. Adicionar permissão de SELECT/UPDATE para admins nas tabelas existentes
-- Profissionais
DROP POLICY IF EXISTS "Admins leitura total profissionais" ON public.profissionais;
CREATE POLICY "Admins leitura total profissionais"
  ON public.profissionais FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins edicao total profissionais" ON public.profissionais;
CREATE POLICY "Admins edicao total profissionais"
  ON public.profissionais FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Agendamentos
DROP POLICY IF EXISTS "Admins leitura total agendamentos" ON public.agendamentos;
CREATE POLICY "Admins leitura total agendamentos"
  ON public.agendamentos FOR SELECT
  USING (public.is_admin());

-- Clientes
DROP POLICY IF EXISTS "Admins leitura total clientes" ON public.clientes;
CREATE POLICY "Admins leitura total clientes"
  ON public.clientes FOR SELECT
  USING (public.is_admin());

-- Servicos
DROP POLICY IF EXISTS "Admins leitura total servicos" ON public.servicos;
CREATE POLICY "Admins leitura total servicos"
  ON public.servicos FOR SELECT
  USING (public.is_admin());

-- Avaliacoes
DROP POLICY IF EXISTS "Admins leitura total avaliacoes" ON public.avaliacoes;
CREATE POLICY "Admins leitura total avaliacoes"
  ON public.avaliacoes FOR SELECT
  USING (public.is_admin());

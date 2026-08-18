-- Migration 00019: Cria a tabela bloqueios_disponibilidade para bloqueios de datas específicas (exceções pontuais)
CREATE TABLE IF NOT EXISTS public.bloqueios_disponibilidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data date NOT NULL,
  motivo text NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_profissional_data UNIQUE (profissional_id, data)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.bloqueios_disponibilidade ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Profissional pode visualizar seus próprios bloqueios
CREATE POLICY "Profissional pode ler seus bloqueios"
  ON public.bloqueios_disponibilidade
  FOR SELECT
  USING (auth.uid() = profissional_id);

-- Política de RLS: Profissional pode inserir seus bloqueios
CREATE POLICY "Profissional pode criar bloqueios"
  ON public.bloqueios_disponibilidade
  FOR INSERT
  WITH CHECK (auth.uid() = profissional_id);

-- Política de RLS: Profissional pode deletar seus bloqueios
CREATE POLICY "Profissional pode deletar bloqueios"
  ON public.bloqueios_disponibilidade
  FOR DELETE
  USING (auth.uid() = profissional_id);

-- Política de leitura pública para o wizard de agendamentos
CREATE POLICY "Leitura pública de bloqueios para agendamento"
  ON public.bloqueios_disponibilidade
  FOR SELECT
  USING (true);

-- Índices para otimizar busca por profissional e data
CREATE INDEX IF NOT EXISTS idx_bloqueios_prof_data
  ON public.bloqueios_disponibilidade (profissional_id, data);

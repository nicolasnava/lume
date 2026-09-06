-- Migration 00039: Relatórios & Metas, Cupons de Desconto e Conta Demo (Prompt 62)

-- 1. Tabela de Metas Mensais da Profissional
CREATE TABLE IF NOT EXISTS public.metas_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL, -- Primeiro dia do mês (ex: 2026-09-01)
  tipo_meta TEXT NOT NULL DEFAULT 'faturamento' CHECK (tipo_meta IN ('faturamento', 'atendimentos', 'novos_clientes', 'ocupacao')),
  valor_meta NUMERIC NOT NULL CHECK (valor_meta >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_meta_profissional_mes_tipo UNIQUE (profissional_id, mes_referencia, tipo_meta)
);

CREATE INDEX IF NOT EXISTS idx_metas_mensais_prof_mes ON public.metas_mensais(profissional_id, mes_referencia);

-- 2. Tabela de Relatórios Mensais Fechados (Dados Históricos Congelados)
CREATE TABLE IF NOT EXISTS public.relatorios_mensais_fechados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  faturamento_total NUMERIC NOT NULL DEFAULT 0,
  atendimentos_concluidos INT NOT NULL DEFAULT 0,
  servico_mais_vendido_nome TEXT,
  meta_valor NUMERIC,
  meta_batida BOOLEAN,
  comparativo_mes_anterior_pct NUMERIC,
  destaque_narrativo TEXT,
  congelado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_relatorio_fechado_prof_mes UNIQUE (profissional_id, mes_referencia)
);

CREATE INDEX IF NOT EXISTS idx_relatorios_fechados_prof_mes ON public.relatorios_mensais_fechados(profissional_id, mes_referencia);

-- 3. Tabela de Cupons Próprios da Profissional
CREATE TABLE IF NOT EXISTS public.cupons_profissional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('percentual', 'valor_fixo')),
  valor NUMERIC NOT NULL CHECK (valor > 0),
  segmento_alvo TEXT NOT NULL DEFAULT 'todos' CHECK (segmento_alvo IN ('todos', 'nunca_agendou', 'inativa')),
  limite_uso_total INT CHECK (limite_uso_total IS NULL OR limite_uso_total > 0),
  limite_uso_por_cliente INT NOT NULL DEFAULT 1 CHECK (limite_uso_por_cliente > 0),
  valido_ate TIMESTAMPTZ,
  usos_atuais INT NOT NULL DEFAULT 0 CHECK (usos_atuais >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cupom_prof_codigo UNIQUE (profissional_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_cupons_prof_codigo ON public.cupons_profissional(profissional_id, codigo);

-- 4. Tabela de Rastreamento de Usos dos Cupons
CREATE TABLE IF NOT EXISTS public.cupom_usos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cupom_id UUID NOT NULL REFERENCES public.cupons_profissional(id) ON DELETE CASCADE,
  cliente_telefone TEXT NOT NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupom_usos_cupom_tel ON public.cupom_usos(cupom_id, cliente_telefone);

-- 5. Coluna de Conta Demo Permanente para Vendas
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 6. Habilitação de RLS e Políticas de Segurança
ALTER TABLE public.metas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_mensais_fechados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons_profissional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupom_usos ENABLE ROW LEVEL SECURITY;

-- Políticas para metas_mensais
CREATE POLICY "Profissionais podem visualizar suas metas"
  ON public.metas_mensais FOR SELECT
  TO authenticated
  USING (profissional_id = auth.uid());

CREATE POLICY "Profissionais podem gerenciar suas metas"
  ON public.metas_mensais FOR ALL
  TO authenticated
  USING (profissional_id = auth.uid())
  WITH CHECK (profissional_id = auth.uid());

-- Políticas para relatorios_mensais_fechados
CREATE POLICY "Profissionais podem visualizar seus relatórios fechados"
  ON public.relatorios_mensais_fechados FOR SELECT
  TO authenticated
  USING (profissional_id = auth.uid());

CREATE POLICY "Profissionais podem gerenciar seus relatórios fechados"
  ON public.relatorios_mensais_fechados FOR ALL
  TO authenticated
  USING (profissional_id = auth.uid())
  WITH CHECK (profissional_id = auth.uid());

-- Políticas para cupons_profissional
CREATE POLICY "Profissionais gerenciam seus cupons"
  ON public.cupons_profissional FOR ALL
  TO authenticated
  USING (profissional_id = auth.uid())
  WITH CHECK (profissional_id = auth.uid());

CREATE POLICY "Leitura pública de cupons ativos para agendamento"
  ON public.cupons_profissional FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- Políticas para cupom_usos
CREATE POLICY "Profissionais visualizam usos de seus cupons"
  ON public.cupom_usos FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cupons_profissional cp
    WHERE cp.id = cupom_usos.cupom_id AND cp.profissional_id = auth.uid()
  ));

CREATE POLICY "Permitir inserção de uso de cupom no agendamento"
  ON public.cupom_usos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

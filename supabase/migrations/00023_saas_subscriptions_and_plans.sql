-- Migration 00023: Módulo Financeiro e Assinaturas SaaS do Lumê

-- 1. Atualizar constraint do status_conta na tabela profissionais para suportar novos status do SaaS
ALTER TABLE public.profissionais DROP CONSTRAINT IF EXISTS profissionais_status_conta_check;

ALTER TABLE public.profissionais 
  ADD CONSTRAINT profissionais_status_conta_check 
  CHECK (status_conta IN ('trial', 'ativa', 'atrasada', 'suspensa', 'cortesia', 'cancelada'));

-- 2. Adicionar novas colunas de assinatura SaaS na tabela profissionais
ALTER TABLE public.profissionais 
  ADD COLUMN IF NOT EXISTS plano_tipo TEXT NOT NULL DEFAULT 'mensal' CHECK (plano_tipo IN ('mensal', 'anual', 'cortesia')),
  ADD COLUMN IF NOT EXISTS valor_mensalidade NUMERIC(10,2) NOT NULL DEFAULT 39.90,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS proximo_vencimento TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days');

-- 3. Criar tabela saas_planos
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

-- Inserir planos padrão do Lumê se não existirem
INSERT INTO public.saas_planos (nome, slug, preco, intervalo, descricao)
VALUES 
  ('Plano Mensal Lumê', 'mensal', 39.90, 'mensal', 'Acesso completo com cobrança recorrente mensal'),
  ('Plano Anual Lumê', 'anual', 359.00, 'anual', 'Acesso completo com desconto especial de 25% no ano')
ON CONFLICT (slug) DO NOTHING;

-- 4. Criar tabela saas_faturas (Cobranças do SaaS)
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

-- Índices de consulta para faturas
CREATE INDEX IF NOT EXISTS idx_saas_faturas_profissional ON public.saas_faturas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_saas_faturas_status ON public.saas_faturas(status);
CREATE INDEX IF NOT EXISTS idx_saas_faturas_vencimento ON public.saas_faturas(data_vencimento DESC);

-- 5. Criar tabela saas_cupons (Cupons de desconto)
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

-- Inserir cupom demonstrativo inicial
INSERT INTO public.saas_cupons (codigo, desconto_pct, dias_trial_extra, limite_usos)
VALUES 
  ('LUMEBEAUTY', 20, 0, 100),
  ('MAISTRIAL', NULL, 7, 50)
ON CONFLICT (codigo) DO NOTHING;

-- 6. Habilitar Row Level Security (RLS) nas novas tabelas
ALTER TABLE public.saas_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_cupons ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para saas_planos
DROP POLICY IF EXISTS "Admins total saas_planos" ON public.saas_planos;
CREATE POLICY "Admins total saas_planos"
  ON public.saas_planos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Todos leitura saas_planos ativos" ON public.saas_planos;
CREATE POLICY "Todos leitura saas_planos ativos"
  ON public.saas_planos FOR SELECT
  USING (ativo = true);

-- 8. Políticas RLS para saas_faturas
DROP POLICY IF EXISTS "Admins total saas_faturas" ON public.saas_faturas;
CREATE POLICY "Admins total saas_faturas"
  ON public.saas_faturas FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Políticas RLS para saas_cupons
DROP POLICY IF EXISTS "Admins total saas_cupons" ON public.saas_cupons;
CREATE POLICY "Admins total saas_cupons"
  ON public.saas_cupons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

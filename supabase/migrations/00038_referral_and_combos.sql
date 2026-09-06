-- Migration 00038: Programa de Indicação e Combos de Serviços (Prompt 61)

-- ==============================================================================
-- 1. PROGRAMA DE INDICAÇÃO EM PROFISSIONAIS
-- ==============================================================================

-- 1.1 Adicionar colunas codigo_indicacao e indicado_por
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS codigo_indicacao TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS indicado_por UUID REFERENCES public.profissionais(id) ON DELETE SET NULL;

-- 1.2 Criar índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_profissionais_codigo_indicacao 
  ON public.profissionais(codigo_indicacao);

CREATE INDEX IF NOT EXISTS idx_profissionais_indicado_por 
  ON public.profissionais(indicado_por);

-- 1.3 Backfill: Gerar codigo_indicacao para contas existentes que não possuam código
DO $$
DECLARE
  prof RECORD;
  base_code TEXT;
  candidate_code TEXT;
  counter INT;
BEGIN
  FOR prof IN SELECT id, slug, nome FROM public.profissionais WHERE codigo_indicacao IS NULL LOOP
    -- Gerar base a partir do slug ou nome (até 6 chars alfanuméricos em maiúsculas)
    base_code := UPPER(REGEXP_REPLACE(COALESCE(prof.slug, prof.nome, 'LUME'), '[^a-zA-Z0-9]', '', 'g'));
    IF LENGTH(base_code) < 3 THEN
      base_code := 'LUME';
    END IF;
    base_code := SUBSTRING(base_code, 1, 6);

    counter := 100 + FLOOR(RANDOM() * 899)::INT;
    candidate_code := base_code || counter::TEXT;

    -- Garantir unicidade
    WHILE EXISTS (SELECT 1 FROM public.profissionais WHERE codigo_indicacao = candidate_code) LOOP
      counter := 100 + FLOOR(RANDOM() * 899)::INT;
      candidate_code := base_code || counter::TEXT;
    END LOOP;

    UPDATE public.profissionais
    SET codigo_indicacao = candidate_code
    WHERE id = prof.id;
  END LOOP;
END $$;

-- 1.4 Função para gerar automaticamente codigo_indicacao se inserido nulo
CREATE OR REPLACE FUNCTION public.fn_gerar_codigo_indicacao()
RETURNS TRIGGER AS $$
DECLARE
  base_code TEXT;
  candidate_code TEXT;
  counter INT;
BEGIN
  IF NEW.codigo_indicacao IS NULL OR TRIM(NEW.codigo_indicacao) = '' THEN
    base_code := UPPER(REGEXP_REPLACE(COALESCE(NEW.slug, NEW.nome, 'LUME'), '[^a-zA-Z0-9]', '', 'g'));
    IF LENGTH(base_code) < 3 THEN
      base_code := 'LUME';
    END IF;
    base_code := SUBSTRING(base_code, 1, 6);

    counter := 100 + FLOOR(RANDOM() * 899)::INT;
    candidate_code := base_code || counter::TEXT;

    WHILE EXISTS (SELECT 1 FROM public.profissionais WHERE codigo_indicacao = candidate_code AND id <> NEW.id) LOOP
      counter := 100 + FLOOR(RANDOM() * 899)::INT;
      candidate_code := base_code || counter::TEXT;
    END LOOP;

    NEW.codigo_indicacao := candidate_code;
  ELSE
    NEW.codigo_indicacao := UPPER(TRIM(NEW.codigo_indicacao));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gerar_codigo_indicacao ON public.profissionais;
CREATE TRIGGER trg_gerar_codigo_indicacao
  BEFORE INSERT ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_gerar_codigo_indicacao();

-- 1.5 Função reutilizável em SQL para recalcular o desconto da indicadora
CREATE OR REPLACE FUNCTION public.fn_recalcular_desconto_indicacao(p_indicador_id UUID)
RETURNS VOID AS $$
DECLARE
  v_ativas_count INT;
  v_desconto_pct NUMERIC;
  v_valor_base NUMERIC := 69.90;
  v_novo_valor NUMERIC;
BEGIN
  IF p_indicador_id IS NULL THEN
    RETURN;
  END IF;

  -- Contar contas ativas indicadas por ela
  SELECT COUNT(*)
  INTO v_ativas_count
  FROM public.profissionais
  WHERE indicado_por = p_indicador_id
    AND status_conta = 'ativa'
    AND deletado_em IS NULL;

  -- Desconto = min(quantidade_ativas * 10%, 30%)
  v_desconto_pct := LEAST(v_ativas_count * 10, 30);

  -- Novo valor com desconto arredondado em 2 casas
  v_novo_valor := ROUND(v_valor_base * (1.0 - (v_desconto_pct / 100.0)), 2);

  UPDATE public.profissionais
  SET valor_mensalidade = v_novo_valor
  WHERE id = p_indicador_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.6 Trigger para recalcular desconto automaticamente quando status_conta mudar
CREATE OR REPLACE FUNCTION public.fn_trg_atualizar_desconto_indicacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status_conta mudou ou o indicado_por mudou
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.status_conta IS DISTINCT FROM NEW.status_conta) OR (OLD.indicado_por IS DISTINCT FROM NEW.indicado_por) THEN
      IF OLD.indicado_por IS NOT NULL THEN
        PERFORM public.fn_recalcular_desconto_indicacao(OLD.indicado_por);
      END IF;
      IF NEW.indicado_por IS NOT NULL THEN
        PERFORM public.fn_recalcular_desconto_indicacao(NEW.indicado_por);
      END IF;
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    IF NEW.indicado_por IS NOT NULL THEN
      PERFORM public.fn_recalcular_desconto_indicacao(NEW.indicado_por);
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.indicado_por IS NOT NULL THEN
      PERFORM public.fn_recalcular_desconto_indicacao(OLD.indicado_por);
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_atualizar_desconto_indicacao ON public.profissionais;
CREATE TRIGGER trg_atualizar_desconto_indicacao
  AFTER INSERT OR UPDATE OF status_conta, indicado_por OR DELETE ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trg_atualizar_desconto_indicacao();

-- ==============================================================================
-- 2. COMBOS DE SERVIÇOS
-- ==============================================================================

-- 2.1 Criar tabela combos
CREATE TABLE IF NOT EXISTS public.combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_combo NUMERIC(10,2) NOT NULL,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combos_profissional_id ON public.combos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_combos_ativo ON public.combos(ativo);

-- 2.2 Criar tabela combo_servicos
CREATE TABLE IF NOT EXISTS public.combo_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_combo_servico UNIQUE (combo_id, servico_id)
);

CREATE INDEX IF NOT EXISTS idx_combo_servicos_combo_id ON public.combo_servicos(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_servicos_servico_id ON public.combo_servicos(servico_id);

-- 2.3 Adicionar coluna combo_id opcional em agendamentos
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS combo_id UUID REFERENCES public.combos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agendamentos_combo_id ON public.agendamentos(combo_id);

-- 2.4 Habilitar RLS em combos e combo_servicos
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_servicos ENABLE ROW LEVEL SECURITY;

-- 2.5 Políticas RLS para combos
DROP POLICY IF EXISTS "Qualquer um pode visualizar combos ativos" ON public.combos;
CREATE POLICY "Qualquer um pode visualizar combos ativos"
  ON public.combos
  FOR SELECT
  USING (ativo = true OR profissional_id = auth.uid());

DROP POLICY IF EXISTS "Profissional gerencia seus próprios combos" ON public.combos;
CREATE POLICY "Profissional gerencia seus próprios combos"
  ON public.combos
  FOR ALL
  TO authenticated
  USING (profissional_id = auth.uid())
  WITH CHECK (profissional_id = auth.uid());

-- 2.6 Políticas RLS para combo_servicos
DROP POLICY IF EXISTS "Qualquer um pode visualizar itens de combos visíveis" ON public.combo_servicos;
CREATE POLICY "Qualquer um pode visualizar itens de combos visíveis"
  ON public.combo_servicos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.combos c 
      WHERE c.id = combo_servicos.combo_id 
        AND (c.ativo = true OR c.profissional_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Profissional gerencia serviços dos seus combos" ON public.combo_servicos;
CREATE POLICY "Profissional gerencia serviços dos seus combos"
  ON public.combo_servicos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.combos c 
      WHERE c.id = combo_servicos.combo_id 
        AND c.profissional_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.combos c 
      WHERE c.id = combo_servicos.combo_id 
        AND c.profissional_id = auth.uid()
    )
  );

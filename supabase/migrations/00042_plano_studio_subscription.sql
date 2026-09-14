-- Migration 00042: Cadastro do Plano Studio e Atualização de Constraints de Assinatura
-- Plano Solo: R$ 69,00/mês
-- Plano Studio: R$ 169,00/mês (Até 6 profissionais inclusas, +R$ 29,00/mês por profissional extra)

-- 1. Atualizar constraint de plano_tipo e valor padrão da mensalidade na tabela public.profissionais
ALTER TABLE public.profissionais DROP CONSTRAINT IF EXISTS profissionais_plano_tipo_check;
ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_plano_tipo_check 
  CHECK (plano_tipo IN ('mensal', 'anual', 'cortesia', 'studio'));

ALTER TABLE public.profissionais ALTER COLUMN valor_mensalidade SET DEFAULT 69.00;

-- Atualizar profissionais que ainda possuíam o valor antigo de 39.90
UPDATE public.profissionais SET valor_mensalidade = 69.00 WHERE valor_mensalidade = 39.90 OR valor_mensalidade = 39.9;

-- Atualizar cupons legados que estavam com valido_de nulo
UPDATE public.cupons_profissional SET valido_de = created_at WHERE valido_de IS NULL;

-- 2. Garantir cadastro dos planos na tabela saas_planos
INSERT INTO public.saas_planos (nome, slug, preco, intervalo, descricao, ativo)
VALUES
  (
    'Plano Solo Lumê',
    'mensal',
    69.00,
    'mensal',
    'Acesso completo com cobrança recorrente mensal para profissional autônoma',
    true
  ),
  (
    'Plano Studio Lumê',
    'studio',
    169.00,
    'mensal',
    'Gestão completa de studio para até 6 profissionais (+R$ 29/mês por profissional extra), comissões automáticas, agenda da recepção e vitrine coletiva',
    true
  )
ON CONFLICT (slug) DO UPDATE
SET preco = EXCLUDED.preco,
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    ativo = EXCLUDED.ativo;

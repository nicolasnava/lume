-- Migration 00043: Criação da Comanda Digital / Produtos para Profissionais
-- Permite que profissionais cadastrem produtos de revenda, home care, cosméticos ou itens de consumo da comanda

-- 1. Criar tabela comanda_produtos
CREATE TABLE IF NOT EXISTS public.comanda_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_comanda_produtos_profissional_id ON public.comanda_produtos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_comanda_produtos_ativo ON public.comanda_produtos(ativo);

-- 3. Habilitar RLS
ALTER TABLE public.comanda_produtos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "Qualquer um pode visualizar produtos ativos da comanda" ON public.comanda_produtos;
CREATE POLICY "Qualquer um pode visualizar produtos ativos da comanda"
  ON public.comanda_produtos
  FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "Profissionais podem gerenciar seus proprios produtos de comanda" ON public.comanda_produtos;
CREATE POLICY "Profissionais podem gerenciar seus proprios produtos de comanda"
  ON public.comanda_produtos
  FOR ALL
  USING (auth.uid() = profissional_id)
  WITH CHECK (auth.uid() = profissional_id);

-- 5. Comentários informativos
COMMENT ON TABLE public.comanda_produtos IS 'Produtos de revenda e itens da comanda digital cadastrados pelos profissionais';
COMMENT ON COLUMN public.comanda_produtos.nome IS 'Nome do produto ou item da comanda (ex: Shampoo para cílios, Home care)';
COMMENT ON COLUMN public.comanda_produtos.preco IS 'Valor unitário de venda do produto';

-- Migration 00017: Normaliza formas de pagamento em agendamentos e profissionais

-- 1. Normalizar forma_pagamento na tabela agendamentos
UPDATE public.agendamentos
SET forma_pagamento = 'cartao'
WHERE forma_pagamento IN ('cartao_credito', 'cartao_debito');

-- 2. Normalizar array de formas_pagamento_aceitas na tabela profissionais
UPDATE public.profissionais
SET formas_pagamento_aceitas = ARRAY(
  SELECT DISTINCT CASE 
    WHEN elem IN ('cartao_credito', 'cartao_debito') THEN 'cartao'
    ELSE elem
  END
  FROM unnest(formas_pagamento_aceitas) AS elem
)
WHERE formas_pagamento_aceitas IS NOT NULL;

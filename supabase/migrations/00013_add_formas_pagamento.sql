-- Migration 00013: Adicionar formas_pagamento_aceitas na tabela profissionais e forma_pagamento_preferida em agendamentos

ALTER TABLE profissionais 
ADD COLUMN IF NOT EXISTS formas_pagamento_aceitas text[] DEFAULT ARRAY['pix', 'dinheiro', 'cartao_credito'];

ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS forma_pagamento_preferida text;

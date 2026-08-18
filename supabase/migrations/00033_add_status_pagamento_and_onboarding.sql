-- Migration 00033: Adicionar status_pagamento em agendamentos e onboarding_concluido em profissionais
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente';

ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS onboarding_concluido BOOLEAN DEFAULT false;

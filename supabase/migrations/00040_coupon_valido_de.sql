-- 00040_coupon_valido_de.sql
-- Adiciona a coluna valido_de para permitir intervalo de validade (de X até Y) nos cupons

ALTER TABLE public.cupons_profissional 
ADD COLUMN IF NOT EXISTS valido_de TIMESTAMPTZ;

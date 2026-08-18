-- Migration 00020: Adiciona suporte a bloqueios por período (data_fim) e horários parciais (hora_inicio, hora_fim)
ALTER TABLE public.bloqueios_disponibilidade
ADD COLUMN IF NOT EXISTS data_fim date NULL,
ADD COLUMN IF NOT EXISTS hora_inicio time NULL,
ADD COLUMN IF NOT EXISTS hora_fim time NULL;

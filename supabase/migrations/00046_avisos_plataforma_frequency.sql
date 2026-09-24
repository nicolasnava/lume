ALTER TABLE public.avisos_plataforma
  ADD COLUMN IF NOT EXISTS frequencia VARCHAR(30) NOT NULL DEFAULT 'uma_vez_por_dia';

ALTER TABLE public.avisos_plataforma
  DROP CONSTRAINT IF EXISTS avisos_plataforma_frequencia_check;

ALTER TABLE public.avisos_plataforma
  ADD CONSTRAINT avisos_plataforma_frequencia_check
  CHECK (frequencia IN ('cada_acesso', 'uma_vez_por_dia', 'somente_sino'));

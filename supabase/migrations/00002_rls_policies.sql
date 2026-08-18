-- Migration 00002: Row Level Security (RLS) Policies & Storage Setup

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 2. Políticas para 'profissionais'
-- -------------------------------------------------------------
-- Leitura pública para que qualquer cliente acesse o perfil pelo slug
CREATE POLICY "Profissionais leitura publica"
  ON profissionais FOR SELECT
  USING (true);

-- Inserção permitida para o próprio usuário autenticado
CREATE POLICY "Profissionais insercao propria"
  ON profissionais FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Edição apenas pela própria profissional
CREATE POLICY "Profissionais edicao propria"
  ON profissionais FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Exclusão apenas pela própria profissional
CREATE POLICY "Profissionais exclusao propria"
  ON profissionais FOR DELETE
  USING (auth.uid() = id);

-- -------------------------------------------------------------
-- 3. Políticas para 'servicos'
-- -------------------------------------------------------------
-- Leitura pública dos serviços prestados
CREATE POLICY "Servicos leitura publica"
  ON servicos FOR SELECT
  USING (true);

-- Escrita restrita à profissional dona do serviço
CREATE POLICY "Servicos criacao propria"
  ON servicos FOR INSERT
  WITH CHECK (auth.uid() = profissional_id);

CREATE POLICY "Servicos edicao propria"
  ON servicos FOR UPDATE
  USING (auth.uid() = profissional_id)
  WITH CHECK (auth.uid() = profissional_id);

CREATE POLICY "Servicos exclusao propria"
  ON servicos FOR DELETE
  USING (auth.uid() = profissional_id);

-- -------------------------------------------------------------
-- 4. Políticas para 'disponibilidade'
-- -------------------------------------------------------------
-- Leitura pública dos horários de atendimento da profissional
CREATE POLICY "Disponibilidade leitura publica"
  ON disponibilidade FOR SELECT
  USING (true);

-- Escrita restrita à profissional dona
CREATE POLICY "Disponibilidade criacao propria"
  ON disponibilidade FOR INSERT
  WITH CHECK (auth.uid() = profissional_id); 

CREATE POLICY "Disponibilidade edicao propria"
  ON disponibilidade FOR UPDATE
  USING (auth.uid() = profissional_id)
  WITH CHECK (auth.uid() = profissional_id);

CREATE POLICY "Disponibilidade exclusao propria"
  ON disponibilidade FOR DELETE
  USING (auth.uid() = profissional_id);

-- -------------------------------------------------------------
-- 5. Políticas para 'clientes'
-- -------------------------------------------------------------
-- Leitura e escrita restritas à profissional dona do registro (dados privados)
CREATE POLICY "Clientes leitura profissional"
  ON clientes FOR SELECT
  USING (auth.uid() = profissional_id);

CREATE POLICY "Clientes insercao profissional"
  ON clientes FOR INSERT
  WITH CHECK (auth.uid() = profissional_id);

CREATE POLICY "Clientes edicao profissional"
  ON clientes FOR UPDATE
  USING (auth.uid() = profissional_id)
  WITH CHECK (auth.uid() = profissional_id);

CREATE POLICY "Clientes exclusao profissional"
  ON clientes FOR DELETE
  USING (auth.uid() = profissional_id);

-- -------------------------------------------------------------
-- 6. Políticas para 'agendamentos'
-- -------------------------------------------------------------
-- A profissional dona pode ler todos os seus agendamentos
CREATE POLICY "Agendamentos leitura profissional"
  ON agendamentos FOR SELECT
  USING (auth.uid() = profissional_id);

-- Clientes públicos (não autenticados) e a profissional podem criar agendamentos
CREATE POLICY "Agendamentos insercao publica"
  ON agendamentos FOR INSERT
  WITH CHECK (true);

-- Apenas a profissional dona pode alterar ou cancelar agendamentos existentes
CREATE POLICY "Agendamentos edicao profissional"
  ON agendamentos FOR UPDATE
  USING (auth.uid() = profissional_id)
  WITH CHECK (auth.uid() = profissional_id);

CREATE POLICY "Agendamentos exclusao profissional"
  ON agendamentos FOR DELETE
  USING (auth.uid() = profissional_id);

-- -------------------------------------------------------------
-- 7. Configuração do Supabase Storage (Bucket 'profissionais_fotos')
-- -------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('profissionais_fotos', 'profissionais_fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública para fotos de perfil
CREATE POLICY "Fotos leitura publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profissionais_fotos');

-- Política de inserção para usuários autenticados
CREATE POLICY "Fotos insercao autenticado"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profissionais_fotos'
    AND auth.role() = 'authenticated'
  );

-- Política de atualização para usuários autenticados
CREATE POLICY "Fotos edicao autenticado"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profissionais_fotos'
    AND auth.role() = 'authenticated'
  );

-- Política de deleção para usuários autenticados
CREATE POLICY "Fotos delecao autenticado"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profissionais_fotos'
    AND auth.role() = 'authenticated'
  );

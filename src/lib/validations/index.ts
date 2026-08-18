import { z } from 'zod'

/**
 * Esquemas de validação Zod centralizados para o projeto Lumê.
 */

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const cadastroSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export type CadastroInput = z.infer<typeof cadastroSchema>

export const cadastroMultiStepSchema = z.object({
  // Etapa 1: Acesso
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),

  // Etapa 2: Especialidade & Contato
  categoria: z.array(z.string()).min(1, 'Selecione pelo menos uma especialidade'),
  whatsapp: z.string().min(10, 'Informe um número de WhatsApp válido com DDD'),
  instagram: z.string().optional().nullable(),
  tagline: z.string().max(120, 'A frase deve ter no máximo 120 caracteres').optional().nullable(),

  // Etapa 3: Localização & Pagamento
  localizacao: z.string().max(200, 'A localização deve ter no máximo 200 caracteres').optional().nullable(),
  modalidade_atendimento: z.union([z.array(z.string()), z.string()]).default(['studio']).optional().nullable(),
  formas_pagamento_aceitas: z.array(z.string()).default(['pix', 'cartao', 'dinheiro']),

  // Etapa 4: Link, Visual & Horários
  slug: z
    .string()
    .min(3, 'O link deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'O link deve conter apenas letras minúsculas, números e hífen'),
  cor_primaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor primária inválida').default('#B8A9D9'),
  cor_secundaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor secundária inválida').default('#FAF7F5'),
  dias_atendimento: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inicial inválido').default('09:00'),
  hora_fim: z.string().regex(/^\d{2}:\d{2}$/, 'Horário final inválido').default('18:00'),
})

export type CadastroMultiStepInput = z.infer<typeof cadastroMultiStepSchema>

export const perfilSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(500, 'A bio não pode ultrapassar 500 caracteres').optional().nullable(),
  tagline: z.string().max(120, 'A frase de efeito deve ter no máximo 120 caracteres').optional().nullable(),
  localizacao: z.string().max(200, 'A localização deve ter no máximo 200 caracteres').optional().nullable(),
  modalidade_atendimento: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  cor_primaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor primária inválida'),
  cor_secundaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor secundária inválida'),
  categoria: z.array(z.string()).default([]),
  formas_pagamento_aceitas: z.array(z.string()).optional(),
  slug: z.string().min(3, 'O link deve ter pelo menos 3 caracteres').regex(/^[a-z0-9-]+$/, 'O link deve conter apenas letras minúsculas, números e hífen').optional(),
  janela_agendamento_dias: z.number().min(15).max(180).optional().nullable(),
  foto_url: z.string().optional().nullable(),
  foto_capa_url: z.string().optional().nullable(),
})

export type PerfilInput = z.infer<typeof perfilSchema>

export const avaliacaoSchema = z.object({
  agendamentoId: z.string().min(1, 'ID do agendamento inválido'),
  nota: z.number().min(1, 'Selecione uma nota de 1 a 5').max(5, 'A nota máxima é 5'),
  comentario: z.string().max(500, 'O comentário deve ter no máximo 500 caracteres').optional().nullable(),
})

export type AvaliacaoInput = z.infer<typeof avaliacaoSchema>

export const servicoSchema = z.object({
  nome: z.string().min(2, 'O nome do serviço deve ter pelo menos 2 caracteres'),
  descricao: z.string().max(150, 'A descrição deve ter no máximo 150 caracteres').optional().nullable(),
  duracao_minutos: z.number({ invalid_type_error: 'Duração deve ser um número válido' }).min(15, 'A duração mínima é de 15 minutos'),
  preco: z.number({ invalid_type_error: 'Preço deve ser um valor numérico' }).min(0, 'O preço não pode ser um valor negativo'),
  foto_url: z.string().optional().nullable(),
  intervalo_manutencao_dias: z.number({ invalid_type_error: 'Intervalo deve ser um número válido' }).min(1, 'O intervalo mínimo de manutenção é de 1 dia').optional().nullable(),
})

export type ServicoInput = z.infer<typeof servicoSchema>

export const agendamentoSchema = z.object({
  profissional_id: z.string().uuid(),
  cliente_nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cliente_telefone: z.string().min(10, 'Telefone inválido'),
  servico_id: z.string().uuid(),
  data_hora_inicio: z.string(),
  data_hora_fim: z.string(),
})

export type AgendamentoInput = z.infer<typeof agendamentoSchema>

export const clienteAgendamentoSchema = z.object({
  profissional_id: z.string().uuid('ID de profissional inválido'),
  servico_id: z.string().uuid('ID de serviço inválido'),
  data_hora_inicio: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data e horário de início inválidos'),
  cliente_nome: z.string().min(2, 'Informe seu nome completo (mínimo de 2 caracteres)'),
  cliente_telefone: z.string().refine((val) => {
    const digits = val.replace(/\D/g, '')
    return digits.length === 10 || digits.length === 11
  }, 'Informe um número de WhatsApp válido com DDD (ex: 11 99999-8888)'),
})

export type ClienteAgendamentoInput = z.infer<typeof clienteAgendamentoSchema>

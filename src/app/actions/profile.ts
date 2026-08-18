'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { perfilSchema } from '@/lib/validations'
import { normalizeSlug } from '@/lib/utils/slug'
import { revalidatePath } from 'next/cache'

export interface ProfileFormData {
  nome: string
  bio?: string | null
  tagline?: string | null
  localizacao?: string | null
  modalidade_atendimento?: string[] | string | null
  whatsapp?: string | null
  instagram?: string | null
  categoria: string[]
  formas_pagamento_aceitas?: string[]
  slug?: string
  cor_primaria: string
  cor_secundaria: string
  foto_url?: string | null
  foto_capa_url?: string | null
  janela_agendamento_dias?: number | null
}

const RESERVED_SLUGS = [
  'agendar',
  'login',
  'cadastro',
  'perfil',
  'dashboard',
  'api',
  'admin',
  'avaliar',
  'avaliacoes',
  'servicos',
  'disponibilidade',
  'clientes',
  'financeiro',
]

/**
 * Server Action para verificar a disponibilidade de um slug em tempo real.
 */
export async function checkSlugAvailabilityAction(rawSlug: string, currentUserId: string) {
  const normalized = normalizeSlug(rawSlug)

  if (normalized.length < 3) {
    return { available: false, normalized, reason: 'Mínimo de 3 caracteres.' }
  }

  if (RESERVED_SLUGS.includes(normalized)) {
    return { available: false, normalized, reason: 'Este link é reservado pelo sistema.' }
  }

  const adminSupabase = createAdminClient()

  // 1. Verificar trava de 30 dias na profissional atual
  const { data: currentProf } = await adminSupabase
    .from('profissionais')
    .select('slug, slug_alterado_em')
    .eq('id', currentUserId)
    .maybeSingle()

  if (currentProf && currentProf.slug !== normalized && currentProf.slug_alterado_em) {
    const lastChange = new Date(currentProf.slug_alterado_em)
    const now = new Date()
    const diffTime = now.getTime() - lastChange.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays < 30) {
      const nextAllowed = new Date(lastChange.getTime() + 30 * 24 * 60 * 60 * 1000)
      const formattedDate = nextAllowed.toLocaleDateString('pt-BR')
      return {
        available: false,
        normalized,
        reason: `Você alterou seu link recentemente. Uma nova alteração só será permitida a partir de ${formattedDate}.`,
      }
    }
  }

  // 2. Verificar se pertence a outra profissional na tabela profissionais
  const { data: existingProf } = await adminSupabase
    .from('profissionais')
    .select('id')
    .eq('slug', normalized)
    .neq('id', currentUserId)
    .maybeSingle()

  if (existingProf) {
    return { available: false, normalized, reason: 'Esse link já está em uso, escolha outro.' }
  }

  // 3. Verificar se existe no histórico slugs_antigos de outra profissional
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingOld } = await (adminSupabase.from('slugs_antigos') as any)
    .select('profissional_id')
    .eq('slug_antigo', normalized)
    .neq('profissional_id', currentUserId)
    .maybeSingle()

  if (existingOld) {
    return { available: false, normalized, reason: 'Esse link já foi utilizado no histórico de outra profissional.' }
  }

  return { available: true, normalized }
}

/**
 * Server Action pública para verificar a disponibilidade de um slug durante o cadastro
 */
export async function checkPublicSlugAvailabilityAction(rawSlug: string) {
  const normalized = normalizeSlug(rawSlug)

  if (normalized.length < 3) {
    return { available: false, normalized, reason: 'Mínimo de 3 caracteres.' }
  }

  if (RESERVED_SLUGS.includes(normalized)) {
    return { available: false, normalized, reason: 'Este link é reservado pelo sistema.' }
  }

  const adminSupabase = createAdminClient()

  // 1. Verificar se pertence a qualquer profissional existente
  const { data: existingProf } = await adminSupabase
    .from('profissionais')
    .select('id')
    .eq('slug', normalized)
    .maybeSingle()

  if (existingProf) {
    return { available: false, normalized, reason: 'Esse link já está em uso, escolha outro.' }
  }

  // 2. Verificar se existe no histórico slugs_antigos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingOld } = await (adminSupabase.from('slugs_antigos') as any)
    .select('id')
    .eq('slug_antigo', normalized)
    .maybeSingle()

  if (existingOld) {
    return { available: false, normalized, reason: 'Esse link já foi utilizado no histórico do Lumê.' }
  }

  return { available: true, normalized, reason: 'Link disponível!' }
}

export async function updatePerfilAction(formData: ProfileFormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Sessão expirada. Por favor, faça login novamente.' }
    }

    const validation = perfilSchema.safeParse(formData)
    if (!validation.success) {
      const errorMsg = validation.error.errors.map((e) => e.message).join(', ')
      return { success: false, message: `Dados inválidos: ${errorMsg}` }
    }

    const adminSupabase = createAdminClient()

    // Buscar dados atuais da profissional para conferir se o slug mudou
    const { data: currentProf } = await adminSupabase
      .from('profissionais')
      .select('slug')
      .eq('id', user.id)
      .single()

    const newSlug = validation.data.slug ? normalizeSlug(validation.data.slug) : null
    let slugChanged = false

    if (newSlug && currentProf && currentProf.slug !== newSlug) {
      // Validar disponibilidade e trava de 30 dias do novo slug
      const avail = await checkSlugAvailabilityAction(newSlug, user.id)
      if (!avail.available) {
        return { success: false, message: avail.reason || 'Slug indisponível.' }
      }

      // Guardar o slug antigo na tabela slugs_antigos (se ainda não existir lá)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingOldRecord } = await (adminSupabase.from('slugs_antigos') as any)
        .select('id')
        .eq('slug_antigo', currentProf.slug)
        .maybeSingle()

      if (!existingOldRecord) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminSupabase.from('slugs_antigos') as any).insert([
          {
            profissional_id: user.id,
            slug_antigo: currentProf.slug,
          },
        ])
      }

      slugChanged = true
    }

    // Atualizar perfil
    const updatePayload: Record<string, unknown> = {
      nome: validation.data.nome,
      bio: validation.data.bio || null,
      tagline: validation.data.tagline || null,
      localizacao: validation.data.localizacao || null,
      modalidade_atendimento: Array.isArray(validation.data.modalidade_atendimento)
        ? validation.data.modalidade_atendimento
        : validation.data.modalidade_atendimento
        ? [validation.data.modalidade_atendimento]
        : ['studio'],
      whatsapp: validation.data.whatsapp || null,
      instagram: validation.data.instagram || null,
      categoria: validation.data.categoria,
      formas_pagamento_aceitas: validation.data.formas_pagamento_aceitas || ['pix', 'dinheiro', 'cartao_credito'],
      cor_primaria: validation.data.cor_primaria,
      cor_secundaria: validation.data.cor_secundaria,
      foto_url: validation.data.foto_url || null,
      foto_capa_url: validation.data.foto_capa_url || null,
      janela_agendamento_dias: validation.data.janela_agendamento_dias || 90,
    }

    if (newSlug) {
      updatePayload.slug = newSlug
      if (slugChanged) {
        updatePayload.slug_alterado_em = new Date().toISOString()
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { error } = await (adminSupabase.from('profissionais') as any)
      .update(updatePayload)
      .eq('id', user.id)

    // Se falhou por causa de coluna não encontrada (ex: modalidade_atendimento), faz fallback
    if (
      error &&
      (error.code === 'PGRST204' ||
        error.message?.includes('modalidade_atendimento') ||
        error.message?.includes('schema cache'))
    ) {
      console.warn('[updatePerfilAction] Aplicando fallback sem modalidade_atendimento:', error.message)
      const fallbackPayload = { ...updatePayload }
      delete fallbackPayload.modalidade_atendimento
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const retryResult = await (adminSupabase.from('profissionais') as any)
        .update(fallbackPayload)
        .eq('id', user.id)
      error = retryResult.error
    }

    if (error) {
      console.error('[updatePerfilAction] Erro no banco de dados:', error)
      return { success: false, message: 'Não foi possível salvar as alterações do perfil no momento. Tente novamente em instantes.' }
    }

    revalidatePath('/perfil')
    revalidatePath('/dashboard')
    revalidatePath('/p/[slug]', 'page')

    return { success: true, message: 'Perfil atualizado com sucesso!' }
  } catch (err: unknown) {
    console.error('[updatePerfilAction] Exceção inesperada:', err)
    const errorObj = err as { message?: string }
    return {
      success: false,
      message: errorObj?.message || 'Ocorreu um erro inesperado ao salvar o perfil.',
    }
  }
}

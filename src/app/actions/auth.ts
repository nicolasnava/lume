'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cadastroMultiStepSchema, CadastroMultiStepInput, cadastroSchema, CadastroInput } from '@/lib/validations'
import { generateUniqueSlug, normalizeSlug } from '@/lib/utils/slug'

export type SignUpData = (CadastroMultiStepInput | CadastroInput) & { ref?: string }

export async function signUpAction(formData: SignUpData) {
  try {
    // 1. Validação de formato dos dados (tenta validar multi-step completo primeiro; se faltar, tenta o básico)
    const multiStepValidation = cadastroMultiStepSchema.safeParse(formData)
    let isFullData = false
    let validData: CadastroMultiStepInput

    if (multiStepValidation.success) {
      isFullData = true
      validData = multiStepValidation.data
    } else {
      const basicValidation = cadastroSchema.safeParse(formData)
      if (!basicValidation.success) {
        return {
          success: false,
          message: multiStepValidation.error.errors[0]?.message || basicValidation.error.errors[0]?.message,
        }
      }
      validData = {
        nome: basicValidation.data.nome,
        email: basicValidation.data.email,
        senha: basicValidation.data.senha,
        categoria: [],
        whatsapp: '',
        instagram: null,
        tagline: null,
        localizacao: null,
        modalidade_atendimento: ['studio'],
        formas_pagamento_aceitas: ['pix', 'cartao', 'dinheiro'],
        slug: normalizeSlug(basicValidation.data.nome),
        cor_primaria: '#B8A9D9',
        cor_secundaria: '#FAF7F5',
        dias_atendimento: [1, 2, 3, 4, 5],
        hora_inicio: '09:00',
        hora_fim: '18:00',
      }
    }

    const {
      nome,
      email,
      senha,
      categoria,
      whatsapp,
      instagram,
      tagline,
      localizacao,
      formas_pagamento_aceitas,
      slug: preferredSlug,
      cor_primaria,
      cor_secundaria,
      dias_atendimento,
      hora_inicio,
      hora_fim,
    } = validData

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 2. Criar a conta de usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    })

    if (authError || !authData.user) {
      console.error('[signUpAction] Erro ao criar conta no Supabase Auth:', authError)
      return {
        success: false,
        message:
          'Não foi possível concluir o cadastro com os dados informados. Se você já possui uma conta, tente fazer login ou recuperar sua senha.',
      }
    }

    const userId = authData.user.id

    // 3. Garantir slug único válido
    const baseSlugToUse = preferredSlug ? normalizeSlug(preferredSlug) : normalizeSlug(nome)
    const finalSlug = await generateUniqueSlug(adminSupabase, baseSlugToUse)

    // Formatar instagram limpo (remover @ se houver)
    const cleanInstagram = instagram ? instagram.replace(/^@/, '').trim() : null

    // 3.5. Tratar código de indicação (se presente)
    let indicadoPorId: string | null = null
    if (formData.ref && typeof formData.ref === 'string') {
      try {
        const cleanRef = formData.ref.trim().toUpperCase()
        const { data: indicadora } = await adminSupabase
          .from('profissionais')
          .select('id')
          .ilike('codigo_indicacao', cleanRef)
          .is('deletado_em', null)
          .maybeSingle()

        if (indicadora && indicadora.id !== userId) {
          indicadoPorId = indicadora.id
        }
      } catch (err) {
        console.warn('[signUpAction] Erro ao buscar indicadora pelo código:', err)
      }
    }

    // Gerar código de indicação único para a nova profissional
    const baseCode = (finalSlug || nome || 'LUME')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
    const randSuffix = Math.floor(100 + Math.random() * 900)
    const novoCodigoIndicacao = `${baseCode || 'LUME'}${randSuffix}`

    // 4. Inserir ou atualizar o registro na tabela 'profissionais' usando service_role (bypassing RLS)
    const profPayload: Record<string, unknown> = {
      id: userId,
      nome,
      categoria: Array.isArray(categoria) ? categoria : [],
      whatsapp: whatsapp || null,
      instagram: cleanInstagram || null,
      tagline: tagline || null,
      localizacao: localizacao || null,
      modalidade_atendimento: Array.isArray(validData.modalidade_atendimento)
        ? validData.modalidade_atendimento
        : validData.modalidade_atendimento
        ? [validData.modalidade_atendimento]
        : ['studio'],
      formas_pagamento_aceitas: formas_pagamento_aceitas || ['pix', 'cartao', 'dinheiro'],
      slug: finalSlug,
      cor_primaria: cor_primaria || '#B8A9D9',
      cor_secundaria: cor_secundaria || '#FAF7F5',
      codigo_indicacao: novoCodigoIndicacao,
      indicado_por: indicadoPorId,
    }

    // Helper resiliente para salvar com fallback caso colunas do schema ainda estejam sendo migradas
    const saveProfissionalData = async (payloadToSave: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: primaryError } = await (adminSupabase.from('profissionais') as any)
        .upsert(payloadToSave, { onConflict: 'id' })

      if (!primaryError) return { success: true }

      console.warn('[signUpAction] Erro no primeiro upsert do profissional:', primaryError)

      // Se falhou por causa de coluna não encontrada (ex: modalidade_atendimento), remove e tenta novamente
      if (
        primaryError.code === 'PGRST204' ||
        primaryError.message?.includes('modalidade_atendimento') ||
        primaryError.message?.includes('schema cache')
      ) {
        const fallbackPayload = { ...payloadToSave }
        delete fallbackPayload.modalidade_atendimento
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: fallbackError } = await (adminSupabase.from('profissionais') as any)
          .upsert(fallbackPayload, { onConflict: 'id' })

        if (!fallbackError) return { success: true }
        console.error('[signUpAction] Erro no fallback de upsert do profissional:', fallbackError)
        return { success: false, error: fallbackError }
      }

      return { success: false, error: primaryError }
    }

    const saveResult = await saveProfissionalData(profPayload)
    if (!saveResult.success) {
      console.error('[signUpAction] Falha ao persistir dados do profissional:', saveResult.error)
    }

    // 5. Inserir horários de atendimento padrão na tabela 'disponibilidade'
    if (dias_atendimento && dias_atendimento.length > 0) {
      try {
        const rowsToInsert = dias_atendimento.map((dia) => ({
          profissional_id: userId,
          dia_semana: dia,
          hora_inicio: hora_inicio || '09:00',
          hora_fim: hora_fim || '18:00',
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminSupabase.from('disponibilidade') as any).insert(rowsToInsert)
      } catch (dispErr) {
        console.error('[signUpAction] Erro ao salvar horários iniciais de disponibilidade:', dispErr)
        // Não trava o fluxo principal de cadastro
      }
    }

    // 6. Tentar realizar o login para definir cookies de sessão caso a confirmação de e-mail esteja desativada
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    const requiresEmailConfirmation = Boolean(signInError)

    return {
      success: true,
      requiresEmailConfirmation,
      message: requiresEmailConfirmation
        ? 'Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar a conta antes de fazer login.'
        : 'Conta criada com sucesso!',
    }
  } catch (error) {
    console.error('[signUpAction] Exceção inesperada:', error)
    return {
      success: false,
      message: 'Não foi possível concluir o cadastro. Verifique os dados informados ou tente fazer login se já possuir uma conta.',
    }
  }
}

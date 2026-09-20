'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cadastroMultiStepSchema, CadastroMultiStepInput, cadastroSchema, CadastroInput } from '@/lib/validations'
import { generateUniqueSlug, normalizeSlug } from '@/lib/utils/slug'
import { translateAuthError } from '@/lib/utils/errorTranslations'

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
          message: multiStepValidation.error.errors[0]?.message || basicValidation.error.errors[0]?.message || 'Dados de cadastro incompletos.',
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
    let finalAuthUser: { id: string } | null = null

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    })

    if (!authError && authData.user) {
      // Se o Supabase Auth tiver confirmação de e-mail ativada e o e-mail já existir, ele retorna identities vazio
      if (authData.user.identities && authData.user.identities.length === 0) {
        console.warn('[signUpAction] Usuário já registrado (identities vazias):', email)
        return {
          success: false,
          message: 'Este e-mail já está cadastrado no Lumê. Por favor, faça login ou utilize a opção de recuperação de senha.',
        }
      }
      finalAuthUser = authData.user
    } else {
      console.warn('[signUpAction] signUp padrão falhou, avaliando motivo:', authError)

      const isEmailSendIssue =
        authError?.message?.toLowerCase().includes('confirmation email') ||
        authError?.message?.toLowerCase().includes('error sending') ||
        authError?.message?.toLowerCase().includes('smtp') ||
        authError?.status === 500

      if (isEmailSendIssue) {
        // Fallback resiliente: se o serviço de SMTP padrão do Supabase falhou ao enviar confirmação,
        // cria via admin com email_confirm: true para que a profissional não seja barrada!
        console.info('[signUpAction] Tentando criação direta via admin com e-mail confirmado...')
        const { data: adminCreated, error: adminErr } = await adminSupabase.auth.admin.createUser({
          email,
          password: senha,
          email_confirm: true,
          user_metadata: { nome },
        })

        if (!adminErr && adminCreated.user) {
          finalAuthUser = adminCreated.user
        } else {
          console.error('[signUpAction] Erro também no fallback do admin.createUser:', adminErr)
          return {
            success: false,
            message: adminErr ? translateAuthError(adminErr) : 'Falha temporária ao enviar o e-mail de confirmação. Tente novamente em alguns instantes.',
          }
        }
      } else {
        return {
          success: false,
          message: authError ? translateAuthError(authError) : 'Não foi possível registrar o usuário no sistema. Verifique os dados informados.',
        }
      }
    }

    if (!finalAuthUser) {
      return {
        success: false,
        message: 'Não foi possível concluir o cadastro no momento. Tente novamente em alguns instantes.',
      }
    }

    const userId = finalAuthUser.id

    // 3. Garantir slug único válido
    const baseSlugToUse = preferredSlug ? normalizeSlug(preferredSlug) : normalizeSlug(nome)
    const finalSlug = await generateUniqueSlug(adminSupabase, baseSlugToUse)

    // Formatar instagram limpo (remover @ se houver)
    const cleanInstagram = instagram ? instagram.replace(/^@/, '').trim() : null

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
      return {
        success: false,
        message: 'Sua conta de acesso foi criada, mas ocorreu uma falha temporária ao salvar os dados do seu perfil. Por favor, tente novamente em instantes.',
      }
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
  } catch (error: any) {
    console.error('[signUpAction] Exceção inesperada:', error)
    return {
      success: false,
      message: translateAuthError(error),
    }
  }
}

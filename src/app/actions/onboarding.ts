'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Retorna o status de conclusão do onboarding da profissional autenticada.
 */
export async function getOnboardingStatusAction(): Promise<{
  success: boolean
  onboardingConcluido: boolean
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, onboardingConcluido: true }
    }

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('profissionais') as any)
      .select('onboarding_concluido')
      .eq('id', user.id)
      .single()

    if (error) {
      // Se a coluna ainda não existir no schema remoto, considera falso para nova usuária
      return { success: true, onboardingConcluido: false }
    }

    return {
      success: true,
      onboardingConcluido: data?.onboarding_concluido === true,
    }
  } catch (err) {
    console.warn('[getOnboardingStatusAction] Falha ao verificar onboarding:', err)
    return { success: true, onboardingConcluido: false }
  }
}

/**
 * Marca o onboarding como concluído no banco de dados.
 */
export async function completeOnboardingAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false }
    }

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('profissionais') as any)
      .update({ onboarding_concluido: true })
      .eq('id', user.id)

    if (error) {
      console.warn('[completeOnboardingAction] Aviso ao gravar onboarding_concluido:', error.message)
    }

    revalidatePath('/dashboard/geral')
    revalidatePath('/perfil')
    return { success: true }
  } catch (err) {
    console.error('[completeOnboardingAction] Erro inesperado:', err)
    return { success: false }
  }
}

/**
 * Reseta o onboarding para permitir que a profissional veja o tutorial novamente.
 */
export async function resetOnboardingAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false }
    }

    const adminSupabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('profissionais') as any)
      .update({ onboarding_concluido: false })
      .eq('id', user.id)

    if (error) {
      console.warn('[resetOnboardingAction] Aviso ao resetar onboarding_concluido:', error.message)
    }

    revalidatePath('/dashboard/geral')
    return { success: true }
  } catch (err) {
    console.error('[resetOnboardingAction] Erro inesperado:', err)
    return { success: false }
  }
}

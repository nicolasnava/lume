'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToProfissional } from '@/lib/push/pushService'

export interface SaveSubscriptionParams {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Salva a inscrição Web Push da profissional no Supabase.
 */
export async function savePushSubscriptionAction(subscription: SaveSubscriptionParams): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return { success: false, message: 'Dados de inscrição inválidos.' }
    }

    const adminSupabase = createAdminClient()

    // Upsert na tabela push_subscriptions
    const { error } = await adminSupabase.from('push_subscriptions').upsert(
      {
        profissional_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'profissional_id,endpoint' }
    )

    if (error) {
      console.error('[savePushSubscriptionAction] Erro ao salvar subscription:', error)
      return { success: false, message: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[savePushSubscriptionAction] Erro inesperado:', error)
    return { success: false, message: err?.message || 'Erro ao salvar notificação push.' }
  }
}

/**
 * Remove uma inscrição Web Push da profissional.
 */
export async function deletePushSubscriptionAction(endpoint: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('push_subscriptions')
      .delete()
      .eq('profissional_id', user.id)
      .eq('endpoint', endpoint)

    if (error) {
      return { success: false, message: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    const err = error as { message?: string }
    return { success: false, message: err?.message || 'Erro ao remover notificação push.' }
  }
}

/**
 * Envia uma notificação push de teste para a profissional conectada.
 */
export async function testPushNotificationAction(): Promise<{
  success: boolean
  message?: string
  sentCount?: number
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const result = await sendPushToProfissional(user.id, {
      title: '🎉 Notificações Push Ativas!',
      body: 'O Lumê agora notificará você em tempo real sobre novos agendamentos, cancelamentos e remarcações.',
      url: '/dashboard/agenda',
      tag: 'test-push',
    })

    if (result.sentCount > 0) {
      return { success: true, sentCount: result.sentCount, message: 'Notificação de teste enviada com sucesso!' }
    } else {
      return {
        success: false,
        message: 'Nenhum dispositivo registrado recebeu a notificação. Verifique se as permissões do navegador estão ativas.',
      }
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    return { success: false, message: err?.message || 'Erro ao disparar teste push.' }
  }
}

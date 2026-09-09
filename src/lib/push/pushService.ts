import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_VAPID_PUBLIC =
  'BFgvxWm6W2GeFpPByZi-vuBvdreMBENs100PEaQhhHpf8aAw7PK25fej67_3XrRlZJ8eYg0Pm-5hrQHVoOMIpOk'
const DEFAULT_VAPID_PRIVATE = 'ED8OJvoyc2N1Zb9klO5N1rlTUJkE5wYK3SMwGVNCpf4'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:suporte@lume.com.br'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export interface PushNotificationPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * Envia notificação push para todas as subscriptions ativas da profissional.
 * Deleta automaticamente subscriptions que retornarem 410 Gone ou 404 Not Found.
 */
export async function sendPushToProfissional(
  profissionalId: string,
  payload: PushNotificationPayload
): Promise<{ sentCount: number; failedCount: number }> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[Web Push] VAPID keys não configuradas no ambiente. Push ignorado.')
      return { sentCount: 0, failedCount: 0 }
    }

    const supabase = createAdminClient()

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('profissional_id', profissionalId)

    if (error || !subscriptions || subscriptions.length === 0) {
      return { sentCount: 0, failedCount: 0 }
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard/agenda',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag,
      data: payload.data,
    })

    let sentCount = 0
    let failedCount = 0
    const expiredIds: string[] = []

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, payloadString)
          sentCount++
        } catch (err: unknown) {
          failedCount++
          const pushErr = err as { statusCode?: number; message?: string }
          console.warn(`[Web Push] Falha ao enviar para sub ${sub.id}:`, pushErr?.message || err)
          if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
            expiredIds.push(sub.id)
          }
        }
      })
    )

    // Remove subscriptions mortas ou revogadas
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds)
      console.log(`[Web Push] Limpeza concluída: ${expiredIds.length} subscriptions removidas.`)
    }

    return { sentCount, failedCount }
  } catch (error) {
    console.error('[Web Push] Erro inesperado em sendPushToProfissional:', error)
    return { sentCount: 0, failedCount: 0 }
  }
}

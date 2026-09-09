'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react'
import {
  savePushSubscriptionAction,
  deletePushSubscriptionAction,
  testPushNotificationAction,
} from '@/app/actions/push'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      checkCurrentSubscription()
    }
  }, [])

  const checkCurrentSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch (err) {
      console.error('Erro ao verificar push subscription:', err)
    }
  }

  const handleSubscribe = async () => {
    setLoading(true)
    setStatusMsg(null)

    try {
      const DEFAULT_VAPID_PUBLIC =
        'BFgvxWm6W2GeFpPByZi-vuBvdreMBENs100PEaQhhHpf8aAw7PK25fej67_3XrRlZJ8eYg0Pm-5hrQHVoOMIpOk'
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC

      // Solicitar permissão do navegador
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setStatusMsg({
          type: 'error',
          text: 'Permissão para notificações não foi concedida no seu navegador.',
        })
        setLoading(false)
        return
      }

      // Registrar Service Worker se ainda não estiver pronto
      const reg = await navigator.serviceWorker.ready

      // Inscrever no PushManager
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey)
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      })

      const rawP256dh = subscription.getKey('p256dh')
      const rawAuth = subscription.getKey('auth')

      const p256dh = arrayBufferToBase64(rawP256dh)
      const auth = arrayBufferToBase64(rawAuth)

      // Salvar no backend Supabase
      const res = await savePushSubscriptionAction({
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
      })

      if (!res.success) {
        throw new Error(res.message || 'Erro ao registrar notificação no servidor.')
      }

      setIsSubscribed(true)
      setStatusMsg({
        type: 'success',
        text: 'Notificações push ativadas com sucesso! Você receberá alertas de novos agendamentos e cancelamentos.',
      })
    } catch (error: unknown) {
      console.error('Erro ao inscrever para notificações push:', error)
      const err = error as { message?: string }
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Erro ao ativar notificações push.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    setStatusMsg(null)

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await deletePushSubscriptionAction(endpoint)
      }

      setIsSubscribed(false)
      setStatusMsg({
        type: 'success',
        text: 'Notificações desativadas neste dispositivo.',
      })
    } catch (error: unknown) {
      console.error('Erro ao cancelar inscrição push:', error)
      const err = error as { message?: string }
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Erro ao desativar notificações.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestPush = async () => {
    setTesting(true)
    setStatusMsg(null)

    try {
      const res = await testPushNotificationAction()
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: 'Notificação de teste enviada! Verifique a central de notificações do seu dispositivo.',
        })
      } else {
        setStatusMsg({
          type: 'error',
          text: res.message || 'Falha ao enviar notificação de teste.',
        })
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Erro ao enviar notificação.',
      })
    } finally {
      setTesting(false)
    }
  }

  if (isSupported === false) {
    return (
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2 font-bold text-[#4A3F5C]">
          <BellOff className="h-4 w-4 text-gray-400" />
          <span>Notificações Push no Dispositivo</span>
        </div>
        <p>Seu navegador atual não suporta Web Push API ou está em modo de navegação anônima.</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xs border border-gray-200/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#4A3F5C]">
              <Bell className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#4A3F5C]">
              Notificações Push em Tempo Real
            </h3>
            {isSubscribed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Ativas
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Receba alertas instantâneos no seu celular ou computador quando clientes agendarem, remarcarem ou cancelarem.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isSubscribed ? (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading || permission === 'denied'}
              className="px-4 py-2.5 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-purple-900 transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Ativando...</span>
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span>Ativar Notificações</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestPush}
                disabled={testing}
                className="px-3.5 py-2.5 rounded-2xl border border-purple-200 bg-purple-50 text-xs font-bold text-[#4A3F5C] hover:bg-purple-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Testar notificação agora"
              >
                {testing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Testar Push</span>
              </button>

              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Desativar
              </button>
            </div>
          )}
        </div>
      </div>

      {permission === 'denied' && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800 border border-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <strong className="block font-bold">Notificações bloqueadas pelo navegador</strong>
            <span>
              Para receber alertas, clique no ícone de cadeado na barra de endereços do seu navegador e mude &quot;Notificações&quot; para &quot;Permitir&quot;.
            </span>
          </div>
        </div>
      )}

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-3 text-xs font-medium border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  )
}

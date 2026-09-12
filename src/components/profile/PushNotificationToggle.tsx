'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2, Send, Check, X } from 'lucide-react'
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

  // Personalização de Notificações (Item 12)
  const [prefNovos, setPrefNovos] = useState(true)
  const [prefCancel, setPrefCancel] = useState(true)
  const [prefLembretes, setPrefLembretes] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p1 = localStorage.getItem('lume_push_pref_novos')
      const p2 = localStorage.getItem('lume_push_pref_cancel')
      const p3 = localStorage.getItem('lume_push_pref_lembretes')
      if (p1 !== null) setPrefNovos(p1 === 'true')
      if (p2 !== null) setPrefCancel(p2 === 'true')
      if (p3 !== null) setPrefLembretes(p3 === 'true')
    }
  }, [])

  const handleTogglePref = (key: 'novos' | 'cancel' | 'lembretes') => {
    if (key === 'novos') {
      const next = !prefNovos
      setPrefNovos(next)
      localStorage.setItem('lume_push_pref_novos', String(next))
    } else if (key === 'cancel') {
      const next = !prefCancel
      setPrefCancel(next)
      localStorage.setItem('lume_push_pref_cancel', String(next))
    } else {
      const next = !prefLembretes
      setPrefLembretes(next)
      localStorage.setItem('lume_push_pref_lembretes', String(next))
    }
  }

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
      {/* 1. Ícone, Título e Subtítulo (estilo Aplicativo Lumê no Celular) */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#3D2E4D]">
            Notificações Push no Dispositivo
          </h3>
          <p className="text-[11px] text-[#6B5E7A]">
            Alertas instantâneos no seu celular e computador
          </p>
        </div>
      </div>

      {/* 2. Botão de uma extremidade a outra (estilo cupom porcentagem / dinheiro) */}
      <div className="grid grid-cols-2 gap-1.5 bg-[#FAF7F5] p-1 rounded-2xl border border-gray-200/80 w-full">
        <button
          type="button"
          onClick={!isSubscribed ? handleSubscribe : undefined}
          disabled={loading || permission === 'denied'}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
            isSubscribed
              ? 'bg-[#4A3F5C] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#4A3F5C] hover:bg-white/60'
          }`}
        >
          {loading && !isSubscribed ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          <span>Ativado</span>
        </button>

        <button
          type="button"
          onClick={isSubscribed ? handleUnsubscribe : undefined}
          disabled={loading}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
            !isSubscribed
              ? 'bg-[#4A3F5C] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#4A3F5C] hover:bg-white/60'
          }`}
        >
          {loading && isSubscribed ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          <span>Desativado</span>
        </button>
      </div>

      {/* 3. Linha ultra fina e descrição */}
      <div className="border-t border-gray-100" />
      <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
        Receba alertas instantâneos no seu celular ou computador quando clientes agendarem, remarcarem ou cancelarem, garantindo agilidade e pontualidade no seu atendimento.
      </p>

      {/* 4. Quando ativado: Personalizar Alertas (sem fundo nos badges) e Botão Enviar Mensagem */}
      {isSubscribed && (
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Personalizar Alertas
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer py-1 hover:opacity-80 transition">
              <input
                type="checkbox"
                checked={prefNovos}
                onChange={() => handleTogglePref('novos')}
                className="rounded text-[#4A3F5C] focus:ring-[#B8A9D9] h-4 w-4 cursor-pointer"
              />
              <span className="font-semibold text-[#4A3F5C]">Novos Agendamentos</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer py-1 hover:opacity-80 transition">
              <input
                type="checkbox"
                checked={prefCancel}
                onChange={() => handleTogglePref('cancel')}
                className="rounded text-[#4A3F5C] focus:ring-[#B8A9D9] h-4 w-4 cursor-pointer"
              />
              <span className="font-semibold text-[#4A3F5C]">Remarcações & Cancelamentos</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer py-1 hover:opacity-80 transition">
              <input
                type="checkbox"
                checked={prefLembretes}
                onChange={() => handleTogglePref('lembretes')}
                className="rounded text-[#4A3F5C] focus:ring-[#B8A9D9] h-4 w-4 cursor-pointer"
              />
              <span className="font-semibold text-[#4A3F5C]">Lembretes de Atendimento</span>
            </label>
          </div>

          {/* Botão de uma extremidade a outra com Enviar mensagem e o ícone */}
          <button
            type="button"
            onClick={handleTestPush}
            disabled={testing}
            className="w-full py-3 px-4 rounded-2xl bg-[#8C5383] hover:bg-[#784370] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 mt-1"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Enviar mensagem de teste</span>
          </button>
        </div>
      )}

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

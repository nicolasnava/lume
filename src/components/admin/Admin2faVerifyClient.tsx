'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ArrowRight, RotateCw, LogOut, KeyRound } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import { verifyAdmin2faAction, resendAdmin2faOtpAction } from '@/app/actions/admin2fa'
import { createClient } from '@/lib/supabase/client'

interface Admin2faVerifyClientProps {
  maskedEmail: string
  otpSentOnLoad?: boolean
}

export default function Admin2faVerifyClient({ maskedEmail, otpSentOnLoad = false }: Admin2faVerifyClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focar no primeiro campo ao carregar e verificar se há erro no link
  // Se o OTP não foi enviado durante o login (acesso direto à página), enviar agora
  useEffect(() => {
    inputRefs.current[0]?.focus()
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setToast({
        show: true,
        message: errorParam === 'invalid_link'
          ? 'Link de verificação inválido ou expirado. Digite o código de 6 dígitos.'
          : errorParam,
        type: 'error',
      })
    }

    // Disparar OTP automaticamente se não foi enviado durante o login
    if (!otpSentOnLoad) {
      resendAdmin2faOtpAction().catch(() => null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cooldown timer para o botão de reenvio
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleDigitChange = (index: number, value: string) => {
    // Tratar colagem de código completo de 6 dígitos
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('')
      if (pastedDigits.length > 0) {
        const next = [...digits]
        pastedDigits.forEach((d, i) => {
          if (index + i < 6) next[index + i] = d
        })
        setDigits(next)
        const nextFocus = Math.min(index + pastedDigits.length, 5)
        inputRefs.current[nextFocus]?.focus()

        // Se preencheu todos os 6 dígitos, submete automaticamente
        if (next.every((d) => d !== '')) {
          handleSubmitCode(next.join(''))
        }
      }
      return
    }

    const clean = value.replace(/\D/g, '')
    const next = [...digits]
    next[index] = clean
    setDigits(next)

    // Avançar para o próximo input
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Se completou os 6 dígitos
    if (clean && index === 5 && next.every((d) => d !== '')) {
      handleSubmitCode(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmitCode = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('')
    if (code.length !== 6) {
      setToast({
        show: true,
        message: 'Por favor, preencha os 6 dígitos do código de segurança.',
        type: 'error',
      })
      return
    }

    setLoading(true)
    setToast(null)

    try {
      const res = await verifyAdmin2faAction(code)
      if (!res.success) {
        setToast({
          show: true,
          message: res.message || 'Código incorreto ou expirado.',
          type: 'error',
        })
        setLoading(false)
        return
      }

      setToast({
        show: true,
        message: 'Código confirmado com sucesso! Entrando no painel executivo...',
        type: 'success',
      })

      setTimeout(() => {
        // Hard navigation para garantir que o middleware releia o cookie 2FA
        window.location.href = res.redirectUrl || '/admin'
      }, 600)
    } catch {
      setToast({
        show: true,
        message: 'Erro de comunicação ao validar código. Tente novamente.',
        type: 'error',
      })
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setToast(null)

    try {
      const res = await resendAdmin2faOtpAction()
      if (res.success) {
        setToast({ show: true, message: res.message, type: 'success' })
        setCooldown(60)
      } else {
        setToast({ show: true, message: res.message, type: 'error' })
      }
    } catch {
      setToast({ show: true, message: 'Erro ao solicitar novo código.', type: 'error' })
    } finally {
      setResending(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] dark:bg-[#0E0B14] text-[#4A3F5C] dark:text-[#F8F5FA] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased tracking-tight relative overflow-hidden">
      {/* Glow de fundo suave Lumê */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#B8A9D9]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Card Principal */}
        <div className="rounded-2xl bg-white dark:bg-[#18141F] p-8 sm:p-10 shadow-xl border border-gray-200/80 dark:border-[#B8A9D9]/30 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Logo Lumê */}
          <div className="flex items-center justify-center mb-2">
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={120}
              height={36}
              priority
              className="h-auto w-auto max-h-8 object-contain"
            />
          </div>

          {/* Título e Explicação Segura */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#4A3F5C] dark:text-[#F8F5FA] tracking-tight">
              Verificação em Duas Etapas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A9A1B5] leading-relaxed font-medium">
              Por segurança, enviamos um código de <strong className="text-[#4A3F5C] dark:text-[#F8F5FA]">6 dígitos</strong> para:
            </p>
            <div className="inline-block px-3.5 py-1 rounded-full bg-[#FAF7F5] dark:bg-[#15111F] border border-gray-200 dark:border-white/[0.08] text-xs font-mono font-bold text-[#4A3F5C] dark:text-[#F8F5FA]">
              {maskedEmail}
            </div>
          </div>

          {/* Inputs dos 6 Dígitos do OTP */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmitCode()
            }}
            className="space-y-6 pt-2"
          >
            <div className="flex justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono text-[#4A3F5C] dark:text-[#F8F5FA] bg-[#FAF7F5] dark:bg-[#15111F] border-2 border-gray-200 dark:border-white/[0.08] rounded-xl focus:border-[#B8A9D9] focus:bg-white dark:focus:bg-[#15111F] focus:outline-hidden focus:ring-4 focus:ring-[#B8A9D9]/20 transition shadow-inner"
                />
              ))}
            </div>

            {/* Botão de Confirmação */}
            <button
              type="submit"
              disabled={loading || digits.some((d) => d === '')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#B8A9D9] hover:bg-[#c4b6e3] disabled:opacity-40 disabled:cursor-not-allowed text-[#18141F] py-3.5 px-6 text-sm font-bold shadow-xs transition cursor-pointer active:scale-[0.97]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#18141F]" />
                  <span>Validando código...</span>
                </>
              ) : (
                <>
                  <span>Confirmar e Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Ações Secundárias: Reenvio e Cancelamento */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-[#A9A1B5]">
              {cooldown > 0 ? (
                <span className="text-gray-400 dark:text-[#A9A1B5] font-mono">
                  Reenviar código em <strong className="text-[#4A3F5C] dark:text-[#F8F5FA]">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-[#8675A9] dark:text-[#B8A9D9] hover:text-[#4A3F5C] dark:hover:text-[#F8F5FA] font-bold transition cursor-pointer active:scale-[0.97]"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>Reenviar código por e-mail</span>
                </button>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-[#A9A1B5] hover:text-[#F87171] transition cursor-pointer active:scale-[0.97]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cancelar e sair da conta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nota de Segurança no Rodapé */}
        <p className="text-center text-[11px] text-gray-400 dark:text-[#A9A1B5] font-medium flex items-center justify-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#8675A9] dark:text-[#B8A9D9]" />
          <span>O código expira em 10 minutos. Nunca compartilhe seu código.</span>
        </p>
      </div>

      {toast && (
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

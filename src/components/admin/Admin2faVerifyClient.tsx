'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ShieldCheck, Loader2, ArrowRight, RotateCw, LogOut, KeyRound } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import { verifyAdmin2faAction, resendAdmin2faOtpAction } from '@/app/actions/admin2fa'
import { createClient } from '@/lib/supabase/client'

interface Admin2faVerifyClientProps {
  maskedEmail: string
}

export default function Admin2faVerifyClient({ maskedEmail }: Admin2faVerifyClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focar no primeiro campo ao carregar e verificar se há erro no link
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
  }, [searchParams])

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
        router.push(res.redirectUrl || '/admin')
        router.refresh()
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
    <div className="min-h-screen bg-[#111111] text-[#F5F5F4] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased tracking-tight relative overflow-hidden">
      {/* Glow de fundo executivo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#8C5383]/15 via-[#B8A9D9]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Card Principal */}
        <div className="rounded-3xl bg-[#1A1A1C] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/[0.08] backdrop-blur-xl text-center space-y-6">
          {/* Logo Lumê Branca com Ícone de Segurança */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#8C5383]/20 border border-[#8C5383]/30 flex items-center justify-center text-[#D8B4E2] shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#D8B4E2]" />
            </div>
            <Image
              src="/assets/logo_branca.webp"
              alt="Lumê"
              width={110}
              height={34}
              priority
              className="h-auto w-auto max-h-8 object-contain"
            />
          </div>

          {/* Título e Explicação Segura */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight whitespace-nowrap">
              Verificação em Duas Etapas
            </h1>
            <p className="text-xs sm:text-sm text-[#9C9C9F] leading-relaxed font-normal">
              Por segurança, enviamos um código de <strong className="text-[#F5F5F4]">6 dígitos</strong> para:
            </p>
            <div className="inline-block px-3.5 py-1 rounded-full bg-[#141416] border border-white/[0.08] text-xs font-mono font-semibold text-[#D8B4E2] shadow-inner">
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
                  className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono text-[#F5F5F4] bg-[#141416] border-2 border-white/[0.08] rounded-2xl focus:border-[#8C5383] focus:bg-[#1A1A1C] focus:outline-none focus:ring-4 focus:ring-[#8C5383]/20 transition shadow-inner"
                />
              ))}
            </div>

            {/* Botão de Confirmação */}
            <button
              type="submit"
              disabled={loading || digits.some((d) => d === '')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8C5383] to-[#5C3656] hover:from-[#9D5D93] hover:to-[#6E4067] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 px-6 text-sm font-bold border border-[#B8A9D9]/30 shadow-[0_4px_20px_rgba(140,83,131,0.3)] transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D8B4E2]" />
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
          <div className="pt-3 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-center text-xs font-semibold text-[#9C9C9F]">
              {cooldown > 0 ? (
                <span className="text-[#9C9C9F] font-mono">
                  Reenviar código em <strong className="text-[#F5F5F4]">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-[#D8B4E2] hover:text-[#F5F5F4] font-bold transition cursor-pointer"
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
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9C9C9F] hover:text-rose-400 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cancelar e sair da conta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nota de Segurança no Rodapé */}
        <p className="text-center text-[11px] text-[#9C9C9F] font-medium flex items-center justify-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#B8A9D9]" />
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


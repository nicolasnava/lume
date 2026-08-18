'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validations'
import Toast from '@/components/ui/Toast'
import { Lock, Mail, Loader2, Eye, EyeOff, X, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react'
import { getPostLoginRedirectAction } from '@/app/actions/admin2fa'

function getSafeRedirectUrl(target: string | null): string {
  const defaultUrl = '/dashboard/geral'
  if (!target) return defaultUrl

  const trimmed = target.trim()
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('http://') &&
    !trimmed.includes('https://')
  ) {
    return trimmed
  }

  return defaultUrl
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = getSafeRedirectUrl(searchParams.get('redirectTo'))

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Estado de Recuperação de Senha ("Esqueceu a senha?")
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setToast(null)

    const validation = loginSchema.safeParse({ email, senha })
    if (!validation.success) {
      setToast({
        show: true,
        message: validation.error.errors[0].message,
        type: 'error',
      })
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (authError) {
      const msg =
        authError.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
          : authError.message
      setToast({
        show: true,
        message: msg,
        type: 'error',
      })
      setLoading(false)
      return
    }

    // Avaliar privilégios de admin para redirecionamento direto e envio de 2FA
    let targetUrl = redirectTo
    let needs2fa = false

    try {
      const postLogin = await getPostLoginRedirectAction()
      if (postLogin && postLogin.isAdmin) {
        targetUrl = postLogin.redirectUrl || '/admin'
      }
      needs2fa = !!(postLogin && postLogin.needs2fa)
    } catch (err) {
      console.warn('[Login] Erro ao verificar pós-login admin, seguindo fluxo padrão:', err)
    }

    setToast({
      show: true,
      message: needs2fa
        ? 'Verificação 2FA necessária. Redirecionando...'
        : 'Login realizado! Entrando no painel...',
      type: 'success',
    })

    setTimeout(() => {
      router.push(targetUrl)
      router.refresh()
    }, 600)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setToast({
        show: true,
        message: 'Por favor, informe um e-mail válido.',
        type: 'error',
      })
      return
    }

    setForgotLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (error) {
        setToast({
          show: true,
          message: error.message,
          type: 'error',
        })
      } else {
        setForgotSuccess(true)
      }
    } catch {
      setToast({
        show: true,
        message: 'Ocorreu um erro ao enviar o e-mail de recuperação.',
        type: 'error',
      })
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-[#E8DFD8]">
        <div className="text-center">
          <div className="mx-auto flex justify-center mb-2">
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={140}
              height={44}
              priority
              className="h-auto w-auto max-h-12 object-contain"
            />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#3D2E4D]">
            Bem-vinda ao Lumê
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#6B5E7A]">
            Acesse seu painel profissional de agendamentos
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-[#3D2E4D] mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B5E7A]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-[#E8DFD8] bg-[#FAF8F5] py-3 pl-10 pr-3 text-xs sm:text-sm text-[#3D2E4D] placeholder-gray-400 transition focus:border-[#8C5383] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C5383]/20"
                  placeholder="seuemail@exemplo.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="senha"
                  className="block text-xs font-bold uppercase tracking-wider text-[#3D2E4D]"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotSuccess(false)
                    setShowForgotModal(true)
                  }}
                  className="text-xs font-semibold text-[#8C5383] hover:text-[#3D2E4D] hover:underline transition cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B5E7A]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full rounded-xl border border-[#E8DFD8] bg-[#FAF8F5] py-3 pl-10 pr-10 text-xs sm:text-sm text-[#3D2E4D] placeholder-gray-400 transition focus:border-[#8C5383] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C5383]/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#3D2E4D] transition focus:outline-none cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-xl bg-[#3D2E4D] py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#2E223B] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8C5383] focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Entrar na conta'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs sm:text-sm text-[#6B5E7A]">
          Ainda não tem uma conta?{' '}
          <Link href="/cadastro" className="font-bold text-[#8C5383] hover:underline">
            Cadastre-se gratuitamente
          </Link>
        </div>
      </div>

      {/* Modal de Esqueceu a Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E8DFD8] space-y-5 text-left">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#FAF0F5] flex items-center justify-center text-[#8C5383]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#3D2E4D]">Recuperar Senha</h4>
                  <p className="text-[11px] text-[#6B5E7A]">Enviaremos um link de redefinição</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 text-center py-2">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h5 className="text-sm font-bold text-[#3D2E4D]">E-mail Enviado!</h5>
                  <p className="text-xs text-[#6B5E7A] leading-relaxed">
                    Se houver uma conta cadastrada com <strong>{forgotEmail}</strong>, você receberá um link seguro para redefinir sua senha em instantes. Verifique também a pasta de spam.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-3 bg-[#3D2E4D] text-white font-bold rounded-xl text-xs hover:bg-[#2E223B] transition cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs font-medium">
                <p className="text-[#6B5E7A] leading-relaxed">
                  Digite seu e-mail cadastrado no Lumê para receber as instruções de recuperação de acesso.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="forgotEmail" className="font-bold text-[#3D2E4D] block">
                    Seu E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B5E7A]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full rounded-xl border border-[#E8DFD8] bg-[#FAF8F5] py-3 pl-10 pr-3 text-xs text-[#3D2E4D] focus:border-[#8C5383] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C5383]/20"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 bg-white text-[#6B5E7A] font-bold rounded-xl text-xs border border-[#E8DFD8] hover:bg-gray-50 transition cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-[#3D2E4D] text-white font-bold rounded-xl text-xs hover:bg-[#2E223B] transition cursor-pointer disabled:opacity-50 text-center"
                  >
                    {forgotLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Enviar Link</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4 py-12 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex h-64 w-full max-w-md items-center justify-center rounded-3xl bg-white p-8 shadow-xl border border-[#E8DFD8]">
            <Loader2 className="h-8 w-8 animate-spin text-[#8C5383]" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}

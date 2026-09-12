'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Zap,
  TrendingUp,
  Calendar,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react'
import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

import { useState, useEffect } from 'react'

export default function InstalarPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
      <LandingHeader />

      {/* Hero da Página de Instalação */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2E4D] tracking-tight max-w-3xl mx-auto leading-tight">
            Sua agenda sempre à mão
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E7A] max-w-2xl mx-auto leading-relaxed">
            Adicione o Lumê à tela inicial do seu celular e acesse sua rotina com apenas um toque, de onde você estiver — sem ocupar a memória do seu aparelho.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {deferredPrompt && !isInstalled ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#8C5383] hover:bg-[#784370] px-8 py-4 text-sm font-bold text-white shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                <span>Instalar Aplicativo Lumê (1 Toque)</span>
              </button>
            ) : null}

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#3D2E4D] px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-[#2E223B] transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Abrir o Lumê no Celular</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2 Instruções Visuais: iPhone vs Android */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Instalação em 20 segundos</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Escolha o sistema do seu celular
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Siga o passo a passo ilustrado para fixar o Lumê como aplicativo na sua tela principal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Guia iPhone (iOS Safari) */}
            <div className="bg-[#FAF8F5] p-8 sm:p-10 rounded-3xl border border-[#E8DFD8] space-y-6 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-[#E8DFD8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-[#3D2E4D] shadow-2xs">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#3D2E4D]">No iPhone (iOS)</h3>
                    <p className="text-xs text-[#6B5E7A] font-medium">Usando o navegador Safari</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-[#FAF0F5] text-[#8C5383] px-3 py-1 rounded-full border border-[#E8DFD8]">
                  Safari
                </span>
              </div>

              <ol className="space-y-4 text-xs sm:text-sm font-medium text-[#3D2E4D]">
                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong>Abra o Lumê no Safari</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">Acesse o endereço da sua conta pelo navegador Safari no iPhone.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong>Toque em Compartilhar</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">
                      Toque no ícone de quadrado com seta para cima (<Share className="h-3.5 w-3.5 inline text-[#8C5383]" />) na barra inferior da tela.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong>Adicionar à Tela de Início</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">
                      Role as opções para baixo e selecione <PlusSquare className="h-3.5 w-3.5 inline text-[#8C5383]" /> <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong>Confirmar</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">Toque no botão <strong>&quot;Adicionar&quot;</strong> no canto superior direito. Pronto!</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Guia Android (Chrome) */}
            <div className="bg-[#FAF8F5] p-8 sm:p-10 rounded-3xl border border-[#E8DFD8] space-y-6 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-[#E8DFD8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8DFD8] flex items-center justify-center text-emerald-700 shadow-2xs">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#3D2E4D]">No Android</h3>
                    <p className="text-xs text-[#6B5E7A] font-medium">Usando o Google Chrome</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                  Chrome
                </span>
              </div>

              <ol className="space-y-4 text-xs sm:text-sm font-medium text-[#3D2E4D]">
                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong>Abra o Lumê no Chrome</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">Acesse o endereço da sua conta pelo navegador Google Chrome.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong>Toque no menu de 3 pontos</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">
                      Toque no ícone de 3 pontinhos (<MoreVertical className="h-3.5 w-3.5 inline text-[#8C5383]" />) no canto superior direito do navegador.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong>Instalar ou Adicionar</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">
                      Selecione <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80">
                  <span className="h-6 w-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong>Confirmar</strong>
                    <p className="text-[#6B5E7A] text-xs pt-0.5">Confirme tocando em <strong>&quot;Instalar&quot;</strong> ou <strong>&quot;Adicionar&quot;</strong>. O ícone aparecerá junto aos seus apps.</p>
                  </div>
                </li>
              </ol>
            </div>

          </div>

        </div>
      </section>

      {/* Seção "Por que instalar?" */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8C5383]">
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
              <span>Vantagens do Aplicativo</span>
              <span className="w-5 h-0.5 bg-[#8C5383]/50 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Por que adicionar à tela inicial?
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Toda a potência de um app nativo, sem a lentidão nem o consumo de armazenamento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#3D2E4D]">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Acesso com 1 Toque</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                Abra sua agenda em tela cheia direto pelo ícone, sem precisar digitar endereço nem abrir abas no navegador.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#8C5383]">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Próximos Clientes</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                Consulte em segundos qual o próximo procedimento, horários vagos e telefones das clientes do dia.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#8C5383]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Controle Financeiro</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                Veja o faturamento realizado no dia e no mês com números atualizados em tempo real.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8DFD8] shadow-xs space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#3D2E4D]">Memória Livre</h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium">
                Pesa menos de 1 MB e não ocupa a memória de fotos e vídeos do seu smartphone.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Solução de Problemas */}
      <section className="py-16 sm:py-24 bg-white border-t border-[#E8DFD8]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8 text-left">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D]">Solução de dúvidas comuns</h2>
            <p className="text-xs sm:text-sm text-[#6B5E7A]">Se não encontrou a opção de adicionar, veja o que fazer:</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8DFD8] space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-[#3D2E4D] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#8C5383]" />
                <span>Não encontrei o botão de compartilhar no iPhone?</span>
              </h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium pl-6">
                Certifique-se de que está abrindo o link pelo navegador <strong>Safari</strong> nativo da Apple. Se abriu pelo navegador interno do Instagram ou WhatsApp, toque nos 3 pontinhos e selecione &quot;Abrir no Safari&quot;.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8DFD8] space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-[#3D2E4D] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#8C5383]" />
                <span>Não aparece &quot;Instalar aplicativo&quot; no Android?</span>
              </h3>
              <p className="text-xs text-[#6B5E7A] leading-relaxed font-medium pl-6">
                Abra pelo <strong>Google Chrome</strong>. No menu de 3 pontinhos, você também pode usar a opção &quot;Adicionar à tela inicial&quot;, que funciona exatamente da mesma forma.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3D2E4D] p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold max-w-2xl mx-auto leading-tight tracking-tight">
              Leve sua rotina com você.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto leading-relaxed">
              Acesse sua conta ou crie seu teste grátis agora mesmo pelo celular.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#3D2E4D] shadow-lg hover:bg-[#F4EAE4] transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Abrir o Lumê</span>
                <ArrowRight className="h-4 w-4 text-[#3D2E4D]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

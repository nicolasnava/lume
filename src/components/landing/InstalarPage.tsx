'use client'

import {
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
import CornerFillButton from '@/components/ui/CornerFillButton'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function InstalarPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
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
    <div className="landing-motion-scope min-h-screen bg-[#FAF8F5] text-[#3D2E4D] font-sans selection:bg-[#8C5383]/20">
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

          </div>
        </div>
      </section>

      {/* 2 Instruções Visuais: iPhone vs Android com Layout Editorial */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E8DFD8]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C5383]">
              Passo a Passo Rápido • Menos de 20 segundos
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              Como adicionar no seu aparelho
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Siga as instruções diretas de acordo com o modelo do seu celular.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Guia iPhone (iOS Safari) */}
            <div className="space-y-8 text-left">
              <div className="flex items-center justify-between border-b border-[#E8DFD8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#FAF8F5] border border-[#E8DFD8] flex items-center justify-center text-[#3D2E4D]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#3D2E4D]">iPhone (iOS)</h3>
                    <p className="text-xs text-[#6B5E7A]">Pelo navegador Safari</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-[#FAF8F5] text-[#8C5383] px-3 py-1 rounded-full border border-[#E8DFD8]">
                  Safari
                </span>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Abra o Lumê no Safari</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Acesse sua conta ou vitrine no navegador Safari do iPhone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Toque em Compartilhar</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Toque no ícone de quadrado com seta para cima (<Share className="h-3.5 w-3.5 inline text-[#8C5383]" />) na barra inferior central.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Adicionar à Tela de Início</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Role o menu para cima e selecione <PlusSquare className="h-3.5 w-3.5 inline text-[#8C5383]" /> <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-[#3D2E4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Confirmar</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior direito. O ícone oficial do Lumê surgirá na tela.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guia Android (Chrome) */}
            <div className="space-y-8 text-left">
              <div className="flex items-center justify-between border-b border-[#E8DFD8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#3D2E4D]">Android</h3>
                    <p className="text-xs text-[#6B5E7A]">Pelo Google Chrome</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                  Chrome
                </span>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Abra o Lumê no Chrome</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Acesse sua conta ou vitrine pelo Google Chrome no celular.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Toque no menu de 3 pontos</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Toque no ícone (<MoreVertical className="h-3.5 w-3.5 inline text-[#8C5383]" />) no topo direito da tela.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Instalar ou Adicionar</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Escolha <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-[#3D2E4D]">Confirmar</strong>
                    <p className="text-xs text-[#6B5E7A] leading-relaxed">
                      Toque em <strong>&quot;Instalar&quot;</strong> e o aplicativo estará pronto na sua grade de apps.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Vantagens em Layout Editorial Linear com Divisórias */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C5383]">
              Tecnologia PWA • Leve e Rápida
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#3D2E4D] tracking-tight">
              A agilidade de um app nativo, sem complicações
            </h2>
            <p className="text-sm sm:text-base text-[#6B5E7A]">
              Tudo o que você precisa sem ocupar a memória de fotos e vídeos do seu aparelho.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left border-y border-[#E8DFD8] py-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#3D2E4D]">
                <Zap className="h-5 w-5 text-[#8C5383]" />
                <h3 className="text-sm font-bold text-[#3D2E4D]">1 Toque na Tela</h3>
              </div>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Abre em tela cheia direto pelo ícone, sem digitar endereços ou navegar por abas.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#3D2E4D]">
                <Calendar className="h-5 w-5 text-[#8C5383]" />
                <h3 className="text-sm font-bold text-[#3D2E4D]">Visão Rápida do Dia</h3>
              </div>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Consulte horários vagos, próximos procedimentos e contatos das clientes em segundos.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#3D2E4D]">
                <TrendingUp className="h-5 w-5 text-[#8C5383]" />
                <h3 className="text-sm font-bold text-[#3D2E4D]">Financeiro em Tempo Real</h3>
              </div>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Confira recebimentos do dia e saldo acumulado a qualquer instante com dados sincronizados.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#3D2E4D]">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#3D2E4D]">Menos de 1 MB</h3>
              </div>
              <p className="text-xs text-[#6B5E7A] leading-relaxed">
                Não consome memória do aparelho e não exige atualizações manuais na loja de apps.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Dúvidas Frequentes de Instalação */}
      <section className="py-16 sm:py-20 bg-white border-t border-[#E8DFD8]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8 text-left">
          
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C5383]">Suporte</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3D2E4D] tracking-tight">Dúvidas sobre a instalação</h2>
          </div>

          <div className="divide-y divide-[#E8DFD8]">
            <div className="py-5 space-y-1.5">
              <h3 className="text-sm font-bold text-[#3D2E4D] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#8C5383] shrink-0" />
                <span>Não encontrei a opção de compartilhar no iPhone?</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed pl-6">
                Abra o endereço no aplicativo nativo <strong>Safari</strong> (ícone de bússola azul). Caso você tenha aberto através do Instagram ou WhatsApp, clique nos 3 pontinhos e escolha &quot;Abrir no Safari&quot;.
              </p>
            </div>

            <div className="py-5 space-y-1.5">
              <h3 className="text-sm font-bold text-[#3D2E4D] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#8C5383] shrink-0" />
                <span>Não vejo &quot;Instalar aplicativo&quot; no Android?</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E7A] leading-relaxed pl-6">
                Certifique-se de usar o <strong>Google Chrome</strong>. No menu de 3 pontos, a opção &quot;Adicionar à tela inicial&quot; tem exatamente o mesmo efeito de instalação.
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
              <CornerFillButton
                href="/login"
                variant="light"
                className="px-8 py-4 text-sm font-bold shadow-lg"
              >
                <span>Abrir o Lumê</span>
              </CornerFillButton>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

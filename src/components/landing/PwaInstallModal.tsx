'use client'

import { useState, useEffect } from 'react'
import { Smartphone, X, Share, PlusSquare, MoreVertical, Download } from 'lucide-react'

interface PwaInstallModalProps {
  isOpen: boolean
  onClose: () => void
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E8DFD8] space-y-5 text-left">
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#F4EAE4] flex items-center justify-center text-[#8C5383]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3D2E4D]">Instalar o Lumê no Celular</h4>
              <p className="text-[11px] text-[#6B5E7A] font-medium">Atalho direto na sua tela inicial</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Botão de instalação nativa com 1 toque (se suportado pelo navegador) */}
        {deferredPrompt && (
          <div className="bg-[#FAF0F5] p-3.5 rounded-2xl border border-[#ECCAC0] space-y-2 text-center">
            <p className="text-xs font-bold text-[#3D2E4D]">Seu navegador suporta instalação direta!</p>
            <button
              type="button"
              onClick={handleNativeInstall}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#8C5383] hover:bg-[#784370] text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Baixar / Instalar Agora</span>
            </button>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* iPhone (iOS) */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8DFD8] space-y-2">
            <div className="flex items-center gap-2 text-[#3D2E4D] font-bold">
              <Smartphone className="h-3.5 w-3.5 text-[#8C5383]" aria-hidden="true" />
              <span>No iPhone (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[#6B5E7A] font-medium leading-relaxed">
              <li>
                Toque no botão <strong>Compartilhar</strong> (<Share className="h-3 w-3 inline text-[#8C5383]" aria-hidden="true" />) na barra inferior do Safari.
              </li>
              <li>
                Role para baixo e selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong> (<PlusSquare className="h-3 w-3 inline text-[#8C5383]" aria-hidden="true" />).
              </li>
              <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
          </div>

          {/* Android (Chrome) */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8DFD8] space-y-2">
            <div className="flex items-center gap-2 text-[#3D2E4D] font-bold">
              <Smartphone className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>No Android (Chrome)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[#6B5E7A] font-medium leading-relaxed">
              <li>
                Toque no menu de <strong>3 pontos</strong> (<MoreVertical className="h-3 w-3 inline text-[#8C5383]" aria-hidden="true" />) no canto superior.
              </li>
              <li>
                Selecione <strong>&quot;Adicionar à tela inicial&quot;</strong> ou <strong>&quot;Instalar aplicativo&quot;</strong>.
              </li>
              <li>Confirme tocando em <strong>Adicionar</strong>.</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#3D2E4D] text-white font-bold rounded-xl text-xs shadow-md hover:bg-[#2E223B] transition cursor-pointer"
          >
            Entendi
          </button>
        </div>

      </div>
    </div>
  )
}

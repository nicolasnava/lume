'use client'

import { useState, useEffect } from 'react'
import { Megaphone, X } from 'lucide-react'

interface PlatformAnnouncementBannerProps {
  aviso: {
    id: string
    mensagem: string
    tipo: 'info' | 'alerta' | 'manutencao'
  } | null
}

export default function PlatformAnnouncementBanner({ aviso }: PlatformAnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (aviso) {
      const dismissedId = sessionStorage.getItem(`lume_dismissed_aviso_${aviso.id}`)
      if (!dismissedId) {
        setDismissed(false)
      }
    }
  }, [aviso])

  if (!aviso || dismissed) return null

  const handleDismiss = () => {
    sessionStorage.setItem(`lume_dismissed_aviso_${aviso.id}`, 'true')
    setDismissed(true)
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex justify-center md:left-72 md:right-8">
      <div className="pointer-events-auto flex w-full max-w-2xl items-start justify-between gap-3 rounded-2xl border border-[#B8A9D9]/45 bg-[#FAF7F5]/96 px-4 py-3 text-xs font-semibold text-[#4A3F5C] shadow-[0_18px_50px_-24px_rgba(74,63,92,.55)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-start gap-2.5">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[#8675A9]" />
          <span className="leading-relaxed">{aviso.mensagem}</span>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-[#4A3F5C]/55 transition-[transform,color,background-color] duration-150 ease-out hover:bg-[#B8A9D9]/15 hover:text-[#4A3F5C] active:scale-[0.97]"
          title="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

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

  const getStyle = () => {
    switch (aviso.tipo) {
      case 'manutencao':
        return 'bg-rose-900 text-rose-100 border-rose-700'
      case 'alerta':
        return 'bg-amber-900 text-amber-100 border-amber-700'
      case 'info':
      default:
        return 'bg-purple-900 text-purple-100 border-purple-700'
    }
  }

  return (
    <div className={`border-b px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-xs ${getStyle()}`}>
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 shrink-0 animate-bounce" />
        <span>{aviso.mensagem}</span>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 hover:opacity-80 transition cursor-pointer shrink-0"
        title="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

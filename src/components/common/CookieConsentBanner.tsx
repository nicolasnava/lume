'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, X } from 'lucide-react'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('lume_cookie_consent')
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage may be restricted in some private modes
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem('lume_cookie_consent', 'accepted')
    } catch {}
    setVisible(false)
  }

  const handleDecline = () => {
    try {
      localStorage.setItem('lume_cookie_consent', 'declined')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label="Consentimento de Cookies e Privacidade"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-2xl border border-[#E8DFD8] text-left space-y-3.5 relative">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#FAF0F5] text-[#8C5383] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-[#3D2E4D] whitespace-nowrap">
              Privacidade & Cookies
            </h4>
          </div>
          <button
            onClick={handleDecline}
            aria-label="Fechar aviso de cookies"
            className="text-[#6B5E7A] hover:text-[#3D2E4D] p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Descrição */}
        <p className="text-xs text-[#6B5E7A] leading-relaxed">
          Utilizamos cookies essenciais para garantir o funcionamento seguro e rápido da sua agenda. Saiba mais em nossa{' '}
          <Link href="/privacidade" className="text-[#8C5383] font-bold hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>

        {/* Botões: Aceitar todos e Somente essenciais sem quebra de texto */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#3D2E4D] hover:bg-[#2E223B] text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer text-center whitespace-nowrap"
          >
            Aceitar todos
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 text-[#6B5E7A] hover:text-[#3D2E4D] border border-[#E8DFD8] text-[11px] sm:text-xs font-bold transition cursor-pointer text-center whitespace-nowrap"
          >
            Somente essenciais
          </button>
        </div>

      </div>
    </aside>
  )
}

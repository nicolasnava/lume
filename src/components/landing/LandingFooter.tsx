'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#E8DFD8] bg-white py-6 sm:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* LAYOUT MOBILE (sm:hidden): Logo grande centralizada, @2026 Lumê e links nas extremidades */}
        <div className="sm:hidden flex flex-col items-center space-y-4 text-center">
          {/* Logo Centralizada Tamanho Grande */}
          <Link href="/" className="inline-block">
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={140}
              height={42}
              className="h-10 w-auto object-contain mx-auto"
            />
          </Link>

          {/* Linha de Direitos Autorais */}
          <p className="text-xs text-[#6B5E7A] font-medium leading-relaxed max-w-xs mx-auto">
            © {currentYear} Lumê. Todos os direitos reservados.
          </p>

          {/* Links Centralizados no Mobile separados por ponto voador */}
          <div className="flex items-center justify-center gap-2.5 w-full pt-3 border-t border-[#E8DFD8]/70 text-xs font-semibold text-[#3D2E4D]">
            <Link href="/termos" className="hover:text-[#8C5383] transition">
              Termos de Serviço
            </Link>
            <span className="text-[#8C5383]/60 select-none" aria-hidden="true">•</span>
            <Link href="/privacidade" className="hover:text-[#8C5383] transition">
              Política de Privacidade
            </Link>
          </div>
        </div>

        {/* LAYOUT DESKTOP (hidden sm:flex): Linha única limpa */}
        <div className="hidden sm:flex items-center justify-between gap-4 text-xs text-[#6B5E7A]">
          {/* Lado Esquerdo: Logo + Desenvolvido por */}
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-block shrink-0">
              <Image
                src="/assets/lume_logo.webp"
                alt="Lumê"
                width={80}
                height={24}
                className="h-auto w-auto max-h-6 object-contain"
              />
            </Link>
            <span className="text-[#E8DFD8]" aria-hidden="true">•</span>
            <span className="font-medium text-[#6B5E7A]">
              © {currentYear} Lumê. Todos os direitos reservados.
            </span>
          </div>

          {/* Lado Direito: Links de Termos e Privacidade */}
          <div className="flex items-center gap-5 text-xs font-semibold text-[#3D2E4D]">
            <Link href="/termos" className="hover:text-[#8C5383] transition">
              Termos de Serviço
            </Link>
            <span className="text-[#E8DFD8]" aria-hidden="true">•</span>
            <Link href="/privacidade" className="hover:text-[#8C5383] transition">
              Política de Privacidade
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

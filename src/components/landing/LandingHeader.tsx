'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutGrid,
  ArrowRight,
  CreditCard,
  Clock,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  HelpCircle,
  Mail,
  Store,
} from 'lucide-react'
import PwaInstallModal from './PwaInstallModal'

export default function LandingHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pwaModalOpen, setPwaModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DFD8] bg-[#FAF8F5]/90 backdrop-blur-md transition-all">
        {/* Faixa Superior Promocional */}
        <div className="w-full bg-gradient-to-r from-[#2E223B] via-[#4A3F5C] to-[#2E223B] text-white py-2 px-2 sm:px-4 text-center font-medium border-b border-white/10 shadow-xs relative overflow-hidden flex items-center justify-center h-9 sm:h-10">
          <Link
            href="/cadastro"
            className="group inline-flex items-center justify-center flex-nowrap whitespace-nowrap gap-1.5 sm:gap-2.5 transition hover:opacity-95 text-[10px] min-[380px]:text-[11.5px] sm:text-[13px] max-w-full overflow-hidden"
          >
            <span className="text-white/95 font-medium truncate whitespace-nowrap">
              Teste grátis por 30 dias. Sem pagamento nenhum
            </span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 font-bold text-[#2E223B] bg-[#B8A9D9] hover:bg-white px-2 sm:px-2.5 py-0.5 rounded-full transition-all duration-200 shadow-xs text-[9px] sm:text-[11px] shrink-0 whitespace-nowrap">
              <span>Clique aqui</span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#2E223B] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </span>
          </Link>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          
          {/* Logo Lumê à Esquerda */}
          <div className="flex-1 flex items-center justify-start">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/assets/lume_logo.webp"
                alt="Lumê"
                width={130}
                height={40}
                priority
                className="h-auto w-auto max-h-9 object-contain"
              />
            </Link>
          </div>

          {/* Links Desktop Centralizados */}
          <nav className="hidden md:flex items-center justify-center gap-7 text-xs font-semibold text-[#3D2E4D]">
            <Link href="/#simulador" className="hover:text-[#8C5383] transition">
              Simulador
            </Link>
            <Link href="/#dores" className="hover:text-[#8C5383] transition">
              Por que usar
            </Link>
            <Link href="/#recursos" className="hover:text-[#8C5383] transition">
              Recursos
            </Link>
            <Link href="/#como-funciona" className="hover:text-[#8C5383] transition">
              Como funciona
            </Link>
            <Link href="/#precos" className="hover:text-[#8C5383] transition">
              Preços
            </Link>

            {/* Dropdown "Mais" */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onMouseEnter={() => setDropdownOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-[#8C5383] transition py-1 cursor-pointer"
                aria-expanded={dropdownOpen}
              >
                <span>Mais</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-out ${
                    dropdownOpen ? 'rotate-180 text-[#8C5383]' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-50 pointer-events-auto"
                >
                  <div className="lume-smooth-dropdown origin-top-center w-64 rounded-2xl bg-white/98 backdrop-blur-md p-2 shadow-2xl border border-[#E8DFD8] text-xs space-y-0.5 text-left">
                    <Link
                      href="/funcionalidades"
                      onClick={() => setDropdownOpen(false)}
                      className="lume-smooth-dropdown-item flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                    >
                      <LayoutGrid className="h-4 w-4 text-[#8C5383] shrink-0" />
                      <div>
                        <span className="font-bold block">Funcionalidades</span>
                        <span className="text-[10px] text-[#6B5E7A]">Vitrine, agenda e Google Sync</span>
                      </div>
                    </Link>

                    <Link
                      href="/precos"
                      onClick={() => setDropdownOpen(false)}
                      className="lume-smooth-dropdown-item flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                    >
                      <CreditCard className="h-4 w-4 text-[#8C5383] shrink-0" />
                      <div>
                        <span className="font-bold block">Plano e Preços</span>
                        <span className="text-[10px] text-[#6B5E7A]">Conheça os detalhes do plano</span>
                      </div>
                    </Link>

                    <Link
                      href="/jornada-cliente"
                      onClick={() => setDropdownOpen(false)}
                      className="lume-smooth-dropdown-item flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                    >
                      <Clock className="h-4 w-4 text-[#8C5383] shrink-0" />
                      <div>
                        <span className="font-bold block">Jornada da Cliente</span>
                        <span className="text-[10px] text-[#6B5E7A]">Passo a passo simplificado</span>
                      </div>
                    </Link>

                    <Link
                      href="/studio"
                      onClick={() => setDropdownOpen(false)}
                      className="lume-smooth-dropdown-item flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                    >
                      <Store className="h-4 w-4 text-[#8C5383] shrink-0" />
                      <div>
                        <span className="font-bold block">Lumê Studio</span>
                        <span className="text-[10px] text-[#6B5E7A]">Salões & Clínicas compartilhadas</span>
                      </div>
                    </Link>

                    <Link
                      href="/sobre"
                      onClick={() => setDropdownOpen(false)}
                      className="lume-smooth-dropdown-item flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                    >
                      <HelpCircle className="h-4 w-4 text-[#8C5383] shrink-0" />
                      <div>
                        <span className="font-bold block">Sobre o Lumê</span>
                        <span className="text-[10px] text-[#6B5E7A]">Nossa proposta para a beleza</span>
                      </div>
                    </Link>

                    <Link
                      href="/contato"
                      onClick={() => setDropdownOpen(false)}
                      className="lume-smooth-dropdown-item flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                    >
                      <Mail className="h-4 w-4 text-[#8C5383] shrink-0" />
                      <div>
                        <span className="font-bold block">Contato e suporte</span>
                        <span className="text-[10px] text-[#6B5E7A]">Fale com nossa equipe</span>
                      </div>
                    </Link>

                    <Link
                      href="/instalar"
                      onClick={() => setDropdownOpen(false)}
                      className="lume-smooth-dropdown-item w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition text-left cursor-pointer border-t border-[#E8DFD8] mt-1 pt-2"
                    >
                      <Smartphone className="h-4 w-4 text-[#8C5383] shrink-0" />
                      <div>
                        <span className="font-bold block text-[#8C5383]">Instalar no celular</span>
                        <span className="text-[10px] text-[#6B5E7A]">Atalho direto na tela inicial</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Botões de Ação Desktop à Direita */}
          <div className="flex-1 hidden md:flex items-center justify-end gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-xs font-bold text-[#3D2E4D] hover:bg-[#F4EAE4] transition-colors duration-180 ease-out active:scale-[0.97] cursor-pointer"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-[#3D2E4D] hover:bg-[#2E223B] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:shadow-sm transition-all duration-180 ease-out active:scale-[0.97] cursor-pointer"
            >
              <span>Testar agenda grátis</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Ações Mobile: [Entrar] ao lado do [Menu Hamburguer] */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-full border border-[#D8C7BC] bg-white/80 text-xs font-bold text-[#3D2E4D] hover:bg-[#F4EAE4] transition-colors duration-180 ease-out active:scale-[0.97]"
            >
              Entrar
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#3D2E4D] hover:bg-[#F4EAE4] rounded-xl transition"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Expansível */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8DFD8] bg-[#FAF8F5] px-4 py-4 space-y-3 text-sm font-semibold text-[#3D2E4D] animate-in fade-in slide-in-from-top-2">
            <Link
              href="/#simulador"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Simulador
            </Link>
            <Link
              href="/#dores"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Por que usar
            </Link>
            <Link
              href="/#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Recursos
            </Link>
            <Link
              href="/#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Como funciona
            </Link>
            <Link
              href="/#precos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Preços
            </Link>
            <Link
              href="/jornada-cliente"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Jornada da Cliente
            </Link>
            <Link
              href="/studio"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#8C5383] font-bold hover:text-[#4A3F5C]"
            >
              Lumê Studio (Salões & Clínicas)
            </Link>
            <Link
              href="/sobre"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Sobre o Lumê
            </Link>
            <Link
              href="/contato"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Contato e suporte
            </Link>
            <Link
              href="/instalar"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left py-2 text-[#8C5383] font-bold flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              <span>Instalar no celular</span>
            </Link>

            <div className="pt-3 border-t border-[#E8DFD8] flex flex-col gap-2">
              <Link
                href="/cadastro"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-full bg-[#3D2E4D] text-xs font-bold text-white shadow-md"
              >
                Testar minha agenda grátis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Modal PWA Global */}
      <PwaInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />
    </>
  )
}

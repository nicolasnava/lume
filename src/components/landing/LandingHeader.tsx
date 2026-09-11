'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles,
  ArrowRight,
  CreditCard,
  Clock,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  HelpCircle,
  Mail,
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
            <Link href="/#como-funciona" className="hover:text-[#8C5383] transition">
              Como funciona
            </Link>
            <Link href="/#dores" className="hover:text-[#8C5383] transition">
              Por que usar
            </Link>
            <Link href="/funcionalidades" className="hover:text-[#8C5383] transition">
              Recursos
            </Link>
            <Link href="/#simulador" className="hover:text-[#8C5383] transition">
              Simulador
            </Link>
            <Link href="/precos" className="hover:text-[#8C5383] transition">
              Preços
            </Link>

            {/* Dropdown "Mais" */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onMouseEnter={() => setDropdownOpen(true)}
                className="inline-flex items-center gap-1 hover:text-[#8C5383] transition py-1 cursor-pointer"
                aria-expanded={dropdownOpen}
              >
                <span>Mais</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180 text-[#8C5383]' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-[#E8DFD8] z-50 text-xs space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150 text-left"
                >
                  <Link
                    href="/funcionalidades"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <Sparkles className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Funcionalidades</span>
                      <span className="text-[10px] text-[#6B5E7A]">Vitrine, agenda e Google Sync</span>
                    </div>
                  </Link>

                  <Link
                    href="/precos"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <CreditCard className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Plano e Preços</span>
                      <span className="text-[10px] text-[#6B5E7A]">Conheça os detalhes do plano</span>
                    </div>
                  </Link>

                  <Link
                    href="/jornada-cliente"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <Clock className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Jornada da Cliente</span>
                      <span className="text-[10px] text-[#6B5E7A]">Passo a passo simplificado</span>
                    </div>
                  </Link>

                  <Link
                    href="/sobre"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <HelpCircle className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Sobre o Lumê</span>
                      <span className="text-[10px] text-[#6B5E7A]">Nossa proposta para a beleza</span>
                    </div>
                  </Link>

                  <Link
                    href="/contato"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition"
                  >
                    <Mail className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block">Contato e suporte</span>
                      <span className="text-[10px] text-[#6B5E7A]">Fale com nossa equipe</span>
                    </div>
                  </Link>

                  <Link
                    href="/instalar"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-[#3D2E4D] hover:bg-[#FAF8F5] transition text-left cursor-pointer border-t border-[#E8DFD8] mt-1 pt-2"
                  >
                    <Smartphone className="h-4 w-4 text-[#8C5383]" />
                    <div>
                      <span className="font-bold block text-[#8C5383]">Instalar no celular</span>
                      <span className="text-[10px] text-[#6B5E7A]">Atalho direto na tela inicial</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Botões de Ação Desktop à Direita */}
          <div className="flex-1 hidden md:flex items-center justify-end gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-xs font-bold text-[#3D2E4D] hover:bg-[#F4EAE4] transition cursor-pointer"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#3D2E4D] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#2E223B] transition cursor-pointer"
            >
              <span>Testar agenda grátis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Ações Mobile: [Entrar] ao lado do [Menu Hamburguer] */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-full border border-[#D8C7BC] bg-white/80 text-xs font-bold text-[#3D2E4D] hover:bg-[#F4EAE4] transition"
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
              href="/#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Como funciona
            </Link>
            <Link
              href="/#dores"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Por que usar
            </Link>
            <Link
              href="/funcionalidades"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Recursos
            </Link>
            <Link
              href="/#simulador"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#8C5383]"
            >
              Simulador
            </Link>
            <Link
              href="/precos"
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

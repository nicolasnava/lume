'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  ArrowLeft,
  Menu,
  X,
  Bot,
  Bell,
  LogOut,
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Sliders,
} from 'lucide-react'

import AdminAiChatDrawer from './AdminAiChatDrawer'

interface AdminSidebarLayoutClientProps {
  admin: {
    id: string
    nome: string
    email: string
  }
  children: React.ReactNode
}

export default function AdminSidebarLayoutClient({
  admin,
  children,
}: AdminSidebarLayoutClientProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Painel admin sempre em modo escuro
  useEffect(() => {
    const handleOpenAi = () => setIsChatOpen(true)
    window.addEventListener('open-admin-ai-chat', handleOpenAi)
    document.documentElement.classList.add('dark')
    return () => {
      window.removeEventListener('open-admin-ai-chat', handleOpenAi)
    }
  }, [])

  const navItems = [
    {
      label: 'Visão Geral',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      label: 'Profissionais',
      href: '/admin/profissionais',
      icon: Users,
      active: pathname.startsWith('/admin/profissionais'),
    },
    {
      label: 'Estúdios',
      href: '/admin/estudios',
      icon: Building2,
      active: pathname.startsWith('/admin/estudios'),
    },
    {
      label: 'Receita',
      href: '/admin/financeiro',
      icon: CreditCard,
      active: pathname === '/admin/financeiro',
    },
    {
      label: 'Retenção',
      href: '/admin/retencao',
      icon: TrendingUp,
      active: pathname === '/admin/retencao',
    },
    {
      label: 'Avisos',
      href: '/admin/avisos',
      icon: Bell,
      active: pathname === '/admin/avisos',
    },
    {
      label: 'Segurança',
      href: '/admin/seguranca',
      icon: ShieldCheck,
      active: pathname.startsWith('/admin/seguranca'),
    },
    {
      label: 'Configurações',
      href: '/admin/configuracoes',
      icon: Sliders,
      active: pathname.startsWith('/admin/configuracoes'),
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F5] dark:bg-[#0E0B14] text-slate-800 dark:text-[#F8F5FA] flex flex-col md:flex-row antialiased font-sans transition-colors duration-200">
      {/* 1. SIDEBAR LATERAL FIXA À ESQUERDA (ESTILO LUMÊ LUXO REFINADO) */}
      <aside className="hidden md:flex w-68 flex-col justify-between p-4 sticky top-0 h-screen shrink-0 bg-white dark:bg-[#15111F] border-r border-gray-200/80 dark:border-white/[0.08] shadow-2xs overflow-y-auto">
        <div className="space-y-6">
          {/* Logo Oficial do Lumê (versão clara) */}
          <div className="px-2 pt-2 flex items-center">
            <Link href="/admin" className="flex items-center">
              <Image
                src="/assets/logo_branca.webp"
                alt="Lumê"
                width={140}
                height={42}
                priority
                className="h-auto w-auto max-h-9 object-contain"
              />
            </Link>
          </div>

          {/* Menu Contínuo com Botões Ampliados e Confortáveis */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-tight transition duration-150 active:scale-[0.98] ${
                    item.active
                      ? 'bg-[#B8A9D9]/[0.16] border-l-[3px] border-[#B8A9D9] text-[#4A3F5C] dark:text-[#F8F5FA] font-bold rounded-r-xl'
                      : 'text-gray-600 dark:text-[#A9A1B5] hover:bg-gray-100/80 dark:hover:bg-white/[0.05] hover:text-[#4A3F5C] dark:hover:text-[#F8F5FA] rounded-xl'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      item.active
                        ? 'text-[#8675A9] dark:text-[#B8A9D9]'
                        : 'text-gray-400 dark:text-[#A9A1B5] group-hover:text-[#4A3F5C] dark:group-hover:text-[#F8F5FA]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* RODAPÉ DA SIDEBAR: ASSISTENTE LUMÊ, PERFIL DO ADMIN & TEMA */}
        <div className="border-t border-gray-100 dark:border-white/[0.08] pt-3.5 space-y-2.5">
          {/* Botão Assistente Lumê (Desacoplado) */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#18141F] hover:bg-gray-100 dark:hover:bg-[#201b2a] border border-gray-200 dark:border-white/[0.08] text-[#4A3F5C] dark:text-[#F8F5FA] transition cursor-pointer shadow-2xs group text-left"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative shrink-0">
                <Image
                  src="/assets/ai.webp"
                  alt="Assistente Lumê"
                  width={22}
                  height={22}
                  className="w-5 h-5 object-contain rounded-full"
                />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#34D399] rounded-full border border-white dark:border-[#15111F]" />
              </div>
              <div className="overflow-hidden min-w-0">
                <span className="block text-xs font-bold text-[#4A3F5C] dark:text-[#F8F5FA] truncate">Assistente Lumê</span>
                <span className="block text-[10px] text-gray-500 dark:text-[#A9A1B5] truncate">Receita, retenção e operação</span>
              </div>
            </div>
            <Bot className="h-4 w-4 text-[#8675A9] dark:text-[#B8A9D9] group-hover:scale-110 transition shrink-0 ml-1" />
          </button>

          {/* Perfil do Administrador Logado */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#18141F] border border-gray-200 dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-7 w-7 rounded-full bg-[#B8A9D9]/20 border border-[#B8A9D9]/30 text-[#4A3F5C] dark:text-[#F8F5FA] font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {admin.nome ? admin.nome.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-[#4A3F5C] dark:text-[#F8F5FA] truncate">
                  {admin.nome || 'Nicolas Nava'}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-[#A9A1B5] truncate">
                  Administrador Geral
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/geral"
              title="Voltar ao App"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#F8F5FA] transition shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. TOPBAR MOBILE */}
      <header className="flex md:hidden items-center justify-between border-b border-gray-200/80 dark:border-white/[0.08] px-4 py-3 sticky top-0 z-30 bg-white dark:bg-[#15111F] shadow-2xs">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/assets/logo_branca.webp"
              alt="Lumê"
              width={120}
              height={36}
              priority
              className="h-auto w-auto max-h-8 object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Assistente IA no Mobile */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            title="Assistente IA"
            className="p-2 rounded-xl bg-[#B8A9D9]/20 dark:bg-[#171520] border border-[#B8A9D9]/40 dark:border-white/[0.07] text-[#4A3F5C] dark:text-white hover:bg-[#B8A9D9]/30 dark:hover:bg-[#1c1926] transition cursor-pointer flex items-center justify-center shadow-2xs"
          >
            <Image
              src="/assets/ai.webp"
              alt="IA"
              width={18}
              height={18}
              className="w-4.5 h-4.5 rounded-full object-contain"
            />
          </button>

          {/* Botão Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#FAF7F5] dark:bg-[#171520] border border-gray-200 dark:border-white/[0.07] text-[#4A3F5C] dark:text-[#EAE5F3] hover:bg-gray-100 dark:hover:bg-[#1f1c2b] transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* MENU MOBILE EXPANSÍVEL */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 dark:border-white/[0.07] p-4 space-y-1.5 fixed top-[53px] left-0 right-0 z-50 bg-white/98 dark:bg-[#121019]/98 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-120px)] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition duration-150 ${
                  item.active
                    ? 'bg-[#B8A9D9]/20 text-[#4A3F5C] dark:text-white font-bold border-l-2 border-[#B8A9D9]'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/[0.04] hover:text-[#4A3F5C] dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 ${
                    item.active ? 'text-[#8675A9] dark:text-[#B8A9D9]' : 'text-gray-400 dark:text-[#94a3b8]'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.07]">
            <Link
              href="/dashboard/geral"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#4A3F5C] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao App Lumê</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. CONTEÚDO PRINCIPAL DO ADMIN */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-20 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* 4. MENU NO RODAPÉ MOBILE (BOTTOM NAVIGATION BAR FIXA) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#15111F]/95 backdrop-blur-md border-t border-gray-200 dark:border-white/[0.08] flex items-center justify-around px-2 py-2 safe-area-pb shadow-lg">
        <Link
          href="/admin"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition active:scale-[0.95] ${
            pathname === '/admin' ? 'text-[#B8A9D9] font-bold' : 'text-gray-500 dark:text-[#A9A1B5]'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Visão Geral</span>
        </Link>
        <Link
          href="/admin/profissionais"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition active:scale-[0.95] ${
            pathname.startsWith('/admin/profissionais') ? 'text-[#B8A9D9] font-bold' : 'text-gray-500 dark:text-[#A9A1B5]'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Equipe</span>
        </Link>
        <Link
          href="/admin/financeiro"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition active:scale-[0.95] ${
            pathname === '/admin/financeiro' ? 'text-[#B8A9D9] font-bold' : 'text-gray-500 dark:text-[#A9A1B5]'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Receita</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition active:scale-[0.95] cursor-pointer ${
            mobileMenuOpen ? 'text-[#B8A9D9] font-bold' : 'text-gray-500 dark:text-[#A9A1B5]'
          }`}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span>{mobileMenuOpen ? 'Fechar' : 'Menu'}</span>
        </button>
      </nav>

      {/* DRAWER GLOBAL DO ASSISTENTE IA */}
      <AdminAiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        adminNome={admin.nome}
      />
    </div>
  )
}

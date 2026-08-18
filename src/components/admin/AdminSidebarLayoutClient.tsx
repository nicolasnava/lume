'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  History,
  ArrowLeft,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  BarChart3,
  MessageSquare,
  Megaphone,
  Star,
  Sparkles,
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('lume_admin_theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('dark')
      localStorage.setItem('lume_admin_theme', 'dark')
    }
  }, [])

  useEffect(() => {
    const handleOpenAi = () => setIsChatOpen(true)
    window.addEventListener('open-admin-ai-chat', handleOpenAi)
    return () => window.removeEventListener('open-admin-ai-chat', handleOpenAi)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('lume_admin_theme', nextTheme)
  }

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
      label: 'Financeiro',
      href: '/admin/financeiro',
      icon: DollarSign,
      active: pathname.startsWith('/admin/financeiro'),
    },
    {
      label: 'Análises',
      href: '/admin/analises',
      icon: BarChart3,
      active: pathname.startsWith('/admin/analises'),
    },
    {
      label: 'Feedback',
      href: '/admin/feedback',
      icon: MessageSquare,
      active: pathname.startsWith('/admin/feedback'),
    },
    {
      label: 'Avisos',
      href: '/admin/avisos',
      icon: Megaphone,
      active: pathname.startsWith('/admin/avisos'),
    },
    {
      label: 'NPS',
      href: '/admin/nps',
      icon: Star,
      active: pathname.startsWith('/admin/nps'),
    },
    {
      label: 'Novidades',
      href: '/admin/novidades',
      icon: Sparkles,
      active: pathname.startsWith('/admin/novidades'),
    },
    {
      label: 'Auditoria',
      href: '/admin/logs',
      icon: History,
      active: pathname.startsWith('/admin/logs'),
    },
  ]

  const isDark = theme === 'dark'

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-300 ${
        isDark ? 'bg-[#111111] text-[#F5F5F4] dark' : 'bg-[#FAF7F5] text-slate-800'
      }`}
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* 1. SIDEBAR LATERAL FIXA À ESQUERDA (DARK MODE EXECUTIVO) */}
      <aside
        className={`hidden md:flex w-64 flex-col justify-between p-5 sticky top-0 h-screen shrink-0 border-r transition-colors duration-300 ${
          isDark
            ? 'bg-[#161616] border-white/[0.06] text-[#9C9C9F]'
            : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        <div className="space-y-6">
          {/* Logo Oficial do Lumê */}
          <div className="px-1 pt-1 pb-1">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image
                src={isDark ? '/assets/logo_branca.webp' : '/assets/lume_logo.webp'}
                alt="Lumê Logo Oficial"
                width={125}
                height={38}
                priority
                className="h-auto w-auto max-h-9 object-contain"
              />
            </Link>
          </div>

          {/* Campo de Busca Rápida no Topo da Sidebar */}
          <div className="relative px-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9C9F]" />
            <input
              type="text"
              placeholder="Buscar no painel..."
              className={`w-full rounded-xl text-xs font-medium pl-9 pr-3 py-2 transition border focus:outline-hidden ${
                isDark
                  ? 'bg-[#141416] border-white/[0.08] text-[#F5F5F4] placeholder-[#9C9C9F] focus:border-[#8C5383] shadow-inner'
                  : 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Links de Navegação Lateral */}
          <nav className="space-y-1 px-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition duration-150 ${
                    item.active
                      ? isDark
                        ? 'bg-[#242428] text-[#F5F5F4] font-bold border border-white/[0.1] shadow-xs'
                        : 'bg-purple-900 text-white font-semibold shadow-2xs'
                      : isDark
                      ? 'text-[#9C9C9F] hover:bg-white/[0.04] hover:text-[#F5F5F4]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      item.active
                        ? isDark
                          ? 'text-[#D8B4E2]'
                          : 'text-white'
                        : isDark
                        ? 'text-[#9C9C9F]'
                        : 'text-purple-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* RODAPÉ DA SIDEBAR: TEMA, BOTÃO IA & USUÁRIO */}
        <div
          className={`border-t pt-4 space-y-3 px-1 ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}
        >
          {/* Linha com Botão de Alternar Tema + Botão de Chat com o Assistente IA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-light transition cursor-pointer border ${
                isDark
                  ? 'bg-[#141416] border-white/[0.08] text-[#9C9C9F] hover:bg-[#242428] hover:text-[#F5F5F4]'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Moon className="h-3.5 w-3.5 text-[#D8B4E2] stroke-[1.5]" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-500 stroke-[1.5]" />
                )}
                <span className="font-medium text-[11px]">{isDark ? 'Modo Escuro' : 'Modo Claro'}</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[#9C9C9F]">
                {theme.toUpperCase()}
              </span>
            </button>

            {/* Botão Assistente IA no Desktop ao lado do Tema */}
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              title="Abrir Chat com o Assistente do Chefe"
              className="h-[34px] w-[34px] rounded-xl bg-[#8C5383]/20 hover:bg-[#8C5383]/30 border border-[#8C5383]/40 text-[#D8B4E2] flex items-center justify-center shrink-0 transition cursor-pointer shadow-xs"
            >
              <Image
                src="/assets/ai.webp"
                alt="Assistente IA"
                width={20}
                height={20}
                className="w-5 h-5 object-contain rounded-full"
              />
            </button>
          </div>

          {/* Perfil do Admin Logado */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-xl bg-[#8C5383]/20 text-[#D8B4E2] font-bold flex items-center justify-center text-xs shrink-0 border border-[#8C5383]/30">
                {admin.nome ? admin.nome.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate text-[#F5F5F4]">{admin.nome}</p>
                <p className="text-[10px] font-mono text-[#9C9C9F] truncate">{admin.email}</p>
              </div>
            </div>
          </div>

          {/* Botão Voltar ao App */}
          <Link
            href="/dashboard/geral"
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition border ${
              isDark
                ? 'bg-[#141416] border-white/[0.08] text-[#9C9C9F] hover:bg-[#242428] hover:text-[#F5F5F4]'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Voltar ao App</span>
          </Link>
        </div>
      </aside>

      {/* 2. TOPBAR MOBILE */}
      <header
        className={`flex md:hidden items-center justify-between border-b px-4 py-3 sticky top-0 z-30 transition-colors ${
          isDark
            ? 'bg-[#161616] border-white/[0.06] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <Image
            src={isDark ? '/assets/logo_branca.webp' : '/assets/lume_logo.webp'}
            alt="Lumê"
            width={95}
            height={30}
            priority
            className="h-auto w-auto max-h-7 object-contain"
          />
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] text-[#D8B4E2] border border-white/[0.08]">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Chat com a IA no Mobile */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            title="Assistente IA do Chefe"
            className="p-2 rounded-xl bg-[#8C5383]/20 border border-[#8C5383]/30 text-[#D8B4E2] hover:bg-[#8C5383]/30 transition cursor-pointer flex items-center justify-center shadow-xs"
          >
            <Image
              src="/assets/ai.webp"
              alt="IA"
              width={18}
              height={18}
              className="w-4.5 h-4.5 rounded-full object-contain"
            />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#141416] border border-white/[0.08] text-[#9C9C9F] cursor-pointer"
          >
            {isDark ? <Moon className="h-4 w-4 text-[#D8B4E2]" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#141416] border border-white/[0.08] text-[#9C9C9F] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* MENU MOBILE EXPANSÍVEL */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-b p-4 space-y-2 sticky top-[53px] z-20 transition-colors ${
            isDark ? 'bg-[#161616] border-white/[0.06]' : 'bg-white border-slate-200'
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                  item.active
                    ? isDark
                      ? 'bg-[#242428] text-white font-bold border border-white/[0.1]'
                      : 'bg-zinc-800 text-white font-normal'
                    : isDark
                    ? 'text-[#9C9C9F] hover:bg-white/[0.04] hover:text-[#F5F5F4]'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <div className="pt-2 border-t border-white/[0.06]">
            <Link
              href="/dashboard/geral"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#9C9C9F]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao App</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. CONTEÚDO PRINCIPAL DO ADMIN */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* DRAWER GLOBAL DO ASSISTENTE IA */}
      <AdminAiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        adminNome={admin.nome}
      />
    </div>
  )
}

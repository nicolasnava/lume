'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Calendar,
  Users,
  Scissors,
  Clock,
  User,
  DollarSign,
  Star,
  Plus,
  MoreHorizontal,
  X,
  LogOut,
  Bell,
  MessageSquare,
  Building2,
  BarChart2,
} from 'lucide-react'
import NewBookingModal from './NewBookingModal'
import FeedbackModal from './FeedbackModal'
import NovidadesModal from './NovidadesModal'
import { getNovidades } from '@/app/actions/adminPrompt34'

interface DashboardNavProps {
  mobile?: boolean
}

const NAV_ITEMS = [
  // Par 1: Início / Agenda
  {
    name: 'Início',
    href: '/dashboard/geral',
    icon: Home,
  },
  {
    name: 'Agenda',
    href: '/dashboard/agenda',
    icon: Calendar,
  },
  // Par 2: Financeiro / Relatórios
  {
    name: 'Financeiro',
    href: '/dashboard/financeiro',
    icon: DollarSign,
  },
  {
    name: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: BarChart2,
  },
  // Par 3: Clientes / Avaliações
  {
    name: 'Clientes',
    href: '/dashboard/clientes',
    icon: Users,
  },
  {
    name: 'Avaliações',
    href: '/dashboard/avaliacoes',
    icon: Star,
  },
  // Par 4: Disponibilidade / Serviços
  {
    name: 'Disponibilidade',
    href: '/dashboard/disponibilidade',
    icon: Clock,
  },
  {
    name: 'Serviços',
    href: '/dashboard/servicos',
    icon: Scissors,
  },
  // Par 5: Studio / Perfil
  {
    name: 'Studio',
    href: '/dashboard/studio',
    icon: Building2,
  },
  {
    name: 'Perfil',
    href: '/perfil',
    icon: User,
  },
]

export default function DashboardNav({ mobile = false }: DashboardNavProps) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isNovidadesOpen, setIsNovidadesOpen] = useState(false)
  const [hasUnreadNovidades, setHasUnreadNovidades] = useState(false)

  useEffect(() => {
    getNovidades().then((list) => {
      if (list.length > 0) {
        const lastSeen = localStorage.getItem('lume_last_seen_novidade')
        if (!lastSeen || lastSeen !== list[0].id) {
          setHasUnreadNovidades(true)
        }
      }
    })

    const handleOpenMore = () => setIsMoreOpen(true)
    const handleCloseMore = () => setIsMoreOpen(false)

    window.addEventListener('lume-tour-open-more', handleOpenMore)
    window.addEventListener('lume-tour-close-more', handleCloseMore)

    return () => {
      window.removeEventListener('lume-tour-open-more', handleOpenMore)
      window.removeEventListener('lume-tour-close-more', handleCloseMore)
    }
  }, [])

  if (mobile) {
    const isGeralActive = pathname === '/dashboard/geral'
    const isAgendaActive = pathname === '/dashboard/agenda' || pathname === '/dashboard'
    const isFinanceiroActive = pathname.startsWith('/dashboard/financeiro')

    return (
      <>
        <div className="flex w-full items-center justify-around py-1">
          {/* 1. Início */}
          <Link
            id="tour-mobile-inicio"
            href="/dashboard/geral"
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              isGeralActive ? 'text-[#4A3F5C] font-bold' : 'text-gray-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isGeralActive ? 'bg-[#B8A9D9]/30 text-[#4A3F5C]' : ''}`}>
              <Home className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5">Início</span>
          </Link>

          {/* 2. Agenda */}
          <Link
            id="tour-mobile-agenda"
            href="/dashboard/agenda"
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              isAgendaActive ? 'text-[#4A3F5C] font-bold' : 'text-gray-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isAgendaActive ? 'bg-[#B8A9D9]/30 text-[#4A3F5C]' : ''}`}>
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5">Agenda</span>
          </Link>

          {/* 3. Botão Central "+" Destacado (Novo Agendamento) */}
          <button
            id="tour-btn-new-booking-mobile"
            type="button"
            onClick={() => setIsNewBookingOpen(true)}
            className="relative -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#4A3F5C] text-white shadow-lg border-2 border-white hover:bg-[#4A3F5C]/90 active:scale-95 transition cursor-pointer"
            title="Novo Agendamento"
          >
            <Plus className="h-6 w-6" />
          </button>

          {/* 4. Financeiro */}
          <Link
            id="tour-mobile-financeiro"
            href="/dashboard/financeiro"
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              isFinanceiroActive ? 'text-[#4A3F5C] font-bold' : 'text-gray-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isFinanceiroActive ? 'bg-[#B8A9D9]/30 text-[#4A3F5C]' : ''}`}>
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5">Financeiro</span>
          </Link>

          {/* 5. Menu "Mais" */}
          <button
            id="tour-mobile-more"
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
              isMoreOpen ? 'text-[#4A3F5C] font-bold' : 'text-gray-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isMoreOpen ? 'bg-[#B8A9D9]/30 text-[#4A3F5C]' : ''}`}>
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5">Mais</span>
          </button>
        </div>

        {/* Modais */}
        <NewBookingModal
          isOpen={isNewBookingOpen}
          onClose={() => setIsNewBookingOpen(false)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        <NovidadesModal isOpen={isNovidadesOpen} onClose={() => setIsNovidadesOpen(false)} />

        {/* Drawer / Sliding Bottom Sheet para "Mais" */}
        {isMoreOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setIsMoreOpen(false)}
            />
            <div className="relative w-full rounded-t-3xl bg-white p-4 sm:p-6 shadow-2xl space-y-3 max-h-[58vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 z-10">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="text-sm sm:text-base font-bold text-[#4A3F5C]">Menu Completo</h3>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  const itemId =
                    item.href === '/dashboard/servicos'
                      ? 'tour-mobile-servicos'
                      : item.href === '/dashboard/disponibilidade'
                      ? 'tour-mobile-disponibilidade'
                      : item.href === '/dashboard/clientes'
                      ? 'tour-mobile-clientes'
                      : item.href === '/dashboard/avaliacoes'
                      ? 'tour-mobile-avaliacoes'
                      : item.href === '/dashboard/studio' || item.href === '/dashboard/estudio'
                      ? 'tour-mobile-estudio'
                      : item.href === '/perfil'
                      ? 'tour-mobile-perfil'
                      : undefined

                  return (
                    <Link
                      id={itemId}
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl p-3 text-xs font-semibold border transition cursor-pointer ${
                        isActive
                          ? 'bg-[#B8A9D9]/25 border-[#B8A9D9] text-[#4A3F5C]'
                          : 'bg-[#FAF7F5] border-gray-200/80 text-gray-700 hover:bg-white hover:border-[#B8A9D9]'
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#4A3F5C] shadow-2xs">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Botão de Enviar Feedback no Mobile */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false)
                    setIsFeedbackOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 p-3 text-xs font-bold text-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span>Enviar Feedback</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false)
                    setHasUnreadNovidades(false)
                    setIsNovidadesOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <Bell className="h-4 w-4 text-purple-600" />
                  <span>Central de Novidades</span>
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair da Conta</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Visualização Desktop Sidebar
  return (
    <div className="space-y-2">
      {/* Novidades e Feedback (Sem linha divisória, exatamente igual à foto) */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => {
            setHasUnreadNovidades(false)
            setIsNovidadesOpen(true)
          }}
          className="relative inline-flex items-center gap-2 text-xs font-bold text-[#4A3F5C] hover:text-purple-700 transition cursor-pointer"
          title="Ver novidades e atualizações"
        >
          <div className="relative">
            <Bell className="h-3.5 w-3.5 text-purple-600" />
            {hasUnreadNovidades && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span>Novidades</span>
        </button>

        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 rounded-xl transition cursor-pointer"
        >
          Feedback
        </button>
      </div>

      {/* Lista dos 10 Itens de Navegação com espaçamento e cantos arredondados idênticos à foto */}
      <nav className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          const itemId =
            item.href === '/dashboard/geral'
              ? 'tour-nav-inicio'
              : item.href === '/dashboard/agenda'
              ? 'tour-nav-agenda'
              : item.href === '/dashboard/financeiro'
              ? 'tour-nav-financeiro'
              : item.href === '/dashboard/relatorios'
              ? 'tour-nav-relatorios'
              : item.href === '/dashboard/clientes'
              ? 'tour-nav-clientes'
              : item.href === '/dashboard/avaliacoes'
              ? 'tour-nav-avaliacoes'
              : item.href === '/dashboard/servicos'
              ? 'tour-nav-servicos'
              : item.href === '/dashboard/disponibilidade'
              ? 'tour-nav-disponibilidade'
              : item.href === '/dashboard/studio' || item.href === '/dashboard/estudio'
              ? 'tour-nav-estudio'
              : item.href === '/perfil'
              ? 'tour-nav-perfil'
              : undefined

          return (
            <Link
              id={itemId}
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-[#B8A9D9]/25 text-[#4A3F5C] font-bold shadow-2xs'
                  : 'text-gray-600 font-semibold hover:bg-gray-100/80 hover:text-[#4A3F5C]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#4A3F5C]' : 'text-gray-400'}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <NovidadesModal isOpen={isNovidadesOpen} onClose={() => setIsNovidadesOpen(false)} />
    </div>
  )
}

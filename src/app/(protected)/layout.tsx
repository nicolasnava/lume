import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfissional } from '@/lib/profissionais/getOrCreateProfissional'
import { recordLoginLog, getActiveAvisoPlataforma } from '@/app/actions/adminPrompt34'
import DashboardNav from '@/components/dashboard/DashboardNav'
import PlatformAnnouncementBanner from '@/components/dashboard/PlatformAnnouncementBanner'
import NpsSurveyModal from '@/components/dashboard/NpsSurveyModal'
import { getContrastingTextColor, getLightTint } from '@/lib/utils/contrast'
import { ExternalLink, User as UserIcon, AlertTriangle, ShieldAlert, LogOut, Smartphone } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Executar buscas de layout em paralelo para carregamento instantâneo
  const [profissional, ativoAviso] = await Promise.all([
    getOrCreateProfissional(user.id, user.user_metadata?.nome),
    getActiveAvisoPlataforma(),
  ])

  // Fire-and-forget não-bloqueante para registro de log
  recordLoginLog(user.id).catch(() => {})

  // Se a conta tiver sido desativada por Soft Delete, bloquear acesso
  if (profissional?.deletado_em) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Conta Desativada</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Esta conta foi desativada e seus dados estão programados para exclusão em conformidade com a LGPD. Se deseja reativá-la, entre em contato com o suporte oficial.
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da Sessão</span>
            </button>
          </form>
        </div>
      </div>
    )
  }

  const corPrimaria = profissional?.cor_primaria || '#FAF7F5'
  const textColor = getContrastingTextColor(corPrimaria)

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-between selection:bg-[#B8A9D9]/30">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 p-4 justify-between z-30 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <Image
                src="/assets/lume_logo.webp"
                alt="Lumê"
                width={120}
                height={36}
                priority
                className="h-auto w-auto max-h-9 object-contain"
              />
            </div>

            {/* Banner de Página Pública Customizada */}
            {profissional && (
              <div
                id="tour-public-link-desktop"
                className="rounded-xl p-3 shadow-2xs border transition-all duration-300"
                style={{
                  backgroundColor: corPrimaria,
                  borderColor: getLightTint(corPrimaria, 40),
                }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-80"
                  style={{ color: textColor }}
                >
                  Sua Página Pública
                </span>
                <Link
                  href={`/p/${profissional.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition truncate max-w-full hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <span className="truncate">/p/{profissional.slug}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" style={{ color: textColor }} />
                </Link>
              </div>
            )}

            {/* Links de Navegação Principal */}
            <DashboardNav />
          </div>

          {/* Rodapé da Sidebar - Usuário & Logout */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#B8A9D9]/40 bg-gray-100">
                {profissional?.foto_url ? (
                  <Image
                    src={profissional.foto_url}
                    alt={profissional.nome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#4A3F5C]/50">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-[#4A3F5C] truncate">{profissional?.nome}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Topbar Mobile */}
        <header className="flex md:hidden items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={100}
              height={32}
              priority
              className="h-auto w-auto max-h-8 object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            {profissional && (
              <Link
                id="tour-public-link-mobile"
                href={`/p/${profissional.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-lg bg-[#FAF7F5] px-2.5 py-1.5 text-xs font-semibold text-[#4A3F5C] border border-[#B8A9D9]/40"
              >
                <span>Ver Página</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </header>

        {/* Conteúdo Principal das Páginas */}
        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <main className="flex-1 pb-20 md:pb-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Banner de Aviso Ativo da Plataforma */}
            <PlatformAnnouncementBanner aviso={ativoAviso} />

            {profissional?.status_conta === 'suspensa' && (
              <div className="mb-6 mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-rose-900 shadow-2xs">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs font-medium space-y-0.5">
                  <strong className="font-extrabold block text-rose-950">Conta Temporariamente Suspensa</strong>
                  <p>
                    Sua página pública de agendamento está indisponível para novos agendamentos no momento. Você ainda tem acesso total ao seu painel para consultar seus dados. Entre em contato com a equipe de suporte para solicitar a reativação.
                  </p>
                </div>
              </div>
            )}
            {children}
          </main>
        </div>

        {/* Bottom Bar Mobile */}
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 py-1 justify-around shadow-lg">
          <DashboardNav mobile />
        </nav>
      </div>

      {/* Modal de Pesquisa NPS (Exibido no máximo 1x a cada 30 dias) */}
      <NpsSurveyModal />
    </div>
  )
}

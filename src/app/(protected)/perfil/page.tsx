import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfissional } from '@/lib/profissionais/getOrCreateProfissional'
import { getProfissionalSubscriptionData } from '@/app/actions/subscription'
import ProfileTabsWrapper from '@/components/profile/ProfileTabsWrapper'
import { LogOut, UserCheck, AlertCircle } from 'lucide-react'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar perfil e dados de assinatura em paralelo
  const [profissional, subscriptionData] = await Promise.all([
    getOrCreateProfissional(user.id, user.user_metadata?.nome),
    getProfissionalSubscriptionData().catch((err) => {
      console.warn('[PerfilPage] Erro ao carregar dados de assinatura:', err)
      return null
    }),
  ])

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/60">
            <UserCheck className="h-4 w-4 text-[#B8A9D9]" />
            <span>Painel Profissional</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#4A3F5C]">
            Configuração da Conta
          </h1>
        </div>

        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-gray-500" />
            <span>Sair da conta</span>
          </button>
        </form>
      </div>

      {/* Formulário de Edição & Assinatura ou Alerta de Erro */}
      {profissional && subscriptionData ? (
        <ProfileTabsWrapper
          profissional={profissional}
          subscriptionData={subscriptionData}
        />
      ) : (
        <div className="rounded-2xl bg-red-50 p-6 border border-red-200 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Erro ao carregar o perfil</h3>
            <p className="text-xs text-red-700 mt-1">
              Não foi possível consultar ou inicializar os seus dados de perfil no banco de dados. Por favor, recarregue a página ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

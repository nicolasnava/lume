import { redirect } from 'next/navigation'
import { obterDadosEstudioUsuario } from '@/app/actions/estudio'
import { getProfissionalSubscriptionData } from '@/app/actions/subscription'
import StudioDashboardView from '@/components/dashboard/StudioDashboardView'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function DashboardStudioPage() {
  const [status, subscription] = await Promise.all([
    obterDadosEstudioUsuario(),
    getProfissionalSubscriptionData(),
  ])

  if (!status) {
    redirect('/login')
  }

  const studioPrice = subscription.planos.find((plano) => plano.slug === 'studio' && plano.intervalo === 'mensal')?.preco ?? 169

  return <StudioDashboardView status={status} planType={subscription.planoTipo} studioPrice={studioPrice} />
}

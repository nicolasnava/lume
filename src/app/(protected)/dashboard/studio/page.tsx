import { redirect } from 'next/navigation'
import { obterDadosEstudioUsuario } from '@/app/actions/estudio'
import StudioDashboardView from '@/components/dashboard/StudioDashboardView'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function DashboardStudioPage() {
  const status = await obterDadosEstudioUsuario()

  if (!status) {
    redirect('/login')
  }

  return <StudioDashboardView status={status} />
}

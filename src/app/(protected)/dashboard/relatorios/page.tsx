import { getRelatoriosEMetasAction } from '@/app/actions/reports'
import RelatoriosViewClient from '@/components/dashboard/RelatoriosViewClient'
import DashboardDataError from '@/components/dashboard/DashboardDataError'

export const metadata = {
  title: 'Relatórios & Metas | Lumê',
  description: 'Acompanhe seu faturamento, ritmo diário e histórico mensal no Lumê.',
}

export default async function RelatoriosPage() {
  const data = await getRelatoriosEMetasAction()

  if (!data.success || !data.mesAtual) {
    // Se não autenticado, middleware redireciona ou fallback
    return <DashboardDataError message={data.message || 'Não foi possível consultar os relatórios e indicadores financeiros.'} />
  }

  return (
    <RelatoriosViewClient
      initialMesAtual={data.mesAtual}
      initialHistorico={data.historicoMesesFechados || []}
    />
  )
}

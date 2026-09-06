import { getRelatoriosEMetasAction } from '@/app/actions/reports'
import RelatoriosViewClient from '@/components/dashboard/RelatoriosViewClient'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Relatórios & Metas | Lumê',
  description: 'Acompanhe seu faturamento, ritmo diário e histórico mensal no Lumê.',
}

export default async function RelatoriosPage() {
  const data = await getRelatoriosEMetasAction()

  if (!data.success || !data.mesAtual) {
    // Se não autenticado, middleware redireciona ou fallback
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Não foi possível carregar os relatórios. Verifique sua conexão e tente novamente.
      </div>
    )
  }

  return (
    <RelatoriosViewClient
      initialMesAtual={data.mesAtual}
      initialHistorico={data.historicoMesesFechados || []}
    />
  )
}

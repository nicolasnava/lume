import { getAdminDashboardData } from '@/app/actions/admin'
import { getAdminAiInsightAction } from '@/app/actions/adminAi'
import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const admin = await getAuthenticatedAdmin()
  const initialData = await getAdminDashboardData({ period: '30dias' })

  let initialAiInsight = 'Operação estável e métricas consolidadas.'
  try {
    const aiRes = await getAdminAiInsightAction()
    if (aiRes?.insight) {
      initialAiInsight = aiRes.insight
    }
  } catch (e) {
    console.warn('[AdminDashboardPage] Falha ao gerar insight inicial com IA:', e)
  }

  return (
    <AdminDashboardClient
      initialData={initialData}
      adminNome={admin?.nome || 'Admin'}
      initialAiInsight={initialAiInsight}
    />
  )
}

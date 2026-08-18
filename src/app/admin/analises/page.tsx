import { getAdminAnalyticsData } from '@/app/actions/admin'
import AdminAnalisesClient from '@/components/admin/AdminAnalisesClient'

export const dynamic = 'force-dynamic'

export default async function AdminAnalisesPage() {
  const analyticsData = await getAdminAnalyticsData()

  return <AdminAnalisesClient initialData={analyticsData} />
}

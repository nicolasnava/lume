import { getAdminLogs } from '@/app/actions/admin'
import AdminLogsClient from '@/components/admin/AdminLogsClient'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const initialData = await getAdminLogs()

  return <AdminLogsClient initialData={initialData} />
}

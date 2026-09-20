import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect } from 'next/navigation'
import AdminSegurancaClient from '@/components/admin/AdminSegurancaClient'
import { getAdminLogs } from '@/app/actions/admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Segurança | Lumê Admin',
  description: 'Acessos administrativos, autenticação em duas etapas e auditoria.',
}

export default async function AdminSegurancaPage() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const logsData = await getAdminLogs().catch(() => ({
    logs: [],
    adminsList: [],
    profsList: [],
  }))

  return <AdminSegurancaClient currentAdmin={admin} initialLogsData={logsData} />
}

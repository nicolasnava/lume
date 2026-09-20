import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect } from 'next/navigation'
import AdminAvisosClient from '@/components/admin/AdminAvisosClient'
import { getAdminAvisos, getNovidades } from '@/app/actions/adminPrompt34'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Avisos | Lumê Admin',
  description: 'Criação e histórico de comunicados globais do sistema.',
}

export default async function AdminAvisosPage() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const [avisos, novidades] = await Promise.all([
    getAdminAvisos().catch(() => []),
    getNovidades().catch(() => []),
  ])

  return <AdminAvisosClient initialAvisos={avisos} initialNovidades={novidades} />
}

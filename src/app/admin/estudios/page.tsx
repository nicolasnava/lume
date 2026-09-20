import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect } from 'next/navigation'
import { getAdminStudiosAction } from '@/app/actions/admin'
import AdminEstudiosClient from '@/components/admin/AdminEstudiosClient'

export const metadata = {
  title: 'Estúdios | Lumê Admin',
  description: 'Gestão de estabelecimentos multi-profissionais e licenças.',
}

export default async function AdminEstudiosPage() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const studiosData = await getAdminStudiosAction()

  return <AdminEstudiosClient initialData={studiosData} />
}

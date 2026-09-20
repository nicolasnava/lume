import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect } from 'next/navigation'
import { getAdminProfissionais } from '@/app/actions/admin'
import AdminProfissionaisClient from '@/components/admin/AdminProfissionaisClient'

export const metadata = {
  title: 'Profissionais | Lumê Admin',
  description: 'Gestão cadastral de profissionais e vitrines ativas.',
}

export default async function AdminProfissionaisPage() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const profissionais = await getAdminProfissionais()

  return <AdminProfissionaisClient initialProfissionais={profissionais} />
}

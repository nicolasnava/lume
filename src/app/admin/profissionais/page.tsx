import { getAdminProfissionais } from '@/app/actions/admin'
import AdminProfissionaisClient from '@/components/admin/AdminProfissionaisClient'

export const dynamic = 'force-dynamic'

export default async function AdminProfissionaisPage() {
  const initialProfissionais = await getAdminProfissionais()

  return <AdminProfissionaisClient initialProfissionais={initialProfissionais} />
}

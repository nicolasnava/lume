import { getAdminProfissionalDetail } from '@/app/actions/admin'
import AdminProfissionalDetailClient from '@/components/admin/AdminProfissionalDetailClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function AdminProfissionalDetailPage({ params }: PageProps) {
  const { id } = await params
  const initialData = await getAdminProfissionalDetail(id, { period: '30dias' })

  return <AdminProfissionalDetailClient initialData={initialData} profissionalId={id} />
}

import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect, notFound } from 'next/navigation'
import { getAdminProfissionalDetail } from '@/app/actions/admin'
import AdminProfissionalDetailClient from '@/components/admin/AdminProfissionalDetailClient'

export const metadata = {
  title: 'Detalhes da Profissional | Lumê Admin',
  description: 'Ficha cadastral completa e gestão operacional da profissional.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminProfissionalDetailPage({ params }: PageProps) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const { id } = await params

  try {
    const detailData = await getAdminProfissionalDetail(id)
    return <AdminProfissionalDetailClient initialData={detailData} />
  } catch (error) {
    console.error('[AdminProfissionalDetailPage] Erro ao carregar profissional:', error)
    notFound()
  }
}

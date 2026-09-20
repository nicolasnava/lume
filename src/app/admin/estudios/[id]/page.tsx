import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect, notFound } from 'next/navigation'
import { getAdminStudioDetail } from '@/app/actions/admin'
import AdminEstudioDetailClient from '@/components/admin/AdminEstudioDetailClient'

export const metadata = {
  title: 'Detalhes do Estúdio | Lumê Admin',
  description: 'Gestão da equipe, vitrine compartilhada e modelo operacional do estúdio.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEstudioDetailPage({ params }: PageProps) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const { id } = await params

  try {
    const studioData = await getAdminStudioDetail(id)
    return <AdminEstudioDetailClient initialData={studioData} />
  } catch (error) {
    console.error('[AdminEstudioDetailPage] Erro ao carregar estúdio:', error)
    notFound()
  }
}

import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect } from 'next/navigation'
import AdminConfiguracoesClient from '@/components/admin/AdminConfiguracoesClient'

export const metadata = {
  title: 'Configurações | Lumê Admin',
  description: 'Parâmetros globais da plataforma, planos e integrações.',
}

export default async function AdminConfiguracoesPage() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  return <AdminConfiguracoesClient />
}

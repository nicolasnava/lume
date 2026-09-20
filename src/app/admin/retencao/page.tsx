import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect } from 'next/navigation'
import AdminRetencaoClient from '@/components/admin/AdminRetencaoClient'
import {
  getInactiveProfissionais,
  getAdminFeedbacks,
  getAdminNpsSummary,
} from '@/app/actions/adminPrompt34'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Retenção | Lumê Admin',
  description: 'Saúde da base, prevenção de cancelamentos e NPS.',
}

export default async function AdminRetencaoPage() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const [inactiveProfs, feedbacks, npsSummary] = await Promise.all([
    getInactiveProfissionais(14).catch(() => []),
    getAdminFeedbacks('todos', 'todos').catch(() => []),
    getAdminNpsSummary().catch(() => ({ media: 0, total: 0, respostas: [] })),
  ])

  return (
    <AdminRetencaoClient
      initialInactiveProfissionais={inactiveProfs}
      initialFeedbacks={feedbacks}
      initialNpsSummary={npsSummary}
    />
  )
}

import { getAdminDashboardData } from '@/app/actions/admin'
import { getAdminAiInsightAction } from '@/app/actions/adminAi'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  let initialData: Awaited<ReturnType<typeof getAdminDashboardData>>
  try {
    initialData = await getAdminDashboardData({ period: '30dias' })
  } catch (error) {
    console.error('[AdminDashboardPage] Falha ao carregar os dados do painel:', error)
    return (
      <main className="mx-auto max-w-3xl px-5 py-12 text-[#4A3F5C]">
        <section className="rounded-2xl border border-[#B8A9D9]/40 bg-[#FAF7F5] p-6 sm:p-8">
          <h1 className="text-xl font-semibold">Não foi possível carregar a Visão Geral</h1>
          <p className="mt-2 text-sm text-[#6B5E7A]">
            Os dados do painel não foram carregados. Confira a conexão e tente novamente; nenhum valor de demonstração será exibido.
          </p>
          <Link href="/admin" className="mt-5 inline-flex rounded-xl bg-[#4A3F5C] px-4 py-2.5 text-sm font-medium text-white">
            Tentar novamente
          </Link>
        </section>
      </main>
    )
  }

  let initialAiInsight = 'Ainda não há um insight disponível para este período.'
  try {
    const aiRes = await getAdminAiInsightAction()
    if (aiRes?.insight) {
      initialAiInsight = aiRes.insight
    }
  } catch (e) {
    console.warn('[AdminDashboardPage] Falha ao gerar insight inicial com IA:', e)
  }

  return (
    <AdminDashboardClient
      initialData={initialData}
      initialAiInsight={initialAiInsight}
    />
  )
}

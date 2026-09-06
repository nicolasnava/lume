import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import BookingWizardPageClient from '@/components/booking/BookingWizardPageClient'
import { getCombosProfissionalAction } from '@/app/actions/combos'

interface PageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    servico?: string
  }>
}

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AgendarPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { servico: servicoIdParam } = await searchParams

  const adminSupabase = createAdminClient()

  // Buscar profissional pelo slug ativo
  const { data: profissional } = await adminSupabase
    .from('profissionais_publico')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle()

  if (!profissional) {
    notFound()
  }

  const prof = profissional as ProfissionalRow

  // Buscar serviços ativos e combos cadastrados
  const [servicosResult, combosResult] = await Promise.all([
    adminSupabase
      .from('servicos')
      .select('*')
      .eq('profissional_id', prof.id)
      .neq('ativo', false)
      .order('nome', { ascending: true }),
    getCombosProfissionalAction(prof.id),
  ])

  const servicos = (servicosResult.data || []) as ServicoRow[]
  const activeCombos = (combosResult || []).filter((c) => c.ativo)

  return (
    <BookingWizardPageClient
      profissional={prof}
      allServicos={servicos}
      allCombos={activeCombos}
      initialServicoId={servicoIdParam}
    />
  )
}

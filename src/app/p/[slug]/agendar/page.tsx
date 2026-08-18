import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import BookingWizardPageClient from '@/components/booking/BookingWizardPageClient'

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

  // Buscar serviços ativos
  const { data: servicosData } = await adminSupabase
    .from('servicos')
    .select('*')
    .eq('profissional_id', prof.id)
    .neq('ativo', false)
    .order('nome', { ascending: true })

  const servicos = (servicosData || []) as ServicoRow[]

  return (
    <BookingWizardPageClient
      profissional={prof}
      allServicos={servicos}
      initialServicoId={servicoIdParam}
    />
  )
}

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import BookingWizardPageClient from '@/components/booking/BookingWizardPageClient'

interface AgendarPageProps {
  params: Promise<{
    slug: string
    profissionalSlug: string
  }>
  searchParams: Promise<{
    servico?: string
  }>
}

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: AgendarPageProps): Promise<Metadata> {
  const { slug, profissionalSlug } = await params
  const adminSupabase = createAdminClient()

  const [{ data: estudio }, { data: profissional }] = await Promise.all([
    adminSupabase.from('estudios').select('nome').ilike('slug', slug).maybeSingle(),
    adminSupabase
      .from('profissionais_publico')
      .select('nome')
      .ilike('slug', profissionalSlug)
      .maybeSingle(),
  ])

  if (!estudio || !profissional) {
    return {
      title: 'Agendamento | Lumê',
    }
  }

  return {
    title: `Agendar com ${profissional.nome} | ${estudio.nome}`,
    description: `Escolha seus serviços e horário para atendimento com ${profissional.nome} no ${estudio.nome}.`,
  }
}

export default async function StudioMemberAgendarPage({ params, searchParams }: AgendarPageProps) {
  const { slug, profissionalSlug } = await params
  const { servico: servicoIdParam } = await searchParams

  const adminSupabase = createAdminClient()

  // 1. Buscar Studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, nome, slug')
    .ilike('slug', slug)
    .maybeSingle()

  if (!estudio) {
    notFound()
  }

  // 2. Buscar Profissional
  const { data: profissional } = await adminSupabase
    .from('profissionais_publico')
    .select('*')
    .ilike('slug', profissionalSlug)
    .maybeSingle()

  if (!profissional) {
    notFound()
  }

  const prof = profissional as ProfissionalRow

  // 3. Validação de segurança e integridade de rota
  if (prof.estudio_id !== estudio.id || prof.ativo_no_estudio !== true) {
    notFound()
  }

  // 4. Buscar serviços ativos
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
      studioContext={{
        nome: estudio.nome,
        slug: estudio.slug,
      }}
    />
  )
}

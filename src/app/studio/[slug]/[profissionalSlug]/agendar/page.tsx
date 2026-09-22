import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import BookingWizardPageClient from '@/components/booking/BookingWizardPageClient'
import { getCombosProfissionalAction } from '@/app/actions/combos'
import { getComandaProdutosAction } from '@/app/actions/comanda'

interface AgendarPageProps {
  params: Promise<{
    slug: string
    profissionalSlug: string
  }>
  searchParams: Promise<{
    servico?: string
    combo?: string
    produto?: string
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
  const { servico: servicoIdParam, combo: comboIdParam, produto: produtoIdParam } = await searchParams

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

  // 3. Validação de integridade de estúdio
  if (prof.estudio_id !== estudio.id || prof.ativo_no_estudio !== true) {
    notFound()
  }

  // 4. Buscar serviços ativos e combos cadastrados
  const [servicosResult, combosResult, comandaProdutos] = await Promise.all([
    adminSupabase
      .from('servicos')
      .select('*')
      .eq('profissional_id', prof.id)
      .neq('ativo', false)
      .order('nome', { ascending: true }),
    getCombosProfissionalAction(prof.id),
    getComandaProdutosAction(prof.id, true),
  ])

  const servicos = (servicosResult.data || []) as ServicoRow[]
  const activeCombos = (combosResult || []).filter((c) => c.ativo)

  return (
    <BookingWizardPageClient
      profissional={prof}
      allServicos={servicos}
      allCombos={activeCombos}
      initialServicoId={servicoIdParam}
      initialComboId={comboIdParam}
      allComandaProdutos={comandaProdutos}
      initialProdutoId={produtoIdParam}
      studioContext={{
        nome: estudio.nome,
        slug: estudio.slug,
      }}
    />
  )
}

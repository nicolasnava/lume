import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import PublicShowcaseView from '@/components/booking/PublicShowcaseView'
import { PublicReviewItem } from '@/components/reviews/PublicReviewsSection'
import { getCombosProfissionalAction } from '@/app/actions/combos'
import { getComandaProdutosAction } from '@/app/actions/comanda'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']
type DisponibilidadeRow = Database['public']['Tables']['disponibilidade']['Row']

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params
  const adminSupabase = createAdminClient()

  // 1. Buscar profissional pelo slug ativo usando profissionais_publico
  const { data: profissional } = await adminSupabase
    .from('profissionais_publico')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle()

  if (!profissional) {
    notFound()
  }

  const prof = profissional as ProfissionalRow

  // 2. Se a profissional pertence a um studio, redirecionar para a localização aninhada sob o studio
  if (prof.estudio_id) {
    const { data: estudio } = await adminSupabase
      .from('estudios')
      .select('slug')
      .eq('id', prof.estudio_id)
      .maybeSingle()

    if (estudio?.slug) {
      redirect(`/studio/${estudio.slug}/${prof.slug}`)
    }
  }

  // 3. Buscar serviços, disponibilidades, avaliações, combos e comanda em paralelo
  const [
    { data: servicosData },
    { data: disponibilidadesData },
    { data: avaliacoesFullData },
    combos,
    comandaProdutos,
  ] = await Promise.all([
    adminSupabase
      .from('servicos')
      .select('*')
      .eq('profissional_id', prof.id)
      .neq('ativo', false)
      .order('nome', { ascending: true }),
    adminSupabase
      .from('disponibilidade')
      .select('*')
      .eq('profissional_id', prof.id),
    adminSupabase
      .from('avaliacoes')
      .select('id, nota, comentario, created_at, agendamentos(clientes(nome), servicos(nome))')
      .eq('profissional_id', prof.id)
      .eq('oculta', false)
      .order('created_at', { ascending: false }),
    getCombosProfissionalAction(prof.id),
    getComandaProdutosAction(prof.id, true),
  ])

  const servicos = (servicosData || []) as ServicoRow[]
  const disponibilidades = (disponibilidadesData || []) as DisponibilidadeRow[]

  const avaliacoes: PublicReviewItem[] = (avaliacoesFullData || []).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ag: any = item.agendamentos
    return {
      id: item.id,
      nota: Number(item.nota),
      comentario: item.comentario,
      created_at: item.created_at,
      clienteNome: ag?.clientes?.nome || 'Cliente',
      servicoNome: ag?.servicos?.nome || 'Atendimento',
    }
  })

  return (
    <PublicShowcaseView
      profissional={prof}
      servicos={servicos}
      disponibilidades={disponibilidades}
      avaliacoes={avaliacoes}
      combos={combos}
      comandaProdutos={comandaProdutos}
    />
  )
}

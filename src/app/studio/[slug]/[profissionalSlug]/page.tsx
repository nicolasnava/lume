import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import PublicShowcaseView from '@/components/booking/PublicShowcaseView'
import { PublicReviewItem } from '@/components/reviews/PublicReviewsSection'

interface MemberPageProps {
  params: Promise<{
    slug: string
    profissionalSlug: string
  }>
}

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']
type DisponibilidadeRow = Database['public']['Tables']['disponibilidade']['Row']

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { slug, profissionalSlug } = await params
  const adminSupabase = createAdminClient()

  const [{ data: estudio }, { data: profissional }] = await Promise.all([
    adminSupabase.from('estudios').select('nome').ilike('slug', slug).maybeSingle(),
    adminSupabase
      .from('profissionais_publico')
      .select('nome, bio, foto_url')
      .ilike('slug', profissionalSlug)
      .maybeSingle(),
  ])

  if (!estudio || !profissional) {
    return {
      title: 'Profissional não encontrada | Lumê',
    }
  }

  const title = `${profissional.nome} | ${estudio.nome} no Lumê`
  const description =
    profissional.bio ||
    `Agende com ${profissional.nome} no ${estudio.nome} de forma simples e rápida.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profissional.foto_url ? [{ url: profissional.foto_url }] : [],
    },
  }
}

export default async function StudioMemberProfilePage({ params }: MemberPageProps) {
  const { slug, profissionalSlug } = await params
  const adminSupabase = createAdminClient()

  // 1. Buscar o Studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, nome, slug')
    .ilike('slug', slug)
    .maybeSingle()

  if (!estudio) {
    notFound()
  }

  // 2. Buscar a profissional pelo slug ativo usando profissionais_publico
  const { data: profissional } = await adminSupabase
    .from('profissionais_publico')
    .select('*')
    .ilike('slug', profissionalSlug)
    .maybeSingle()

  if (!profissional) {
    notFound()
  }

  const prof = profissional as ProfissionalRow

  // 3. Validação de segurança e integridade de rota:
  // Deve pertencer ao studio da URL E estar com ativo_no_estudio = true
  if (prof.estudio_id !== estudio.id || prof.ativo_no_estudio !== true) {
    notFound()
  }

  // 4. Buscar serviços cadastrados e ativos da profissional
  const { data: servicosData } = await adminSupabase
    .from('servicos')
    .select('*')
    .eq('profissional_id', prof.id)
    .neq('ativo', false)
    .order('nome', { ascending: true })

  const servicos = (servicosData || []) as ServicoRow[]

  // 5. Buscar disponibilidades cadastradas
  const { data: disponibilidadesData } = await adminSupabase
    .from('disponibilidade')
    .select('*')
    .eq('profissional_id', prof.id)

  const disponibilidades = (disponibilidadesData || []) as DisponibilidadeRow[]

  // 6. Buscar avaliações recebidas
  const { data: avaliacoesFullData } = await adminSupabase
    .from('avaliacoes')
    .select('id, nota, comentario, created_at, agendamentos(clientes(nome), servicos(nome))')
    .eq('profissional_id', prof.id)
    .order('created_at', { ascending: false })

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
      studioContext={{
        nome: estudio.nome,
        slug: estudio.slug,
      }}
    />
  )
}

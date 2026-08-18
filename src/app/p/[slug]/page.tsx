import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import PublicShowcaseView from '@/components/booking/PublicShowcaseView'
import { PublicReviewItem } from '@/components/reviews/PublicReviewsSection'

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

  // 3. Buscar serviços cadastrados e ativos da profissional
  const { data: servicosData } = await adminSupabase
    .from('servicos')
    .select('*')
    .eq('profissional_id', prof.id)
    .neq('ativo', false)
    .order('nome', { ascending: true })

  const servicos = (servicosData || []) as ServicoRow[]

  // 4. Buscar disponibilidades cadastradas para compor o horário resumido
  const { data: disponibilidadesData } = await adminSupabase
    .from('disponibilidade')
    .select('*')
    .eq('profissional_id', prof.id)

  const disponibilidades = (disponibilidadesData || []) as DisponibilidadeRow[]

  // 5. Buscar avaliações recebidas completas (com dados do agendamento e cliente)
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
    />
  )
}

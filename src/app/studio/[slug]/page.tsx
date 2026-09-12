import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicStudioShowcaseView, {
  PublicStudioData,
  PublicStudioMember,
} from '@/components/studio/PublicStudioShowcaseView'
import { extrairMetadadosStudio, limparBioStudio } from '@/lib/studio/utils'
import { PublicReviewItem } from '@/components/reviews/PublicReviewsSection'

interface StudioPageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: StudioPageProps): Promise<Metadata> {
  const { slug } = await params
  const adminSupabase = createAdminClient()

  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('nome, bio, foto_capa_url')
    .ilike('slug', slug)
    .maybeSingle()

  if (!estudio) {
    return {
      title: 'Studio não encontrado | Lumê',
    }
  }

  const title = `${estudio.nome} | Studio no Lumê`
  const description =
    limparBioStudio(estudio.bio) ||
    `Conheça a equipe e agende seu horário no ${estudio.nome} através do Lumê.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: estudio.foto_capa_url ? [{ url: estudio.foto_capa_url }] : [],
    },
  }
}

export default async function StudioPublicPage({ params }: StudioPageProps) {
  const { slug } = await params
  const adminSupabase = createAdminClient()

  // 1. Buscar studio pelo slug
  const { data: estudioRaw } = await adminSupabase
    .from('estudios')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle()

  if (!estudioRaw) {
    notFound()
  }

  const meta = extrairMetadadosStudio(estudioRaw)
  const estudio: PublicStudioData = {
    ...(estudioRaw as PublicStudioData),
    bio: limparBioStudio(estudioRaw.bio),
    fotos_espaco: meta.fotos_espaco,
    foto_perfil_url: meta.foto_perfil_url,
    instagram: meta.instagram,
    whatsapp: meta.whatsapp,
    endereco: meta.endereco,
  }

  // 2. Buscar todos os membros do studio (para ordenação: ativos primeiro, inativos em preto e branco - Item 20)
  const { data: membrosRaw } = await adminSupabase
    .from('profissionais_publico')
    .select('id, nome, foto_url, slug, categoria, bio, ativo_no_estudio')
    .eq('estudio_id', estudio.id)
    .order('created_at', { ascending: true })

  const membros = (membrosRaw || []) as PublicStudioMember[]

  // 3. Buscar avaliações de clientes das profissionais da equipe (Item 25)
  const memberIds = membros.map((m) => m.id)
  let avaliacoes: PublicReviewItem[] = []
  if (memberIds.length > 0) {
    const { data: avaliacoesData } = await adminSupabase
      .from('avaliacoes')
      .select('id, nota, comentario, created_at, agendamentos(clientes(nome), servicos(nome))')
      .in('profissional_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(30)

    avaliacoes = (avaliacoesData || []).map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ag: any = item.agendamentos
      return {
        id: item.id,
        nota: Number(item.nota),
        comentario: item.comentario,
        created_at: item.created_at,
        agendamentos: {
          clientes: ag?.clientes ? { nome: ag.clientes.nome } : null,
          servicos: ag?.servicos ? { nome: ag.servicos.nome } : null,
        },
      }
    })
  }

  return (
    <PublicStudioShowcaseView
      studio={estudio}
      membros={membros}
      avaliacoes={avaliacoes}
    />
  )
}

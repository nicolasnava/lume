import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicStudioShowcaseView, {
  PublicStudioData,
  PublicStudioMember,
} from '@/components/studio/PublicStudioShowcaseView'
import { extrairFotosEspaco, limparBioStudio } from '@/lib/studio/utils'

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

  const fotos = extrairFotosEspaco(estudioRaw)
  const estudio: PublicStudioData = {
    ...(estudioRaw as PublicStudioData),
    bio: limparBioStudio(estudioRaw.bio),
    fotos_espaco: fotos,
  }

  // 2. Buscar membros ativos do studio (não suspensas, não deletadas)
  const { data: membrosRaw } = await adminSupabase
    .from('profissionais_publico')
    .select('id, nome, foto_url, slug, categoria, bio')
    .eq('estudio_id', estudio.id)
    .eq('ativo_no_estudio', true)
    .order('created_at', { ascending: true })

  const membros = (membrosRaw || []) as PublicStudioMember[]

  return <PublicStudioShowcaseView studio={estudio} membros={membros} />
}

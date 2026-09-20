import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import PublicStudioLandingClient, {
  PublicFeaturedStudio,
} from '@/components/studio/PublicStudioLandingClient'

export const revalidate = 60 // Revalida a cada 1 minuto

export const metadata: Metadata = {
  title: 'Lumê Studio',
  description:
    'Unifique sua equipe em uma única vitrine online. Distribua horários de forma inteligente, gerencie comissões ou aluguel de cadeira e encante suas clientes.',
  openGraph: {
    title: 'Lumê Studio',
    description:
      'A solução completa para salões, spas e espaços multi-profissionais no Lumê.',
  },
}

export default async function StudioHubPage() {
  const adminSupabase = createAdminClient()
  const supabase = await createClient()

  // 1. Verificar se a usuária já está logada
  let currentUser: { id: string; nome: string; estudio_id: string | null } | null = null
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: prof } = await adminSupabase
        .from('profissionais')
        .select('id, nome, estudio_id')
        .eq('id', user.id)
        .maybeSingle()

      if (prof) {
        currentUser = {
          id: prof.id,
          nome: prof.nome,
          estudio_id: prof.estudio_id || null,
        }
      }
    }
  } catch {
    // Continua como visitante deslogado se houver qualquer erro
  }

  // 2. Buscar studios reais cadastrados no Lumê para exibir na vitrine
  const { data: rawStudios } = await adminSupabase
    .from('estudios')
    .select('id, nome, slug, bio, foto_capa_url, cor_primaria, cor_secundaria')
    .order('created_at', { ascending: false })
    .limit(6)

  // 3. Buscar contagem de membros por estúdio
  let studios: PublicFeaturedStudio[] = []

  if (rawStudios && rawStudios.length > 0) {
    const studioIds = rawStudios.map((s) => s.id)

    const { data: membros } = await adminSupabase
      .from('profissionais')
      .select('id, estudio_id')
      .in('estudio_id', studioIds)
      .is('deletado_em', null)

    const countMap: Record<string, number> = {}
    ;(membros || []).forEach((m) => {
      if (m.estudio_id) {
        countMap[m.estudio_id] = (countMap[m.estudio_id] || 0) + 1
      }
    })

    studios = rawStudios.map((s) => ({
      id: s.id,
      nome: s.nome,
      slug: s.slug,
      bio: s.bio,
      foto_capa_url: s.foto_capa_url,
      cor_primaria: s.cor_primaria || '#B8A9D9',
      cor_secundaria: s.cor_secundaria || '#FAF7F5',
      membrosCount: countMap[s.id] || 0,
    }))
  }

  return <PublicStudioLandingClient studios={studios} currentUser={currentUser} />
}

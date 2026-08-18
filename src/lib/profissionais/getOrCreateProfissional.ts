import { createAdminClient } from '@/lib/supabase/admin'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { Database } from '@/lib/supabase/database.types'

type ProfissionalRow = Database['public']['Tables']['profissionais']['Row']

/**
 * Obtém ou cria automaticamente o registro de um profissional no Supabase.
 * Utiliza o adminSupabase para evitar bloqueios por RLS durante a criação inicial do perfil.
 */
export async function getOrCreateProfissional(
  userId: string,
  userName?: string | null
): Promise<ProfissionalRow | null> {
  const adminSupabase = createAdminClient()

  try {
    // 1. Tentar buscar o profissional existente
    const { data: existingProf, error: fetchError } = await adminSupabase
      .from('profissionais')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('[getOrCreateProfissional] Erro ao buscar profissional:', fetchError)
    }

    if (existingProf) {
      return existingProf as ProfissionalRow
    }

    // 2. Se não existir, gerar slug único e criar registro inicial
    const nomeToUse = userName || 'Profissional de Beleza'
    const slug = await generateUniqueSlug(adminSupabase, nomeToUse)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newProf, error: insertError } = await (adminSupabase.from('profissionais') as any)
      .insert([
        {
          id: userId,
          nome: nomeToUse,
          categoria: [],
          slug,
          cor_primaria: '#B8A9D9',
          cor_secundaria: '#FAF7F5',
        },
      ])
      .select('*')
      .single()

    if (insertError) {
      console.error('[getOrCreateProfissional] Erro ao inserir profissional:', insertError)
      // Tentar buscar novamente em caso de corrida ou criação simultânea por trigger
      const { data: retryProf } = await adminSupabase
        .from('profissionais')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      return (retryProf as ProfissionalRow) || null
    }

    return newProf as ProfissionalRow
  } catch (err) {
    console.error('[getOrCreateProfissional] Exceção inesperada:', err)
    return null
  }
}

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Normaliza uma string para o formato de slug válido no Lumê:
 * Converte para minúsculas, remove acentos, substitui espaços e caracteres especiais por hífens.
 */
export function normalizeSlug(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Gera um slug único garantido no banco de dados para novos cadastros.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateUniqueSlug(supabase: SupabaseClient<any, any, any>, baseName: string): Promise<string> {
  const baseSlug = normalizeSlug(baseName) || 'profissional'
  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data } = await supabase
      .from('profissionais')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

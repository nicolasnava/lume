/**
 * Mapeamento centralizado de rótulos amigáveis para as categorias de atuação do Lumê.
 */
export const CATEGORY_MAP: Record<string, { label: string; shortLabel: string }> = {
  cilios: { label: 'Lash Designer (Cílios)', shortLabel: 'Lash Designer' },
  unhas: { label: 'Manicure & Unhas', shortLabel: 'Manicure & Unhas' },
  sobrancelha: { label: 'Micropigmentação & Sobrancelhas', shortLabel: 'Micropigmentação & Sobrancelhas' },
  maquiagem: { label: 'Maquiadora', shortLabel: 'Maquiadora' },
  estetica: { label: 'Esteticista / Cuidados com a Pele', shortLabel: 'Esteticista' },
  cabelo: { label: 'Cabeleireira / Hair Stylist', shortLabel: 'Hair Stylist' },
  outro: { label: 'Outra Especialidade', shortLabel: 'Outra Especialidade' },
}

/**
 * Converte qualquer formato de categoria vindo do banco (array, string JSON, Postgres array ou string isolada)
 * em um array limpo de chaves de categorias.
 */
export function parseCategorias(categoria: unknown): string[] {
  if (!categoria) return []

  if (Array.isArray(categoria)) {
    return categoria.map((c) => String(c).trim()).filter(Boolean)
  }

  if (typeof categoria === 'string') {
    const trimmed = categoria.trim()
    if (!trimmed) return []

    // Tratar JSON string como '["outro"]' ou '["cilios", "unhas"]'
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map((c) => String(c).trim()).filter(Boolean)
        }
      } catch {
        // ignora se não for JSON válido
      }
    }

    // Tratar array no formato Postgres '{"outro"}' ou '{}'
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1).trim()
      if (!inner) return []
      return inner
        .split(',')
        .map((s) => s.replace(/"/g, '').trim())
        .filter(Boolean)
    }

    // Tratar string separada por vírgula "cilios, unhas"
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
    }

    return [trimmed]
  }

  return []
}

/**
 * Retorna o rótulo formatado para exibição a partir da chave interna.
 */
export function getCategoryLabel(key: string, short = false): string {
  const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
  const found = CATEGORY_MAP[cleanKey] || CATEGORY_MAP[key]
  if (found) {
    return short ? found.shortLabel : found.label
  }
  // Se for uma chave não mapeada, formata com letra maiúscula
  if (key === 'outro') return 'Outra Especialidade'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Mapeamento centralizado de modalidades de atendimento.
 */
export const MODALIDADE_MAP: Record<string, { label: string; desc: string }> = {
  studio: { label: 'Studio / Sala Própria', desc: 'Atendimento em espaço comercial dedicado' },
  domicilio: { label: 'Atendimento a Domicílio', desc: 'Atendimento direto na residência da cliente' },
  salao: { label: 'Salão / Espaço Compartilhado', desc: 'Atendimento em salão parceiro' },
}

/**
 * Converte qualquer formato de modalidade vindo do banco em um array limpo de modalidades.
 */
export function parseModalidades(modalidade: unknown): string[] {
  if (!modalidade) return ['studio']

  if (Array.isArray(modalidade)) {
    const list = modalidade.map((m) => String(m).trim()).filter(Boolean)
    return list.length > 0 ? list : ['studio']
  }

  if (typeof modalidade === 'string') {
    const trimmed = modalidade.trim()
    if (!trimmed) return ['studio']

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          const list = parsed.map((m) => String(m).trim()).filter(Boolean)
          return list.length > 0 ? list : ['studio']
        }
      } catch {
        // ignora se não for JSON válido
      }
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1).trim()
      if (!inner) return ['studio']
      const list = inner
        .split(',')
        .map((s) => s.replace(/"/g, '').trim())
        .filter(Boolean)
      return list.length > 0 ? list : ['studio']
    }

    if (trimmed.includes(',')) {
      const list = trimmed.split(',').map((s) => s.trim()).filter(Boolean)
      return list.length > 0 ? list : ['studio']
    }

    return [trimmed]
  }

  return ['studio']
}


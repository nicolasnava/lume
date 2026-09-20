/**
 * Formata nomes para exibição enxuta em listagens e rankings (apenas primeiro nome e sobrenome).
 * No perfil / detalhes completo, o nome integral é preservado.
 */
export function getShortName(fullName: string | null | undefined): string {
  if (!fullName) return 'Sem nome'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return parts.join(' ')

  const connectors = ['de', 'da', 'do', 'dos', 'das', 'e']
  if (connectors.includes(parts[1].toLowerCase()) && parts.length >= 3) {
    return `${parts[0]} ${parts[1]} ${parts[2]}`
  }

  return `${parts[0]} ${parts[1]}`
}

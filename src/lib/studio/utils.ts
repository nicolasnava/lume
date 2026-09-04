export function extrairFotosEspaco(estudio: any): string[] {
  if (Array.isArray(estudio?.fotos_espaco) && estudio.fotos_espaco.length > 0) {
    return estudio.fotos_espaco
  }
  if (estudio?.bio && estudio.bio.includes('<!--LUME_PHOTOS:')) {
    const match = estudio.bio.match(/<!--LUME_PHOTOS:(.*?)-->/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1])
        if (Array.isArray(parsed)) return parsed
      } catch {}
    }
  }
  return []
}

export function limparBioStudio(bio: string | null | undefined): string {
  if (!bio) return ''
  return bio.replace(/<!--LUME_PHOTOS:.*?-->/g, '').trim()
}

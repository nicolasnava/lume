export interface StudioMetadata {
  foto_perfil_url: string | null
  instagram: string | null
  whatsapp: string | null
  endereco: string | null
  fotos_espaco: string[]
}

export function extrairMetadadosStudio(estudio: any): StudioMetadata {
  let foto_perfil_url = estudio?.foto_perfil_url || null
  let instagram = estudio?.instagram || null
  let whatsapp = estudio?.whatsapp || null
  let endereco = estudio?.endereco || estudio?.localizacao || null
  let fotos_espaco: string[] = Array.isArray(estudio?.fotos_espaco) ? estudio.fotos_espaco : []

  if (estudio?.bio && estudio.bio.includes('<!--LUME_STUDIO_META:')) {
    const match = estudio.bio.match(/<!--LUME_STUDIO_META:(.*?)-->/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1])
        if (!foto_perfil_url && parsed.foto_perfil_url) foto_perfil_url = parsed.foto_perfil_url
        if (!instagram && parsed.instagram) instagram = parsed.instagram
        if (!whatsapp && parsed.whatsapp) whatsapp = parsed.whatsapp
        if (!endereco && (parsed.endereco || parsed.localizacao)) endereco = parsed.endereco || parsed.localizacao
        if (fotos_espaco.length === 0 && Array.isArray(parsed.fotos_espaco)) fotos_espaco = parsed.fotos_espaco
      } catch {}
    }
  }

  if (fotos_espaco.length === 0 && estudio?.bio && estudio.bio.includes('<!--LUME_PHOTOS:')) {
    const match = estudio.bio.match(/<!--LUME_PHOTOS:(.*?)-->/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1])
        if (Array.isArray(parsed)) fotos_espaco = parsed
      } catch {}
    }
  }

  return {
    foto_perfil_url,
    instagram,
    whatsapp,
    endereco,
    fotos_espaco,
  }
}

export function extrairFotosEspaco(estudio: any): string[] {
  return extrairMetadadosStudio(estudio).fotos_espaco
}

export function limparBioStudio(bio: string | null | undefined): string {
  if (!bio) return ''
  return bio
    .replace(/<!--LUME_STUDIO_META:.*?-->/g, '')
    .replace(/<!--LUME_PHOTOS:.*?-->/g, '')
    .trim()
}

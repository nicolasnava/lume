'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateProfissional } from '@/lib/profissionais/getOrCreateProfissional'
import { parseCategorias } from '@/lib/utils/categories'
import { extrairFotosEspaco, limparBioStudio } from '@/lib/studio/utils'

export interface StudioMember {
  id: string
  nome: string
  foto_url: string | null
  slug: string
  categoria: string[]
  ativo_no_estudio: boolean
  isOwner: boolean
}

export interface StudioInvite {
  id: string
  estudio_id: string
  tipo: 'link' | 'email'
  codigo: string | null
  email_convidado: string | null
  status: 'pendente' | 'aceito' | 'expirado' | 'cancelado'
  expira_em: string
  created_at: string
}

export interface StudioData {
  id: string
  nome: string
  slug: string
  bio: string | null
  foto_capa_url: string | null
  cor_primaria: string
  cor_secundaria: string
  criado_por: string
  round_robin_ultimo_membro_id: string | null
  created_at: string
  fotos_espaco?: string[]
}

export type StudioUserStatus =
  | {
      papel: 'dona'
      estudio: StudioData
      membros: StudioMember[]
      convites: StudioInvite[]
      ativoNoEstudio: boolean
      donaNaEquipe: boolean
      userSlug: string
    }
  | {
      papel: 'membro'
      estudio: StudioData
      dona: { nome: string; foto_url: string | null }
      ativoNoEstudio: boolean
      userSlug: string
    }
  | {
      papel: 'nenhum'
      userSlug: string
    }

/**
 * 1. Obter dados completos do studio para a usuária autenticada
 */
export async function obterDadosEstudioUsuario(): Promise<StudioUserStatus | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const adminSupabase = createAdminClient()
  const prof = await getOrCreateProfissional(user.id, user.user_metadata?.nome)
  if (!prof) return null

  // 1. Verificar se ela é dona de algum studio
  const { data: estudioDona } = await adminSupabase
    .from('estudios')
    .select('*')
    .eq('criado_por', user.id)
    .maybeSingle()

  if (estudioDona) {
    const fotos = extrairFotosEspaco(estudioDona)
    const estudio = {
      ...estudioDona,
      bio: limparBioStudio(estudioDona.bio),
      fotos_espaco: fotos,
    } as StudioData

    // Verifica se a dona também está vinculada como membro da equipe de atendimento
    const donaNaEquipe = prof.estudio_id === estudio.id

    // Buscar membros vinculados a este studio
    const { data: membrosRaw } = await adminSupabase
      .from('profissionais')
      .select('id, nome, foto_url, slug, categoria, ativo_no_estudio')
      .eq('estudio_id', estudio.id)
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    const membros: StudioMember[] = (membrosRaw || []).map((m) => ({
      id: m.id,
      nome: m.nome,
      foto_url: m.foto_url,
      slug: m.slug,
      categoria: parseCategorias(m.categoria),
      ativo_no_estudio: m.ativo_no_estudio !== false,
      isOwner: m.id === estudio.criado_por,
    }))

    // Buscar convites pendentes e não expirados do studio
    const { data: convitesRaw } = await adminSupabase
      .from('estudio_convites')
      .select('*')
      .eq('estudio_id', estudio.id)
      .eq('status', 'pendente')
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false })

    const convites = (convitesRaw || []) as StudioInvite[]

    return {
      papel: 'dona',
      estudio,
      membros,
      convites,
      ativoNoEstudio: prof.ativo_no_estudio !== false,
      donaNaEquipe,
      userSlug: prof.slug,
    }
  }

  // 2. Verificar se ela é membro de algum studio (não dona)
  if (prof.estudio_id) {
    const { data: estudioMembro } = await adminSupabase
      .from('estudios')
      .select('*')
      .eq('id', prof.estudio_id)
      .maybeSingle()

    if (estudioMembro) {
      const fotos = extrairFotosEspaco(estudioMembro)
      const estudio = {
        ...estudioMembro,
        bio: limparBioStudio(estudioMembro.bio),
        fotos_espaco: fotos,
      } as StudioData

      // Buscar dados da dona
      const { data: donaData } = await adminSupabase
        .from('profissionais')
        .select('nome, foto_url')
        .eq('id', estudio.criado_por)
        .maybeSingle()

      return {
        papel: 'membro',
        estudio,
        dona: {
          nome: donaData?.nome || 'Administradora',
          foto_url: donaData?.foto_url || null,
        },
        ativoNoEstudio: prof.ativo_no_estudio !== false,
        userSlug: prof.slug,
      }
    }
  }

  return {
    papel: 'nenhum',
    userSlug: prof.slug,
  }
}

/**
 * 2. Criar um novo studio
 */
export async function criarEstudio(dados: {
  nome: string
  slug: string
  bio?: string
  foto_capa_url?: string
  cor_primaria?: string
  cor_secundaria?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Você precisa estar autenticada para criar um studio.')
  }

  const adminSupabase = createAdminClient()

  // Validação do nome
  const nomeTrim = dados.nome?.trim()
  if (!nomeTrim || nomeTrim.length < 2) {
    throw new Error('O nome do studio deve ter pelo menos 2 caracteres.')
  }

  // Validação e higienização do slug
  const cleanSlug = dados.slug
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!cleanSlug || cleanSlug.length < 3) {
    throw new Error('O slug do studio deve conter pelo menos 3 letras ou números.')
  }

  // Verificar se o usuário já possui um studio
  const { data: existingStudio } = await adminSupabase
    .from('estudios')
    .select('id')
    .eq('criado_por', user.id)
    .maybeSingle()

  if (existingStudio) {
    throw new Error('Você já é dona de um studio registrado.')
  }

  // Verificar unicidade do slug
  const { data: slugTaken } = await adminSupabase
    .from('estudios')
    .select('id')
    .ilike('slug', cleanSlug)
    .maybeSingle()

  if (slugTaken) {
    throw new Error('Este link (slug) já está em uso por outro studio. Escolha outro.')
  }

  // Inserir studio
  const { data: newStudio, error: insertError } = await adminSupabase
    .from('estudios')
    .insert([
      {
        nome: nomeTrim,
        slug: cleanSlug,
        bio: dados.bio?.trim() || null,
        foto_capa_url: dados.foto_capa_url || null,
        cor_primaria: dados.cor_primaria || '#B8A9D9',
        cor_secundaria: dados.cor_secundaria || '#FAF7F5',
        criado_por: user.id,
      },
    ])
    .select()
    .single()

  if (insertError || !newStudio) {
    console.error('[criarEstudio] Erro ao criar studio:', insertError)
    throw new Error('Erro ao criar studio. Tente novamente.')
  }

  // Vincular a profissional dona ao studio com atendimento ativo
  await adminSupabase
    .from('profissionais')
    .update({
      estudio_id: newStudio.id,
      ativo_no_estudio: true,
    })
    .eq('id', user.id)

  revalidatePath('/dashboard/estudio')
  revalidatePath('/dashboard/geral')
  revalidatePath('/perfil')

  return { success: true, estudio: newStudio }
}

/**
 * 3. Atualizar dados do studio (apenas dona)
 */
export async function atualizarEstudio(dados: {
  id: string
  nome: string
  slug: string
  bio?: string
  foto_capa_url?: string
  cor_primaria?: string
  cor_secundaria?: string
  fotos_espaco?: string[]
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Verificar propriedade
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, criado_por, slug')
    .eq('id', dados.id)
    .single()

  if (!estudio || estudio.criado_por !== user.id) {
    throw new Error('Apenas a administradora do studio pode alterar essas informações.')
  }

  const cleanSlug = dados.slug
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // Verificar se slug mudou e se está disponível
  const { data: slugTaken } = await adminSupabase
    .from('estudios')
    .select('id')
    .ilike('slug', cleanSlug)
    .neq('id', dados.id)
    .maybeSingle()

  if (slugTaken) {
    throw new Error('Este link (slug) já está em uso por outro studio.')
  }

  const cleanBio = limparBioStudio(dados.bio)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    nome: dados.nome.trim(),
    slug: cleanSlug,
    bio: cleanBio || null,
    foto_capa_url: dados.foto_capa_url || null,
    cor_primaria: dados.cor_primaria || '#B8A9D9',
    cor_secundaria: dados.cor_secundaria || '#FAF7F5',
  }

  if (dados.fotos_espaco !== undefined) {
    payload.fotos_espaco = dados.fotos_espaco
  }

  let { error: updateError } = await adminSupabase
    .from('estudios')
    .update(payload)
    .eq('id', dados.id)

  // Fallback resiliente caso a migration ainda não tenha sido rodada no Supabase
  if (updateError && (updateError.code === '42703' || updateError.message?.includes('fotos_espaco'))) {
    delete payload.fotos_espaco
    const fotosMeta = JSON.stringify(dados.fotos_espaco || [])
    payload.bio = cleanBio ? `${cleanBio}\n<!--LUME_PHOTOS:${fotosMeta}-->` : `<!--LUME_PHOTOS:${fotosMeta}-->`
    const retry = await adminSupabase.from('estudios').update(payload).eq('id', dados.id)
    updateError = retry.error
  }

  if (updateError) {
    console.error('[atualizarEstudio] Erro ao atualizar:', updateError)
    throw new Error('Erro ao salvar dados do studio.')
  }

  revalidatePath('/dashboard/studio')
  revalidatePath('/dashboard/estudio')
  revalidatePath(`/studio/${cleanSlug}`)
  revalidatePath(`/estudio/${cleanSlug}`)
  if (estudio.slug !== cleanSlug) {
    revalidatePath(`/studio/${estudio.slug}`)
    revalidatePath(`/estudio/${estudio.slug}`)
  }
  return { success: true }
}

/**
 * 4. Alternar participação da profissional como atendente no studio
 */
export async function alternarAtivoNoEstudio(ativo: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('profissionais')
    .update({ ativo_no_estudio: ativo })
    .eq('id', user.id)

  if (error) {
    console.error('[alternarAtivoNoEstudio] Erro:', error)
    throw new Error('Erro ao atualizar status de atendimento.')
  }

  revalidatePath('/dashboard/estudio')
  return { success: true, ativo }
}

/**
 * 5. Gerar convite por link
 */
export async function gerarConviteLink() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Obter studio do usuário
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id')
    .eq('criado_por', user.id)
    .single()

  if (!estudio) {
    throw new Error('Você precisa ser dona de um studio para gerar links de convite.')
  }

  // Gerar código aleatório seguro
  const codigo = crypto.randomBytes(8).toString('hex')
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: convite, error } = await adminSupabase
    .from('estudio_convites')
    .insert([
      {
        estudio_id: estudio.id,
        tipo: 'link',
        codigo,
        status: 'pendente',
        expira_em: expiraEm,
      },
    ])
    .select()
    .single()

  if (error || !convite) {
    console.error('[gerarConviteLink] Erro ao criar convite:', error)
    throw new Error('Erro ao gerar link de convite.')
  }

  revalidatePath('/dashboard/estudio')
  return { success: true, convite }
}

/**
 * 6. Cancelar convite
 */
export async function cancelarConvite(conviteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Verificar se o convite pertence a um studio onde user é dona
  const { data: convite } = await adminSupabase
    .from('estudio_convites')
    .select('id, estudio_id, estudios(criado_por)')
    .eq('id', conviteId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const est: any = convite?.estudios
  if (!convite || est?.criado_por !== user.id) {
    throw new Error('Você não tem permissão para cancelar este convite.')
  }

  await adminSupabase
    .from('estudio_convites')
    .update({ status: 'cancelado' })
    .eq('id', conviteId)

  revalidatePath('/dashboard/estudio')
  return { success: true }
}

/**
 * 7. Buscar profissional por email (para verificar antes de enviar convite)
 */
export async function buscarProfissionalPorEmail(email: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const emailClean = email.trim().toLowerCase()
  if (!emailClean || !emailClean.includes('@')) {
    throw new Error('Email inválido.')
  }

  const adminSupabase = createAdminClient()

  // Verificar que user é dona de studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id')
    .eq('criado_por', user.id)
    .single()

  if (!estudio) {
    throw new Error('Você não possui um studio ativo.')
  }

  // 1. Tentar chamar a RPC se já criada na migration
  try {
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
      'buscar_profissional_por_email',
      { search_email: emailClean }
    )

    if (!rpcError && rpcData && rpcData.length > 0) {
      const p = rpcData[0]
      return {
        exists: true,
        profissional: {
          id: p.id,
          nome: p.nome,
          foto_url: p.foto_url,
          slug: p.slug,
          email: p.email,
          jaNoEstudio: p.estudio_id === estudio.id,
        },
      }
    }
  } catch {
    // Fallback abaixo
  }

  // 2. Fallback via admin.auth.listUsers
  const { data: usersList } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
  const targetUser = usersList?.users?.find(
    (u) => u.email?.trim().toLowerCase() === emailClean
  )

  if (!targetUser) {
    return { exists: false }
  }

  const { data: targetProf } = await adminSupabase
    .from('profissionais')
    .select('id, nome, foto_url, slug, estudio_id')
    .eq('id', targetUser.id)
    .is('deletado_em', null)
    .maybeSingle()

  if (!targetProf) {
    return { exists: false }
  }

  return {
    exists: true,
    profissional: {
      id: targetProf.id,
      nome: targetProf.nome,
      foto_url: targetProf.foto_url,
      slug: targetProf.slug,
      email: targetUser.email,
      jaNoEstudio: targetProf.estudio_id === estudio.id,
    },
  }
}

/**
 * 8. Enviar convite por email
 */
export async function enviarConviteEmail(email: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const emailClean = email.trim().toLowerCase()
  if (!emailClean) throw new Error('Email obrigatório.')

  const adminSupabase = createAdminClient()

  // Buscar studio da dona
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, nome')
    .eq('criado_por', user.id)
    .single()

  if (!estudio) {
    throw new Error('Apenas a dona do studio pode enviar convites.')
  }

  // Verificar se o email pertence a uma profissional
  const busca = await buscarProfissionalPorEmail(emailClean)
  if (!busca.exists || !busca.profissional) {
    throw new Error(
      'Não encontramos nenhuma profissional cadastrada no Lumê com este email. Peça para ela criar uma conta primeiro!'
    )
  }

  if (busca.profissional.jaNoEstudio) {
    throw new Error('Esta profissional já faz parte da equipe deste studio!')
  }

  // Verificar se já tem convite pendente ativo para este email neste studio
  const { data: conviteExistente } = await adminSupabase
    .from('estudio_convites')
    .select('id')
    .eq('estudio_id', estudio.id)
    .eq('tipo', 'email')
    .ilike('email_convidado', emailClean)
    .eq('status', 'pendente')
    .gt('expira_em', new Date().toISOString())
    .maybeSingle()

  if (conviteExistente) {
    throw new Error('Já existe um convite pendente ativo enviado para este email.')
  }

  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await adminSupabase.from('estudio_convites').insert([
    {
      estudio_id: estudio.id,
      tipo: 'email',
      email_convidado: emailClean,
      status: 'pendente',
      expira_em: expiraEm,
    },
  ])

  if (insertError) {
    console.error('[enviarConviteEmail] Erro:', insertError)
    throw new Error('Erro ao registrar convite por email.')
  }

  revalidatePath('/dashboard/estudio')
  return { success: true, nomeProfissional: busca.profissional.nome }
}

/**
 * 9. Obter convites pendentes recebidos pela profissional logada
 */
export async function obterConvitesPendentesUsuario() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) return []

  const adminSupabase = createAdminClient()
  const userEmail = user.email.trim().toLowerCase()

  const { data: convites } = await adminSupabase
    .from('estudio_convites')
    .select(`
      id,
      estudio_id,
      tipo,
      status,
      expira_em,
      created_at,
      estudios (
        id,
        nome,
        slug,
        foto_capa_url,
        cor_primaria,
        criado_por,
        profissionais!criado_por (nome, foto_url)
      )
    `)
    .eq('tipo', 'email')
    .ilike('email_convidado', userEmail)
    .eq('status', 'pendente')
    .gt('expira_em', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (!convites) return []

  return convites.map((c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const est: any = c.estudios
    return {
      id: c.id,
      estudioId: c.estudio_id,
      estudioNome: est?.nome || 'Studio',
      estudioSlug: est?.slug || '',
      estudioCapa: est?.foto_capa_url || null,
      estudioCorPrimaria: est?.cor_primaria || '#B8A9D9',
      donaNome: est?.profissionais?.nome || 'Administradora',
      donaFoto: est?.profissionais?.foto_url || null,
      expiraEm: c.expira_em,
    }
  })
}

/**
 * 10. Aceitar convite por email
 */
export async function aceitarConviteEmail(conviteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    throw new Error('Você precisa estar logada para aceitar um convite.')
  }

  const adminSupabase = createAdminClient()
  const userEmail = user.email.trim().toLowerCase()

  // Buscar convite
  const { data: convite } = await adminSupabase
    .from('estudio_convites')
    .select('*')
    .eq('id', conviteId)
    .single()

  if (!convite || convite.status !== 'pendente') {
    throw new Error('Este convite não está mais pendente ou já foi utilizado.')
  }

  if (new Date(convite.expira_em) <= new Date()) {
    throw new Error('Este convite expirou.')
  }

  if (convite.email_convidado?.toLowerCase() !== userEmail) {
    throw new Error('Este convite não pertence ao seu email atual.')
  }

  // Verificar se o usuário já é dona de um studio
  const { data: ownStudio } = await adminSupabase
    .from('estudios')
    .select('id')
    .eq('criado_por', user.id)
    .maybeSingle()

  if (ownStudio) {
    throw new Error(
      'Você é dona de outro studio. Não é possível entrar em um studio parceiro enquanto for dona de um studio próprio.'
    )
  }

  // Vincular ao novo studio
  await adminSupabase
    .from('profissionais')
    .update({
      estudio_id: convite.estudio_id,
      ativo_no_estudio: true,
    })
    .eq('id', user.id)

  // Marcar convite como aceito
  await adminSupabase
    .from('estudio_convites')
    .update({ status: 'aceito' })
    .eq('id', conviteId)

  revalidatePath('/dashboard/estudio')
  revalidatePath('/dashboard/geral')
  revalidatePath('/perfil')

  return { success: true, estudioId: convite.estudio_id }
}

/**
 * 11. Recusar convite por email
 */
export async function recusarConviteEmail(conviteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()
  const userEmail = user.email.trim().toLowerCase()

  const { data: convite } = await adminSupabase
    .from('estudio_convites')
    .select('*')
    .eq('id', conviteId)
    .single()

  if (!convite || convite.email_convidado?.toLowerCase() !== userEmail) {
    throw new Error('Não autorizado a recusar este convite.')
  }

  await adminSupabase
    .from('estudio_convites')
    .update({ status: 'cancelado' })
    .eq('id', conviteId)

  revalidatePath('/dashboard/geral')
  revalidatePath('/dashboard/estudio')
  return { success: true }
}

/**
 * 12. Obter dados para a página de convite por link (/convite-estudio/[codigo])
 */
export async function obterDadosConviteLink(codigo: string) {
  const adminSupabase = createAdminClient()

  const { data: convite } = await adminSupabase
    .from('estudio_convites')
    .select(`
      id,
      codigo,
      estudio_id,
      status,
      expira_em,
      tipo,
      estudios (
        id,
        nome,
        slug,
        bio,
        foto_capa_url,
        cor_primaria,
        cor_secundaria,
        criado_por,
        profissionais!criado_por (
          nome,
          foto_url
        )
      )
    `)
    .eq('codigo', codigo)
    .maybeSingle()

  if (!convite) {
    return { status: 'not_found' as const }
  }

  if (convite.status !== 'pendente') {
    return { status: 'invalid' as const }
  }

  if (new Date(convite.expira_em) <= new Date()) {
    return { status: 'expired' as const }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const est: any = convite.estudios
  const donaObj = est?.profissionais

  // Verificar status do usuário atual (se logado)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let usuarioLogado = false
  let jaNoMesmoEstudio = false
  let estudioAtualNome: string | null = null
  let isOwnerOfAnotherStudio = false

  if (user) {
    usuarioLogado = true
    const { data: prof } = await adminSupabase
      .from('profissionais')
      .select('id, estudio_id')
      .eq('id', user.id)
      .maybeSingle()

    // Verificar se ela é dona de algum studio
    const { data: ownStudio } = await adminSupabase
      .from('estudios')
      .select('id, nome')
      .eq('criado_por', user.id)
      .maybeSingle()

    if (ownStudio) {
      isOwnerOfAnotherStudio = true
      estudioAtualNome = ownStudio.nome
    } else if (prof?.estudio_id) {
      if (prof.estudio_id === est.id) {
        jaNoMesmoEstudio = true
      } else {
        const { data: otherStudio } = await adminSupabase
          .from('estudios')
          .select('nome')
          .eq('id', prof.estudio_id)
          .maybeSingle()
        estudioAtualNome = otherStudio?.nome || 'Outro Studio'
      }
    }
  }

  return {
    status: 'valid' as const,
    conviteId: convite.id,
    estudio: {
      id: est.id,
      nome: est.nome,
      slug: est.slug,
      bio: est.bio,
      foto_capa_url: est.foto_capa_url,
      cor_primaria: est.cor_primaria,
      cor_secundaria: est.cor_secundaria,
    },
    dona: {
      nome: donaObj?.nome || 'Administradora',
      foto_url: donaObj?.foto_url || null,
    },
    usuarioLogado,
    jaNoMesmoEstudio,
    estudioAtualNome,
    isOwnerOfAnotherStudio,
  }
}

/**
 * 13. Aceitar convite por link
 */
export async function aceitarConviteLink(codigo: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Faça login ou crie sua conta no Lumê para aceitar o convite.')
  }

  const adminSupabase = createAdminClient()

  // Buscar e validar convite
  const { data: convite } = await adminSupabase
    .from('estudio_convites')
    .select('*')
    .eq('codigo', codigo)
    .single()

  if (!convite || convite.status !== 'pendente') {
    throw new Error('Este convite não está mais disponível ou já foi utilizado.')
  }

  if (new Date(convite.expira_em) <= new Date()) {
    throw new Error('Este convite expirou.')
  }

  // Garantir perfil do usuário
  await getOrCreateProfissional(user.id, user.user_metadata?.nome)

  // Verificar se o usuário é dona de algum studio
  const { data: ownStudio } = await adminSupabase
    .from('estudios')
    .select('id')
    .eq('criado_por', user.id)
    .maybeSingle()

  if (ownStudio) {
    throw new Error(
      'Você é dona de um studio próprio. Não é possível aceitar convite para ser membro enquanto possuir um studio sob sua gestão.'
    )
  }

  // Definir novo estudio_id
  await adminSupabase
    .from('profissionais')
    .update({
      estudio_id: convite.estudio_id,
      ativo_no_estudio: true,
    })
    .eq('id', user.id)

  // Marcar convite como aceito
  await adminSupabase
    .from('estudio_convites')
    .update({ status: 'aceito' })
    .eq('id', convite.id)

  revalidatePath('/dashboard/estudio')
  revalidatePath('/dashboard/geral')
  revalidatePath('/perfil')

  return { success: true, estudioId: convite.estudio_id }
}

/**
 * 14. Remover membro do studio (apenas dona)
 * Se o membroId for a própria dona, ela é desvinculada da equipe de atendimento (estudio_id = null)
 * mas continua com a posse administrativa do studio (criado_por = user.id).
 */
export async function removerMembroEstudio(membroId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Verificar que user é dona de um studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, slug')
    .eq('criado_por', user.id)
    .single()

  if (!estudio) {
    throw new Error('Apenas a administradora do studio pode desvincular membros.')
  }

  // Desvincular membro (apenas remove estudio_id, nunca apaga dados da conta)
  const { error } = await adminSupabase
    .from('profissionais')
    .update({
      estudio_id: null,
      ativo_no_estudio: true,
    })
    .eq('id', membroId)
    .eq('estudio_id', estudio.id)

  if (error) {
    console.error('[removerMembroEstudio] Erro:', error)
    throw new Error('Erro ao desvincular membro do studio.')
  }

  revalidatePath('/dashboard/estudio')
  revalidatePath('/dashboard/geral')
  revalidatePath('/perfil')
  revalidatePath(`/estudio/${estudio.slug}`)
  return { success: true }
}

/**
 * 14.1 Alternar participação da dona como profissional de atendimento no studio
 */
export async function alternarDonaComoAtendente(participar: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, slug')
    .eq('criado_por', user.id)
    .single()

  if (!estudio) {
    throw new Error('Apenas a dona do studio pode alterar sua participação na equipe.')
  }

  const { error } = await adminSupabase
    .from('profissionais')
    .update({
      estudio_id: participar ? estudio.id : null,
      ativo_no_estudio: participar ? true : false,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[alternarDonaComoAtendente] Erro:', error)
    throw new Error('Erro ao atualizar participação da dona no studio.')
  }

  revalidatePath('/dashboard/estudio')
  revalidatePath('/dashboard/geral')
  revalidatePath('/perfil')
  revalidatePath(`/estudio/${estudio.slug}`)
  return { success: true, participar }
}

/**
 * 15. Sair do studio (para profissional que é membro, não dona)
 */
export async function sairDoEstudio() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Se ela for dona, não pode simplesmente sair sem gerenciar o studio
  const { data: ownStudio } = await adminSupabase
    .from('estudios')
    .select('id')
    .eq('criado_por', user.id)
    .maybeSingle()

  if (ownStudio) {
    throw new Error('A dona do studio não pode sair do próprio studio.')
  }

  // Desvincular do studio
  const { error } = await adminSupabase
    .from('profissionais')
    .update({
      estudio_id: null,
      ativo_no_estudio: true,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[sairDoEstudio] Erro:', error)
    throw new Error('Erro ao sair do studio.')
  }

  revalidatePath('/dashboard/estudio')
  revalidatePath('/dashboard/geral')
  revalidatePath('/perfil')

  return { success: true }
}

/**
 * 16. Selecionar qualquer profissional disponível (Rodízio Circular / Round-Robin)
 */
export async function selecionarQualquerProfissional(studioSlug: string) {
  const adminSupabase = createAdminClient()

  // 1. Buscar studio pelo slug
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, slug, round_robin_ultimo_membro_id')
    .ilike('slug', studioSlug)
    .maybeSingle()

  if (!estudio) {
    throw new Error('Studio não encontrado.')
  }

  // 2. Buscar membros ativos do studio ordenados de forma estável (created_at ASC, id ASC)
  const { data: membrosRaw } = await adminSupabase
    .from('profissionais_publico')
    .select('id, slug')
    .eq('estudio_id', estudio.id)
    .eq('ativo_no_estudio', true)
    .order('created_at', { ascending: true })

  const membros = membrosRaw || []

  if (membros.length === 0) {
    throw new Error('Nenhuma profissional ativa disponível neste studio no momento.')
  }

  let proximoMembro = membros[0]

  if (membros.length > 1) {
    const ultimoId = estudio.round_robin_ultimo_membro_id
    const indiceUltimo = ultimoId ? membros.findIndex((m) => m.id === ultimoId) : -1

    if (indiceUltimo === -1) {
      // Se não havia último ou o último não está mais ativo, seleciona o primeiro
      proximoMembro = membros[0]
    } else {
      // Rodízio circular
      const proximoIndice = (indiceUltimo + 1) % membros.length
      proximoMembro = membros[proximoIndice]
    }
  }

  // 3. Atualizar round_robin_ultimo_membro_id no banco
  await adminSupabase
    .from('estudios')
    .update({ round_robin_ultimo_membro_id: proximoMembro.id })
    .eq('id', estudio.id)

  return {
    success: true,
    redirectUrl: `/estudio/${estudio.slug}/${proximoMembro.slug}`,
  }
}

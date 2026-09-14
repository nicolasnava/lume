'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateProfissional } from '@/lib/profissionais/getOrCreateProfissional'
import { parseCategorias } from '@/lib/utils/categories'
import { extrairFotosEspaco, extrairMetadadosStudio, limparBioStudio } from '@/lib/studio/utils'

export interface StudioMember {
  id: string
  nome: string
  foto_url: string | null
  slug: string
  categoria: string[]
  ativo_no_estudio: boolean
  isOwner: boolean
  compartilhar_faturamento: boolean
  compartilhar_agendamentos: boolean
  permitir_agendamento_dona: boolean
  termo_aceito_em?: string | null
  comissao_personalizada_pct?: number | null
  aluguel_personalizado_fixo?: number | null
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
  foto_perfil_url?: string | null
  instagram?: string | null
  whatsapp?: string | null
  endereco?: string | null
  cor_primaria: string
  cor_secundaria: string
  criado_por: string
  round_robin_ultimo_membro_id: string | null
  created_at: string
  fotos_espaco?: string[]
  tipo_gestao: 'aluguel_cadeira' | 'gestao_completa'
  comissao_padrao_pct: number
  aluguel_padrao_fixo: number
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
      compartilhar_faturamento: boolean
      compartilhar_agendamentos: boolean
      permitir_agendamento_dona: boolean
      comissao_personalizada_pct?: number | null
      aluguel_personalizado_fixo?: number | null
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
    const meta = extrairMetadadosStudio(estudioDona)
    const estudio = {
      ...estudioDona,
      bio: limparBioStudio(estudioDona.bio),
      fotos_espaco: meta.fotos_espaco,
      foto_perfil_url: meta.foto_perfil_url,
      instagram: meta.instagram,
      whatsapp: meta.whatsapp,
      endereco: meta.endereco,
      tipo_gestao: (estudioDona.tipo_gestao as 'aluguel_cadeira' | 'gestao_completa') || 'gestao_completa',
      comissao_padrao_pct: Number(estudioDona.comissao_padrao_pct ?? 30),
      aluguel_padrao_fixo: Number(estudioDona.aluguel_padrao_fixo ?? 0),
    } as StudioData

    // Verifica se a dona também está vinculada como membro da equipe de atendimento
    const donaNaEquipe = prof.estudio_id === estudio.id

    // Buscar membros vinculados a este studio
    const { data: membrosRaw } = await adminSupabase
      .from('profissionais')
      .select('id, nome, foto_url, slug, categoria, ativo_no_estudio, compartilhar_faturamento, compartilhar_agendamentos, permitir_agendamento_dona, termo_aceito_em, comissao_personalizada_pct, aluguel_personalizado_fixo')
      .eq('estudio_id', estudio.id)
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    const membros: StudioMember[] = (membrosRaw || []).map((m: any) => ({
      id: m.id,
      nome: m.nome,
      foto_url: m.foto_url,
      slug: m.slug,
      categoria: parseCategorias(m.categoria),
      ativo_no_estudio: m.ativo_no_estudio !== false,
      isOwner: m.id === estudio.criado_por,
      compartilhar_faturamento: m.compartilhar_faturamento !== false,
      compartilhar_agendamentos: m.compartilhar_agendamentos !== false,
      permitir_agendamento_dona: m.permitir_agendamento_dona !== false,
      termo_aceito_em: m.termo_aceito_em || null,
      comissao_personalizada_pct: m.comissao_personalizada_pct != null ? Number(m.comissao_personalizada_pct) : null,
      aluguel_personalizado_fixo: m.aluguel_personalizado_fixo != null ? Number(m.aluguel_personalizado_fixo) : null,
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
      const meta = extrairMetadadosStudio(estudioMembro)
      const estudio = {
        ...estudioMembro,
        bio: limparBioStudio(estudioMembro.bio),
        fotos_espaco: meta.fotos_espaco,
        foto_perfil_url: meta.foto_perfil_url,
        instagram: meta.instagram,
        whatsapp: meta.whatsapp,
        endereco: meta.endereco,
        tipo_gestao: (estudioMembro.tipo_gestao as 'aluguel_cadeira' | 'gestao_completa') || 'gestao_completa',
        comissao_padrao_pct: Number(estudioMembro.comissao_padrao_pct ?? 30),
        aluguel_padrao_fixo: Number(estudioMembro.aluguel_padrao_fixo ?? 0),
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
        compartilhar_faturamento: prof.compartilhar_faturamento !== false,
        compartilhar_agendamentos: prof.compartilhar_agendamentos !== false,
        permitir_agendamento_dona: prof.permitir_agendamento_dona !== false,
        comissao_personalizada_pct: prof.comissao_personalizada_pct != null ? Number(prof.comissao_personalizada_pct) : null,
        aluguel_personalizado_fixo: prof.aluguel_personalizado_fixo != null ? Number(prof.aluguel_personalizado_fixo) : null,
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
  foto_capa_url?: string | null
  foto_perfil_url?: string | null
  instagram?: string | null
  whatsapp?: string | null
  endereco?: string | null
  cor_primaria?: string
  cor_secundaria?: string
  fotos_espaco?: string[]
  tipo_gestao?: 'aluguel_cadeira' | 'gestao_completa'
  comissao_padrao_pct?: number
  aluguel_padrao_fixo?: number
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
  const meta = {
    foto_perfil_url: dados.foto_perfil_url !== undefined ? dados.foto_perfil_url : null,
    instagram: dados.instagram !== undefined ? dados.instagram : null,
    whatsapp: dados.whatsapp !== undefined ? dados.whatsapp : null,
    endereco: dados.endereco !== undefined ? dados.endereco : null,
    fotos_espaco: dados.fotos_espaco || [],
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    nome: dados.nome.trim(),
    slug: cleanSlug,
    bio: cleanBio || null,
    foto_capa_url: dados.foto_capa_url || null,
    foto_perfil_url: dados.foto_perfil_url || null,
    instagram: dados.instagram || null,
    whatsapp: dados.whatsapp || null,
    endereco: dados.endereco || null,
    cor_primaria: dados.cor_primaria || '#B8A9D9',
    cor_secundaria: dados.cor_secundaria || '#FAF7F5',
  }

  if (dados.fotos_espaco !== undefined) {
    payload.fotos_espaco = dados.fotos_espaco
  }
  if (dados.tipo_gestao !== undefined) {
    payload.tipo_gestao = dados.tipo_gestao
  }
  if (dados.comissao_padrao_pct !== undefined) {
    payload.comissao_padrao_pct = dados.comissao_padrao_pct
  }
  if (dados.aluguel_padrao_fixo !== undefined) {
    payload.aluguel_padrao_fixo = dados.aluguel_padrao_fixo
  }

  let { error: updateError } = await adminSupabase
    .from('estudios')
    .update(payload)
    .eq('id', dados.id)

  // Fallback resiliente caso as novas colunas não existam no Supabase
  if (updateError && (updateError.code === '42703' || updateError.message?.includes('does not exist') || updateError.message?.includes('fotos_espaco'))) {
    delete payload.foto_perfil_url
    delete payload.instagram
    delete payload.whatsapp
    delete payload.endereco
    delete payload.fotos_espaco
    const studioMetaStr = JSON.stringify(meta)
    payload.bio = cleanBio ? `${cleanBio}\n<!--LUME_STUDIO_META:${studioMetaStr}-->` : `<!--LUME_STUDIO_META:${studioMetaStr}-->`
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
      tipo_gestao: (est.tipo_gestao as 'aluguel_cadeira' | 'gestao_completa') || 'gestao_completa',
      comissao_padrao_pct: Number(est.comissao_padrao_pct ?? 30),
      aluguel_padrao_fixo: Number(est.aluguel_padrao_fixo ?? 0),
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
 * 13. Aceitar convite por link com preferências de privacidade
 */
export async function aceitarConviteLink(
  codigo: string,
  preferencias?: {
    compartilhar_faturamento?: boolean
    compartilhar_agendamentos?: boolean
    permitir_agendamento_dona?: boolean
  }
) {
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

  // Definir novo estudio_id e registrar consentimento
  await adminSupabase
    .from('profissionais')
    .update({
      estudio_id: convite.estudio_id,
      ativo_no_estudio: true,
      compartilhar_faturamento: preferencias?.compartilhar_faturamento ?? true,
      compartilhar_agendamentos: preferencias?.compartilhar_agendamentos ?? true,
      permitir_agendamento_dona: preferencias?.permitir_agendamento_dona ?? true,
      termo_aceito_em: new Date().toISOString(),
    })
    .eq('id', user.id)

  // Marcar convite como aceito
  await adminSupabase
    .from('estudio_convites')
    .update({ status: 'aceito' })
    .eq('id', convite.id)

  revalidatePath('/dashboard/studio')
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

// ============================================================================
// 17. CENTRAL DE GESTÃO DO STUDIO: MÉTRICAS, COMISSÕES E REPASSES
// ============================================================================

export interface MemberPerformance {
  id: string
  nome: string
  foto_url: string | null
  slug: string
  categoria: string[]
  ativo_no_estudio: boolean
  isOwner: boolean
  totalAgendamentos: number
  agendamentosConcluidos: number
  faturamentoBruto: number | null // null se a profissional marcou como privado
  comissaoStudio: number | null
  repasseLiquido: number | null
  aluguelFixo: number | null
  compartilharFaturamento: boolean
  compartilharAgendamentos: boolean
  permitirAgendamentoDona: boolean
}

export interface StudioMetricsData {
  periodo: 'mes_atual' | 'mes_anterior' | 'hoje' | 'ultimos_30_dias'
  periodoLabel: string
  tipoGestao: 'aluguel_cadeira' | 'gestao_completa'
  totalAgendamentos: number
  agendamentosConcluidos: number
  agendamentosConfirmados: number
  agendamentosCancelados: number
  faturamentoBrutoTotal: number
  faturamentoStudioTotal: number
  repassesEquipeTotal: number
  ticketMedio: number
  membrosDesempenho: MemberPerformance[]
  totalProfissionaisAtivas: number
}

export async function obterMetricasStudioAction(
  estudioId: string,
  periodo: 'mes_atual' | 'mes_anterior' | 'hoje' | 'ultimos_30_dias' = 'mes_atual'
): Promise<StudioMetricsData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // 1. Validar que o usuário é a dona do studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, criado_por, tipo_gestao, comissao_padrao_pct, aluguel_padrao_fixo')
    .eq('id', estudioId)
    .single()

  if (!estudio || estudio.criado_por !== user.id) {
    throw new Error('Apenas a administradora do studio pode acessar as métricas de gestão.')
  }

  const tipoGestao = (estudio.tipo_gestao as 'aluguel_cadeira' | 'gestao_completa') || 'gestao_completa'
  const comissaoPadrao = Number(estudio.comissao_padrao_pct ?? 30)
  const aluguelPadrao = Number(estudio.aluguel_padrao_fixo ?? 0)

  // 2. Buscar membros do studio
  const { data: membrosRaw } = await adminSupabase
    .from('profissionais')
    .select('id, nome, foto_url, slug, categoria, ativo_no_estudio, compartilhar_faturamento, compartilhar_agendamentos, permitir_agendamento_dona, comissao_personalizada_pct, aluguel_personalizado_fixo')
    .eq('estudio_id', estudioId)
    .is('deletado_em', null)
    .order('nome', { ascending: true })

  const membros = membrosRaw || []
  const memberIds = membros.map((m) => m.id)

  // 3. Definir intervalo de datas
  const now = new Date()
  let startDate: Date
  let endDate: Date
  let periodoLabel: string

  if (periodo === 'hoje') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    periodoLabel = 'Hoje'
  } else if (periodo === 'mes_anterior') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    periodoLabel = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  } else if (periodo === 'ultimos_30_dias') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    endDate = now
    periodoLabel = 'Últimos 30 dias'
  } else {
    // mes_atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    periodoLabel = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  if (memberIds.length === 0) {
    return {
      periodo,
      periodoLabel,
      tipoGestao,
      totalAgendamentos: 0,
      agendamentosConcluidos: 0,
      agendamentosConfirmados: 0,
      agendamentosCancelados: 0,
      faturamentoBrutoTotal: 0,
      faturamentoStudioTotal: 0,
      repassesEquipeTotal: 0,
      ticketMedio: 0,
      membrosDesempenho: [],
      totalProfissionaisAtivas: 0,
    }
  }

  // 4. Buscar agendamentos de todos os membros no período
  const { data: agendamentosRaw } = await adminSupabase
    .from('agendamentos')
    .select('id, profissional_id, status, status_pagamento, valor_cobrado, data_hora_inicio')
    .in('profissional_id', memberIds)
    .gte('data_hora_inicio', startDate.toISOString())
    .lte('data_hora_inicio', endDate.toISOString())

  const agendamentos = agendamentosRaw || []

  // 5. Agregar por profissional
  let faturamentoBrutoTotal = 0
  let faturamentoStudioTotal = 0
  let repassesEquipeTotal = 0
  let totalAgendamentos = 0
  let totalConcluidos = 0
  let totalConfirmados = 0
  let totalCancelados = 0

  const membrosDesempenho: MemberPerformance[] = membros.map((m: any) => {
    const profBookings = agendamentos.filter((b) => b.profissional_id === m.id)
    const isOwner = m.id === user.id
    const podeVerFaturamento = m.compartilhar_faturamento !== false || isOwner

    const concluidos = profBookings.filter((b) => b.status === 'concluido')
    const confirmados = profBookings.filter((b) => b.status === 'confirmado')
    const cancelados = profBookings.filter((b) => b.status === 'cancelado')

    totalAgendamentos += profBookings.length
    totalConcluidos += concluidos.length
    totalConfirmados += confirmados.length
    totalCancelados += cancelados.length

    // Atendimentos considerados para receita: concluídos ou pagos
    const faturaveis = profBookings.filter(
      (b) => b.status === 'concluido' || (b.status === 'confirmado' && b.status_pagamento === 'pago')
    )
    const valorSoma = faturaveis.reduce((acc, cur) => acc + Number(cur.valor_cobrado || 0), 0)

    const comissaoPct = m.comissao_personalizada_pct != null ? Number(m.comissao_personalizada_pct) : comissaoPadrao
    const aluguelFixo = m.aluguel_personalizado_fixo != null ? Number(m.aluguel_personalizado_fixo) : aluguelPadrao

    let faturamentoBruto: number | null = null
    let comissaoStudio: number | null = null
    let repasseLiquido: number | null = null

    if (podeVerFaturamento) {
      faturamentoBruto = Math.round(valorSoma)
      faturamentoBrutoTotal += faturamentoBruto

      if (tipoGestao === 'gestao_completa') {
        comissaoStudio = Math.round((faturamentoBruto * comissaoPct) / 100)
        repasseLiquido = Math.max(0, faturamentoBruto - comissaoStudio)
        faturamentoStudioTotal += comissaoStudio
        repassesEquipeTotal += repasseLiquido
      } else {
        // aluguel_cadeira
        comissaoStudio = 0
        repasseLiquido = faturamentoBruto
        faturamentoStudioTotal += aluguelFixo
        repassesEquipeTotal += repasseLiquido
      }
    } else {
      // Caso a parceira tenha optado por não compartilhar faturamento
      if (tipoGestao === 'aluguel_cadeira') {
        faturamentoStudioTotal += aluguelFixo
      }
    }

    return {
      id: m.id,
      nome: m.nome,
      foto_url: m.foto_url,
      slug: m.slug,
      categoria: parseCategorias(m.categoria),
      ativo_no_estudio: m.ativo_no_estudio !== false,
      isOwner,
      totalAgendamentos: profBookings.length,
      agendamentosConcluidos: concluidos.length,
      faturamentoBruto,
      comissaoStudio,
      repasseLiquido,
      aluguelFixo,
      compartilharFaturamento: podeVerFaturamento,
      compartilharAgendamentos: m.compartilhar_agendamentos !== false,
      permitirAgendamentoDona: m.permitir_agendamento_dona !== false,
    }
  })

  // Ordenar por faturamento bruto decrescente
  membrosDesempenho.sort((a, b) => (b.faturamentoBruto || 0) - (a.faturamentoBruto || 0))

  const ticketMedio = totalConcluidos > 0 ? Math.round(faturamentoBrutoTotal / totalConcluidos) : 0
  const totalProfissionaisAtivas = membros.filter((m: any) => m.ativo_no_estudio !== false).length

  return {
    periodo,
    periodoLabel,
    tipoGestao,
    totalAgendamentos,
    agendamentosConcluidos: totalConcluidos,
    agendamentosConfirmados: totalConfirmados,
    agendamentosCancelados: totalCancelados,
    faturamentoBrutoTotal,
    faturamentoStudioTotal,
    repassesEquipeTotal,
    ticketMedio,
    membrosDesempenho,
    totalProfissionaisAtivas,
  }
}

// ============================================================================
// 18. AGENDAMENTOS CONSOLIDADOS DO STUDIO
// ============================================================================

export interface StudioBookingItem {
  id: string
  profissionalId: string
  profissionalNome: string
  profissionalFoto: string | null
  profissionalSlug: string
  clienteNome: string
  clienteTelefone: string
  servicoNome: string
  servicoPreco: number
  valorCobrado: number | null
  dataHoraInicio: string
  dataHoraFim: string
  status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
  statusPagamento: string | null
}

export interface ObterAgendamentosStudioFiltros {
  profissionalId?: string
  status?: string
  dataInicio?: string
  dataFim?: string
  limite?: number
}

export async function obterAgendamentosStudioAction(
  estudioId: string,
  filtros?: ObterAgendamentosStudioFiltros
): Promise<StudioBookingItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // 1. Validar que o usuário é a dona do studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, criado_por')
    .eq('id', estudioId)
    .single()

  if (!estudio || estudio.criado_por !== user.id) {
    throw new Error('Apenas a administradora do studio pode acessar a agenda consolidada.')
  }

  // 2. Buscar membros do studio que autorizam compartilhar agendamento
  const { data: membros } = await adminSupabase
    .from('profissionais')
    .select('id, nome, foto_url, slug, compartilhar_faturamento, compartilhar_agendamentos')
    .eq('estudio_id', estudioId)
    .is('deletado_em', null)

  if (!membros || membros.length === 0) return []

  const membrosMap = new Map(membros.map((m) => [m.id, m]))
  // Membros cujos agendamentos podem ser exibidos para a dona
  const allowedMemberIds = membros
    .filter((m) => m.id === user.id || m.compartilhar_agendamentos !== false)
    .map((m) => m.id)

  if (allowedMemberIds.length === 0) return []

  let query = adminSupabase
    .from('agendamentos')
    .select(`
      id,
      profissional_id,
      cliente_id,
      servico_id,
      data_hora_inicio,
      data_hora_fim,
      status,
      status_pagamento,
      valor_cobrado,
      created_at,
      clientes (id, nome, telefone),
      servicos (id, nome, preco, duracao_minutos)
    `)
    .in('profissional_id', allowedMemberIds)
    .order('data_hora_inicio', { ascending: false })
    .limit(filtros?.limite || 100)

  if (filtros?.profissionalId && allowedMemberIds.includes(filtros.profissionalId)) {
    query = query.eq('profissional_id', filtros.profissionalId)
  }

  if (filtros?.status && filtros.status !== 'todos') {
    query = query.eq('status', filtros.status as 'confirmado' | 'cancelado' | 'concluido' | 'no_show')
  }

  if (filtros?.dataInicio) {
    query = query.gte('data_hora_inicio', filtros.dataInicio)
  }

  if (filtros?.dataFim) {
    query = query.lte('data_hora_inicio', filtros.dataFim)
  }

  const { data: agendamentosRaw, error } = await query

  if (error || !agendamentosRaw) {
    console.error('[obterAgendamentosStudioAction] Erro:', error)
    return []
  }

  return agendamentosRaw.map((a: any) => {
    const prof = membrosMap.get(a.profissional_id)
    const podeVerFaturamento = prof?.id === user.id || prof?.compartilhar_faturamento !== false

    return {
      id: a.id,
      profissionalId: a.profissional_id,
      profissionalNome: prof?.nome || 'Profissional',
      profissionalFoto: prof?.foto_url || null,
      profissionalSlug: prof?.slug || '',
      clienteNome: a.clientes?.nome || 'Cliente',
      clienteTelefone: a.clientes?.telefone || '',
      servicoNome: a.servicos?.nome || 'Serviço',
      servicoPreco: Number(a.servicos?.preco || 0),
      valorCobrado: podeVerFaturamento ? Number(a.valor_cobrado ?? a.servicos?.preco ?? 0) : null,
      dataHoraInicio: a.data_hora_inicio,
      dataHoraFim: a.data_hora_fim,
      status: a.status,
      statusPagamento: a.status_pagamento,
    }
  })
}

// ============================================================================
// 19. ATUALIZAR STATUS DE AGENDAMENTO PELA DONA
// ============================================================================

export async function atualizarStatusAgendamentoStudioAction(
  agendamentoId: string,
  novoStatus: 'confirmado' | 'concluido' | 'cancelado' | 'no_show',
  statusPagamento?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Buscar agendamento e verificar se pertence a um studio onde user é dona
  const { data: agendamento } = await adminSupabase
    .from('agendamentos')
    .select('id, profissional_id, profissionais(estudio_id, estudios(criado_por))')
    .eq('id', agendamentoId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profData: any = agendamento?.profissionais
  const criadoPor = profData?.estudios?.criado_por

  if (!agendamento || criadoPor !== user.id) {
    throw new Error('Você não tem permissão para alterar este agendamento.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { status: novoStatus }
  if (statusPagamento) {
    updateData.status_pagamento = statusPagamento
  }

  const { error } = await adminSupabase
    .from('agendamentos')
    .update(updateData)
    .eq('id', agendamentoId)

  if (error) {
    console.error('[atualizarStatusAgendamentoStudioAction] Erro:', error)
    throw new Error('Erro ao atualizar agendamento.')
  }

  revalidatePath('/dashboard/studio')
  return { success: true }
}

// ============================================================================
// 20. CRIAR AGENDAMENTO PELA DONA DO STUDIO
// ============================================================================

export interface CriarAgendamentoDonaInput {
  estudioId: string
  profissionalId: string
  clienteNome: string
  clienteTelefone: string
  servicoId: string
  dataHoraInicio: string // ISO
  formaPagamentoPreferida?: string
  observacoes?: string
}

export async function criarAgendamentoPelaDonaAction(dados: CriarAgendamentoDonaInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // 1. Validar que user é dona do studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, criado_por')
    .eq('id', dados.estudioId)
    .single()

  if (!estudio || estudio.criado_por !== user.id) {
    throw new Error('Apenas a administradora do studio pode criar agendamentos para a equipe.')
  }

  // 2. Validar que a profissional pertence ao studio e autorizou agendamento pela dona
  const { data: prof } = await adminSupabase
    .from('profissionais')
    .select('id, estudio_id, permitir_agendamento_dona, ativo_no_estudio')
    .eq('id', dados.profissionalId)
    .single()

  if (!prof || prof.estudio_id !== dados.estudioId) {
    throw new Error('Esta profissional não pertence a este studio.')
  }

  if (prof.id !== user.id && prof.permitir_agendamento_dona === false) {
    throw new Error('Esta profissional optou por não receber agendamentos criados pela administradora.')
  }

  // 3. Buscar dados do serviço
  const { data: servico } = await adminSupabase
    .from('servicos')
    .select('id, duracao_minutos, preco')
    .eq('id', dados.servicoId)
    .eq('profissional_id', dados.profissionalId)
    .single()

  if (!servico) {
    throw new Error('Serviço não encontrado para esta profissional.')
  }

  const inicio = new Date(dados.dataHoraInicio)
  const fim = new Date(inicio.getTime() + (servico.duracao_minutos || 45) * 60 * 1000)

  // 4. Cadastrar / obter cliente no CRM da profissional
  const telLimpo = dados.clienteTelefone.replace(/\D/g, '')
  let clienteId: string | null = null

  const { data: existingClient } = await adminSupabase
    .from('clientes')
    .select('id')
    .eq('profissional_id', dados.profissionalId)
    .eq('telefone', telLimpo)
    .maybeSingle()

  if (existingClient) {
    clienteId = existingClient.id
  } else {
    const { data: newClient, error: clientError } = await adminSupabase
      .from('clientes')
      .insert([
        {
          profissional_id: dados.profissionalId,
          nome: dados.clienteNome.trim(),
          telefone: telLimpo,
        },
      ])
      .select('id')
      .single()

    if (!clientError && newClient) {
      clienteId = newClient.id
    }
  }

  if (!clienteId) {
    throw new Error('Não foi possível identificar ou cadastrar o cliente.')
  }

  // 5. Inserir agendamento
  const { data: newBooking, error: bookingError } = await adminSupabase
    .from('agendamentos')
    .insert([
      {
        profissional_id: dados.profissionalId,
        cliente_id: clienteId,
        servico_id: dados.servicoId,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        status: 'confirmado' as const,
        status_pagamento: 'pendente',
        valor_cobrado: servico.preco,
        forma_pagamento_preferida: dados.formaPagamentoPreferida || 'pix',
      },
    ])
    .select('id')
    .single()

  if (bookingError || !newBooking) {
    console.error('[criarAgendamentoPelaDonaAction] Erro ao criar agendamento:', bookingError)
    throw new Error('Conflito de horário ou erro ao gravar o agendamento.')
  }

  revalidatePath('/dashboard/studio')
  revalidatePath('/dashboard/geral')
  return { success: true, agendamentoId: newBooking.id }
}

// ============================================================================
// 21. ATUALIZAR PERMISSÕES DE PRIVACIDADE DA PROFISSIONAL MEMBRO
// ============================================================================

export interface PermissoesPrivacidadeInput {
  compartilhar_faturamento?: boolean
  compartilhar_agendamentos?: boolean
  permitir_agendamento_dona?: boolean
}

export async function atualizarPermissoesPrivacidadeMembroAction(permissoes: PermissoesPrivacidadeInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {}
  if (permissoes.compartilhar_faturamento !== undefined) {
    payload.compartilhar_faturamento = permissoes.compartilhar_faturamento
  }
  if (permissoes.compartilhar_agendamentos !== undefined) {
    payload.compartilhar_agendamentos = permissoes.compartilhar_agendamentos
  }
  if (permissoes.permitir_agendamento_dona !== undefined) {
    payload.permitir_agendamento_dona = permissoes.permitir_agendamento_dona
  }

  const { error } = await adminSupabase
    .from('profissionais')
    .update(payload)
    .eq('id', user.id)

  if (error) {
    console.error('[atualizarPermissoesPrivacidadeMembroAction] Erro:', error)
    throw new Error('Erro ao salvar preferências de privacidade.')
  }

  revalidatePath('/dashboard/studio')
  revalidatePath('/dashboard/estudio')
  return { success: true }
}

// ============================================================================
// 22. ATUALIZAR REGRA FINANCEIRA INDIVIDUAL DE MEMBRO (APENAS DONA)
// ============================================================================

export interface RegraMembroInput {
  comissao_personalizada_pct?: number | null
  aluguel_personalizado_fixo?: number | null
}

export async function atualizarRegraMembroStudioAction(
  estudioId: string,
  membroId: string,
  dados: RegraMembroInput
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Validar propriedade do studio
  const { data: estudio } = await adminSupabase
    .from('estudios')
    .select('id, criado_por')
    .eq('id', estudioId)
    .single()

  if (!estudio || estudio.criado_por !== user.id) {
    throw new Error('Apenas a administradora do studio pode ajustar regras financeiras da equipe.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {}
  if (dados.comissao_personalizada_pct !== undefined) {
    payload.comissao_personalizada_pct = dados.comissao_personalizada_pct
  }
  if (dados.aluguel_personalizado_fixo !== undefined) {
    payload.aluguel_personalizado_fixo = dados.aluguel_personalizado_fixo
  }

  const { error } = await adminSupabase
    .from('profissionais')
    .update(payload)
    .eq('id', membroId)
    .eq('estudio_id', estudioId)

  if (error) {
    console.error('[atualizarRegraMembroStudioAction] Erro:', error)
    throw new Error('Erro ao salvar regra financeira da profissional.')
  }

  revalidatePath('/dashboard/studio')
  return { success: true }
}

// ============================================================================
// 23. OBTER PROFISSIONAIS DISPONÍVEIS PARA NOVO AGENDAMENTO NO STUDIO
// ============================================================================

export async function obterProfissionaisDisponiveisParaAgendamentoAction(estudioId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // Buscar membros ativos que autorizam agendamento pela dona
  const { data: membros } = await adminSupabase
    .from('profissionais')
    .select('id, nome, foto_url, slug, ativo_no_estudio, permitir_agendamento_dona')
    .eq('estudio_id', estudioId)
    .eq('ativo_no_estudio', true)
    .is('deletado_em', null)
    .order('nome', { ascending: true })

  if (!membros) return []

  // Filtrar apenas as que permitem (ou a própria dona)
  const aptas = membros.filter((m) => m.id === user.id || m.permitir_agendamento_dona !== false)

  if (aptas.length === 0) return []

  // Buscar serviços de cada uma
  const aptasIds = aptas.map((m) => m.id)
  const { data: servicos } = await adminSupabase
    .from('servicos')
    .select('id, profissional_id, nome, preco, duracao_minutos')
    .in('profissional_id', aptasIds)
    .order('nome', { ascending: true })

  const servicosMap = new Map<string, Array<{ id: string; nome: string; preco: number; duracao_minutos: number }>>()
  ;(servicos || []).forEach((s) => {
    const list = servicosMap.get(s.profissional_id) || []
    list.push({
      id: s.id,
      nome: s.nome,
      preco: Number(s.preco),
      duracao_minutos: Number(s.duracao_minutos),
    })
    servicosMap.set(s.profissional_id, list)
  })

  return aptas.map((m) => ({
    id: m.id,
    nome: m.nome,
    foto_url: m.foto_url,
    slug: m.slug,
    servicos: servicosMap.get(m.id) || [],
  }))
}

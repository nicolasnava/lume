'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'

/**
 * 1. REGISTRO DE LOGIN (LOGIN LOGS)
 * Registra um evento de login se a profissional ainda não tiver um log registrado no dia de hoje.
 */
export async function recordLoginLog(profissionalId: string) {
  try {
    const adminSupabase = createAdminClient()
    const todayStr = new Date().toISOString().split('T')[0]

    // Verificar se já existe log para hoje
    const { data: existing } = await adminSupabase
      .from('login_logs')
      .select('id')
      .eq('profissional_id', profissionalId)
      .gte('created_at', `${todayStr}T00:00:00.000Z`)
      .limit(1)

    if (!existing || existing.length === 0) {
      await adminSupabase.from('login_logs').insert([
        {
          profissional_id: profissionalId,
        },
      ])
    }
  } catch (err) {
    console.warn('[recordLoginLog] Erro ao registrar log de login:', err)
  }
}

import { getOrCreateProfissional } from '@/lib/profissionais/getOrCreateProfissional'

/**
 * 2. CENTRAL DE FEEDBACK
 */
export async function submitFeedback(tipo: 'sugestao' | 'bug' | 'elogio' | 'outro', mensagem: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Você precisa estar logada para enviar um feedback.')
  }

  if (!mensagem || mensagem.trim().length < 5) {
    throw new Error('Por favor, descreva sua mensagem com pelo menos 5 caracteres.')
  }

  // Garantir que a profissional existe no banco
  const prof = await getOrCreateProfissional(user.id, user.user_metadata?.nome)
  const profId = prof?.id || user.id

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('feedbacks').insert([
    {
      profissional_id: profId,
      tipo,
      mensagem: mensagem.trim(),
      status: 'novo',
    },
  ])

  if (error) {
    console.error('[submitFeedback] Erro ao inserir feedback no Supabase:', error)
    throw new Error(`Erro ao enviar feedback: ${error.message || error.code || 'Falha no banco de dados'}`)
  }

  return { success: true, message: 'Feedback enviado com sucesso! Obrigado pela colaboração.' }
}

export async function getAdminFeedbacks(tipoFilter: string = 'todos', statusFilter: string = 'todos') {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado. Apenas administradores podem visualizar feedbacks.')
  }

  const adminSupabase = createAdminClient()

  let query = adminSupabase
    .from('feedbacks')
    .select('id, profissional_id, tipo, mensagem, status, created_at')
    .order('created_at', { ascending: false })

  if (tipoFilter && tipoFilter !== 'todos') {
    query = query.eq('tipo', tipoFilter as 'sugestao' | 'bug' | 'elogio' | 'outro')
  }
  if (statusFilter && statusFilter !== 'todos') {
    query = query.eq('status', statusFilter as 'novo' | 'em_analise' | 'resolvido')
  }

  const { data: feedbacks, error } = await query

  if (error) {
    console.error('[getAdminFeedbacks] Erro ao consultar feedbacks no Supabase:', error)
    throw new Error(`Erro ao carregar feedbacks: ${error.message || error.code || 'Verifique a tabela feedbacks'}`)
  }

  const { data: profs, error: profsError } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, foto_url')

  if (profsError) {
    console.warn('[getAdminFeedbacks] Aviso ao buscar profissionais:', profsError)
  }

  const profMap = new Map<string, { nome: string; slug: string; foto_url: string | null }>()
  ;(profs || []).forEach((p) => {
    profMap.set(p.id, { nome: p.nome, slug: p.slug, foto_url: p.foto_url })
  })

  return (feedbacks || []).map((f) => {
    const prof = profMap.get(f.profissional_id)
    return {
      id: f.id,
      profissional_id: f.profissional_id,
      profissional_nome: prof?.nome || 'Profissional',
      profissional_slug: prof?.slug || '',
      foto_url: prof?.foto_url || null,
      tipo: f.tipo as 'sugestao' | 'bug' | 'elogio' | 'outro',
      mensagem: f.mensagem,
      status: f.status as 'novo' | 'em_analise' | 'resolvido',
      created_at: f.created_at,
    }
  })
}

export async function updateFeedbackStatus(id: string, status: 'novo' | 'em_analise' | 'resolvido') {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('feedbacks')
    .update({ status })
    .eq('id', id)

  if (error) {
    throw new Error('Erro ao atualizar status do feedback.')
  }

  return { success: true }
}

/**
 * 3. MÉTRICAS DE ENGAJAMENTO POR PROFISSIONAL
 */
export async function getProfissionalEngagementMetrics(profissionalId: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    throw new Error('Acesso não autorizado.')
  }

  const adminSupabase = createAdminClient()
  const now = new Date()
  const data30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // 1) Logs de Login
  const { data: loginLogs } = await adminSupabase
    .from('login_logs')
    .select('created_at')
    .eq('profissional_id', profissionalId)
    .order('created_at', { ascending: false })

  const ultimoLoginDate = loginLogs && loginLogs.length > 0 ? loginLogs[0].created_at : null
  const logins30dCount = (loginLogs || []).filter((l) => new Date(l.created_at) >= data30d).length

  // 2) Agendamentos da profissional nos últimos 30 dias (manuais vs wizard público)
  const { data: agendamentos } = await adminSupabase
    .from('agendamentos')
    .select('id, created_at, data_hora_inicio')
    .eq('profissional_id', profissionalId)

  const agendamentosAll = (agendamentos || []) as (Record<string, unknown> & { created_at: string; data_hora_inicio: string; criado_pela_profissional?: boolean; origem?: string })[]
  const agendamentos30d = agendamentosAll.filter((a) => new Date(a.created_at) >= data30d)

  // Consideramos wizard público agendamentos criados com informação de cliente vinda de formulário público
  const agendamentosManualCount = agendamentos30d.filter((a) => a.criado_pela_profissional === true || a.origem === 'manual').length
  const agendamentosWizardCount = agendamentos30d.length - agendamentosManualCount

  // Data do último agendamento
  const ultimosAgendamentos = agendamentosAll.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const ultimoAgendamentoDate = ultimosAgendamentos.length > 0 ? ultimosAgendamentos[0].created_at : null

  return {
    ultimoLoginDate,
    logins30dCount,
    agendamentos30dTotal: agendamentos30d.length,
    agendamentosManualCount,
    agendamentosWizardCount: Math.max(0, agendamentosWizardCount),
    ultimoAgendamentoDate,
  }
}

/**
 * 4. BANNERS DE AVISOS CONFIGURÁVEIS
 */
export async function getActiveAvisoPlataforma() {
  try {
    const adminSupabase = createAdminClient()
    const { data: aviso } = await adminSupabase
      .from('avisos_plataforma')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .maybeSingle()

    return aviso || null
  } catch (err) {
    console.warn('[getActiveAvisoPlataforma] Erro:', err)
    return null
  }
}

export async function getAdminAvisos() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()
  const { data: avisos } = await adminSupabase
    .from('avisos_plataforma')
    .select('*')
    .order('created_at', { ascending: false })

  return avisos || []
}

export async function createAvisoPlataforma(mensagem: string, tipo: 'info' | 'alerta' | 'manutencao', ativo: boolean = false) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  if (ativo) {
    // Desativar todos os anteriores
    await adminSupabase.from('avisos_plataforma').update({ ativo: false }).neq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { error } = await adminSupabase.from('avisos_plataforma').insert([
    {
      mensagem: mensagem.trim(),
      tipo,
      ativo,
    },
  ])

  if (error) throw new Error('Erro ao criar aviso.')
  return { success: true }
}

export async function toggleAvisoPlataforma(id: string, ativo: boolean) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  if (ativo) {
    // Desativar todos os outros antes
    await adminSupabase.from('avisos_plataforma').update({ ativo: false }).neq('id', id)
  }

  const { error } = await adminSupabase
    .from('avisos_plataforma')
    .update({ ativo })
    .eq('id', id)

  if (error) throw new Error('Erro ao alterar status do aviso.')
  return { success: true }
}

/**
 * 5. PESQUISA DE SATISFAÇÃO (NPS)
 */
export async function submitNpsResposta(nota: number, comentario?: string) {
  if (typeof nota !== 'number' || nota < 0 || nota > 10) {
    throw new Error('A nota da pesquisa deve ser entre 0 e 10.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Você precisa estar logada para responder à pesquisa.')
  }

  // Garantir que a profissional existe no banco
  const prof = await getOrCreateProfissional(user.id, user.user_metadata?.nome)
  const profId = prof?.id || user.id

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('nps_respostas').insert([
    {
      profissional_id: profId,
      nota,
      comentario: comentario?.trim() || null,
    },
  ])

  if (error) {
    console.error('[submitNpsResposta] Erro ao salvar resposta NPS:', error)
    throw new Error(`Erro ao salvar avaliação NPS: ${error.message || error.code || 'Falha no banco de dados'}`)
  }

  return { success: true, message: 'Obrigado pela sua avaliação!' }
}

export async function getAdminNpsSummary() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()
  const { data: respostas, error } = await adminSupabase
    .from('nps_respostas')
    .select('id, profissional_id, nota, comentario, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Erro ao buscar pesquisas NPS.')

  const { data: profs } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug')

  const profMap = new Map<string, { nome: string; slug: string }>()
  ;(profs || []).forEach((p) => {
    profMap.set(p.id, { nome: p.nome, slug: p.slug })
  })

  const allRespostas = respostas || []
  const total = allRespostas.length
  const media = total > 0 ? Math.round((allRespostas.reduce((sum, r) => sum + r.nota, 0) / total) * 10) / 10 : 0

  return {
    media,
    total,
    respostas: allRespostas.map((r) => {
      const prof = profMap.get(r.profissional_id)
      return {
        id: r.id,
        profissional_nome: prof?.nome || 'Profissional',
        profissional_slug: prof?.slug || '',
        nota: r.nota,
        comentario: r.comentario || null,
        created_at: r.created_at,
      }
    }),
  }
}

/**
 * 6. LINHA DO TEMPO DA CONTA DA PROFISSIONAL
 */
export async function getProfissionalActivityTimeline(profissionalId: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  const [
    { data: logins },
    { data: agendamentos },
    { data: servicos },
    { data: feedbacks },
    { data: logsAdmin },
  ] = await Promise.all([
    adminSupabase.from('login_logs').select('created_at').eq('profissional_id', profissionalId).order('created_at', { ascending: false }).limit(5),
    adminSupabase.from('agendamentos').select('id, created_at, status, valor_cobrado').eq('profissional_id', profissionalId).order('created_at', { ascending: false }).limit(5),
    adminSupabase.from('servicos').select('id, nome, created_at').eq('profissional_id', profissionalId).order('created_at', { ascending: false }).limit(5),
    adminSupabase.from('feedbacks').select('id, tipo, mensagem, created_at').eq('profissional_id', profissionalId).order('created_at', { ascending: false }).limit(5),
    adminSupabase.from('admin_logs').select('id, acao, created_at, detalhes').eq('profissional_id', profissionalId).order('created_at', { ascending: false }).limit(5),
  ])

  type TimelineItem = {
    tipo: 'login' | 'agendamento' | 'servico' | 'feedback' | 'admin'
    titulo: string
    descricao: string
    created_at: string
  }

  const items: TimelineItem[] = []

  ;(logins || []).forEach((l) => {
    items.push({
      tipo: 'login',
      titulo: 'Acesso ao Painel',
      descricao: 'Login efetuado no sistema',
      created_at: l.created_at,
    })
  })

  ;(agendamentos || []).forEach((a) => {
    items.push({
      tipo: 'agendamento',
      titulo: 'Novo Agendamento Criado',
      descricao: `Status: ${a.status} (${a.valor_cobrado ? `R$ ${Number(a.valor_cobrado).toFixed(2)}` : 'Sem valor'})`,
      created_at: a.created_at,
    })
  })

  ;(servicos || []).forEach((s) => {
    items.push({
      tipo: 'servico',
      titulo: 'Serviço Cadastrado',
      descricao: `Serviço "${s.nome}" adicionado à vitrine`,
      created_at: s.created_at,
    })
  })

  ;(feedbacks || []).forEach((f) => {
    items.push({
      tipo: 'feedback',
      titulo: `Feedback Enviado (${f.tipo})`,
      descricao: f.mensagem.length > 50 ? `${f.mensagem.substring(0, 50)}...` : f.mensagem,
      created_at: f.created_at,
    })
  })

  ;(logsAdmin || []).forEach((la) => {
    items.push({
      tipo: 'admin',
      titulo: `Ação do Admin: ${la.acao}`,
      descricao: la.detalhes ? JSON.stringify(la.detalhes) : 'Ação de suporte',
      created_at: la.created_at,
    })
  })

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return items.slice(0, 10)
}

/**
 * 7. CENTRAL DE NOVIDADES (CHANGELOG)
 */
export async function createNovidade(titulo: string, descricao: string) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('novidades').insert([
    {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
    },
  ])

  if (error) throw new Error('Erro ao cadastrar novidade.')
  return { success: true }
}

export async function getNovidades() {
  try {
    const adminSupabase = createAdminClient()
    const { data: list } = await adminSupabase
      .from('novidades')
      .select('*')
      .order('created_at', { ascending: false })

    return list || []
  } catch (err) {
    console.warn('[getNovidades] Erro:', err)
    return []
  }
}

/**
 * 8. ALERTA DE CONTAS INATIVAS (>14 DIAS SEM LOGIN)
 */
export async function getInactiveProfissionais(daysLimit: number = 14) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  // 1. Buscar todas as profissionais ativas (não desativadas por soft delete)
  const { data: profs } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, whatsapp, created_at')
    .is('deletado_em', null)

  // 2. Buscar último login log de cada profissional
  const { data: loginLogs } = await adminSupabase
    .from('login_logs')
    .select('profissional_id, created_at')
    .order('created_at', { ascending: false })

  const emailMap = new Map<string, string>()
  try {
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    if (usersData?.users) {
      usersData.users.forEach((u) => {
        if (u.email) emailMap.set(u.id, u.email)
      })
    }
  } catch (err) {
    console.warn('[getInactiveProfissionais] Erro auth users:', err)
  }

  const lastLoginMap = new Map<string, Date>()
  ;(loginLogs || []).forEach((l) => {
    if (!lastLoginMap.has(l.profissional_id)) {
      lastLoginMap.set(l.profissional_id, new Date(l.created_at))
    }
  })

  const inactiveList = (profs || [])
    .map((p) => {
      const lastLogin = lastLoginMap.get(p.id) || new Date(p.created_at) // Fallback para data de cadastro se não houver login log
      const diffDays = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: p.id,
        nome: p.nome,
        slug: p.slug,
        email: emailMap.get(p.id) || 'Sem e-mail',
        whatsapp: p.whatsapp,
        lastLoginDate: lastLogin.toISOString(),
        diasSemAcesso: diffDays,
      }
    })
    .filter((item) => item.diasSemAcesso >= daysLimit)
    .sort((a, b) => b.diasSemAcesso - a.diasSemAcesso)

  return inactiveList
}

/**
 * 9. EXPORTAÇÃO DE RELATÓRIOS EM CSV
 */
export async function exportProfissionaisCSV() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  const { data: profs } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, created_at, status_conta, deletado_em')
    .order('created_at', { ascending: false })

  const { data: agendamentos } = await adminSupabase
    .from('agendamentos')
    .select('profissional_id')

  const { data: loginLogs } = await adminSupabase
    .from('login_logs')
    .select('profissional_id, created_at')
    .order('created_at', { ascending: false })

  const emailMap = new Map<string, string>()
  try {
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    if (usersData?.users) {
      usersData.users.forEach((u) => {
        if (u.email) emailMap.set(u.id, u.email)
      })
    }
  } catch (err) {
    console.warn('[exportProfissionaisCSV] Erro:', err)
  }

  const agendamentosCountMap: Record<string, number> = {}
  ;(agendamentos || []).forEach((a) => {
    agendamentosCountMap[a.profissional_id] = (agendamentosCountMap[a.profissional_id] || 0) + 1
  })

  const lastLoginMap = new Map<string, string>()
  ;(loginLogs || []).forEach((l) => {
    if (!lastLoginMap.has(l.profissional_id)) {
      lastLoginMap.set(l.profissional_id, new Date(l.created_at).toLocaleDateString('pt-BR'))
    }
  })

  // Montar conteúdo do CSV com cabeçalhos em Português
  let csv = 'Nome;E-mail;Slug;Data de Cadastro;Status da Conta;Total de Agendamentos;Último Acesso\n'

  ;(profs || []).forEach((p) => {
    const nome = `"${p.nome.replace(/"/g, '""')}"`
    const email = emailMap.get(p.id) || ''
    const slug = p.slug
    const cadastro = new Date(p.created_at).toLocaleDateString('pt-BR')
    const status = p.deletado_em ? 'Desativada (Soft Delete)' : p.status_conta || 'trial'
    const totalAg = agendamentosCountMap[p.id] || 0
    const ultimoLogin = lastLoginMap.get(p.id) || 'Sem registro'

    csv += `${nome};${email};${slug};${cadastro};${status};${totalAg};${ultimoLogin}\n`
  })

  return csv
}

export async function exportFinanceiroCSV() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) throw new Error('Não autorizado.')

  const adminSupabase = createAdminClient()

  const { data: profs } = await adminSupabase
    .from('profissionais')
    .select('id, nome, slug, status_conta, valor_mensalidade, plano_tipo')

  const { data: faturas } = await adminSupabase
    .from('saas_faturas')
    .select('profissional_id, valor, status')

  const faturamentoMap: Record<string, number> = {}
  ;(faturas || []).forEach((f) => {
    if (f.status === 'pago') {
      faturamentoMap[f.profissional_id] = (faturamentoMap[f.profissional_id] || 0) + Number(f.valor)
    }
  })

  let csv = 'Profissional;Slug;Status da Conta;Plano;Mensalidade;Faturamento SaaS Pago Acumulado\n'
  ;(profs || []).forEach((p) => {
    const nome = `"${p.nome.replace(/"/g, '""')}"`
    const slug = p.slug
    const status = p.status_conta || 'trial'
    const plano = p.plano_tipo || 'mensal'
    const valor = Number(p.valor_mensalidade || 69.90).toFixed(2).replace('.', ',')
    const pagoAcumulado = (faturamentoMap[p.id] || 0).toFixed(2).replace('.', ',')

    csv += `${nome};${slug};${status};${plano};R$ ${valor};R$ ${pagoAcumulado}\n`
  })

  return csv
}

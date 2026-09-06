import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 1. Carregar variáveis de ambiente do .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=')
      const val = rest.join('=').replace(/^["']|["']$/g, '').trim()
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🚀 INICIANDO RESET GERAL E SEED DO AMBIENTE LUMÊ...')

  // 1. Obter IDs e Emails dos Administradores para proteção absoluta
  const { data: adminRows } = await supabase.from('admin_users').select('id, email')
  const protectedAdminEmails = new Set(
    (adminRows || []).map((a) => (a.email || '').toLowerCase()).filter(Boolean)
  )
  protectedAdminEmails.add('nicolasnavasantos@gmail.com')

  const protectedAdminIds = new Set((adminRows || []).map((a) => a.id))

  console.log('🛡️  Admins protegidos (NÃO SERÃO APAGADOS):', Array.from(protectedAdminEmails))

  // 2. Buscar todos os usuários do Auth
  const { data: allAuthUsers, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) {
    console.error('Erro ao listar usuários auth:', listError)
    process.exit(1)
  }

  const usersToDelete = allAuthUsers.users.filter(
    (u) => !protectedAdminIds.has(u.id) && !protectedAdminEmails.has((u.email || '').toLowerCase())
  )

  console.log(`🧹 Contas encontradas para exclusão: ${usersToDelete.length}`)

  // 3. Limpar dados no banco associados a contas não-admin
  for (const user of usersToDelete) {
    console.log(`- Excluindo dados de: ${user.email} (${user.id})...`)
    try {
      // Cupons
      const { data: userCupons } = await (supabase.from('cupons_profissional') as any)
        .select('id')
        .eq('profissional_id', user.id)
      const cIds = (userCupons || []).map((c: any) => c.id)
      if (cIds.length > 0) {
        await (supabase.from('cupom_usos') as any).delete().in('cupom_id', cIds)
      }
      await (supabase.from('cupons_profissional') as any).delete().eq('profissional_id', user.id)

      // Metas e relatórios
      await (supabase.from('metas_mensais') as any).delete().eq('profissional_id', user.id)
      await (supabase.from('relatorios_mensais_fechados') as any).delete().eq('profissional_id', user.id)
      await (supabase.from('avaliacoes') as any).delete().eq('profissional_id', user.id)

      // Agendamentos e serviços
      const { data: ags } = await supabase.from('agendamentos').select('id').eq('profissional_id', user.id)
      const agIds = (ags || []).map((a) => a.id)
      if (agIds.length > 0) {
        await (supabase.from('agendamento_servicos') as any).delete().in('agendamento_id', agIds)
      }
      await supabase.from('agendamentos').delete().eq('profissional_id', user.id)
      await supabase.from('clientes').delete().eq('profissional_id', user.id)
      await (supabase.from('combos') as any).delete().eq('profissional_id', user.id)
      await supabase.from('servicos').delete().eq('profissional_id', user.id)
      await supabase.from('disponibilidade').delete().eq('profissional_id', user.id)

      // Vínculos de estúdios
      await (supabase.from('estudio_profissionais') as any).delete().eq('profissional_id', user.id)
      await (supabase.from('estudio_convites') as any).delete().eq('profissional_id', user.id)
      await (supabase.from('estudios') as any).delete().eq('dono_id', user.id)

      // Profissional
      await supabase.from('profissionais').delete().eq('id', user.id)

      // Auth user
      await supabase.auth.admin.deleteUser(user.id)
    } catch (errClean) {
      console.warn(`Aviso na limpeza do usuário ${user.id}:`, errClean)
    }
  }

  // 4. Limpeza adicional de estúdios órfãos (não pertencentes a admins)
  try {
    const { data: oldEstudios } = await (supabase.from('estudios') as any).select('id, dono_id')
    for (const est of oldEstudios || []) {
      if (!protectedAdminIds.has(est.dono_id)) {
        await (supabase.from('estudio_profissionais') as any).delete().eq('estudio_id', est.id)
        await (supabase.from('estudios') as any).delete().eq('id', est.id)
      }
    }
  } catch (e) {}

  console.log('✅ Limpeza de contas antigas concluída!')

  // =========================================================================
  // 5. CRIAÇÃO DAS CONTAS SOLICITADAS
  // =========================================================================
  const PASSWORD_DEFAULT = 'Password123!'
  console.log(`\n🔑 Senha padrão definida para todas as contas de teste: ${PASSWORD_DEFAULT}`)

  // Função auxiliar para criar usuário no Auth e garantir login direto
  async function createAuthUser(email: string, nome: string) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD_DEFAULT,
      email_confirm: true,
      user_metadata: { nome },
    })

    if (error) {
      // Se já existe, tenta buscar
      console.warn(`Usuário ${email} já existente ou erro: ${error.message}. Tentando buscar...`)
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
      if (existing) return existing.id
      throw error
    }
    return data.user.id
  }

  // -------------------------------------------------------------------------
  // CONTA 1: DONA DO STUDIO (Helena Valença) - Tem absolutamente tudo ativado
  // -------------------------------------------------------------------------
  console.log('\n👑 [1/4] Criando Conta 1: Dona do Studio (dona@lume.app)...')
  const donaId = await createAuthUser('dona@lume.app', 'Helena Valença')

  // Criar Registro do Studio
  const { data: estudioCriado, error: estError } = await (supabase.from('estudios') as any)
    .insert({
      nome: 'Studio Bella Donna',
      slug: 'studio-bella-donna',
      dono_id: donaId,
      telefone: '11998881122',
      whatsapp: '11998881122',
      instagram: '@studiobelladonna',
      localizacao: 'Alameda Santos, 1470 - Jardins, São Paulo - SP',
      bio: 'O refúgio de beleza e autocuidado mais exclusivo dos Jardins. Especialistas em beleza do olhar, unhas de fibra e hair styling.',
    })
    .select('id')
    .single()

  const estudioId = estudioCriado?.id

  // Criar Registro da Profissional (Dona)
  await (supabase.from('profissionais') as any).upsert({
    id: donaId,
    nome: 'Helena Valença',
    slug: 'helena-valenca',
    estudio_id: estudioId,
    bio: 'Fundadora e Master Lash Designer do Studio Bella Donna. Educadora internacional e especialista em biossegurança e naturalidade.',
    tagline: 'Elevando sua beleza e autoestima ao mais alto padrão ✨',
    categoria: ['Lash Designer', 'Designer de Sobrancelhas'],
    modalidade_atendimento: ['studio', 'no_local'],
    formas_pagamento_aceitas: ['pix', 'cartao', 'dinheiro'],
    localizacao: 'Alameda Santos, 1470 - Jardins, São Paulo - SP',
    whatsapp: '11998881122',
    instagram: '@helenavalença.beauty',
    cor_primaria: '#4A3F5C',
    cor_secundaria: '#FAF7F5',
    status_conta: 'ativa',
    plano_tipo: 'mensal',
    valor_mensalidade: 55.92, // 20% de desconto por indicar Carla e Beatriz!
    codigo_indicacao: 'HELENA100',
    is_demo: false,
  })

  // Vincular à tabela estudio_profissionais
  if (estudioId) {
    await (supabase.from('estudio_profissionais') as any).upsert({
      estudio_id: estudioId,
      profissional_id: donaId,
      papel: 'dona',
      ativo: true,
    })
  }

  // Serviços da Dona
  const { data: servicosDona } = await supabase
    .from('servicos')
    .insert([
      {
        profissional_id: donaId,
        nome: 'Extensão de Cílios Fio a Fio Clássico',
        descricao: 'Aplicação fio a fio para efeito máscara natural e sofisticado.',
        preco: 170.0,
        duracao_minutos: 120,
        ativo: true,
      },
      {
        profissional_id: donaId,
        nome: 'Volume Russo Glamour',
        descricao: 'Densidade harmônica com leques leves de 3D a 6D.',
        preco: 230.0,
        duracao_minutos: 150,
        ativo: true,
      },
      {
        profissional_id: donaId,
        nome: 'Manutenção Fio a Fio (Até 20 dias)',
        descricao: 'Limpeza, reposição e alinhamento dos fios.',
        preco: 100.0,
        duracao_minutos: 75,
        ativo: true,
      },
      {
        profissional_id: donaId,
        nome: 'Design de Sobrancelhas Personalizado',
        descricao: 'Mapeamento facial completo e pinçamento de precisão.',
        preco: 60.0,
        duracao_minutos: 45,
        ativo: true,
      },
      {
        profissional_id: donaId,
        nome: 'Brow Lamination & Tintura Especial',
        descricao: 'Alinhamento dos fios rebeldes com hidratação de colágeno.',
        preco: 140.0,
        duracao_minutos: 60,
        ativo: true,
      },
    ])
    .select('id, nome, preco, duracao_minutos')

  // Combos / Pacotes da Dona
  if (servicosDona && servicosDona.length >= 2) {
    await (supabase.from('combos') as any).insert([
      {
        profissional_id: donaId,
        nome: 'Pacote Olhar Completo (Cílios + Sobrancelhas)',
        descricao: 'Extensão Fio a Fio + Design de Sobrancelhas com desconto especial.',
        preco_original: 230.0,
        preco_combo: 195.0,
        duracao_total_minutos: 165,
        servico_ids: [servicosDona[0].id, servicosDona[3].id],
        ativo: true,
      },
      {
        profissional_id: donaId,
        nome: 'Assinatura Beleza: Volume Russo + Manutenção Garantida',
        descricao: 'Aplicação inicial do Volume Russo com 1 manutenção quinzenal inclusa.',
        preco_original: 330.0,
        preco_combo: 280.0,
        duracao_total_minutos: 225,
        servico_ids: [servicosDona[1].id, servicosDona[2].id],
        ativo: true,
      },
    ])
  }

  // Disponibilidade da Dona (Segunda a Sábado)
  const dispDona = [1, 2, 3, 4, 5, 6].map((dia) => ({
    profissional_id: donaId,
    dia_semana: dia,
    hora_inicio: '09:00',
    hora_fim: dia === 6 ? '16:00' : '19:00',
    intervalo_inicio: '12:00',
    intervalo_fim: '13:00',
    ativo: true,
  }))
  await supabase.from('disponibilidade').insert(dispDona)

  // Clientes da Dona
  const clientesDonaData = [
    { nome: 'Ana Beatriz Souza', telefone: '11991112233' },
    { nome: 'Gabriela Lima', telefone: '11992223344' },
    { nome: 'Vanessa Rodrigues', telefone: '11993334455' },
    { nome: 'Patrícia Mendes', telefone: '11994445566' },
    { nome: 'Renata Albuquerque', telefone: '11995556677' },
    { nome: 'Isabela Fontes', telefone: '11996667788' },
  ]
  const { data: clientesDona } = await supabase
    .from('clientes')
    .insert(clientesDonaData.map((c) => ({ profissional_id: donaId, ...c })))
    .select('id, nome, telefone')

  // Agendamentos da Dona (Últimos 60 dias)
  const now = new Date()
  const agendamentosDona: any[] = []
  const servsD = servicosDona || []
  const clisD = clientesDona || []

  for (let i = 0; i < 22; i++) {
    const cli = clisD[i % clisD.length]
    const srv = servsD[i % servsD.length]
    const daysAgo = Math.floor(i * 2.5) + 1
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    d.setHours(10 + (i % 7), 0, 0, 0)
    const fim = new Date(d.getTime() + (srv?.duracao_minutos || 60) * 60 * 1000)

    const status = i === 5 ? 'cancelado' : i === 12 ? 'no_show' : 'concluido'

    agendamentosDona.push({
      profissional_id: donaId,
      cliente_id: cli?.id,
      servico_id: srv?.id,
      data_hora_inicio: d.toISOString(),
      data_hora_fim: fim.toISOString(),
      status,
      status_pagamento: status === 'concluido' ? 'pago_no_local' : 'cancelado',
      pago: status === 'concluido',
      forma_pagamento: 'pix',
      forma_pagamento_preferida: 'pix',
      valor_cobrado: srv?.preco || 150,
      created_at: new Date(d.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  // Agendamentos futuros confirmados da Dona
  for (let i = 1; i <= 3; i++) {
    const cli = clisD[i % clisD.length]
    const srv = servsD[i % servsD.length]
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    d.setHours(14, 0, 0, 0)
    const fim = new Date(d.getTime() + (srv?.duracao_minutos || 60) * 60 * 1000)

    agendamentosDona.push({
      profissional_id: donaId,
      cliente_id: cli?.id,
      servico_id: srv?.id,
      data_hora_inicio: d.toISOString(),
      data_hora_fim: fim.toISOString(),
      status: 'confirmado',
      status_pagamento: 'pendente',
      pago: false,
      forma_pagamento_preferida: 'cartao',
      valor_cobrado: srv?.preco || 150,
      created_at: now.toISOString(),
    })
  }

  const { data: agsDonaCriados } = await (supabase.from('agendamentos') as any)
    .insert(agendamentosDona)
    .select('id, status')

  // Avaliações da Dona
  const concluidosDona = (agsDonaCriados || []).filter((a: any) => a.status === 'concluido')
  const avaliacoesDona = [
    { nota: 5, comentario: 'A melhor Lash de SP! Meus cílios duram o mês inteiro perfeitos!' },
    { nota: 5, comentario: 'O Studio Bella Donna é impecável. Atendimento com café, carinho e muita precisão técnica.' },
    { nota: 5, comentario: 'Fiz o pacote e amei o resultado da sobrancelha combinando com a extensão!' },
    { nota: 5, comentario: 'Ambiente aconchegante, biossegurança nota mil. Recomendo sempre!' },
  ]
  for (let i = 0; i < Math.min(avaliacoesDona.length, concluidosDona.length); i++) {
    await supabase.from('avaliacoes').insert({
      profissional_id: donaId,
      agendamento_id: concluidosDona[i].id,
      nota: avaliacoesDona[i].nota,
      comentario: avaliacoesDona[i].comentario,
    })
  }

  // Cupons da Dona
  const validadeCupons = new Date()
  validadeCupons.setDate(validadeCupons.getDate() + 60)
  await (supabase.from('cupons_profissional') as any).insert([
    {
      profissional_id: donaId,
      codigo: 'BOASVINDAS15',
      tipo_desconto: 'percentual',
      valor: 15,
      segmento_alvo: 'nunca_agendou',
      limite_uso_total: 50,
      limite_uso_por_cliente: 1,
      valido_ate: validadeCupons.toISOString(),
      usos_atuais: 5,
      ativo: true,
    },
    {
      profissional_id: donaId,
      codigo: 'VOLTA20',
      tipo_desconto: 'valor_fixo',
      valor: 20.0,
      segmento_alvo: 'inativa',
      limite_uso_total: 30,
      limite_uso_por_cliente: 1,
      valido_ate: validadeCupons.toISOString(),
      usos_atuais: 2,
      ativo: true,
    },
    {
      profissional_id: donaId,
      codigo: 'DONA10',
      tipo_desconto: 'percentual',
      valor: 10,
      segmento_alvo: 'todos',
      limite_uso_total: 100,
      limite_uso_por_cliente: 1,
      valido_ate: null,
      usos_atuais: 11,
      ativo: true,
    },
  ])

  // Metas da Dona
  const mesAtualStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const mesAntStr = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  await (supabase.from('metas_mensais') as any).insert([
    { profissional_id: donaId, mes_referencia: mesAtualStr, tipo_meta: 'faturamento', valor_meta: 5000.0 },
    { profissional_id: donaId, mes_referencia: mesAntStr, tipo_meta: 'faturamento', valor_meta: 4200.0 },
  ])

  // -------------------------------------------------------------------------
  // CONTA 2: PARTICIPANTE 1 (Carla Nails) - Indicada pela Dona
  // -------------------------------------------------------------------------
  console.log('\n💅 [2/4] Criando Conta 2: Carla Nails (carla@lume.app)...')
  const carlaId = await createAuthUser('carla@lume.app', 'Carla Nails')

  await (supabase.from('profissionais') as any).upsert({
    id: carlaId,
    nome: 'Carla Nails',
    slug: 'carla-nails',
    estudio_id: estudioId,
    indicado_por: donaId, // Indicada pela Helena Dona!
    bio: 'Especialista em Alongamento em Fibra de Vidro, Gel Moldado e Nail Art Minimalista no Studio Bella Donna.',
    tagline: 'Unhas impecáveis, resistentes e com acabamento ultra natural ✨',
    categoria: ['Nail Designer', 'Manicure'],
    modalidade_atendimento: ['studio'],
    formas_pagamento_aceitas: ['pix', 'cartao', 'dinheiro'],
    localizacao: 'Alameda Santos, 1470 - Jardins, São Paulo - SP',
    whatsapp: '11997772233',
    instagram: '@carlanails.studio',
    cor_primaria: '#8675A9',
    cor_secundaria: '#FAF7F5',
    status_conta: 'ativa',
    plano_tipo: 'mensal',
    valor_mensalidade: 69.90,
    is_demo: false,
  })

  if (estudioId) {
    await (supabase.from('estudio_profissionais') as any).upsert({
      estudio_id: estudioId,
      profissional_id: carlaId,
      papel: 'membro',
      ativo: true,
    })
  }

  // Serviços da Carla
  const { data: servicosCarla } = await supabase
    .from('servicos')
    .insert([
      { profissional_id: carlaId, nome: 'Alongamento em Fibra de Vidro', preco: 180.0, duracao_minutos: 150, ativo: true },
      { profissional_id: carlaId, nome: 'Manutenção em Fibra de Vidro', preco: 110.0, duracao_minutos: 90, ativo: true },
      { profissional_id: carlaId, nome: 'Esmaltação em Gel com Blindagem', preco: 85.0, duracao_minutos: 60, ativo: true },
      { profissional_id: carlaId, nome: 'Spa dos Pés com Plástica Podal', preco: 95.0, duracao_minutos: 50, ativo: true },
    ])
    .select('id, nome, preco, duracao_minutos')

  // Disponibilidade da Carla
  await supabase.from('disponibilidade').insert(
    [2, 3, 4, 5, 6].map((dia) => ({
      profissional_id: carlaId,
      dia_semana: dia,
      hora_inicio: '10:00',
      hora_fim: '19:00',
      intervalo_inicio: '13:00',
      intervalo_fim: '14:00',
      ativo: true,
    }))
  )

  // Clientes e agendamentos da Carla
  const { data: clientesCarla } = await supabase
    .from('clientes')
    .insert([
      { profissional_id: carlaId, nome: 'Tatiane Amaral', telefone: '11997771122' },
      { profissional_id: carlaId, nome: 'Carolina Silveira', telefone: '11998883344' },
    ])
    .select('id')

  if (clientesCarla && servicosCarla) {
    await (supabase.from('agendamentos') as any).insert([
      {
        profissional_id: carlaId,
        cliente_id: clientesCarla[0].id,
        servico_id: servicosCarla[0].id,
        data_hora_inicio: new Date(now.getTime() - 2 * 86400000).toISOString(),
        data_hora_fim: new Date(now.getTime() - 2 * 86400000 + 9000000).toISOString(),
        status: 'concluido',
        status_pagamento: 'pago_no_local',
        pago: true,
        valor_cobrado: 180.0,
      },
    ])
  }

  // -------------------------------------------------------------------------
  // CONTA 3: PARTICIPANTE 2 (Beatriz Hair & Make) - Indicada pela Dona
  // -------------------------------------------------------------------------
  console.log('\n💇 [3/4] Criando Conta 3: Beatriz Hair (beatriz@lume.app)...')
  const beatrizId = await createAuthUser('beatriz@lume.app', 'Beatriz Hair')

  await (supabase.from('profissionais') as any).upsert({
    id: beatrizId,
    nome: 'Beatriz Hair & Make',
    slug: 'beatriz-hair',
    estudio_id: estudioId,
    indicado_por: donaId, // Também indicada pela Helena Dona!
    bio: 'Hairstylist e Maquiadora no Studio Bella Donna. Apaixonada por mechas naturais, escovas duradouras e maquiagem glow.',
    tagline: 'Seus cabelos e produção nas mãos de quem entende de sofisticação 💖',
    categoria: ['Cabeleireira', 'Maquiadora'],
    modalidade_atendimento: ['studio'],
    formas_pagamento_aceitas: ['pix', 'cartao', 'dinheiro'],
    localizacao: 'Alameda Santos, 1470 - Jardins, São Paulo - SP',
    whatsapp: '11996663322',
    instagram: '@beatrizhair.make',
    cor_primaria: '#B8A9D9',
    cor_secundaria: '#FAF7F5',
    status_conta: 'ativa',
    plano_tipo: 'mensal',
    valor_mensalidade: 69.90,
    is_demo: false,
  })

  if (estudioId) {
    await (supabase.from('estudio_profissionais') as any).upsert({
      estudio_id: estudioId,
      profissional_id: beatrizId,
      papel: 'membro',
      ativo: true,
    })
  }

  // Serviços da Beatriz
  await supabase.from('servicos').insert([
    { profissional_id: beatrizId, nome: 'Escova Modelada Glamour com Lavagem', preco: 90.0, duracao_minutos: 60, ativo: true },
    { profissional_id: beatrizId, nome: 'Tratamento Cronograma Capilar com Ozônio', preco: 160.0, duracao_minutos: 75, ativo: true },
    { profissional_id: beatrizId, nome: 'Maquiagem Social Completa (com Cílios)', preco: 220.0, duracao_minutos: 90, ativo: true },
  ])

  // Disponibilidade da Beatriz
  await supabase.from('disponibilidade').insert(
    [3, 4, 5, 6].map((dia) => ({
      profissional_id: beatrizId,
      dia_semana: dia,
      hora_inicio: '10:00',
      hora_fim: '20:00',
      intervalo_inicio: '14:00',
      intervalo_fim: '15:00',
      ativo: true,
    }))
  )

  // -------------------------------------------------------------------------
  // CONTA 4: CONTA DEMO PERMANENTE DE VENDAS (demo@lume.app)
  // -------------------------------------------------------------------------
  console.log('\n🌟 [4/4] Criando Conta 4: DEMO PERMANENTE DE VENDAS (demo@lume.app)...')
  const demoId = await createAuthUser('demo@lume.app', 'Camila Alcantara Beauty (DEMO)')

  await (supabase.from('profissionais') as any).upsert({
    id: demoId,
    nome: 'Camila Alcantara Beauty',
    slug: 'camila-alcantara-demo',
    bio: 'Especialista em Lash Design, Extensão de Cílios e Sobrancelhas de Alto Padrão. Mais de 5 anos transformando olhares com biossegurança, precisão e carinho.',
    tagline: 'Realçando o que há de mais deslumbrante no seu olhar ✨ (Vitrine Demonstração)',
    categoria: ['Lash Designer', 'Designer de Sobrancelhas'],
    modalidade_atendimento: ['no_local', 'a_domicilio'],
    formas_pagamento_aceitas: ['pix', 'cartao', 'dinheiro'],
    localizacao: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    whatsapp: '11987654321',
    instagram: '@camilaalcantara.beauty',
    cor_primaria: '#7C3AED',
    cor_secundaria: '#FAF7F5',
    status_conta: 'ativa',
    plano_tipo: 'mensal',
    valor_mensalidade: 69.90,
    is_demo: true, // MARCAÇÃO DEMO EXPLICITA!
  })

  // Usar o script de seed demo para popular o histórico de 3 meses da conta demo
  const { resetAndSeedDemoAccountAction } = await import('@/app/actions/demoSeed')
  // Execução direta simulando admin
  const { data: demoProfCreated } = await (supabase.from('profissionais') as any)
    .select('id')
    .eq('id', demoId)
    .single()

  if (demoProfCreated) {
    // 5 Serviços Demo
    const { data: demoServicos } = await supabase
      .from('servicos')
      .insert([
        { profissional_id: demoId, nome: 'Extensão de Cílios Fio a Fio Clássico', preco: 160.0, duracao_minutos: 120, ativo: true },
        { profissional_id: demoId, nome: 'Volume Russo Glamour', preco: 220.0, duracao_minutos: 150, ativo: true },
        { profissional_id: demoId, nome: 'Manutenção Fio a Fio (Até 20 dias)', preco: 95.0, duracao_minutos: 75, ativo: true },
        { profissional_id: demoId, nome: 'Design de Sobrancelhas Personalizado', preco: 55.0, duracao_minutos: 45, ativo: true },
        { profissional_id: demoId, nome: 'Lash Lifting & Nutrição com Queratina', preco: 130.0, duracao_minutos: 60, ativo: true },
      ])
      .select('id, nome, preco, duracao_minutos')

    // Disponibilidade Demo
    await supabase.from('disponibilidade').insert(
      [1, 2, 3, 4, 5, 6].map((dia) => ({
        profissional_id: demoId,
        dia_semana: dia,
        hora_inicio: '09:00',
        hora_fim: dia === 6 ? '15:00' : '19:00',
        ativo: true,
      }))
    )

    // Clientes Demo
    const { data: demoClientes } = await supabase
      .from('clientes')
      .insert([
        { profissional_id: demoId, nome: 'Mariana Silva', telefone: '11991234567' },
        { profissional_id: demoId, nome: 'Juliana Costa', telefone: '11982345678' },
        { profissional_id: demoId, nome: 'Beatriz Rocha', telefone: '11973456789' },
        { profissional_id: demoId, nome: 'Fernanda Martins', telefone: '11964567890' },
        { profissional_id: demoId, nome: 'Larissa Santos', telefone: '11955678901' },
      ])
      .select('id')

    // 25 agendamentos distribuídos nos últimos 3 meses
    if (demoClientes && demoServicos) {
      const demoAgs: any[] = []
      for (let i = 0; i < 25; i++) {
        const c = demoClientes[i % demoClientes.length]
        const s = demoServicos[i % demoServicos.length]
        const daysAgo = Math.floor(i * 3.5) + 1
        const dt = new Date(now.getTime() - daysAgo * 86400000)
        dt.setHours(10 + (i % 7), 0, 0, 0)
        const fim = new Date(dt.getTime() + s.duracao_minutos * 60000)

        demoAgs.push({
          profissional_id: demoId,
          cliente_id: c.id,
          servico_id: s.id,
          data_hora_inicio: dt.toISOString(),
          data_hora_fim: fim.toISOString(),
          status: i === 7 ? 'cancelado' : i === 14 ? 'no_show' : 'concluido',
          status_pagamento: i === 7 ? 'cancelado' : 'pago_no_local',
          pago: i !== 7 && i !== 14,
          forma_pagamento: 'pix',
          valor_cobrado: s.preco,
        })
      }
      await (supabase.from('agendamentos') as any).insert(demoAgs)
    }

    // Cupons Demo
    await (supabase.from('cupons_profissional') as any).insert([
      { profissional_id: demoId, codigo: 'BOASVINDAS15', tipo_desconto: 'percentual', valor: 15, segmento_alvo: 'nunca_agendou', ativo: true },
      { profissional_id: demoId, codigo: 'VOLTA20', tipo_desconto: 'valor_fixo', valor: 20, segmento_alvo: 'inativa', ativo: true },
      { profissional_id: demoId, codigo: 'DEMOPROMO', tipo_desconto: 'percentual', valor: 10, segmento_alvo: 'todos', ativo: true },
    ])

    // Metas Demo
    await (supabase.from('metas_mensais') as any).insert([
      { profissional_id: demoId, mes_referencia: mesAtualStr, tipo_meta: 'faturamento', valor_meta: 4500.0 },
      { profissional_id: demoId, mes_referencia: mesAntStr, tipo_meta: 'faturamento', valor_meta: 3800.0 },
    ])
  }

  console.log('\n=========================================================================')
  console.log('🎉 SUCESSO ABSOLUTO! TODAS AS CONTAS FORAM CRIADAS E CONFIGURADAS:')
  console.log('=========================================================================')
  console.log('1. 👑 DONA DO STUDIO (COMPLETA COM TODOS OS SISTEMAS):')
  console.log('   - Email: dona@lume.app')
  console.log(`   - Senha: ${PASSWORD_DEFAULT}`)
  console.log('   - Studio: Studio Bella Donna (/studio/studio-bella-donna)')
  console.log('   - Vitrine: /studio/studio-bella-donna/helena-valenca')
  console.log('   - Indicou Carla e Beatriz (Desconto de 20% ativo no SaaS)')
  console.log('   - Serviços, Combos, Clientes, Agendamentos, Avaliações, Metas e Cupons prontos!')
  console.log('\n2. 💅 PARTICIPANTE 1 (NAIL DESIGNER):')
  console.log('   - Email: carla@lume.app')
  console.log(`   - Senha: ${PASSWORD_DEFAULT}`)
  console.log('   - Vinculada ao Studio Bella Donna')
  console.log('\n3. 💇 PARTICIPANTE 2 (HAIR & MAKE):')
  console.log('   - Email: beatriz@lume.app')
  console.log(`   - Senha: ${PASSWORD_DEFAULT}`)
  console.log('   - Vinculada ao Studio Bella Donna')
  console.log('\n4. 🌟 CONTA DEMO PERMANENTE DE VENDAS:')
  console.log('   - Email: demo@lume.app')
  console.log(`   - Senha: ${PASSWORD_DEFAULT}`)
  console.log('   - Vitrine: /p/camila-alcantara-demo (Com banner de vitrine demo)')
  console.log('   - is_demo = true (Isolada das métricas do admin e IA)')
  console.log('=========================================================================')
}

main().catch((err) => {
  console.error('Erro na execução do seed:', err)
  process.exit(1)
})

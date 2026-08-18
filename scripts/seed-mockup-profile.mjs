import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 1. Carregar variáveis de ambiente
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let val = (match[2] || '').trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key(match[1])] = val
  }
})

function key(k) {
  return k.trim()
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Chaves do Supabase não encontradas no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PROFILE_EMAIL = 'studio.camila@lume.app'
const PROFILE_PASSWORD = 'SenhaTeste123!'
const PROFILE_SLUG = 'camila-duarte'

async function seed() {
  console.log('🚀 Iniciando geração do perfil de teste super completo para mockups...')

  // 1. Verificar se usuário já existe no Auth
  const { data: usersList } = await supabase.auth.admin.listUsers()
  let user = usersList?.users?.find((u) => u.email === PROFILE_EMAIL)

  if (!user) {
    console.log(`👤 Criando usuário auth para ${PROFILE_EMAIL}...`)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: PROFILE_EMAIL,
      password: PROFILE_PASSWORD,
      email_confirm: true,
      user_metadata: {
        nome: 'Studio Camila Duarte | Lash & Brow Artist',
      },
    })
    if (createError) {
      console.error('❌ Erro ao criar usuário auth:', createError)
      process.exit(1)
    }
    user = newUser.user
  } else {
    console.log(`👤 Usuário auth já existente: ${user.id} (${PROFILE_EMAIL})`)
  }

  const userId = user.id

  // 2. Limpar dados anteriores deste perfil específico (idempotência limpa)
  console.log('🧹 Limpando dados anteriores deste perfil...')
  const { data: existingAgendamentos } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('profissional_id', userId)

  if (existingAgendamentos && existingAgendamentos.length > 0) {
    const ids = existingAgendamentos.map((a) => a.id)
    await supabase.from('agendamento_servicos').delete().in('agendamento_id', ids)
    await supabase.from('avaliacoes').delete().in('agendamento_id', ids)
  }

  await supabase.from('agendamentos').delete().eq('profissional_id', userId)
  await supabase.from('clientes').delete().eq('profissional_id', userId)
  await supabase.from('servicos').delete().eq('profissional_id', userId)
  await supabase.from('disponibilidade').delete().eq('profissional_id', userId)
  await supabase.from('bloqueios_disponibilidade').delete().eq('profissional_id', userId)
  await supabase.from('saas_faturas').delete().eq('profissional_id', userId)
  await supabase.from('feedbacks').delete().eq('profissional_id', userId)
  await supabase.from('login_logs').delete().eq('profissional_id', userId)
  await supabase.from('nps_respostas').delete().eq('profissional_id', userId)
  await supabase.from('admin_logs').delete().eq('profissional_id', userId)

  // 3. Atualizar/Inserir perfil profissional
  console.log('✨ Configurando perfil de destaque da profissional...')
  const profileData = {
    id: userId,
    nome: 'Studio Camila Duarte | Lash & Brow',
    bio: 'Especialista em Extensão de Cílios, Lash Lifting e Design de Sobrancelhas Personalizado. Transformando olhares com naturalidade, sofisticação e biossegurança. Mais de 5 anos de experiência e +2.500 atendimentos realizados com excelência.',
    tagline: 'Realçando sua beleza natural com exclusividade e arte',
    categoria: ['cilios', 'sobrancelhas', 'estetica'],
    slug: PROFILE_SLUG,
    cor_primaria: '#8B5CF6',
    cor_secundaria: '#FAF5FF',
    localizacao: 'Alameda Santos, 1200 - Conjunto 82, Jardins - São Paulo / SP',
    whatsapp: '11987654321',
    instagram: '@camiladuarte.beauty',
    modalidade_atendimento: ['presencial', 'domicilio'],
    formas_pagamento_aceitas: ['pix', 'cartao', 'dinheiro'],
    janela_agendamento_dias: 60,
    status_conta: 'ativa',
    notas_internas: '⭐ Perfil Modelo / VIP. Excelente taxa de retenção e faturamento consistente. Utiliza muito o link da bio no Instagram.',
    plano_tipo: 'mensal',
    valor_mensalidade: 69.90,
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    proximo_vencimento: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
    foto_capa_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
    onboarding_concluido: true,
  }

  const { error: profError } = await supabase.from('profissionais').upsert(profileData)
  if (profError) {
    console.error('❌ Erro ao atualizar profissionais:', profError)
  } else {
    console.log('✅ Perfil profissional configurado com sucesso!')
  }

  // 4. Inserir Disponibilidade Semanal
  console.log('📅 Criando grade de disponibilidade semanal...')
  const diasDisponibilidade = [
    { dia_semana: 1, hora_inicio: '09:00:00', hora_fim: '19:00:00' }, // Segunda
    { dia_semana: 2, hora_inicio: '09:00:00', hora_fim: '19:00:00' }, // Terça
    { dia_semana: 3, hora_inicio: '09:00:00', hora_fim: '19:00:00' }, // Quarta
    { dia_semana: 4, hora_inicio: '09:00:00', hora_fim: '19:30:00' }, // Quinta
    { dia_semana: 5, hora_inicio: '09:00:00', hora_fim: '19:30:00' }, // Sexta
    { dia_semana: 6, hora_inicio: '08:30:00', hora_fim: '17:00:00' }, // Sábado
  ]

  await supabase.from('disponibilidade').insert(
    diasDisponibilidade.map((d) => ({
      profissional_id: userId,
      ...d,
    }))
  )

  // 5. Inserir Catálogo de Serviços Premium
  console.log('💄 Criando catálogo de serviços...')
  const servicosData = [
    {
      nome: 'Extensão de Cílios - Volume Russo Premium',
      descricao: 'Fans artesanais de 3D a 6D com fios ultrafinos de seda. Proporciona densidade, acabamento aveludado e olhar marcante sem sobrecarregar os fios naturais.',
      duracao_minutos: 120,
      preco: 220.00,
      intervalo_manutencao_dias: 21,
      foto_url: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
    {
      nome: 'Extensão de Cílios - Efeito Fox Eyes / Fio a Fio',
      descricao: 'Alongamento clássico sofisticado com transição de curvaturas alongando os cantos externos para um efeito delineado elegante e natural.',
      duracao_minutos: 90,
      preco: 170.00,
      intervalo_manutencao_dias: 15,
      foto_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
    {
      nome: 'Mega Volume & Efeito Molhado (Wet Lash)',
      descricao: 'Tendência mais pedida do momento: técnica com feixes fechados que reproduzem o visual molhado de máscara de cílios com máxima definição.',
      duracao_minutos: 120,
      preco: 250.00,
      intervalo_manutencao_dias: 20,
      foto_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
    {
      nome: 'Manutenção de Extensão de Cílios (até 21 dias)',
      descricao: 'Higienização profissional com shampoo neutro, remoção criteriosa dos fios com crescimento e reposição de novos fios para manter o volume perfeito.',
      duracao_minutos: 60,
      preco: 130.00,
      intervalo_manutencao_dias: 21,
      foto_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
    {
      nome: 'Lash Lifting com Nutrição e Tintura de Queratina',
      descricao: 'Curvatura e elevação dos próprios cílios naturais desde a raiz, acompanhado de botox de queratina e pigmentação preta intensa. Dura até 6 semanas.',
      duracao_minutos: 60,
      preco: 150.00,
      intervalo_manutencao_dias: 45,
      foto_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
    {
      nome: 'Design Estratégico de Sobrancelhas com Henna',
      descricao: 'Mapeamento facial com linha e paquímetro, alinhamento anatômico e aplicação de henna de alta fixação com efeito sombreado natural ombre.',
      duracao_minutos: 45,
      preco: 75.00,
      intervalo_manutencao_dias: 15,
      foto_url: 'https://images.unsplash.com/photo-1597225244660-1cd128c64284?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
    {
      nome: 'Brow Lamination + Spa de Regeneração',
      descricao: 'Procedimento que reorganiza a direção dos fios das sobrancelhas, criando aspecto mais encorpado, disfarçando falhas e finalizado com máscara de colágeno.',
      duracao_minutos: 50,
      preco: 140.00,
      intervalo_manutencao_dias: 30,
      foto_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
    {
      nome: 'Combo VIP: Volume Russo + Design com Henna + Spa Labial',
      descricao: 'O pacote completo mais vendido: Extensão Volume Russo, Design completo com Henna e Esfoliação + Hidratação labial profunda com ácido hialurônico.',
      duracao_minutos: 150,
      preco: 280.00,
      intervalo_manutencao_dias: 21,
      foto_url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=600&auto=format&fit=crop',
      ativo: true,
    },
  ]

  const { data: createdServicos, error: srvError } = await supabase
    .from('servicos')
    .insert(
      servicosData.map((s) => ({
        profissional_id: userId,
        ...s,
      }))
    )
    .select('*')

  if (srvError) {
    console.error('❌ Erro ao criar serviços:', srvError)
    process.exit(1)
  }
  console.log(`✅ ${createdServicos.length} serviços cadastrados com sucesso!`)

  // 6. Inserir Clientes Realistas
  console.log('👥 Criando carteira de clientes fiéis...')
  const clientesLista = [
    { nome: 'Mariana Silveira', telefone: '(11) 98123-4567' },
    { nome: 'Gabriela Rocha Martins', telefone: '(11) 97234-5678' },
    { nome: 'Beatriz Mendes Cardoso', telefone: '(11) 99345-6789' },
    { nome: 'Carolina Castro Lima', telefone: '(11) 98456-7890' },
    { nome: 'Fernanda Albuquerque', telefone: '(11) 97567-8901' },
    { nome: 'Juliana Souza Prado', telefone: '(11) 99678-9012' },
    { nome: 'Larissa Miranda Ramos', telefone: '(11) 98789-0123' },
    { nome: 'Patrícia Duarte Fontes', telefone: '(11) 97890-1234' },
    { nome: 'Amanda Peixoto Ribeiro', telefone: '(11) 99901-2345' },
    { nome: 'Camila Nogueira Barbosa', telefone: '(11) 98012-3456' },
    { nome: 'Isabella Freitas Costa', telefone: '(11) 97123-4560' },
    { nome: 'Rafaela Morais Vieira', telefone: '(11) 99234-5671' },
    { nome: 'Vanessa Toledo Arruda', telefone: '(11) 98345-6782' },
    { nome: 'Daniela Siqueira Borges', telefone: '(11) 97456-7893' },
    { nome: 'Nathalia Campos Leite', telefone: '(11) 99567-8904' },
    { nome: 'Renata Guimarães Dias', telefone: '(11) 98678-9015' },
    { nome: 'Bruna Meireles Farias', telefone: '(11) 97789-0126' },
    { nome: 'Jéssica Tavares Cunha', telefone: '(11) 99890-1237' },
    { nome: 'Letícia Carvalho Pinto', telefone: '(11) 98901-2348' },
    { nome: 'Tatiane Vasconcelos', telefone: '(11) 97012-3459' },
    { nome: 'Aline Moura Esteves', telefone: '(11) 99123-4560' },
    { nome: 'Sabrina Fagundes Lopes', telefone: '(11) 98234-5671' },
    { nome: 'Priscila Bueno Matos', telefone: '(11) 97345-6782' },
    { nome: 'Eduarda Xavier Antunes', telefone: '(11) 99456-7893' },
    { nome: 'Heloísa Figueiredo', telefone: '(11) 98567-8904' },
    { nome: 'Monique Pires Rezende', telefone: '(11) 97678-9015' },
    { nome: 'Bianca Viana Peçanha', telefone: '(11) 99789-0126' },
    { nome: 'Vivian Moreira Barros', telefone: '(11) 98890-1237' },
    { nome: 'Cintia Godoy Brandão', telefone: '(11) 97901-2348' },
    { nome: 'Luana Salgado Correa', telefone: '(11) 99012-3459' },
    { nome: 'Débora Diniz Valente', telefone: '(11) 98135-7924' },
    { nome: 'Marcella Franco Neves', telefone: '(11) 97246-8035' },
    { nome: 'Thais Dornelles Pinho', telefone: '(11) 99357-9146' },
    { nome: 'Flávia Bernardes Luz', telefone: '(11) 98468-0257' },
    { nome: 'Lorena Silveira Couto', telefone: '(11) 97579-1368' },
  ]

  const { data: createdClientes, error: cliError } = await supabase
    .from('clientes')
    .insert(
      clientesLista.map((c) => ({
        profissional_id: userId,
        ...c,
      }))
    )
    .select('*')

  if (cliError) {
    console.error('❌ Erro ao criar clientes:', cliError)
    process.exit(1)
  }
  console.log(`✅ ${createdClientes.length} clientes cadastrados!`)

  // 7. Gerar Histórico Massivo de Agendamentos (Distribuído entre Maio e Setembro de 2026)
  console.log('⏰ Gerando mais de 100 agendamentos com faturamento realista...')

  // Referência do tempo atual do sistema
  const baseNow = new Date() // ~17 de Agosto de 2026

  // Definição dos slots de atendimento diários (NUNCA colidem)
  const timeSlots = [
    { startH: 9, startM: 0, endH: 10, endM: 30 },
    { startH: 11, startM: 0, endH: 12, endM: 30 },
    { startH: 14, startM: 0, endH: 15, endM: 30 },
    { startH: 16, startM: 0, endH: 18, endM: 0 },
  ]

  const formasPagamento = ['pix', 'cartao_credito', 'pix', 'cartao_debito', 'pix', 'dinheiro', 'cartao_credito']
  const avaliacoesComentarios = [
    'Amei muito! Meus cílios duraram mais de 4 semanas intactos. Já virei cliente fiel!',
    'Atendimento maravilhoso, estúdio cheiroso, café delicioso e a Camila tem mãos de fada.',
    'Melhor lash designer de SP! O volume russo ficou leve e super elegante, sem pesar nada.',
    'Minha sobrancelha nunca foi tão perfeita. O design estratégico valorizou demais meu rosto.',
    'Profissionalismo impecável, pontualidade britânica e um capricho que nunca vi igual.',
    'Fiz o Lash Lifting e estou apaixonada, todo mundo elogia meus cílios!',
    'O Brow Lamination durou muito tempo. Super recomendo!',
    'Excelente experiência do agendamento até a finalização do atendimento.',
    'Amei o combo VIP, valeu cada centavo!',
    'Cílios perfeitos para o meu casamento, segurou a festa inteira e a lua de mel!',
    'Ambiente super aconchegante e higienizado. Super recomendo a Camila!',
    'Sempre saio com a autoestima nas alturas!',
  ]

  const agendamentosToInsert = []
  const avaliacoesToInsert = []
  const agendamentoServicosToInsert = []

  // Gerar dias do passado (de 90 dias atrás até ontem)
  // De -90 dias até +14 dias
  let globalIndex = 0

  for (let dayOffset = -90; dayOffset <= 14; dayOffset++) {
    const currentDate = new Date(baseNow)
    currentDate.setDate(baseNow.getDate() + dayOffset)

    const diaSemana = currentDate.getDay()
    // Domingo não trabalha
    if (diaSemana === 0) continue

    // Quantidade de atendimentos por dia (2 a 4)
    const slotsCount = diaSemana === 6 ? 3 : (dayOffset % 2 === 0 ? 4 : 3)

    for (let s = 0; s < slotsCount; s++) {
      const slot = timeSlots[s]
      const inicio = new Date(currentDate)
      inicio.setHours(slot.startH, slot.startM, 0, 0)

      const fim = new Date(currentDate)
      fim.setHours(slot.endH, slot.endM, 0, 0)

      const client = createdClientes[globalIndex % createdClientes.length]
      const service = createdServicos[globalIndex % createdServicos.length]
      const forma = formasPagamento[globalIndex % formasPagamento.length]

      // Determinar status baseado na data
      let status = 'concluido'
      let pago = true
      let valorCobrado = Number(service.preco)

      if (dayOffset > 0) {
        // Futuro
        status = 'confirmado'
        pago = globalIndex % 3 === 0 // alguns já pré-pagaram por pix
      } else if (dayOffset === 0) {
        // Hoje (17 de Agosto)
        if (s < 2) {
          status = 'concluido'
          pago = true
        } else {
          status = 'confirmado'
          pago = s === 2
        }
      } else {
        // Passado: 92% concluído, 5% cancelado, 3% no_show
        if (globalIndex % 23 === 0) {
          status = 'cancelado'
          pago = false
          valorCobrado = 0
        } else if (globalIndex % 37 === 0) {
          status = 'no_show'
          pago = false
          valorCobrado = 0
        } else {
          status = 'concluido'
          pago = true
        }
      }

      const agendamentoId = crypto.randomUUID()

      agendamentosToInsert.push({
        id: agendamentoId,
        profissional_id: userId,
        cliente_id: client.id,
        servico_id: service.id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        status,
        forma_pagamento: pago ? forma : null,
        forma_pagamento_preferida: forma,
        valor_cobrado: valorCobrado,
        pago,
        observacao_pagamento: pago ? `Pagamento aprovado via ${forma.toUpperCase()}` : 'Pendente de acerto',
        lembrete_confirmacao_enviado: true,
        lembrete_manutencao_enviado: status === 'concluido',
        created_at: new Date(inicio.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // Agendamento Serviços
      agendamentoServicosToInsert.push({
        agendamento_id: agendamentoId,
        servico_id: service.id,
        preco_no_momento: service.preco,
        duracao_no_momento_minutos: service.duracao_minutos,
        created_at: inicio.toISOString(),
      })

      // Avaliações (para ~35 dos atendimentos concluídos)
      if (status === 'concluido' && globalIndex % 3 === 0) {
        const nota = globalIndex % 15 === 0 ? 4 : 5
        const comentario = avaliacoesComentarios[globalIndex % avaliacoesComentarios.length]
        avaliacoesToInsert.push({
          agendamento_id: agendamentoId,
          profissional_id: userId,
          nota,
          comentario,
          created_at: new Date(fim.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        })
      }

      globalIndex++
    }
  }

  // Inserir agendamentos em lotes
  console.log(`📥 Inserindo ${agendamentosToInsert.length} agendamentos no banco...`)
  const chunkSize = 40
  for (let i = 0; i < agendamentosToInsert.length; i += chunkSize) {
    const chunk = agendamentosToInsert.slice(i, i + chunkSize)
    const { error: agError } = await supabase.from('agendamentos').insert(chunk)
    if (agError) {
      console.error(`❌ Erro ao inserir lote de agendamentos (${i}):`, agError)
    }
  }

  console.log(`📥 Inserindo ${agendamentoServicosToInsert.length} itens de agendamento_servicos...`)
  for (let i = 0; i < agendamentoServicosToInsert.length; i += chunkSize) {
    const chunk = agendamentoServicosToInsert.slice(i, i + chunkSize)
    const { error: asError } = await supabase.from('agendamento_servicos').insert(chunk)
    if (asError) {
      console.error('❌ Erro em agendamento_servicos:', asError)
    }
  }

  console.log(`⭐ Inserindo ${avaliacoesToInsert.length} avaliações 5 estrelas com depoimentos...`)
  for (let i = 0; i < avaliacoesToInsert.length; i += chunkSize) {
    const chunk = avaliacoesToInsert.slice(i, i + chunkSize)
    const { error: avError } = await supabase.from('avaliacoes').insert(chunk)
    if (avError) {
      console.error('❌ Erro em avaliacoes:', avError)
    }
  }

  // 8. Faturas SaaS (Histórico Financeiro do SaaS)
  console.log('💳 Criando faturas e histórico de mensalidades SaaS...')
  const saasFaturas = [
    {
      profissional_id: userId,
      plano_slug: 'mensal',
      valor: 69.90,
      status: 'pago',
      forma_pagamento: 'pix',
      data_vencimento: new Date(baseNow.getFullYear(), baseNow.getMonth() - 3, 15).toISOString(),
      data_pagamento: new Date(baseNow.getFullYear(), baseNow.getMonth() - 3, 14, 10, 30).toISOString(),
      codigo_pix: '00020126580014BR.GOV.BCB.PIX0136lume-saas-pagamento-123456789520400005303986540569.905802BR5915LUME TECNOLOGIA6009SAO PAULO62070503***6304ABCD',
    },
    {
      profissional_id: userId,
      plano_slug: 'mensal',
      valor: 69.90,
      status: 'pago',
      forma_pagamento: 'cartao_credito',
      data_vencimento: new Date(baseNow.getFullYear(), baseNow.getMonth() - 2, 15).toISOString(),
      data_pagamento: new Date(baseNow.getFullYear(), baseNow.getMonth() - 2, 15, 8, 12).toISOString(),
    },
    {
      profissional_id: userId,
      plano_slug: 'mensal',
      valor: 69.90,
      status: 'pago',
      forma_pagamento: 'pix',
      data_vencimento: new Date(baseNow.getFullYear(), baseNow.getMonth() - 1, 15).toISOString(),
      data_pagamento: new Date(baseNow.getFullYear(), baseNow.getMonth() - 1, 14, 21, 45).toISOString(),
      codigo_pix: '00020126580014BR.GOV.BCB.PIX0136lume-saas-pagamento-987654321520400005303986540569.905802BR5915LUME TECNOLOGIA6009SAO PAULO62070503***6304EFGH',
    },
    {
      profissional_id: userId,
      plano_slug: 'mensal',
      valor: 69.90,
      status: 'pago',
      forma_pagamento: 'cartao_credito',
      data_vencimento: new Date(baseNow.getFullYear(), baseNow.getMonth(), 15).toISOString(),
      data_pagamento: new Date(baseNow.getFullYear(), baseNow.getMonth(), 15, 9, 0).toISOString(),
    },
    {
      profissional_id: userId,
      plano_slug: 'mensal',
      valor: 69.90,
      status: 'pendente',
      forma_pagamento: 'pix',
      data_vencimento: new Date(baseNow.getFullYear(), baseNow.getMonth() + 1, 15).toISOString(),
      link_pagamento: 'https://pagamento.lume.app/fatura/camila-setembro',
      codigo_pix: '00020126580014BR.GOV.BCB.PIX0136lume-saas-pagamento-future-520400005303986540569.905802BR5915LUME TECNOLOGIA6009SAO PAULO62070503***6304WXYZ',
    },
  ]

  await supabase.from('saas_faturas').insert(saasFaturas)

  // 9. Logs de Login (Engajamento Alto)
  console.log('📱 Criando logs de acesso e atividade da usuária...')
  const loginLogs = []
  for (let d = 0; d < 30; d++) {
    const loginDate = new Date(baseNow.getTime() - d * 24 * 60 * 60 * 1000)
    loginDate.setHours(8 + (d % 4), 15 + (d * 7) % 40, 0, 0)
    loginLogs.push({
      profissional_id: userId,
      created_at: loginDate.toISOString(),
    })
  }
  await supabase.from('login_logs').insert(loginLogs)

  // 10. Feedbacks & NPS
  console.log('💬 Criando feedbacks e resposta NPS...')
  await supabase.from('feedbacks').insert([
    {
      profissional_id: userId,
      tipo: 'elogio',
      mensagem: 'A plataforma é perfeita! Minhas clientes amaram o link de agendamento automático e os lembretes no WhatsApp zeraram minhas faltas.',
      status: 'resolvido',
      created_at: new Date(baseNow.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      profissional_id: userId,
      tipo: 'sugestao',
      mensagem: 'Seria maravilhoso poder anexar fotos de antes e depois direto na ficha de cada cliente!',
      status: 'em_analise',
      created_at: new Date(baseNow.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ])

  await supabase.from('nps_respostas').insert([
    {
      profissional_id: userId,
      nota: 10,
      comentario: 'Economizo pelo menos 2 horas por dia que antes gastava respondendo WhatsApp para marcar horário!',
      created_at: new Date(baseNow.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ])

  // 11. Bloqueios de Disponibilidade
  console.log('🏖️ Criando bloqueio de folga / workshop...')
  const nextMonthDate = new Date(baseNow.getFullYear(), baseNow.getMonth() + 1, 5)
  await supabase.from('bloqueios_disponibilidade').insert([
    {
      profissional_id: userId,
      data: nextMonthDate.toISOString().split('T')[0],
      motivo: 'Masterclass Internacional de Mega Volume e Biossegurança',
    },
  ])

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 SUCESSO TOTAL! PERFIL DE DEMONSTRAÇÃO GERADO!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📌 Nome: Studio Camila Duarte | Lash & Brow`)
  console.log(`📌 E-mail de Login: ${PROFILE_EMAIL}`)
  console.log(`📌 Senha de Login: ${PROFILE_PASSWORD}`)
  console.log(`📌 Slug Público: /p/${PROFILE_SLUG}`)
  console.log(`📌 ID do Profissional: ${userId}`)
  console.log(`📊 Agendamentos gerados: ${agendamentosToInsert.length}`)
  console.log(`💰 Faturamento total simulado: R$ ${agendamentosToInsert.reduce((acc, a) => acc + (a.pago ? a.valor_cobrado : 0), 0).toFixed(2)}`)
  console.log(`⭐ Avaliações 5 estrelas: ${avaliacoesToInsert.length}`)
  console.log(`💳 Faturas SaaS: 4 pagas + 1 pendente`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

seed().catch((err) => {
  console.error('❌ Erro inesperado no seed:', err)
  process.exit(1)
})

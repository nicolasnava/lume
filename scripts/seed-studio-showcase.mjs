import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// 1. Carregar variáveis de ambiente do .env.local
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
    env[match[1].trim()] = val
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Chaves do Supabase não encontradas no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const STUDIO_SLUG = 'maison-lumiere'
const PASSWORD_DEFAULT = 'LumeStudio2026!'

const PERSONAS = [
  {
    role: 'dona',
    email: 'helena.maison@lume.app',
    nome: 'Helena Vasconcelos | Master Lash',
    slug: 'helena-vasconcelos',
    tagline: 'Excelência em Extensão de Cílios e Visagismo Facial',
    bio: 'Fundadora e diretora da Maison Lumière Concept. Mais de 8 anos de dedicação exclusiva à estética do olhar, especialista em técnicas russas avançadas, isolamento perfeito e biossegurança rigorosa.',
    categoria: ['cilios', 'sobrancelhas', 'estetica'],
    cor_primaria: '#A48974', // Dourado/Rose Gold quente
    cor_secundaria: '#FAF8F5',
    foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
    foto_capa_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
    whatsapp: '11988881111',
    instagram: '@helena.maison',
    servicos: [
      {
        nome: 'Extensão de Cílios Volume Russo Imperial',
        descricao: 'Fans artesanais de 3D a 6D com fios ultrafinos de seda cashmere. Proporciona densidade, acabamento aveludado e olhar marcante sem sobrecarregar os fios naturais.',
        duracao_minutos: 120,
        preco: 240.00,
        intervalo_manutencao_dias: 21,
        foto_url: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Lash Lifting com Keratin Boost & Tintura',
        descricao: 'Curvatura e elevação dos próprios cílios naturais desde a raiz, acompanhado de botox de queratina pura e pigmentação preta intensa. Dura até 6 semanas.',
        duracao_minutos: 60,
        preco: 160.00,
        intervalo_manutencao_dias: 45,
        foto_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Design Estratégico de Sobrancelhas com Henna',
        descricao: 'Mapeamento facial com paquímetro e linha orgânica, alinhamento anatômico e aplicação de henna de alta fixação com efeito sombreado degrade.',
        duracao_minutos: 45,
        preco: 85.00,
        intervalo_manutencao_dias: 15,
        foto_url: 'https://images.unsplash.com/photo-1597225244660-1cd128c64284?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Brow Lamination VIP + Regeneração de Fios',
        descricao: 'Procedimento que alinha a direção dos fios rebeldes das sobrancelhas, criando volume marcante e finalizado com sérum nutritivo de colágeno.',
        duracao_minutos: 50,
        preco: 150.00,
        intervalo_manutencao_dias: 30,
        foto_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
  {
    role: 'membro',
    email: 'camila.maison@lume.app',
    nome: 'Dra. Camila Nogueira | Micropigmentação',
    slug: 'camila-nogueira',
    tagline: 'Micropigmentação labial e facial hiper-realista',
    bio: 'Biomédica esteta e especialista em micropigmentação estética e paramédica. Referência em Nanoblading fios ultrafinos e Neutralização Labial Efeito Aquarela com cicatrização impecável.',
    categoria: ['sobrancelhas', 'estetica', 'labios'],
    cor_primaria: '#7C3AED', // Púrpura sofisticado
    cor_secundaria: '#F5F3FF',
    foto_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop',
    foto_capa_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop',
    whatsapp: '11988882222',
    instagram: '@dracamilanogueira',
    servicos: [
      {
        nome: 'Nanoblading Fios Hiper-Realistas',
        descricao: 'Técnica de fios desenhados milimetricamente que se misturam perfeitamente aos fios naturais das sobrancelhas. Resultado sutil, elegante e moderno.',
        duracao_minutos: 120,
        preco: 550.00,
        intervalo_manutencao_dias: 365,
        foto_url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Hydra Gloss Lips Revitalizante',
        descricao: 'Tratamento labial intensivo com microagulhamento e sérum de ácido hialurônico de alta densidade. Promove hidratação profunda e efeito plump natural.',
        duracao_minutos: 50,
        preco: 180.00,
        intervalo_manutencao_dias: 30,
        foto_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Micropigmentação Labial Efeito Aquarela',
        descricao: 'Revitalização da cor dos lábios com pigmentos orgânicos biocompatíveis. Corrige assimetrias, neutraliza tons arroxeados e proporciona cor saudável duradoura.',
        duracao_minutos: 120,
        preco: 490.00,
        intervalo_manutencao_dias: 365,
        foto_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Limpeza de Pele Profunda com Peeling Ultrassônico',
        descricao: 'Higienização, emoliência, extração por sucção sem dor, peeling de diamante, alta frequência e máscara calmante de camomila e ouro.',
        duracao_minutos: 75,
        preco: 210.00,
        intervalo_manutencao_dias: 30,
        foto_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
  {
    role: 'membro',
    email: 'beatriz.maison@lume.app',
    nome: 'Beatriz Alencar | Hair Stylist',
    slug: 'beatriz-alencar',
    tagline: 'Cortes visagistas, morenas iluminadas e terapia capilar',
    bio: 'Hair stylist com formação em Paris e Milão. Especialista em visagismo capilar personalizado, técnicas de mechas sem agressão e cronograma capilar de reconstrução profunda.',
    categoria: ['cabelo', 'terapia_capilar'],
    cor_primaria: '#D97706', // Âmbar dourado
    cor_secundaria: '#FFFBEB',
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    foto_capa_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1200&auto=format&fit=crop',
    whatsapp: '11988883333',
    instagram: '@beatriz.hairconcept',
    servicos: [
      {
        nome: 'Corte Visagista Personalizado + Escova Modelada',
        descricao: 'Consultoria de visagismo avaliando formato do rosto, textura capilar e rotina para um corte que valoriza sua identidade. Acompanha lavagem especial e escova.',
        duracao_minutos: 60,
        preco: 170.00,
        intervalo_manutencao_dias: 60,
        foto_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Morena Iluminada com Nutrição de Brilho',
        descricao: 'Técnica de mechas em tons de avelã, caramelo ou mel com transição suave na raiz e clareamento saudável. Acompanha máscara reconstrutora Kérastase.',
        duracao_minutos: 180,
        preco: 480.00,
        intervalo_manutencao_dias: 120,
        foto_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Terapia Capilar com Ozonioterapia e Laser',
        descricao: 'Desintoxicação do couro cabeludo, estimulação de crescimento dos fios e combate à queda e oleosidade com vapor de ozônio e ledterapia.',
        duracao_minutos: 60,
        preco: 220.00,
        intervalo_manutencao_dias: 21,
        foto_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=600&auto=format&fit=crop',
      },
      {
        nome: 'Escova de Seda & Finalização com Ondas',
        descricao: 'Lavagem com massagem craniana relaxante, hidratação rápida e escova polida com babyliss solto de alta durabilidade.',
        duracao_minutos: 45,
        preco: 110.00,
        intervalo_manutencao_dias: 7,
        foto_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
]

const CLIENTES_MOCK = [
  { nome: 'Mariana Silveira Ramos', telefone: '(11) 98123-4567' },
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
]

const DEPOIMENTOS_POOL = [
  'Experiência impecável! Atendimento acolhedor, pontualidade e resultado acima do que eu esperava.',
  'O melhor studio de SP! Saí me sentindo renovada e com a autoestima lá no alto.',
  'Ambiente sofisticado, atendimento carinhoso e um capricho que você não encontra em outro lugar.',
  'Já sou cliente fiel há meses. Indico para todas as minhas amigas de olhos fechados!',
  'Simplesmente perfeito. Cuidado com cada detalhe, ambiente cheiroso e produtos de altíssima qualidade.',
  'Resultado ultra natural e elegante. A técnica é maravilhosa!',
  'Profissional de um talento e delicadeza únicos. Amei demais o resultado!',
  'Ficou incrível, durou semanas intacto. Não troco por nada!',
]

async function seedStudio() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' ✨ LUMÊ - GERANDO STUDIO COMPLETO COM DONA E EQUIPE ')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. Criar/Garantir Usuários Auth
  console.log('🔐 1. Garantindo usuários no Auth...')
  const { data: usersList } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const createdUsers = []

  for (const p of PERSONAS) {
    let user = usersList?.users?.find((u) => u.email?.toLowerCase() === p.email.toLowerCase())

    if (!user) {
      console.log(`   └─ Criando conta Auth para ${p.nome} (${p.email})...`)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: p.email,
        password: PASSWORD_DEFAULT,
        email_confirm: true,
        user_metadata: { nome: p.nome },
      })
      if (createError) {
        console.error(`❌ Erro ao criar auth para ${p.email}:`, createError)
        process.exit(1)
      }
      user = newUser.user
    } else {
      console.log(`   └─ Conta Auth existente: ${p.email} (${user.id})`)
    }

    createdUsers.push({ ...p, userId: user.id })
  }

  const donaUser = createdUsers.find((u) => u.role === 'dona')

  // 2. Criar ou Atualizar Studio no Banco
  console.log('\n🏛️  2. Criando/Atualizando Studio "Maison Lumière Concept"...')
  const { data: existingStudio } = await supabase
    .from('estudios')
    .select('*')
    .ilike('slug', STUDIO_SLUG)
    .maybeSingle()

  let studioId = existingStudio?.id

  if (!existingStudio) {
    const { data: newStudio, error: studioErr } = await supabase
      .from('estudios')
      .insert([
        {
          nome: 'Maison Lumière Concept',
          slug: STUDIO_SLUG,
          bio: 'Espaço premium integrado de beleza e bem-estar no coração dos Jardins. Um coletivo de especialistas dedicadas à estética facial, micropigmentação de alta precisão e visagismo capilar personalizado.',
          foto_capa_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
          cor_primaria: '#A48974',
          cor_secundaria: '#FAF8F5',
          criado_por: donaUser.userId,
        },
      ])
      .select()
      .single()

    if (studioErr || !newStudio) {
      console.error('❌ Erro ao criar studio:', studioErr)
      process.exit(1)
    }
    studioId = newStudio.id
    console.log(`   ✅ Studio criado com sucesso! ID: ${studioId}`)
  } else {
    // Atualizar dados e dono
    await supabase
      .from('estudios')
      .update({
        nome: 'Maison Lumière Concept',
        criado_por: donaUser.userId,
        bio: 'Espaço premium integrado de beleza e bem-estar no coração dos Jardins. Um coletivo de especialistas dedicadas à estética facial, micropigmentação de alta precisão e visagismo capilar personalizado.',
        foto_capa_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
        cor_primaria: '#A48974',
        cor_secundaria: '#FAF8F5',
      })
      .eq('id', studioId)
    console.log(`   ✅ Studio atualizado com sucesso! ID: ${studioId}`)
  }

  // 3. Configurar cada uma das 3 profissionais com serviços, clientes, agendamentos e métricas
  console.log('\n👩‍🎨 3. Configurando perfis das profissionais e populando métricas realistas...')

  for (let pIdx = 0; pIdx < createdUsers.length; pIdx++) {
    const p = createdUsers[pIdx]
    const uid = p.userId
    console.log(`\n▶ [${pIdx + 1}/3] ${p.nome}`)

    // 3.1 Limpar dados anteriores para evitar duplicações
    const { data: existingAgs } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('profissional_id', uid)

    if (existingAgs && existingAgs.length > 0) {
      const ids = existingAgs.map((a) => a.id)
      await supabase.from('agendamento_servicos').delete().in('agendamento_id', ids)
      await supabase.from('avaliacoes').delete().in('agendamento_id', ids)
    }

    await supabase.from('agendamentos').delete().eq('profissional_id', uid)
    await supabase.from('clientes').delete().eq('profissional_id', uid)
    await supabase.from('servicos').delete().eq('profissional_id', uid)
    await supabase.from('disponibilidade').delete().eq('profissional_id', uid)

    // 3.2 Inserir Perfil Profissional vinculado ao Studio
    const { error: profErr } = await supabase.from('profissionais').upsert({
      id: uid,
      nome: p.nome,
      slug: p.slug,
      bio: p.bio,
      tagline: p.tagline,
      categoria: p.categoria,
      cor_primaria: p.cor_primaria,
      cor_secundaria: p.cor_secundaria,
      foto_url: p.foto_url,
      foto_capa_url: p.foto_capa_url,
      whatsapp: p.whatsapp,
      instagram: p.instagram,
      localizacao: 'Alameda Lorena, 1450 - Jardins, São Paulo - SP',
      modalidade_atendimento: ['studio', 'domicilio'],
      formas_pagamento_aceitas: ['pix', 'cartao', 'dinheiro'],
      janela_agendamento_dias: 45,
      status_conta: 'ativa',
      estudio_id: studioId,
      ativo_no_estudio: true,
      onboarding_concluido: true,
      plano_tipo: 'anual',
      valor_mensalidade: 69.90,
      proximo_vencimento: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (profErr) {
      console.error(`   ❌ Erro ao criar perfil da profissional ${p.nome}:`, profErr)
      continue
    }
    console.log(`   ✅ Perfil ativo e vinculado ao Studio!`)

    // 3.3 Disponibilidade semanal
    const dias = [
      { dia_semana: 1, hora_inicio: '09:00:00', hora_fim: '19:00:00' },
      { dia_semana: 2, hora_inicio: '09:00:00', hora_fim: '19:00:00' },
      { dia_semana: 3, hora_inicio: '09:00:00', hora_fim: '19:00:00' },
      { dia_semana: 4, hora_inicio: '09:00:00', hora_fim: '20:00:00' },
      { dia_semana: 5, hora_inicio: '09:00:00', hora_fim: '20:00:00' },
      { dia_semana: 6, hora_inicio: '09:00:00', hora_fim: '18:00:00' },
    ]
    await supabase.from('disponibilidade').insert(
      dias.map((d) => ({
        profissional_id: uid,
        ...d,
      }))
    )

    // 3.4 Inserir Serviços
    const { data: createdServicos, error: srvErr } = await supabase
      .from('servicos')
      .insert(
        p.servicos.map((s) => ({
          profissional_id: uid,
          ativo: true,
          ...s,
        }))
      )
      .select('*')

    if (srvErr) {
      console.error('   ❌ Erro ao cadastrar serviços:', srvErr)
      continue
    }
    console.log(`   ✅ ${createdServicos.length} serviços cadastrados no menu.`)

    // 3.5 Inserir Clientes Realistas
    const { data: createdClientes, error: cliErr } = await supabase
      .from('clientes')
      .insert(
        CLIENTES_MOCK.map((c) => ({
          profissional_id: uid,
          ...c,
        }))
      )
      .select('*')

    if (cliErr) {
      console.error('   ❌ Erro ao cadastrar clientes:', cliErr)
      continue
    }
    console.log(`   ✅ ${createdClientes.length} clientes cadastrados na carteira.`)

    // 3.6 Gerar Histórico de Agendamentos e Faturamento (~40 a 50 atendimentos)
    const baseNow = new Date()
    const agendamentosToInsert = []
    const agendamentoServicosToInsert = []
    const avaliacoesToInsert = []

    const slots = [
      { startH: 9, startM: 30, endH: 11, endM: 0 },
      { startH: 11, startM: 30, endH: 13, endM: 0 },
      { startH: 14, startM: 30, endH: 16, endM: 30 },
      { startH: 17, startM: 0, endH: 18, endM: 30 },
    ]

    let agIndex = 0
    let receitaTotal = 0

    // De 45 dias atrás até 7 dias no futuro
    for (let dayOffset = -45; dayOffset <= 7; dayOffset++) {
      const d = new Date(baseNow)
      d.setDate(baseNow.getDate() + dayOffset)
      const dayOfWeek = d.getDay()
      if (dayOfWeek === 0) continue // Domingo fechado

      // 1 ou 2 atendimentos por dia
      const count = dayOffset % 2 === 0 ? 2 : 1

      for (let s = 0; s < count; s++) {
        const slot = slots[s]
        const inicio = new Date(d)
        inicio.setHours(slot.startH, slot.startM, 0, 0)
        const fim = new Date(d)
        fim.setHours(slot.endH, slot.endM, 0, 0)

        const client = createdClientes[agIndex % createdClientes.length]
        const service = createdServicos[agIndex % createdServicos.length]
        const agId = crypto.randomUUID()

        let status = 'concluido'
        if (dayOffset > 0) {
          status = 'confirmado'
        } else if (dayOffset === 0) {
          status = s === 0 ? 'concluido' : 'confirmado'
        } else {
          status = agIndex % 17 === 0 ? 'cancelado' : 'concluido'
        }

        const isPago = status === 'concluido'
        const valor = Number(service.preco)
        if (isPago) receitaTotal += valor

        agendamentosToInsert.push({
          id: agId,
          profissional_id: uid,
          cliente_id: client.id,
          servico_id: service.id,
          data_hora_inicio: inicio.toISOString(),
          data_hora_fim: fim.toISOString(),
          status,
          valor_cobrado: valor,
          pago: isPago,
          forma_pagamento: isPago ? (agIndex % 2 === 0 ? 'pix' : 'cartao_credito') : null,
          forma_pagamento_preferida: agIndex % 2 === 0 ? 'pix' : 'cartao_credito',
          observacao_pagamento: isPago ? 'Pagamento confirmado' : 'Aguardando atendimento',
          created_at: new Date(inicio.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        })

        // Agendamento Serviços
        agendamentoServicosToInsert.push({
          agendamento_id: agId,
          servico_id: service.id,
          preco_no_momento: service.preco,
          duracao_no_momento_minutos: service.duracao_minutos,
          created_at: inicio.toISOString(),
        })

        // Avaliações apenas para agendamentos concluídos
        if (status === 'concluido' && agIndex % 3 === 0) {
          const nota = agIndex % 15 === 0 ? 4 : 5
          const comentario = DEPOIMENTOS_POOL[agIndex % DEPOIMENTOS_POOL.length]
          avaliacoesToInsert.push({
            agendamento_id: agId,
            profissional_id: uid,
            nota,
            comentario,
            created_at: new Date(fim.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          })
        }

        agIndex++
      }
    }

    // Inserir agendamentos
    const { error: agErr } = await supabase.from('agendamentos').insert(agendamentosToInsert)
    if (agErr) {
      console.error('   ❌ Erro ao inserir agendamentos:', agErr)
    } else {
      console.log(
        `   ✅ ${agendamentosToInsert.length} agendamentos gerados (Faturamento acumulado: R$ ${receitaTotal.toFixed(2)})`
      )
    }

    // Inserir agendamento_servicos
    if (agendamentoServicosToInsert.length > 0) {
      const { error: asErr } = await supabase
        .from('agendamento_servicos')
        .insert(agendamentoServicosToInsert)
      if (asErr) {
        console.error('   ❌ Erro ao vincular agendamento_servicos:', asErr)
      }
    }

    // Inserir avaliações
    if (avaliacoesToInsert.length > 0) {
      const { error: avErr } = await supabase.from('avaliacoes').insert(avaliacoesToInsert)
      if (avErr) {
        console.error('   ❌ Erro ao inserir avaliações:', avErr)
      } else {
        const media = (
          avaliacoesToInsert.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoesToInsert.length
        ).toFixed(1)
        console.log(`   ✅ ${avaliacoesToInsert.length} avaliações registradas (Média: ⭐ ${media})`)
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' 🎉 STUDIO E EQUIPE CRIADOS COM SUCESSO!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('🌐 LINKS PÚBLICOS PARA TESTE NO NAVEGADOR:')
  console.log(`  🏢 Vitrine Coletiva do Studio:`)
  console.log(`     👉 http://localhost:3000/estudio/${STUDIO_SLUG}\n`)

  console.log(`  👩‍💼 Vitrines Individuais dentro do Studio:`)
  for (const p of createdUsers) {
    const cargo = p.role === 'dona' ? '👑 Dona / Administradora' : '✨ Membro Parceira'
    console.log(`     ${cargo}: ${p.nome}`)
    console.log(`     👉 http://localhost:3000/estudio/${STUDIO_SLUG}/${p.slug}`)
    console.log(`     👉 Agendamento: http://localhost:3000/estudio/${STUDIO_SLUG}/${p.slug}/agendar\n`)
  }

  console.log('🔑 CREDENCIAIS PARA LOGIN NO DASHBOARD (http://localhost:3000/login):')
  console.log(`  Senha padrão para todas as contas: ${PASSWORD_DEFAULT}\n`)
  for (const p of createdUsers) {
    console.log(`  • [${p.role.toUpperCase()}] ${p.nome}:`)
    console.log(`    Email: ${p.email}`)
    console.log(`    Senha: ${PASSWORD_DEFAULT}`)
    console.log(`    Painel Studio: http://localhost:3000/dashboard/estudio\n`)
  }
}

seedStudio().catch(console.error)

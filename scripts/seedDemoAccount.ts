import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Parse manual do .env.local sem dependência externa
try {
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
} catch (e) {
  // Ignora se não conseguir ler arquivo local
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSeed() {
  const targetEmail = process.argv[2]

  console.log('--- Lumê: Script de Seed para Conta Demo (Prompt 62) ---')

  let profId: string | null = null

  if (targetEmail) {
    console.log(`Buscando profissional com email: ${targetEmail}...`)
    const { data: usersData, error: userError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (userError) {
      console.error('Erro ao listar usuários auth:', userError)
      process.exit(1)
    }

    const foundUser = usersData.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase())
    if (!foundUser) {
      console.error(`Nenhum usuário encontrado com o email "${targetEmail}".`)
      process.exit(1)
    }
    profId = foundUser.id
  } else {
    // Buscar primeira conta com is_demo = true ou com slug contendo 'demo'
    console.log('Buscando conta com is_demo = true no banco de dados...')
    const { data: demoProf } = await (supabase.from('profissionais') as any)
      .select('id, nome, slug, is_demo')
      .eq('is_demo', true)
      .limit(1)
      .maybeSingle()

    if (demoProf) {
      profId = demoProf.id
      console.log(`Conta demo localizada: ${demoProf.nome} (${demoProf.slug}) - ID: ${profId}`)
    } else {
      console.log('Nenhuma conta marcada com is_demo = true encontrada.')
      console.log('Uso: npx tsx scripts/seedDemoAccount.ts <email-da-profissional>')
      process.exit(1)
    }
  }

  if (!profId) {
    console.error('ID da profissional não localizado.')
    process.exit(1)
  }

  console.log(`Populando dados demo para profissional ID: ${profId}...`)

  // 1. Limpeza
  console.log('Limpando agendamentos e registros anteriores...')
  const { data: userCupons } = await (supabase.from('cupons_profissional') as any)
    .select('id')
    .eq('profissional_id', profId)
  const cupomIds = (userCupons || []).map((c: any) => c.id)
  if (cupomIds.length > 0) {
    await (supabase.from('cupom_usos') as any).delete().in('cupom_id', cupomIds)
  }

  await (supabase.from('cupons_profissional') as any).delete().eq('profissional_id', profId)
  await (supabase.from('metas_mensais') as any).delete().eq('profissional_id', profId)
  await (supabase.from('relatorios_mensais_fechados') as any).delete().eq('profissional_id', profId)
  await (supabase.from('avaliacoes') as any).delete().eq('profissional_id', profId)

  const { data: oldAgendamentos } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('profissional_id', profId)
  const oldAgendamentoIds = (oldAgendamentos || []).map((a) => a.id)
  if (oldAgendamentoIds.length > 0) {
    await (supabase.from('agendamento_servicos') as any).delete().in('agendamento_id', oldAgendamentoIds)
  }

  await supabase.from('agendamentos').delete().eq('profissional_id', profId)
  await supabase.from('clientes').delete().eq('profissional_id', profId)
  await supabase.from('servicos').delete().eq('profissional_id', profId)
  await supabase.from('disponibilidade').delete().eq('profissional_id', profId)

  // 2. Atualizar perfil
  console.log('Configurando perfil da profissional demo...')
  await (supabase.from('profissionais') as any)
    .update({
      nome: 'Camila Alcantara Beauty',
      bio: 'Especialista em Lash Design, Extensão de Cílios e Sobrancelhas de Alto Padrão. Mais de 5 anos transformando olhares com biossegurança, precisão e carinho.',
      tagline: 'Realçando o que há de mais deslumbrante no seu olhar ✨',
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
      is_demo: true,
    })
    .eq('id', profId)

  // 3. Inserir serviços
  console.log('Inserindo serviços...')
  const { data: servicosCriados } = await supabase
    .from('servicos')
    .insert([
      {
        profissional_id: profId,
        nome: 'Extensão de Cílios Fio a Fio Clássico',
        descricao: 'Técnica delicada que alonga os cílios naturais um a um, proporcionando efeito máscara suave e elegante.',
        preco: 160.0,
        duracao_minutos: 120,
        ativo: true,
      },
      {
        profissional_id: profId,
        nome: 'Volume Russo Glamour',
        descricao: 'Fans feitos à mão de 3D a 6D ultra-leves para máxima densidade, curvatura marcante e acabamento aveludado.',
        preco: 220.0,
        duracao_minutos: 150,
        ativo: true,
      },
      {
        profissional_id: profId,
        nome: 'Manutenção Fio a Fio (Até 20 dias)',
        descricao: 'Higienização profunda, remoção de fios crescidos e preenchimento completo para restaurar o alinhamento.',
        preco: 95.0,
        duracao_minutos: 75,
        ativo: true,
      },
      {
        profissional_id: profId,
        nome: 'Design de Sobrancelhas Personalizado',
        descricao: 'Mapeamento facial com paquímetro para valorizar a simetria do rosto, com finalização e hidratação.',
        preco: 55.0,
        duracao_minutos: 45,
        ativo: true,
      },
      {
        profissional_id: profId,
        nome: 'Lash Lifting & Nutrição com Queratina',
        descricao: 'Curvatura e tintura dos próprios cílios naturais com banho de queratina e aminoácidos para nutrição intensiva.',
        preco: 130.0,
        duracao_minutos: 60,
        ativo: true,
      },
    ])
    .select('id, nome, preco, duracao_minutos')

  const servicos = servicosCriados || []

  // 4. Inserir disponibilidade
  console.log('Inserindo horários de disponibilidade...')
  const disponibilidades = [
    { dia_semana: 1, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
    { dia_semana: 2, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
    { dia_semana: 3, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
    { dia_semana: 4, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
    { dia_semana: 5, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
    { dia_semana: 6, hora_inicio: '09:00', hora_fim: '15:00', intervalo_inicio: null, intervalo_fim: null },
  ].map((d) => ({
    profissional_id: profId,
    ...d,
    ativo: true,
  }))
  await supabase.from('disponibilidade').insert(disponibilidades)

  // 5. Inserir clientes
  console.log('Inserindo clientes...')
  const clientesData = [
    { nome: 'Mariana Silva', telefone: '11991234567' },
    { nome: 'Juliana Costa', telefone: '11982345678' },
    { nome: 'Beatriz Rocha', telefone: '11973456789' },
    { nome: 'Fernanda Martins', telefone: '11964567890' },
    { nome: 'Larissa Santos', telefone: '11955678901' },
    { nome: 'Camila Prado', telefone: '11946789012' },
  ]
  const { data: clientesCriadas } = await supabase
    .from('clientes')
    .insert(clientesData.map((c) => ({ profissional_id: profId, ...c })))
    .select('id, nome, telefone')

  const clientsList = clientesCriadas || []

  // 6. Inserir agendamentos nos últimos 90 dias
  console.log('Inserindo histórico de agendamentos dos últimos 3 meses...')
  const now = new Date()
  const agendamentosParaInserir: any[] = []
  const formasPagamento = ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro']

  const addBatch = (daysStart: number, daysEnd: number, countDone: number, countCancel: number, countNoShow: number) => {
    for (let i = 0; i < countDone; i++) {
      const client = clientsList[i % clientsList.length]
      const service = servicos[i % servicos.length]
      const daysAgo = Math.floor(Math.random() * (daysStart - daysEnd)) + daysEnd
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      d.setHours(9 + (i % 8), 0, 0, 0)
      const endD = new Date(d.getTime() + service.duracao_minutos * 60 * 1000)

      agendamentosParaInserir.push({
        profissional_id: profId,
        cliente_id: client.id,
        servico_id: service.id,
        data_hora_inicio: d.toISOString(),
        data_hora_fim: endD.toISOString(),
        status: 'concluido',
        status_pagamento: 'pago_no_local',
        pago: true,
        forma_pagamento: formasPagamento[i % formasPagamento.length],
        valor_cobrado: service.preco,
        created_at: new Date(d.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    for (let i = 0; i < countCancel; i++) {
      const client = clientsList[(i + 2) % clientsList.length]
      const service = servicos[(i + 1) % servicos.length]
      const daysAgo = Math.floor(Math.random() * (daysStart - daysEnd)) + daysEnd
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      d.setHours(14, 0, 0, 0)
      const endD = new Date(d.getTime() + service.duracao_minutos * 60 * 1000)

      agendamentosParaInserir.push({
        profissional_id: profId,
        cliente_id: client.id,
        servico_id: service.id,
        data_hora_inicio: d.toISOString(),
        data_hora_fim: endD.toISOString(),
        status: 'cancelado',
        status_pagamento: 'cancelado',
        pago: false,
        valor_cobrado: service.preco,
        created_at: new Date(d.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    for (let i = 0; i < countNoShow; i++) {
      const client = clientsList[(i + 4) % clientsList.length]
      const service = servicos[0]
      const daysAgo = Math.floor(Math.random() * (daysStart - daysEnd)) + daysEnd
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      d.setHours(11, 0, 0, 0)
      const endD = new Date(d.getTime() + service.duracao_minutos * 60 * 1000)

      agendamentosParaInserir.push({
        profissional_id: profId,
        cliente_id: client.id,
        servico_id: service.id,
        data_hora_inicio: d.toISOString(),
        data_hora_fim: endD.toISOString(),
        status: 'no_show',
        status_pagamento: 'pendente',
        pago: false,
        valor_cobrado: service.preco,
        created_at: new Date(d.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  }

  addBatch(90, 60, 8, 1, 0)
  addBatch(60, 30, 11, 1, 1)
  addBatch(30, 2, 9, 1, 0)

  // 3 agendamentos futuros
  for (let i = 1; i <= 3; i++) {
    const client = clientsList[i % clientsList.length]
    const service = servicos[i % servicos.length]
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    d.setHours(10 + i * 2, 0, 0, 0)
    const endD = new Date(d.getTime() + service.duracao_minutos * 60 * 1000)

    agendamentosParaInserir.push({
      profissional_id: profId,
      cliente_id: client.id,
      servico_id: service.id,
      data_hora_inicio: d.toISOString(),
      data_hora_fim: endD.toISOString(),
      status: 'confirmado',
      status_pagamento: 'pendente',
      pago: false,
      forma_pagamento_preferida: 'pix',
      valor_cobrado: service.preco,
      created_at: now.toISOString(),
    })
  }

  const { data: agendamentosCriados } = await (supabase.from('agendamentos') as any)
    .insert(agendamentosParaInserir)
    .select('id, status')

  // 7. Avaliações
  console.log('Inserindo avaliações...')
  const concluidos = (agendamentosCriados || []).filter((a: any) => a.status === 'concluido')
  const depoimentos = [
    { nota: 5, comentario: 'Trabalho impecável! O volume russo ficou super leve e natural, recebi vários elogios no evento!' },
    { nota: 5, comentario: 'Atendimento maravilhoso, estúdio cheiroso e super aconchegante. A manutenção durou perfeitamente 3 semanas.' },
    { nota: 5, comentario: 'Amei o resultado do meu lifting, a Camila é um amor de pessoa e super atenciosa com cada detalhe.' },
    { nota: 4, comentario: 'Minha sobrancelha nunca ficou tão perfeita e harmoniosa. Recomendo muito o trabalho dela!' },
  ]
  for (let i = 0; i < Math.min(depoimentos.length, concluidos.length); i++) {
    await supabase.from('avaliacoes').insert({
      profissional_id: profId,
      agendamento_id: concluidos[i].id,
      nota: depoimentos[i].nota,
      comentario: depoimentos[i].comentario,
    })
  }

  // 8. Cupons
  console.log('Inserindo cupons de exemplo...')
  const validade = new Date()
  validade.setDate(validade.getDate() + 45)
  await (supabase.from('cupons_profissional') as any).insert([
    {
      profissional_id: profId,
      codigo: 'BOASVINDAS15',
      tipo_desconto: 'percentual',
      valor: 15,
      segmento_alvo: 'nunca_agendou',
      limite_uso_total: 50,
      limite_uso_por_cliente: 1,
      valido_ate: validade.toISOString(),
      usos_atuais: 6,
      ativo: true,
    },
    {
      profissional_id: profId,
      codigo: 'VOLTA20',
      tipo_desconto: 'valor_fixo',
      valor: 20.0,
      segmento_alvo: 'inativa',
      limite_uso_total: 30,
      limite_uso_por_cliente: 1,
      valido_ate: validade.toISOString(),
      usos_atuais: 3,
      ativo: true,
    },
    {
      profissional_id: profId,
      codigo: 'LUME10',
      tipo_desconto: 'percentual',
      valor: 10,
      segmento_alvo: 'todos',
      limite_uso_total: 100,
      limite_uso_por_cliente: 1,
      valido_ate: null,
      usos_atuais: 14,
      ativo: true,
    },
  ])

  // 9. Metas
  console.log('Inserindo metas mensais...')
  const primeiroDiaMesAtual = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const primeiroDiaMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  await (supabase.from('metas_mensais') as any).insert([
    {
      profissional_id: profId,
      mes_referencia: primeiroDiaMesAtual,
      tipo_meta: 'faturamento',
      valor_meta: 4500.0,
    },
    {
      profissional_id: profId,
      mes_referencia: primeiroDiaMesAnterior,
      tipo_meta: 'faturamento',
      valor_meta: 3800.0,
    },
  ])

  console.log('✅ SEED DA CONTA DEMO CONCLUÍDO COM SUCESSO!')
  console.log(`Profissional ID: ${profId}`)
  console.log(`Total de agendamentos gerados: ${agendamentosParaInserir.length}`)
}

runSeed().catch((err) => {
  console.error('Erro fatal no script de seed:', err)
  process.exit(1)
})

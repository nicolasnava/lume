'use server'

import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Server Action acionável exclusivamente por administradores para
 * resetar e repovoar uma conta com is_demo = true com dados realistas (Prompt 62 Parte 3).
 */
export async function resetAndSeedDemoAccountAction(profissionalId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const admin = await getAuthenticatedAdmin()
    if (!admin) {
      return { success: false, message: 'Acesso restrito a administradores.' }
    }

    const adminSupabase = createAdminClient()

    // 1. Verificar se a profissional existe
    const { data: prof, error: profError } = await (adminSupabase.from('profissionais') as any)
      .select('id, nome, slug, is_demo')
      .eq('id', profissionalId)
      .maybeSingle()

    if (profError || !prof) {
      return { success: false, message: 'Profissional não encontrada.' }
    }

    // 2. Limpar dados anteriores dessa profissional para garantir um estado limpo
    try {
      // Deletar cupom_usos
      const { data: userCupons } = await (adminSupabase.from('cupons_profissional') as any)
        .select('id')
        .eq('profissional_id', profissionalId)
      const cupomIds = (userCupons || []).map((c: any) => c.id)
      if (cupomIds.length > 0) {
        await (adminSupabase.from('cupom_usos') as any).delete().in('cupom_id', cupomIds)
      }

      await (adminSupabase.from('cupons_profissional') as any)
        .delete()
        .eq('profissional_id', profissionalId)

      await (adminSupabase.from('metas_mensais') as any)
        .delete()
        .eq('profissional_id', profissionalId)

      await (adminSupabase.from('relatorios_mensais_fechados') as any)
        .delete()
        .eq('profissional_id', profissionalId)

      await (adminSupabase.from('avaliacoes') as any)
        .delete()
        .eq('profissional_id', profissionalId)

      // Deletar agendamento_servicos
      const { data: oldAgendamentos } = await adminSupabase
        .from('agendamentos')
        .select('id')
        .eq('profissional_id', profissionalId)
      const oldAgendamentoIds = (oldAgendamentos || []).map((a) => a.id)
      if (oldAgendamentoIds.length > 0) {
        await (adminSupabase.from('agendamento_servicos') as any)
          .delete()
          .in('agendamento_id', oldAgendamentoIds)
      }

      await adminSupabase.from('agendamentos').delete().eq('profissional_id', profissionalId)
      await adminSupabase.from('clientes').delete().eq('profissional_id', profissionalId)
      await adminSupabase.from('servicos').delete().eq('profissional_id', profissionalId)
      await adminSupabase.from('disponibilidade').delete().eq('profissional_id', profissionalId)
    } catch (errClean) {
      console.warn('[resetAndSeedDemoAccountAction] Erro durante limpeza:', errClean)
    }

    // 3. Atualizar Perfil Demo
    await (adminSupabase.from('profissionais') as any)
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
      .eq('id', profissionalId)

    // 4. Cadastrar 5 Serviços Variados
    const { data: servicosCriados, error: servError } = await adminSupabase
      .from('servicos')
      .insert([
        {
          profissional_id: profissionalId,
          nome: 'Extensão de Cílios Fio a Fio Clássico',
          descricao: 'Técnica delicada que alonga os cílios naturais um a um, proporcionando efeito máscara suave e elegante.',
          preco: 160.0,
          duracao_minutos: 120,
          ativo: true,
        },
        {
          profissional_id: profissionalId,
          nome: 'Volume Russo Glamour',
          descricao: 'Fans feitos à mão de 3D a 6D ultra-leves para máxima densidade, curvatura marcante e acabamento aveludado.',
          preco: 220.0,
          duracao_minutos: 150,
          ativo: true,
        },
        {
          profissional_id: profissionalId,
          nome: 'Manutenção Fio a Fio (Até 20 dias)',
          descricao: 'Higienização profunda, remoção de fios crescidos e preenchimento completo para restaurar o alinhamento.',
          preco: 95.0,
          duracao_minutos: 75,
          ativo: true,
        },
        {
          profissional_id: profissionalId,
          nome: 'Design de Sobrancelhas Personalizado',
          descricao: 'Mapeamento facial com paquímetro para valorizar a simetria do rosto, com finalização e hidratação.',
          preco: 55.0,
          duracao_minutos: 45,
          ativo: true,
        },
        {
          profissional_id: profissionalId,
          nome: 'Lash Lifting & Nutrição com Queratina',
          descricao: 'Curvatura e tintura dos próprios cílios naturais com banho de queratina e aminoácidos para nutrição intensiva.',
          preco: 130.0,
          duracao_minutos: 60,
          ativo: true,
        },
      ])
      .select('id, nome, preco, duracao_minutos')

    if (servError || !servicosCriados) {
      throw new Error(`Erro ao criar serviços: ${servError?.message}`)
    }

    // 5. Cadastrar Horários de Disponibilidade (Segunda a Sábado)
    const disponibilidades = [
      { dia_semana: 1, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
      { dia_semana: 2, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
      { dia_semana: 3, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
      { dia_semana: 4, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
      { dia_semana: 5, hora_inicio: '09:00', hora_fim: '19:00', intervalo_inicio: '12:00', intervalo_fim: '13:00' },
      { dia_semana: 6, hora_inicio: '09:00', hora_fim: '15:00', intervalo_inicio: null, intervalo_fim: null },
    ].map((d) => ({
      profissional_id: profissionalId,
      ...d,
      ativo: true,
    }))

    await adminSupabase.from('disponibilidade').insert(disponibilidades)

    // 6. Cadastrar 6 Clientes Fictícias
    const clientesData = [
      { nome: 'Mariana Silva', telefone: '11991234567' },
      { nome: 'Juliana Costa', telefone: '11982345678' },
      { nome: 'Beatriz Rocha', telefone: '11973456789' },
      { nome: 'Fernanda Martins', telefone: '11964567890' },
      { nome: 'Larissa Santos', telefone: '11955678901' },
      { nome: 'Camila Prado', telefone: '11946789012' },
    ]

    const { data: clientesCriadas } = await adminSupabase
      .from('clientes')
      .insert(
        clientesData.map((c) => ({
          profissional_id: profissionalId,
          nome: c.nome,
          telefone: c.telefone,
        }))
      )
      .select('id, nome, telefone')

    const clientsList = clientesCriadas || []

    // 7. Gerar Histórico Realista de Agendamentos (Últimos 90 dias)
    const now = new Date()
    const agendamentosParaInserir: any[] = []
    const formasPagamento = ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro']

    // Função auxiliar para gerar datas espaçadas
    const addAppointmentsBatch = (
      daysAgoStart: number,
      daysAgoEnd: number,
      countConcluidos: number,
      countCancelados: number,
      countNoShow: number
    ) => {
      for (let i = 0; i < countConcluidos; i++) {
        const client = clientsList[i % clientsList.length]
        const service = servicosCriados[i % servicosCriados.length]
        const daysAgo = Math.floor(Math.random() * (daysAgoStart - daysAgoEnd)) + daysAgoEnd
        const appointmentDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        appointmentDate.setHours(9 + (i % 8), 0, 0, 0)
        const endDate = new Date(appointmentDate.getTime() + service.duracao_minutos * 60 * 1000)

        agendamentosParaInserir.push({
          profissional_id: profissionalId,
          cliente_id: client.id,
          servico_id: service.id,
          data_hora_inicio: appointmentDate.toISOString(),
          data_hora_fim: endDate.toISOString(),
          status: 'concluido',
          status_pagamento: 'pago_no_local',
          pago: true,
          forma_pagamento: formasPagamento[i % formasPagamento.length],
          forma_pagamento_preferida: formasPagamento[i % formasPagamento.length],
          valor_cobrado: service.preco,
          created_at: new Date(appointmentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      for (let i = 0; i < countCancelados; i++) {
        const client = clientsList[(i + 2) % clientsList.length]
        const service = servicosCriados[(i + 1) % servicosCriados.length]
        const daysAgo = Math.floor(Math.random() * (daysAgoStart - daysAgoEnd)) + daysAgoEnd
        const appointmentDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        appointmentDate.setHours(14, 0, 0, 0)
        const endDate = new Date(appointmentDate.getTime() + service.duracao_minutos * 60 * 1000)

        agendamentosParaInserir.push({
          profissional_id: profissionalId,
          cliente_id: client.id,
          servico_id: service.id,
          data_hora_inicio: appointmentDate.toISOString(),
          data_hora_fim: endDate.toISOString(),
          status: 'cancelado',
          status_pagamento: 'cancelado',
          pago: false,
          valor_cobrado: service.preco,
          created_at: new Date(appointmentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      for (let i = 0; i < countNoShow; i++) {
        const client = clientsList[(i + 4) % clientsList.length]
        const service = servicosCriados[0]
        const daysAgo = Math.floor(Math.random() * (daysAgoStart - daysAgoEnd)) + daysAgoEnd
        const appointmentDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        appointmentDate.setHours(11, 0, 0, 0)
        const endDate = new Date(appointmentDate.getTime() + service.duracao_minutos * 60 * 1000)

        agendamentosParaInserir.push({
          profissional_id: profissionalId,
          cliente_id: client.id,
          servico_id: service.id,
          data_hora_inicio: appointmentDate.toISOString(),
          data_hora_fim: endDate.toISOString(),
          status: 'no_show',
          status_pagamento: 'pendente',
          pago: false,
          valor_cobrado: service.preco,
          created_at: new Date(appointmentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }

    // Mês -2 (60 a 90 dias atrás): 8 concluídos, 1 cancelado
    addAppointmentsBatch(90, 60, 8, 1, 0)
    // Mês -1 (30 a 60 dias atrás): 11 concluídos, 1 cancelado, 1 no-show
    addAppointmentsBatch(60, 30, 11, 1, 1)
    // Mês atual (0 a 30 dias atrás): 9 concluídos, 1 cancelado
    addAppointmentsBatch(30, 2, 9, 1, 0)

    // Agendamentos futuros confirmados para a próxima semana
    for (let i = 1; i <= 3; i++) {
      const client = clientsList[i % clientsList.length]
      const service = servicosCriados[i % servicosCriados.length]
      const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      futureDate.setHours(10 + i * 2, 0, 0, 0)
      const endDate = new Date(futureDate.getTime() + service.duracao_minutos * 60 * 1000)

      agendamentosParaInserir.push({
        profissional_id: profissionalId,
        cliente_id: client.id,
        servico_id: service.id,
        data_hora_inicio: futureDate.toISOString(),
        data_hora_fim: endDate.toISOString(),
        status: 'confirmado',
        status_pagamento: 'pendente',
        pago: false,
        forma_pagamento_preferida: 'pix',
        valor_cobrado: service.preco,
        created_at: now.toISOString(),
      })
    }

    const { data: agendamentosCriados } = await (adminSupabase.from('agendamentos') as any)
      .insert(agendamentosParaInserir)
      .select('id, servico_id, cliente_id, valor_cobrado, status')

    // 8. Cadastrar Avaliações para alguns agendamentos concluídos
    const concluidos = (agendamentosCriados || []).filter((a: any) => a.status === 'concluido')
    const depoimentos = [
      { nota: 5, comentario: 'Trabalho impecável! O volume russo ficou super leve e natural, recebi vários elogios no evento!' },
      { nota: 5, comentario: 'Atendimento maravilhoso, estúdio cheiroso e super aconchegante. A manutenção durou perfeitamente 3 semanas.' },
      { nota: 5, comentario: 'Amei o resultado do meu lifting, a Camila é um amor de pessoa e super atenciosa com cada detalhe.' },
      { nota: 4, comentario: 'Minha sobrancelha nunca ficou tão perfeita e harmoniosa. Recomendo muito o trabalho dela!' },
    ]

    for (let i = 0; i < Math.min(depoimentos.length, concluidos.length); i++) {
      await adminSupabase.from('avaliacoes').insert({
        profissional_id: profissionalId,
        agendamento_id: concluidos[i].id,
        nota: depoimentos[i].nota,
        comentario: depoimentos[i].comentario,
      })
    }

    // 9. Cadastrar Cupons Promocionais de Exemplo (Prompt 62 Parte 2)
    const validadeCupom = new Date()
    validadeCupom.setDate(validadeCupom.getDate() + 45)

    await (adminSupabase.from('cupons_profissional') as any).insert([
      {
        profissional_id: profissionalId,
        codigo: 'BOASVINDAS15',
        tipo_desconto: 'percentual',
        valor: 15,
        segmento_alvo: 'nunca_agendou',
        limite_uso_total: 50,
        limite_uso_por_cliente: 1,
        valido_ate: validadeCupom.toISOString(),
        usos_atuais: 6,
        ativo: true,
      },
      {
        profissional_id: profissionalId,
        codigo: 'VOLTA20',
        tipo_desconto: 'valor_fixo',
        valor: 20.0,
        segmento_alvo: 'inativa',
        limite_uso_total: 30,
        limite_uso_por_cliente: 1,
        valido_ate: validadeCupom.toISOString(),
        usos_atuais: 3,
        ativo: true,
      },
      {
        profissional_id: profissionalId,
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

    // 10. Cadastrar Metas Mensais de Exemplo (Prompt 62 Parte 1)
    const primeiroDiaMesAtual = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const primeiroDiaMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]

    await (adminSupabase.from('metas_mensais') as any).insert([
      {
        profissional_id: profissionalId,
        mes_referencia: primeiroDiaMesAtual,
        tipo_meta: 'faturamento',
        valor_meta: 4500.0,
      },
      {
        profissional_id: profissionalId,
        mes_referencia: primeiroDiaMesAnterior,
        tipo_meta: 'faturamento',
        valor_meta: 3800.0,
      },
    ])

    return {
      success: true,
      message: `Conta demo populada com sucesso! 5 serviços, 6 clientes, ${agendamentosParaInserir.length} agendamentos nos últimos 3 meses, 4 avaliações, cupons e metas configuradas.`,
    }
  } catch (err: unknown) {
    console.error('Erro ao resetar dados demo:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro ao resetar conta demo.',
    }
  }
}

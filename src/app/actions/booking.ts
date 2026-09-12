'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { clienteAgendamentoSchema } from '@/lib/validations'
import { calculateAvailableSlots, getWorkingDaysInNextNDays } from '@/lib/booking/availability'
import { checkRateLimitDb } from '@/lib/rateLimit'
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '@/lib/google-calendar'
import { sendPushToProfissional } from '@/lib/push/pushService'
import { revalidatePath } from 'next/cache'

export interface CreateBookingResponse {
  success: boolean
  errorType?: 'EXCLUSION_VIOLATION' | 'VALIDATION_ERROR' | 'SERVICE_NOT_FOUND' | 'UNKNOWN'
  message?: string
  agendamentoId?: string
}

/**
 * Server Action para buscar os dias de atendimento da profissional.
 */
export async function fetchWorkingDaysAction(
  profissionalId: string,
  daysCount = 90
) {
  try {
    return await getWorkingDaysInNextNDays(profissionalId, daysCount)
  } catch (error) {
    console.error('Erro ao buscar dias de atendimento:', error)
    return []
  }
}

/**
 * Server Action para buscar os horários disponíveis em um dia.
 */
export async function fetchAvailableSlotsAction(
  profissionalId: string,
  servicoIdOrDuracaoMinutos: string | number,
  dateStr: string,
  allowPastSlots = false
) {
  try {
    return await calculateAvailableSlots(profissionalId, servicoIdOrDuracaoMinutos, dateStr, allowPastSlots)
  } catch (error) {
    console.error('Erro ao calcular horários disponíveis:', error)
    return {
      dateStr,
      dayOfWeek: new Date(dateStr).getDay(),
      isWorkingDay: false,
      availableSlots: [],
    }
  }
}

/**
 * Server Action para buscar os serviços ativos e a lista de clientes da profissional logada (Item 1 & Item 2).
 */
export async function getProfissionalServicesAndClientsAction() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, profissionalId: null, services: [], clients: [] }

    const adminSupabase = createAdminClient()

    const { data: servicos } = await adminSupabase
      .from('servicos')
      .select('id, nome, preco, duracao_minutos, foto_url')
      .eq('profissional_id', user.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    const { data: clientes } = await adminSupabase
      .from('clientes')
      .select('id, nome, telefone')
      .eq('profissional_id', user.id)
      .order('nome', { ascending: true })

    return {
      success: true,
      profissionalId: user.id,
      services: (servicos || []) as { id: string; nome: string; preco: number; duracao_minutos: number; foto_url: string | null }[],
      clients: (clientes || []) as { id: string; nome: string; telefone: string }[],
    }
  } catch (error) {
    console.error('Erro ao buscar serviços e clientes da profissional:', error)
    return { success: false, profissionalId: null, services: [], clients: [] }
  }
}

/**
 * Server Action para criar um novo agendamento público.
 */
export async function createBookingAction(formData: {
  profissional_id: string
  servico_id: string
  servico_ids?: string[]
  combo_id?: string | null
  cupom_id?: string | null
  desconto_cupom?: number | null
  data_hora_inicio: string
  cliente_nome: string
  cliente_telefone: string
  para_outra_pessoa?: boolean
  nome_pessoa_atendida?: string
  forma_pagamento_preferida?: string
}): Promise<CreateBookingResponse> {
  // 1. Validação dos campos de entrada
  const validation = clienteAgendamentoSchema.safeParse(formData)
  if (!validation.success) {
    return {
      success: false,
      errorType: 'VALIDATION_ERROR',
      message: validation.error.errors[0].message,
    }
  }

  const { profissional_id, servico_id, data_hora_inicio, cliente_nome, cliente_telefone } =
    validation.data

  // Rate Limit Check persistente para criação pública de agendamento (máx. 5 tentativas por minuto por cliente/profissional)
  const cleanPhone = cliente_telefone.replace(/\D/g, '')
  const rateKey = `booking_create_${profissional_id}_${cleanPhone}`
  const rl = await checkRateLimitDb({
    chave: rateKey,
    acao: 'criar_agendamento',
    limit: 5,
    windowMinutes: 1,
  })

  if (!rl.allowed) {
    return {
      success: false,
      errorType: 'VALIDATION_ERROR',
      message: 'Muitas tentativas de agendamento em sequência. Por favor, aguarde 1 minuto antes de tentar novamente.',
    }
  }

  const servicoIdsList = formData.servico_ids && formData.servico_ids.length > 0
    ? formData.servico_ids
    : [servico_id]

  const supabase = createAdminClient()

  try {
    // 2. Buscar informações de todos os serviços selecionados
    const { data: servicosList, error: servicosError } = await supabase
      .from('servicos')
      .select('id, duracao_minutos, nome, preco')
      .in('id', servicoIdsList)

    if (servicosError || !servicosList || servicosList.length === 0) {
      return {
        success: false,
        errorType: 'SERVICE_NOT_FOUND',
        message: 'Um ou mais serviços selecionados não foram encontrados ou foram removidos.',
      }
    }

    // Calcular duração total acumulada e preço total acumulado
    const totalDuracaoMinutos = servicosList.reduce((sum, s) => sum + s.duracao_minutos, 0)
    let totalPreco = servicosList.reduce((sum, s) => sum + Number(s.preco), 0)
    let nomesCombo = servicosList.map((s) => s.nome).join(' + ')

    // Prompt 61: Se foi contratado via combo, busca o valor do combo para aplicar o preço do pacote
    if (formData.combo_id) {
      const { data: comboData } = await supabase
        .from('combos')
        .select('id, nome, preco_combo')
        .eq('id', formData.combo_id)
        .maybeSingle()

      if (comboData) {
        if (comboData.preco_combo !== null && comboData.preco_combo !== undefined) {
          totalPreco = Number(comboData.preco_combo)
        }
        if (comboData.nome) {
          nomesCombo = `${comboData.nome} (${nomesCombo})`
        }
      }
    }

    // Prompt 62: Se houver cupom aplicado, deduz o desconto do valor total
    if (formData.cupom_id && formData.desconto_cupom) {
      totalPreco = Math.max(0, totalPreco - Number(formData.desconto_cupom))
    }

    // Calcular data_hora_fim com base na duração total do combo
    const inicioDate = new Date(data_hora_inicio)
    const fimDate = new Date(inicioDate.getTime() + totalDuracaoMinutos * 60 * 1000)
    const data_hora_inicio_iso = inicioDate.toISOString()
    const data_hora_fim_iso = fimDate.toISOString()

    // Item 7: Se o agendamento foi realizado para um horário que já passou, define como 'concluido'
    const now = new Date()
    const isPastBooking = fimDate.getTime() < now.getTime()
    const initialStatus = isPastBooking ? 'concluido' : 'confirmado'
    const initialStatusPagamento = isPastBooking ? 'pago_no_local' : 'pendente'

    // 3. Formatar telefone (apenas dígitos)
    const telefoneLimpo = cliente_telefone.replace(/\D/g, '')

    // 4. Verificar se já existe um cliente cadastrado com esse telefone para essa profissional
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('profissional_id', profissional_id)
      .eq('telefone', telefoneLimpo)
      .maybeSingle()

    let clienteId: string

    if (clienteExistente) {
      clienteId = clienteExistente.id
      // Atualizar o nome se tiver mudado
      if (clienteExistente.nome !== cliente_nome) {
        await supabase
          .from('clientes')
          .update({ nome: cliente_nome })
          .eq('id', clienteExistente.id)
      }
    } else {
      // Criar novo registro de cliente
      const { data: novoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert([
          {
            profissional_id,
            nome: cliente_nome,
            telefone: telefoneLimpo,
          },
        ])
        .select('id')
        .single()

      if (clienteError || !novoCliente) {
        throw new Error(`Erro ao cadastrar dados do cliente: ${clienteError?.message}`)
      }

      clienteId = novoCliente.id
    }

    // 5. Inserir o agendamento principal no banco com fallback resiliente
    let obsAtendimento = formData.para_outra_pessoa && formData.nome_pessoa_atendida
      ? `Atendimento para: ${formData.nome_pessoa_atendida} (agendado por ${cliente_nome})`
      : null

    if (formData.cupom_id && formData.desconto_cupom) {
      const infoCupom = `Desconto Cupom: -R$ ${Number(formData.desconto_cupom).toFixed(2)}`
      obsAtendimento = obsAtendimento ? `${obsAtendimento} | ${infoCupom}` : infoCupom
    }

    const basePayload: Record<string, unknown> = {
      profissional_id,
      cliente_id: clienteId,
      servico_id: servicoIdsList[0],
      combo_id: formData.combo_id || null,
      data_hora_inicio: data_hora_inicio_iso,
      data_hora_fim: data_hora_fim_iso,
      valor_cobrado: totalPreco,
      observacao_pagamento: obsAtendimento,
      forma_pagamento_preferida: formData.forma_pagamento_preferida || null,
      forma_pagamento: formData.forma_pagamento_preferida || null,
      status: initialStatus,
      status_pagamento: initialStatusPagamento,
      pago: isPastBooking || initialStatusPagamento === 'pago_no_local',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: novoAgendamento, error: agendamentoError } = await (supabase.from('agendamentos') as any)
      .insert([basePayload])
      .select('id')
      .single()

    // Fallback caso colunas opcionais recentes ainda não estejam presentes no schema cache
    if (agendamentoError && (agendamentoError.code === 'PGRST204' || agendamentoError.code === '42703')) {
      const fallbackPayload: Record<string, unknown> = {
        profissional_id,
        cliente_id: clienteId,
        servico_id: servicoIdsList[0],
        data_hora_inicio: data_hora_inicio_iso,
        data_hora_fim: data_hora_fim_iso,
        valor_cobrado: totalPreco,
        observacao_pagamento: obsAtendimento,
        forma_pagamento: formData.forma_pagamento_preferida || null,
        status: initialStatus,
        pago: isPastBooking || initialStatusPagamento === 'pago_no_local',
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const retryResult = await (supabase.from('agendamentos') as any)
        .insert([fallbackPayload])
        .select('id')
        .single()

      novoAgendamento = retryResult.data
      agendamentoError = retryResult.error
    }

    if (agendamentoError) {
      // Tratar especificamente a violação da Exclusion Constraint de sobreposição (Postgres 23P01)
      const isExclusionError =
        agendamentoError.code === '23P01' ||
        agendamentoError.message?.toLowerCase().includes('exclusion') ||
        agendamentoError.message?.toLowerCase().includes('overlap') ||
        agendamentoError.details?.toLowerCase().includes('no_overlapping_agendamentos')

      if (isExclusionError) {
        return {
          success: false,
          errorType: 'EXCLUSION_VIOLATION',
          message:
            'Ops! Esse horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.',
        }
      }

      throw agendamentoError
    }

    // 6. Inserir os registros detalhados na tabela agendamento_servicos (preservando preços e durações congeladas)
    const agendamentoServicosRows = servicosList.map((s) => ({
      agendamento_id: novoAgendamento.id,
      servico_id: s.id,
      preco_no_momento: Number(s.preco),
      duracao_no_momento_minutos: s.duracao_minutos,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: servicosInsertError } = await (supabase.from('agendamento_servicos') as any)
      .insert(agendamentoServicosRows)

    if (servicosInsertError) {
      console.error('[agendamento_servicos] Erro ao registrar serviços do combo:', servicosInsertError)
    }

    // Prompt 62: Registrar o uso do cupom se aplicável
    if (formData.cupom_id && novoAgendamento?.id) {
      try {
        const { registrarUsoCupomAction } = await import('@/app/actions/coupons')
        await registrarUsoCupomAction({
          cupomId: formData.cupom_id,
          clienteTelefone: telefoneLimpo,
          agendamentoId: novoAgendamento.id,
        })
      } catch (errCupom) {
        console.warn('[createBookingAction] Erro ao registrar uso do cupom:', errCupom)
      }
    }

    // Criar evento no Google Calendar para a profissional se configurado
    try {
      const googleResult = await createGoogleCalendarEvent({
        profissionalId: profissional_id,
        clienteNome: formData.para_outra_pessoa && formData.nome_pessoa_atendida
          ? `${formData.nome_pessoa_atendida} (por ${cliente_nome})`
          : cliente_nome,
        clienteTelefone: cliente_telefone,
        servicoNome: nomesCombo,
        dataHoraInicio: data_hora_inicio_iso,
        dataHoraFim: data_hora_fim_iso,
      })

      if (googleResult?.eventId) {
        await supabase
          .from('agendamentos')
          .update({ google_event_id: googleResult.eventId })
          .eq('id', novoAgendamento.id)
      }
    } catch (googleError) {
      console.error('[Google Calendar] Erro ao integrar no agendamento:', googleError)
    }

    // Disparar notificação Push para a profissional
    try {
      const dataInicioObj = new Date(data_hora_inicio_iso)
      const dataFormatada = dataInicioObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
      const horaFormatada = dataInicioObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
      sendPushToProfissional(profissional_id, {
        title: 'Novo Agendamento Recebido!',
        body: `${cliente_nome} agendou ${nomesCombo} para ${dataFormatada} às ${horaFormatada}.`,
        url: '/dashboard/agenda',
        tag: `booking-new-${novoAgendamento.id}`,
      }).catch((err) => console.error('[Push Notification] Erro ao enviar push de novo agendamento:', err))
    } catch (pushErr) {
      console.error('[Push Notification] Erro no push de createBookingAction:', pushErr)
    }

    revalidatePath('/dashboard')
    revalidatePath('/p/[slug]', 'page')

    return {
      success: true,
      agendamentoId: novoAgendamento.id,
    }
  } catch (error: unknown) {
    console.error('Erro na criação de agendamento:', error)
    return {
      success: false,
      errorType: 'UNKNOWN',
      message: 'Não foi possível concluir seu agendamento no momento. Por favor, tente novamente em instantes.',
    }
  }
}

/**
 * Server Action para cancelar um agendamento.
 * Se houver evento no Google Calendar, remove o evento do calendário.
 */
export async function cancelBookingAction(agendamentoId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Buscar agendamento com informações necessárias
    const { data: agendamento, error: fetchError } = await supabase
      .from('agendamentos')
      .select('id, profissional_id, google_event_id, status')
      .eq('id', agendamentoId)
      .single()

    if (fetchError || !agendamento) {
      return { success: false, message: 'Agendamento não encontrado.' }
    }

    if (agendamento.status === 'cancelado') {
      return { success: false, message: 'Este agendamento já se encontra cancelado.' }
    }

    if (agendamento.status === 'concluido') {
      return { success: false, message: 'Agendamentos já concluídos não podem ser cancelados.' }
    }

    // 2. Atualizar status para cancelado no banco de dados
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', agendamentoId)

    if (updateError) {
      throw updateError
    }

    // 3. Se possuir google_event_id, deletar do Google Calendar
    if (agendamento.google_event_id) {
      try {
        await deleteGoogleCalendarEvent({
          profissionalId: agendamento.profissional_id,
          googleEventId: agendamento.google_event_id,
        })
      } catch (err) {
        console.error('[Google Calendar] Erro ao deletar evento de agendamento cancelado:', err)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao cancelar o agendamento.',
    }
  }
}

/**
 * Server Action para remarcar um agendamento.
 * Atualiza o evento existente no Google Calendar ou cria um novo se não existir.
 */
export async function rescheduleBookingAction(
  agendamentoId: string,
  novaDataHoraInicio: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Buscar agendamento com os relacionamentos do cliente e serviço
    const { data: agendamento, error: fetchError } = await supabase
      .from('agendamentos')
      .select('*, clientes(nome, telefone), servicos(nome, duracao_minutos)')
      .eq('id', agendamentoId)
      .single()

    if (fetchError || !agendamento || !agendamento.servicos || !agendamento.clientes) {
      return { success: false, message: 'Agendamento ou dados relacionados não encontrados.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const servicoObj = agendamento.servicos as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clienteObj = agendamento.clientes as any

    const duracaoMinutos = servicoObj.duracao_minutos || 60
    const inicioDate = new Date(novaDataHoraInicio)
    const fimDate = new Date(inicioDate.getTime() + duracaoMinutos * 60 * 1000)
    const novaDataHoraFim = fimDate.toISOString()

    // 2. Atualizar datas do agendamento no Supabase
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({
        data_hora_inicio: novaDataHoraInicio,
        data_hora_fim: novaDataHoraFim,
      })
      .eq('id', agendamentoId)

    if (updateError) {
      throw updateError
    }

    // 3. Atualizar evento no Google Calendar (Item 3)
    try {
      if (agendamento.google_event_id) {
        await updateGoogleCalendarEvent({
          profissionalId: agendamento.profissional_id,
          googleEventId: agendamento.google_event_id,
          clienteNome: clienteObj.nome,
          clienteTelefone: clienteObj.telefone,
          servicoNome: servicoObj.nome,
          dataHoraInicio: novaDataHoraInicio,
          dataHoraFim: novaDataHoraFim,
        })
      } else {
        const googleResult = await createGoogleCalendarEvent({
          profissionalId: agendamento.profissional_id,
          clienteNome: clienteObj.nome,
          clienteTelefone: clienteObj.telefone,
          servicoNome: servicoObj.nome,
          dataHoraInicio: novaDataHoraInicio,
          dataHoraFim: novaDataHoraFim,
        })

        if (googleResult?.eventId) {
          await supabase
            .from('agendamentos')
            .update({ google_event_id: googleResult.eventId })
            .eq('id', agendamentoId)
        }
      }
    } catch (err) {
      console.error('[Google Calendar] Erro ao sincronizar evento remarcado:', err)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao remarcar agendamento:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao remarcar o agendamento.',
    }
  }
}

export interface CompleteBookingPayload {
  forma_pagamento: 'dinheiro' | 'pix' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'outro'
  valor_cobrado: number
  pago: boolean
  observacao_pagamento?: string | null
  servicos_precos?: { id: string; preco: number }[]
}

/**
 * Server Action para marcar um agendamento como concluído e salvar informações financeiras.
 */
export async function completeBookingAction(
  agendamentoId: string,
  payload: CompleteBookingPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createAdminClient()

    if (!payload.forma_pagamento) {
      return { success: false, message: 'Selecione uma forma de pagamento válida.' }
    }

    if (payload.valor_cobrado < 0) {
      return { success: false, message: 'O valor cobrado não pode ser negativo.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('agendamentos') as any)
      .update({
        status: 'concluido',
        forma_pagamento: payload.forma_pagamento,
        valor_cobrado: Number(payload.valor_cobrado),
        pago: payload.pago,
        observacao_pagamento: payload.observacao_pagamento || null,
      })
      .eq('id', agendamentoId)

    if (updateError) {
      throw updateError
    }

    // Atualizar os valores individuais de cada serviço na tabela agendamento_servicos, se informados
    if (payload.servicos_precos && payload.servicos_precos.length > 0) {
      for (const sp of payload.servicos_precos) {
        if (sp.id && !isNaN(Number(sp.preco))) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('agendamento_servicos') as any)
            .update({ preco_no_momento: Number(sp.preco) })
            .eq('id', sp.id)
        }
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/financeiro')
    revalidatePath('/dashboard/agenda')
    return { success: true }
  } catch (error) {
    console.error('Erro ao concluir agendamento:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao concluir o agendamento.',
    }
  }
}

/**
 * Server Action para marcar um agendamento como No-Show (cliente não compareceu).
 */
export async function markNoShowBookingAction(
  agendamentoId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('agendamentos') as any)
      .update({
        status: 'no_show',
      })
      .eq('id', agendamentoId)

    if (updateError) {
      throw updateError
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/financeiro')
    return { success: true }
  } catch (error) {
    console.error('Erro ao marcar no-show:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao registrar falta (no-show).',
    }
  }
}

export interface ClientBookingItem {
  id: string
  profissional_id?: string
  data_hora_inicio: string
  data_hora_fim: string
  status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
  servicos?: {
    nome: string
    preco: number
    duracao_minutos: number
  } | null
}

/**
 * Server Action pública para o cliente buscar seus agendamentos via WhatsApp.
 */
export async function lookupClientBookingsAction(
  profissionalSlug: string,
  telefone: string
): Promise<{
  success: boolean
  message?: string
  profissionalId?: string
  upcoming?: ClientBookingItem[]
  past?: ClientBookingItem[]
  whatsappProfissional?: string | null
}> {
  try {
    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return { success: false, message: 'Digite um número de telefone/WhatsApp válido com DDD.' }
    }

    // Rate Limit Check persistente (máx. 5 buscas por minuto)
    const rateKey = `lookup_${profissionalSlug}_${cleanPhone}`
    const rl = await checkRateLimitDb({
      chave: rateKey,
      acao: 'buscar_agendamentos_cliente',
      limit: 5,
      windowMinutes: 1,
    })

    if (!rl.allowed) {
      return {
        success: false,
        message: 'Muitas tentativas de busca. Por favor, aguarde 1 minuto antes de tentar novamente.',
      }
    }

    const supabase = createAdminClient()

    // 1. Buscar id e whatsapp da profissional pelo slug
    const { data: prof, error: profError } = await supabase
      .from('profissionais_publico')
      .select('id, whatsapp')
      .ilike('slug', profissionalSlug)
      .maybeSingle()

    if (profError || !prof) {
      return { success: false, message: 'Profissional não encontrada.' }
    }

    // 2. Buscar cliente por profissional_id e telefone
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('profissional_id', prof.id)
      .eq('telefone', cleanPhone)
      .maybeSingle()

    if (!cliente) {
      return {
        success: true,
        upcoming: [],
        past: [],
        whatsappProfissional: prof.whatsapp,
        message: 'Nenhum agendamento encontrado para este telefone.',
      }
    }

    // 3. Buscar agendamentos vinculados
    const { data: agendamentosData, error: agError } = await supabase
      .from('agendamentos')
      .select('id, profissional_id, data_hora_inicio, data_hora_fim, status, servicos(nome, preco, duracao_minutos)')
      .eq('profissional_id', prof.id)
      .eq('cliente_id', cliente.id)
      .order('data_hora_inicio', { ascending: false })

    if (agError) {
      throw agError
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allBookings = (agendamentosData || []) as any[] as ClientBookingItem[]
    const now = new Date()

    // Próximos: status 'confirmado' e data futura
    const upcoming = allBookings
      .filter((b) => b.status === 'confirmado' && new Date(b.data_hora_inicio) >= now)
      .sort((a, b) => new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime())

    // Passados: data retroativa ou status cancelado / concluido / no_show
    const upcomingIds = new Set(upcoming.map((b) => b.id))
    const past = allBookings.filter((b) => !upcomingIds.has(b.id))

    return {
      success: true,
      profissionalId: prof.id,
      upcoming,
      past,
      whatsappProfissional: prof.whatsapp,
    }
  } catch (error: unknown) {
    console.error('[lookupClientBookingsAction] Erro:', error)
    const err = error as { message?: string }
    return {
      success: false,
      message: err?.message || 'Erro ao buscar seus agendamentos.',
    }
  }
}

const CANCEL_NOTICE_HOURS = 4

/**
 * Server Action pública para o cliente cancelar seu próprio agendamento (regra de 4h).
 */
export async function cancelClientBookingAction(params: {
  agendamentoId: string
  telefone: string
  profissionalSlug: string
}): Promise<{
  success: boolean
  message?: string
  isLateCancel?: boolean
  whatsappProfissional?: string | null
}> {
  try {
    const { agendamentoId, telefone, profissionalSlug } = params
    const cleanPhone = telefone.replace(/\D/g, '')

    const supabase = createAdminClient()

    // 1. Buscar agendamento e verificar pertencimento
    const { data: agendamento, error: fetchError } = await supabase
      .from('agendamentos')
      .select('id, data_hora_inicio, status, google_event_id, profissional_id, clientes(telefone), profissionais(slug, whatsapp)')
      .eq('id', agendamentoId)
      .maybeSingle()

    if (fetchError || !agendamento) {
      return { success: false, message: 'Agendamento não encontrado.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clienteObj = agendamento.clientes as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profObj = agendamento.profissionais as any

    const clientPhone = (clienteObj?.telefone || '').replace(/\D/g, '')
    const profSlug = profObj?.slug || ''

    if (clientPhone !== cleanPhone || profSlug.toLowerCase() !== profissionalSlug.toLowerCase()) {
      return { success: false, message: 'Você não tem permissão para cancelar este agendamento.' }
    }

    if (agendamento.status === 'cancelado') {
      return { success: false, message: 'Este agendamento já se encontra cancelado.' }
    }

    if (agendamento.status === 'concluido') {
      return { success: false, message: 'Este agendamento já foi concluído e não pode ser cancelado.' }
    }

    // 2. Verificar antecedência mínima de 4 horas
    const inicioDate = new Date(agendamento.data_hora_inicio)
    const diffHours = (inicioDate.getTime() - Date.now()) / (1000 * 60 * 60)

    if (diffHours < CANCEL_NOTICE_HOURS) {
      return {
        success: false,
        isLateCancel: true,
        whatsappProfissional: profObj?.whatsapp,
        message: `Cancelamentos online só são permitidos com no mínimo ${CANCEL_NOTICE_HOURS} horas de antecedência. Para cancelar em cima da hora, entre em contato direto pelo WhatsApp da profissional.`,
      }
    }

    // 3. Atualizar status para cancelado
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', agendamentoId)

    if (updateError) {
      throw updateError
    }

    // 4. Deletar do Google Calendar se houver evento
    if (agendamento.google_event_id) {
      try {
        await deleteGoogleCalendarEvent({
          profissionalId: agendamento.profissional_id,
          googleEventId: agendamento.google_event_id,
        })
      } catch (gErr) {
        console.error('[Google Calendar] Erro ao deletar evento cancelado pelo cliente:', gErr)
      }
    }

    // Disparar notificação Push para a profissional
    try {
      const inicioObj = new Date(agendamento.data_hora_inicio)
      const dataFormatada = inicioObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
      const horaFormatada = inicioObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
      const nomeCliente = clienteObj?.nome || 'Uma cliente'
      sendPushToProfissional(agendamento.profissional_id, {
        title: 'Agendamento Cancelado',
        body: `${nomeCliente} cancelou o agendamento de ${dataFormatada} às ${horaFormatada}.`,
        url: '/dashboard/agenda',
        tag: `booking-cancel-${agendamentoId}`,
      }).catch((err) => console.error('[Push Notification] Erro ao enviar push de cancelamento:', err))
    } catch (pushErr) {
      console.error('[Push Notification] Erro ao disparar push no cancelClientBookingAction:', pushErr)
    }

    revalidatePath('/p/[slug]', 'page')
    revalidatePath('/dashboard')

    return { success: true, message: 'Agendamento cancelado com sucesso!' }
  } catch (error: unknown) {
    console.error('[cancelClientBookingAction] Erro:', error)
    const err = error as { message?: string }
    return {
      success: false,
      message: err?.message || 'Erro ao cancelar o agendamento.',
    }
  }
}

/**
 * Server Action pública para o cliente remarcar seu próprio agendamento (regra de 4h e proteção contra conflitos).
 */
export async function rescheduleClientBookingAction(params: {
  agendamentoId: string
  telefone: string
  profissionalSlug: string
  novaDataHoraInicio: string
}): Promise<{
  success: boolean
  message?: string
  errorType?: 'EXCLUSION_VIOLATION' | 'VALIDATION_ERROR' | 'UNKNOWN'
  isLate?: boolean
  whatsappProfissional?: string | null
  novoInicio?: string
  novoFim?: string
}> {
  try {
    const { agendamentoId, telefone, profissionalSlug, novaDataHoraInicio } = params
    const cleanPhone = telefone.replace(/\D/g, '')

    const supabase = createAdminClient()

    // 1. Buscar agendamento e verificar pertencimento
    const { data: agendamento, error: fetchError } = await supabase
      .from('agendamentos')
      .select('id, data_hora_inicio, data_hora_fim, status, google_event_id, profissional_id, servico_id, clientes(id, nome, telefone), profissionais(id, slug, whatsapp), servicos(nome, duracao_minutos)')
      .eq('id', agendamentoId)
      .maybeSingle()

    if (fetchError || !agendamento) {
      return { success: false, message: 'Agendamento não encontrado.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clienteObj = agendamento.clientes as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profObj = agendamento.profissionais as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const servicoObj = agendamento.servicos as any

    const clientPhone = (clienteObj?.telefone || '').replace(/\D/g, '')
    const profSlug = profObj?.slug || ''

    if (clientPhone !== cleanPhone || profSlug.toLowerCase() !== profissionalSlug.toLowerCase()) {
      return { success: false, message: 'Você não tem permissão para remarcar este agendamento.' }
    }

    if (agendamento.status !== 'confirmado') {
      return {
        success: false,
        message: `Não é possível remarcar um agendamento com status "${agendamento.status}". Apenas agendamentos confirmados podem ser remarcados.`,
      }
    }

    // 2. Verificar antecedência mínima de 4 horas para a data atual do agendamento
    const inicioDate = new Date(agendamento.data_hora_inicio)
    const diffHours = (inicioDate.getTime() - Date.now()) / (1000 * 60 * 60)

    if (diffHours < CANCEL_NOTICE_HOURS) {
      return {
        success: false,
        isLate: true,
        whatsappProfissional: profObj?.whatsapp,
        message: `Remarcações online só são permitidas com no mínimo ${CANCEL_NOTICE_HOURS} horas de antecedência. Para remarcar em cima da hora, entre em contato direto pelo WhatsApp da profissional.`,
      }
    }

    // 3. Validar novo horário
    const novaInicioDate = new Date(novaDataHoraInicio)
    if (isNaN(novaInicioDate.getTime()) || novaInicioDate.getTime() <= Date.now()) {
      return { success: false, message: 'O novo horário deve ser uma data e hora futura válida.' }
    }

    // Calcular duração original do agendamento
    let duracaoMinutos = 30
    if (agendamento.data_hora_inicio && agendamento.data_hora_fim) {
      const msDiff = new Date(agendamento.data_hora_fim).getTime() - new Date(agendamento.data_hora_inicio).getTime()
      if (msDiff > 0) {
        duracaoMinutos = Math.round(msDiff / 60000)
      }
    } else if (servicoObj?.duracao_minutos) {
      duracaoMinutos = Number(servicoObj.duracao_minutos)
    }

    const novaFimDate = new Date(novaInicioDate.getTime() + duracaoMinutos * 60 * 1000)
    const novaDataHoraInicioIso = novaInicioDate.toISOString()
    const novaDataHoraFimIso = novaFimDate.toISOString()

    // 4. Proteção contra conflito de horário (Exclusion / Overlapping check)
    const { data: conflitos, error: conflitoError } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('profissional_id', agendamento.profissional_id)
      .eq('status', 'confirmado')
      .neq('id', agendamentoId)
      .lt('data_hora_inicio', novaDataHoraFimIso)
      .gt('data_hora_fim', novaDataHoraInicioIso)

    if (conflitoError) {
      console.error('[rescheduleClientBookingAction] Erro ao verificar conflitos:', conflitoError)
    }

    if (conflitos && conflitos.length > 0) {
      return {
        success: false,
        errorType: 'EXCLUSION_VIOLATION',
        message: 'Ops! Esse horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.',
      }
    }

    // Verificar bloqueios de disponibilidade
    const { data: bloqueios } = await supabase
      .from('bloqueios_disponibilidade')
      .select('id')
      .eq('profissional_id', agendamento.profissional_id)
      .lt('data_hora_inicio', novaDataHoraFimIso)
      .gt('data_hora_fim', novaDataHoraInicioIso)

    if (bloqueios && bloqueios.length > 0) {
      return {
        success: false,
        message: 'A profissional possui um intervalo/bloqueio programado neste horário. Por favor, escolha outro horário.',
      }
    }

    // 5. Atualizar agendamento
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({
        data_hora_inicio: novaDataHoraInicioIso,
        data_hora_fim: novaDataHoraFimIso,
      })
      .eq('id', agendamentoId)

    if (updateError) {
      const isExclusionError =
        updateError.message?.toLowerCase().includes('exclusion') ||
        updateError.message?.toLowerCase().includes('overlap') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updateError as any).details?.toLowerCase().includes('no_overlapping_agendamentos')

      if (isExclusionError) {
        return {
          success: false,
          errorType: 'EXCLUSION_VIOLATION',
          message: 'Ops! Esse horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.',
        }
      }
      throw updateError
    }

    // 6. Sincronizar com Google Calendar se configurado
    if (agendamento.google_event_id) {
      try {
        await updateGoogleCalendarEvent({
          profissionalId: agendamento.profissional_id,
          googleEventId: agendamento.google_event_id,
          clienteNome: clienteObj?.nome || 'Cliente',
          clienteTelefone: clienteObj?.telefone || '',
          servicoNome: servicoObj?.nome || 'Atendimento',
          dataHoraInicio: novaDataHoraInicioIso,
          dataHoraFim: novaDataHoraFimIso,
        })
      } catch (gErr) {
        console.error('[Google Calendar] Erro ao sincronizar remarcação:', gErr)
      }
    }

    // 7. Disparar notificação Push para a profissional
    try {
      const dataFormatada = novaInicioDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
      const horaFormatada = novaInicioDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
      const nomeCliente = clienteObj?.nome || 'Uma cliente'

      sendPushToProfissional(agendamento.profissional_id, {
        title: 'Agendamento Remarcado!',
        body: `${nomeCliente} remarcou o atendimento para ${dataFormatada} às ${horaFormatada}.`,
        url: '/dashboard/agenda',
        tag: `booking-reschedule-${agendamentoId}`,
      }).catch((err) => console.error('[Push Notification] Erro ao enviar push de remarcação:', err))
    } catch (pushErr) {
      console.error('[Push Notification] Erro no push de remarcação:', pushErr)
    }

    revalidatePath('/p/[slug]', 'page')
    revalidatePath('/dashboard')

    return {
      success: true,
      novoInicio: novaDataHoraInicioIso,
      novoFim: novaDataHoraFimIso,
      message: 'Agendamento remarcado com sucesso!',
    }
  } catch (error: unknown) {
    console.error('[rescheduleClientBookingAction] Erro:', error)
    const err = error as { message?: string }
    return {
      success: false,
      message: err?.message || 'Erro ao remarcar agendamento.',
    }
  }
}

/**
 * Server Action para atualizar diretamente o status de um agendamento (Confirmado, Concluído, Cancelado, No-Show)
 */
export async function updateBookingStatusAction(
  agendamentoId: string,
  novoStatus: 'confirmado' | 'concluido' | 'cancelado' | 'no_show'
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createAdminClient()
    const { data: agendamento, error: fetchError } = await supabase
      .from('agendamentos')
      .select('id, profissional_id, google_event_id, status')
      .eq('id', agendamentoId)
      .single()

    if (fetchError || !agendamento) {
      return { success: false, message: 'Agendamento não encontrado.' }
    }

    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', agendamentoId)

    if (updateError) {
      throw updateError
    }

    if (novoStatus === 'cancelado' && agendamento.google_event_id) {
      try {
        await deleteGoogleCalendarEvent({
          profissionalId: agendamento.profissional_id,
          googleEventId: agendamento.google_event_id,
        })
      } catch (err) {
        console.error('[Google Calendar] Erro ao deletar evento cancelado:', err)
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard/geral')
    revalidatePath('/dashboard/clientes')

    return { success: true }
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[updateBookingStatusAction] Erro:', error)
    return { success: false, message: err?.message || 'Erro ao atualizar status.' }
  }
}


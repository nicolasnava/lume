'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CupomProfissionalItem {
  id: string
  profissional_id: string
  codigo: string
  tipo_desconto: 'percentual' | 'valor_fixo'
  valor: number
  segmento_alvo: 'todos' | 'nunca_agendou' | 'inativa'
  limite_uso_total: number | null
  limite_uso_por_cliente: number
  valido_ate: string | null
  usos_atuais: number
  ativo: boolean
  created_at: string
}

export interface ValidacaoCupomResult {
  success: boolean
  message?: string
  cupomId?: string
  codigo?: string
  tipoDesconto?: 'percentual' | 'valor_fixo'
  valorCupom?: number
  descontoCalculado?: number
  valorFinal?: number
}

// 1. Listar cupons da profissional logada
export async function getCuponsProfissionalAction(): Promise<{
  success: boolean
  message?: string
  cupons: CupomProfissionalItem[]
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.', cupons: [] }
    }

    const admin = createAdminClient()
    const { data, error } = await (admin.from('cupons_profissional') as any)
      .select('*')
      .eq('profissional_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      cupons: (data || []) as CupomProfissionalItem[],
    }
  } catch (err: unknown) {
    console.error('Erro ao listar cupons:', err)
    const errObj = err as { code?: string; message?: string }
    const isMissingTable =
      errObj?.code === 'PGRST205' ||
      errObj?.message?.includes('cupons_profissional') ||
      (err instanceof Error && err.message.includes('cupons_profissional'))
    return {
      success: false,
      message: isMissingTable
        ? 'A tabela de cupons não foi criada no banco de dados. Execute a migração 00039_reports_coupons_demo.sql no SQL Editor do Supabase.'
        : err instanceof Error ? err.message : 'Erro ao buscar cupons.',
      cupons: [],
    }
  }
}

// 2. Criar cupom
export async function createCupomAction(payload: {
  codigo: string
  tipo_desconto: 'percentual' | 'valor_fixo'
  valor: number
  segmento_alvo?: 'todos' | 'nunca_agendou' | 'inativa'
  limite_uso_total?: number | null
  limite_uso_por_cliente?: number
  valido_ate?: string | null
}): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const codigoLimpo = payload.codigo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
    if (!codigoLimpo || codigoLimpo.length < 3) {
      return { success: false, message: 'O código do cupom deve ter pelo menos 3 caracteres alfanuméricos.' }
    }

    if (!payload.valor || payload.valor <= 0) {
      return { success: false, message: 'Informe um valor de desconto válido maior que zero.' }
    }

    if (payload.tipo_desconto === 'percentual' && payload.valor > 90) {
      return { success: false, message: 'Descontos percentuais não podem exceder 90%.' }
    }

    const admin = createAdminClient()

    // Garantir que a profissional existe na tabela profissionais (para que a FK não falhe se for admin testando)
    const { data: profExistente } = await admin
      .from('profissionais')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profExistente) {
      const nomeUser = user.user_metadata?.nome || user.email?.split('@')[0] || 'Profissional'
      await (admin.from('profissionais') as any).insert({
        id: user.id,
        nome: nomeUser,
        slug: `prof-${user.id.slice(0, 8)}`,
        status_conta: 'ativa',
      })
    }

    // Verificar unicidade
    const { data: existente } = await (admin.from('cupons_profissional') as any)
      .select('id')
      .eq('profissional_id', user.id)
      .eq('codigo', codigoLimpo)
      .maybeSingle()

    if (existente) {
      return { success: false, message: `Você já possui um cupom com o código ${codigoLimpo}.` }
    }

    let dataValidadeIso: string | null = null
    if (payload.valido_ate && payload.valido_ate.trim()) {
      const parsed = new Date(payload.valido_ate)
      if (!isNaN(parsed.getTime())) {
        dataValidadeIso = parsed.toISOString()
      }
    }

    let limTotal: number | null = null
    if (payload.limite_uso_total && Number(payload.limite_uso_total) > 0) {
      limTotal = Math.floor(Number(payload.limite_uso_total))
    }

    const limPorCliente =
      payload.limite_uso_por_cliente && Number(payload.limite_uso_por_cliente) > 0
        ? Math.floor(Number(payload.limite_uso_por_cliente))
        : 1

    const { error } = await (admin.from('cupons_profissional') as any).insert({
      profissional_id: user.id,
      codigo: codigoLimpo,
      tipo_desconto: payload.tipo_desconto,
      valor: payload.valor,
      segmento_alvo: payload.segmento_alvo || 'todos',
      limite_uso_total: limTotal,
      limite_uso_por_cliente: limPorCliente,
      valido_ate: dataValidadeIso,
      usos_atuais: 0,
      ativo: true,
    })

    if (error) throw error

    return { success: true, message: 'Cupom criado com sucesso!' }
  } catch (err: unknown) {
    console.error('Erro ao criar cupom:', err)
    const errObj = err as { code?: string; message?: string }
    const isMissingTable =
      errObj?.code === 'PGRST205' ||
      errObj?.message?.includes('cupons_profissional') ||
      (err instanceof Error && err.message.includes('cupons_profissional'))
    return {
      success: false,
      message: isMissingTable
        ? 'A tabela de cupons não foi criada no banco de dados. Execute a migração 00039_reports_coupons_demo.sql no SQL Editor do Supabase.'
        : err instanceof Error ? err.message : 'Erro ao criar cupom.',
    }
  }
}

// 3. Atualizar cupom
export async function updateCupomAction(
  id: string,
  payload: {
    codigo?: string
    tipo_desconto?: 'percentual' | 'valor_fixo'
    valor?: number
    segmento_alvo?: 'todos' | 'nunca_agendou' | 'inativa'
    limite_uso_total?: number | null
    limite_uso_por_cliente?: number
    valido_ate?: string | null
    ativo?: boolean
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const admin = createAdminClient()

    const updates: Record<string, any> = {}
    if (payload.codigo) {
      updates.codigo = payload.codigo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
    }
    if (payload.tipo_desconto) updates.tipo_desconto = payload.tipo_desconto
    if (payload.valor !== undefined) updates.valor = payload.valor
    if (payload.segmento_alvo) updates.segmento_alvo = payload.segmento_alvo
    if (payload.limite_uso_total !== undefined) updates.limite_uso_total = payload.limite_uso_total
    if (payload.limite_uso_por_cliente !== undefined) updates.limite_uso_por_cliente = payload.limite_uso_por_cliente
    if (payload.valido_ate !== undefined) updates.valido_ate = payload.valido_ate
    if (payload.ativo !== undefined) updates.ativo = payload.ativo

    const { error } = await (admin.from('cupons_profissional') as any)
      .update(updates)
      .eq('id', id)
      .eq('profissional_id', user.id)

    if (error) throw error

    return { success: true, message: 'Cupom atualizado com sucesso!' }
  } catch (err: unknown) {
    console.error('Erro ao atualizar cupom:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro ao atualizar cupom.',
    }
  }
}

// 4. Alternar status (ativo / pausado)
export async function toggleCupomStatusAction(
  id: string,
  ativo: boolean
): Promise<{ success: boolean; message?: string }> {
  return updateCupomAction(id, { ativo })
}

// 5. Excluir cupom
export async function deleteCupomAction(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const admin = createAdminClient()
    const { error } = await (admin.from('cupons_profissional') as any)
      .delete()
      .eq('id', id)
      .eq('profissional_id', user.id)

    if (error) throw error

    return { success: true, message: 'Cupom excluído com sucesso!' }
  } catch (err: unknown) {
    console.error('Erro ao excluir cupom:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro ao excluir cupom.',
    }
  }
}

// 6. Validar cupom no wizard de agendamento público
export async function validarCupomAgendamentoAction(params: {
  profissionalId: string
  codigo: string
  clienteTelefone?: string | null
  valorTotal: number
}): Promise<ValidacaoCupomResult> {
  try {
    if (!params.profissionalId || !params.codigo) {
      return { success: false, message: 'Código de cupom ou profissional inválido.' }
    }

    const codigoBusca = params.codigo.trim().toUpperCase()
    const admin = createAdminClient()

    const { data: cupomRaw, error } = await (admin.from('cupons_profissional') as any)
      .select('*')
      .eq('profissional_id', params.profissionalId)
      .eq('codigo', codigoBusca)
      .maybeSingle()

    if (error || !cupomRaw) {
      return { success: false, message: 'Cupom não encontrado ou inválido para este profissional.' }
    }

    const cupom = cupomRaw as CupomProfissionalItem

    // 1. Checar se está ativo
    if (!cupom.ativo) {
      return { success: false, message: 'Este cupom foi pausado ou está desativado.' }
    }

    // 2. Checar data de validade
    if (cupom.valido_ate && new Date() > new Date(cupom.valido_ate)) {
      return { success: false, message: 'Este cupom já expirou.' }
    }

    // 3. Checar limite total de usos
    if (cupom.limite_uso_total && cupom.usos_atuais >= cupom.limite_uso_total) {
      return { success: false, message: 'Este cupom atingiu o limite máximo de utilizações.' }
    }

    // 4. Se houver telefone da cliente, checar limites por cliente e segmento
    const telefoneLimpo = params.clienteTelefone ? params.clienteTelefone.replace(/\D/g, '') : null

    if (telefoneLimpo) {
      // Limite por cliente
      const { count: usosClienteCount } = await (admin.from('cupom_usos') as any)
        .select('*', { count: 'exact', head: true })
        .eq('cupom_id', cupom.id)
        .eq('cliente_telefone', telefoneLimpo)

      if ((usosClienteCount || 0) >= cupom.limite_uso_por_cliente) {
        return {
          success: false,
          message: `Você já utilizou este cupom o número máximo de vezes (${cupom.limite_uso_por_cliente}x).`,
        }
      }

      // Validação de segmento: 'nunca_agendou'
      if (cupom.segmento_alvo === 'nunca_agendou') {
        const { data: clienteExistente } = await admin
          .from('clientes')
          .select('id')
          .eq('profissional_id', params.profissionalId)
          .eq('telefone', telefoneLimpo)
          .maybeSingle()

        if (clienteExistente) {
          const { count: atendimentosAnteriores } = await admin
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('profissional_id', params.profissionalId)
            .eq('cliente_id', clienteExistente.id)
            .in('status', ['concluido', 'confirmado'])

          if ((atendimentosAnteriores || 0) > 0) {
            return {
              success: false,
              message: 'Este cupom é exclusivo para novas clientes que nunca agendaram antes.',
            }
          }
        }
      }

      // Validação de segmento: 'inativa'
      if (cupom.segmento_alvo === 'inativa') {
        const sessentaDiasAtras = new Date()
        sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60)

        const { data: clienteExistente } = await admin
          .from('clientes')
          .select('id')
          .eq('profissional_id', params.profissionalId)
          .eq('telefone', telefoneLimpo)
          .maybeSingle()

        if (clienteExistente) {
          const { count: atendimentosRecentes } = await admin
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('profissional_id', params.profissionalId)
            .eq('cliente_id', clienteExistente.id)
            .eq('status', 'concluido')
            .gte('data_hora_inicio', sessentaDiasAtras.toISOString())

          if ((atendimentosRecentes || 0) > 0) {
            return {
              success: false,
              message: 'Este cupom é exclusivo para clientes inativas (sem atendimentos nos últimos 60 dias).',
            }
          }
        }
      }
    }

    // 5. Calcular valor do desconto
    let descontoCalculado = 0
    if (cupom.tipo_desconto === 'percentual') {
      descontoCalculado = (params.valorTotal * Number(cupom.valor)) / 100
    } else {
      descontoCalculado = Math.min(params.valorTotal, Number(cupom.valor))
    }

    const valorFinal = Math.max(0, params.valorTotal - descontoCalculado)

    return {
      success: true,
      cupomId: cupom.id,
      codigo: cupom.codigo,
      tipoDesconto: cupom.tipo_desconto,
      valorCupom: Number(cupom.valor),
      descontoCalculado,
      valorFinal,
      message: `Cupom ${cupom.codigo} aplicado com sucesso!`,
    }
  } catch (err: unknown) {
    console.error('Erro ao validar cupom:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro ao validar cupom.',
    }
  }
}

// 7. Registrar uso de cupom pós agendamento confirmado
export async function registrarUsoCupomAction(params: {
  cupomId: string
  clienteTelefone: string
  agendamentoId?: string | null
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const telefoneLimpo = params.clienteTelefone.replace(/\D/g, '')

    // Inserir em cupom_usos
    await (admin.from('cupom_usos') as any).insert({
      cupom_id: params.cupomId,
      cliente_telefone: telefoneLimpo,
      agendamento_id: params.agendamentoId || null,
    })

    // Incrementar usos_atuais
    const { data: cupom } = await (admin.from('cupons_profissional') as any)
      .select('usos_atuais')
      .eq('id', params.cupomId)
      .single()

    if (cupom) {
      await (admin.from('cupons_profissional') as any)
        .update({ usos_atuais: (cupom.usos_atuais || 0) + 1 })
        .eq('id', params.cupomId)
    }
  } catch (err) {
    console.error('Erro ao registrar uso do cupom:', err)
  }
}

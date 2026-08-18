'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface DisponibilidadeBloco {
  dia_semana: number // 0 (Dom) a 6 (Sáb)
  hora_inicio: string // "09:00"
  hora_fim: string // "18:00"
}

export async function saveAvailabilityAction(blocos: DisponibilidadeBloco[]) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    // 1. Validação simples: hora_inicio < hora_fim e sem sobreposição no mesmo dia
    for (let i = 0; i < blocos.length; i++) {
      const b1 = blocos[i]
      if (b1.hora_inicio >= b1.hora_fim) {
        return {
          success: false,
          message: `No dia da semana ${b1.dia_semana}, o horário inicial (${b1.hora_inicio}) deve ser menor que o horário final (${b1.hora_fim}).`,
        }
      }

      for (let j = i + 1; j < blocos.length; j++) {
        const b2 = blocos[j]
        if (b1.dia_semana === b2.dia_semana) {
          // Checar sobreposição
          const overlap = b1.hora_inicio < b2.hora_fim && b2.hora_inicio < b1.hora_fim
          if (overlap) {
            return {
              success: false,
              message: `Existe sobreposição de horários no mesmo dia da semana (${b1.hora_inicio}-${b1.hora_fim} e ${b2.hora_inicio}-${b2.hora_fim}).`,
            }
          }
        }
      }
    }

    const adminSupabase = createAdminClient()

    // 2. Substituição em lote: remover registros antigos e inserir os novos
    const { error: deleteError } = await adminSupabase
      .from('disponibilidade')
      .delete()
      .eq('profissional_id', user.id)

    if (deleteError) {
      throw deleteError
    }

    if (blocos.length > 0) {
      const rowsToInsert = blocos.map((b) => ({
        profissional_id: user.id,
        dia_semana: b.dia_semana,
        hora_inicio: b.hora_inicio,
        hora_fim: b.hora_fim,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (adminSupabase.from('disponibilidade') as any).insert(
        rowsToInsert
      )

      if (insertError) {
        throw insertError
      }
    }

    revalidatePath('/dashboard/disponibilidade')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard/geral')
    revalidatePath('/dashboard/clientes')
    revalidatePath('/dashboard/servicos')
    revalidatePath('/p/[slug]', 'page')
    revalidatePath('/p/[slug]/agendar', 'page')
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar disponibilidade:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao salvar horários de disponibilidade.',
    }
  }
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AvailabilityManager, { DisponibilidadeRow } from '@/components/dashboard/AvailabilityManager'
import DateBlockManager from '@/components/dashboard/DateBlockManager'
import { BloqueioDisponibilidadeRow } from '@/app/actions/blockedDates'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function DisponibilidadePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  // Buscar disponibilidades e bloqueios em paralelo para carregamento instantâneo
  const [{ data: disponibilidades }, { data: bloqueios }] = await Promise.all([
    adminSupabase
      .from('disponibilidade')
      .select('*')
      .eq('profissional_id', user.id)
      .order('dia_semana', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminSupabase.from('bloqueios_disponibilidade') as any)
      .select('*')
      .eq('profissional_id', user.id)
      .order('data', { ascending: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedDisponibilidades = (disponibilidades || []) as any[] as DisponibilidadeRow[]
  const initialBlocks = (bloqueios || []) as BloqueioDisponibilidadeRow[]

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#4A3F5C]">
          Horários de Disponibilidade
        </h1>
        <p className="text-xs sm:text-sm text-[#4A3F5C]/70 mt-1">
          Configure os dias recorrentes de atendimento, janelas de pausa e bloqueio de feriados/folgas
        </p>
      </div>

      <AvailabilityManager initialDisponibilidades={formattedDisponibilidades} />

      {/* Linha ultra fina padrão estilo Lumê entre os horários da semana e o bloqueio de datas específicas */}
      <div className="border-t border-gray-200/80 my-4" />

      {/* Seção de Bloqueio de Datas Especiais (Item 18) */}
      <DateBlockManager initialBlocks={initialBlocks} />
    </div>
  )
}

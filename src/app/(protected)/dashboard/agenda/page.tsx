import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AgendaCalendar from '@/components/dashboard/AgendaCalendar'
import { revalidatePath } from 'next/cache'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function DashboardAgendaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  // Buscar todos os agendamentos da profissional com relacionamentos
  const { data: agendamentos } = await adminSupabase
    .from('agendamentos')
    .select('*, clientes(nome, telefone), servicos(nome, duracao_minutos, preco, ativo), agendamento_servicos(id, preco_no_momento, duracao_no_momento_minutos, servicos(id, nome, preco, duracao_minutos, ativo))')
    .eq('profissional_id', user.id)
    .order('data_hora_inicio', { ascending: true })

  const handleRefresh = async () => {
    'use server'
    revalidatePath('/dashboard/agenda')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedBookings = (agendamentos || []) as any[]

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Dashboard */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#4A3F5C]">
          Visão Geral da Agenda
        </h1>
        <p className="text-xs sm:text-sm text-[#4A3F5C]/70 mt-1">
          Acompanhe seus horários, faturamento previsto e status dos agendamentos
        </p>
      </div>

      {/* Calendário da Agenda com os 3 Indicadores Integrados e Filtro de Período */}
      <AgendaCalendar initialBookings={formattedBookings} onRefresh={handleRefresh} />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ServicesManager, { ServiceRow } from '@/components/dashboard/ServicesManager'
import { getCombosProfissionalAction } from '@/app/actions/combos'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ServicosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()
  const nowIso = new Date().toISOString()

  // Buscar serviços, combos e agendamentos em paralelo para máxima velocidade
  const [{ data: servicos }, { data: pendingBookings }, combos] = await Promise.all([
    adminSupabase
      .from('servicos')
      .select('*')
      .eq('profissional_id', user.id)
      .order('created_at', { ascending: false }),
    (adminSupabase
      .from('agendamentos') as any)
      .select('id, servico_id, data_hora_inicio, data_hora_fim, status, valor_cobrado, clientes(nome, telefone)')
      .eq('profissional_id', user.id)
      .eq('status', 'confirmado')
      .gte('data_hora_inicio', nowIso),
    getCombosProfissionalAction(user.id),
  ])

  const pendingBookingsByService: Record<string, any[]> = {}
  if (pendingBookings) {
    for (const b of (pendingBookings as any[])) {
      if (b.servico_id) {
        if (!pendingBookingsByService[b.servico_id]) {
          pendingBookingsByService[b.servico_id] = []
        }
        pendingBookingsByService[b.servico_id].push({
          ...b,
          cliente_nome: b.clientes?.nome || 'Cliente',
          cliente_telefone: b.clientes?.telefone || null,
        })
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedServices = (servicos || []).map((s: any) => ({
    ...s,
    pending_bookings_count: (pendingBookingsByService[s.id] || []).length,
    pending_bookings: pendingBookingsByService[s.id] || [],
  })) as ServiceRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A3F5C]">
          Gestão de Serviços
        </h1>
        <p className="text-xs sm:text-sm text-[#4A3F5C]/70 mt-1">
          Cadastre os serviços oferecidos, valores, durações, combos promocionais e lembretes de manutenção
        </p>
      </div>

      <ServicesManager
        initialServices={formattedServices}
        initialCombos={combos}
        profissionalId={user.id}
      />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ServicesManager, { ServiceRow } from '@/components/dashboard/ServicesManager'

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

  // Buscar serviços e agendamentos em paralelo para máxima velocidade
  const [{ data: servicos }, { data: pendingBookings }] = await Promise.all([
    adminSupabase
      .from('servicos')
      .select('*')
      .eq('profissional_id', user.id)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('agendamentos')
      .select('servico_id')
      .eq('profissional_id', user.id)
      .eq('status', 'confirmado')
      .gte('data_hora_inicio', nowIso),
  ])

  const pendingCounts: Record<string, number> = {}
  if (pendingBookings) {
    for (const b of pendingBookings) {
      if (b.servico_id) {
        pendingCounts[b.servico_id] = (pendingCounts[b.servico_id] || 0) + 1
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedServices = (servicos || []).map((s: any) => ({
    ...s,
    pending_bookings_count: pendingCounts[s.id] || 0,
  })) as ServiceRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A3F5C]">
          Gestão de Serviços
        </h1>
        <p className="text-xs sm:text-sm text-[#4A3F5C]/70 mt-1">
          Cadastre os serviços oferecidos, valores, durações e intervalos para lembretes de manutenção
        </p>
      </div>

      <ServicesManager initialServices={formattedServices} profissionalId={user.id} />
    </div>
  )
}

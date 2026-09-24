import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ServicesManager, { ServicePendingBooking, ServiceRow } from '@/components/dashboard/ServicesManager'
import { getCombosProfissionalAction } from '@/app/actions/combos'
import { getComandaProdutosAction } from '@/app/actions/comanda'
import DashboardDataError from '@/components/dashboard/DashboardDataError'

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

  // Buscar serviços, combos, agendamentos e comanda em paralelo para máxima velocidade
  const [{ data: servicos, error: servicesError }, { data: pendingBookings }, combos, comandaProdutos, { data: professional }] = await Promise.all([
    adminSupabase
      .from('servicos')
      .select('*')
      .eq('profissional_id', user.id)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('agendamentos')
      .select('id, cliente_id, servico_id, data_hora_inicio, data_hora_fim, status, valor_cobrado')
      .eq('profissional_id', user.id)
      .eq('status', 'confirmado')
      .gte('data_hora_inicio', nowIso),
    getCombosProfissionalAction(user.id),
    getComandaProdutosAction(user.id),
    adminSupabase.from('profissionais').select('slug, cor_primaria').eq('id', user.id).maybeSingle(),
  ])

  if (servicesError) {
    return <DashboardDataError message="Não foi possível carregar os serviços. A coluna de exclusão lógica pode estar ausente; aplique as migrations pendentes do Supabase e tente novamente." />
  }

  const clientIds = [...new Set((pendingBookings || []).map((booking) => booking.cliente_id))]
  const { data: clients } = clientIds.length > 0
    ? await adminSupabase.from('clientes').select('id, nome, telefone').in('id', clientIds)
    : { data: [] }
  const clientById = new Map((clients || []).map((client) => [client.id, client]))

  const pendingBookingsByService: Record<string, ServicePendingBooking[]> = {}
  if (pendingBookings) {
    for (const b of pendingBookings) {
      if (b.servico_id) {
        if (!pendingBookingsByService[b.servico_id]) {
          pendingBookingsByService[b.servico_id] = []
        }
        pendingBookingsByService[b.servico_id].push({
          ...b,
          cliente_nome: clientById.get(b.cliente_id)?.nome || 'Cliente',
          cliente_telefone: clientById.get(b.cliente_id)?.telefone || undefined,
        })
      }
    }
  }

  const formattedServices = (servicos || []).filter((service) => !service.deletado_em).map((s) => ({
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
          Cadastre os serviços oferecidos, valores, durações, pacotes promocionais e itens da comanda digital
        </p>
      </div>

      <ServicesManager
        initialServices={formattedServices}
        initialCombos={combos}
        initialComanda={comandaProdutos}
        profissionalId={user.id}
        professionalSlug={professional?.slug || ''}
        primaryColor={professional?.cor_primaria || '#B8A9D9'}
      />
    </div>
  )
}

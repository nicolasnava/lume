import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FinancialDashboard, { FinancialBookingRow } from '@/components/dashboard/FinancialDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  // Buscar todos os agendamentos da profissional com dados de cliente, serviço e pagamento
  const { data: agendamentos } = await adminSupabase
    .from('agendamentos')
    .select('*, clientes(nome, telefone), servicos(nome, preco)')
    .eq('profissional_id', user.id)
    .order('data_hora_inicio', { ascending: false })

  // Buscar todos os serviços cadastrados da profissional para o filtro
  const { data: servicos } = await adminSupabase
    .from('servicos')
    .select('id, nome')
    .eq('profissional_id', user.id)
    .order('nome', { ascending: true })

  // Buscar todos os clientes cadastrados da profissional para o filtro
  const { data: clientes } = await adminSupabase
    .from('clientes')
    .select('id, nome')
    .eq('profissional_id', user.id)
    .order('nome', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedBookings = (agendamentos || []) as any[] as FinancialBookingRow[]

  return (
    <FinancialDashboard
      initialBookings={formattedBookings}
      allServices={(servicos || []).map((s) => ({ id: s.id, nome: s.nome }))}
      allClients={(clientes || []).map((c) => ({ id: c.id, nome: c.nome }))}
    />
  )
}

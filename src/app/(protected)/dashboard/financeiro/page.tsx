import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FinancialDashboard, { FinancialBookingRow } from '@/components/dashboard/FinancialDashboard'
import DashboardDataError from '@/components/dashboard/DashboardDataError'
import { getDashboardQueryState } from '@/lib/dashboard-query-state'

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
  const { data: agendamentos, error: agendamentosError } = await adminSupabase
    .from('agendamentos')
    .select('*, clientes(nome, telefone), servicos(nome, preco), combos(nome, preco_combo, duracao_minutos, foto_url), agendamento_servicos(id, preco_no_momento, duracao_no_momento_minutos, servicos(id, nome, preco, foto_url, duracao_minutos)), agendamento_comanda_produtos(id, produto_id, nome_no_momento, preco_no_momento, comanda_produtos(nome, foto_url))')
    .eq('profissional_id', user.id)
    .order('data_hora_inicio', { ascending: false })

  // Buscar todos os serviços cadastrados da profissional para o filtro
  const { data: servicos, error: servicosError } = await adminSupabase
    .from('servicos')
    .select('id, nome, preco, duracao_minutos, foto_url')
    .eq('profissional_id', user.id)
    .order('nome', { ascending: true })

  // Buscar todos os clientes cadastrados da profissional para o filtro
  const { data: clientes, error: clientesError } = await adminSupabase
    .from('clientes')
    .select('id, nome')
    .eq('profissional_id', user.id)
    .order('nome', { ascending: true })

  if ([agendamentosError, servicosError, clientesError].some((error) => getDashboardQueryState(error) === 'error')) {
    console.error('[DashboardFinanceiro] Falha ao consultar os dados:', { agendamentosError, servicosError, clientesError })
    return <DashboardDataError message="Não foi possível carregar agenda, serviços e clientes para calcular os indicadores financeiros." />
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedBookings = (agendamentos || []) as any[] as FinancialBookingRow[]

  return (
    <FinancialDashboard
      initialBookings={formattedBookings}
      allServices={(servicos || []).map((s) => ({
        id: s.id,
        nome: s.nome,
        preco: Number(s.preco || 0),
        duracao_minutos: Number(s.duracao_minutos || 0),
        foto_url: s.foto_url || null,
      }))}
      allClients={(clientes || []).map((c) => ({ id: c.id, nome: c.nome }))}
    />
  )
}

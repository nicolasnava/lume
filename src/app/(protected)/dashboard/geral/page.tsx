import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import GeralViewClient from '@/components/dashboard/GeralViewClient'
import StudioPendingInvitesBanner from '@/components/dashboard/StudioPendingInvitesBanner'
import { obterConvitesPendentesUsuario } from '@/app/actions/estudio'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function DashboardGeralPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  // Buscar profissional e convites pendentes de studio em paralelo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profissionalRes, convitesPendentes] = await Promise.all([
    (adminSupabase.from('profissionais') as any)
      .select('nome, onboarding_concluido')
      .eq('id', user.id)
      .single(),
    obterConvitesPendentesUsuario().catch(() => []),
  ])

  const profissional = profissionalRes?.data

  const profissionalNome = profissional?.nome || user.user_metadata?.nome || 'Profissional'
  const onboardingConcluido = profissional?.onboarding_concluido === true

  // Limites do dia de hoje (00:00:00 a 23:59:59)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  // Limites da semana atual
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // Buscar agendamentos do dia e semana com detalhes de cliente e serviço
  const { data: agendamentosData } = await adminSupabase
    .from('agendamentos')
    .select('id, data_hora_inicio, data_hora_fim, valor_cobrado, status, clientes(nome, telefone), servicos(nome, duracao_minutos, preco)')
    .eq('profissional_id', user.id)
    .neq('status', 'cancelado')
    .order('data_hora_inicio', { ascending: true })

  const agendamentos = agendamentosData || []

  // Agendamentos de hoje
  const todayRawBookings = agendamentos.filter((a) => {
    const d = new Date(a.data_hora_inicio)
    return d >= startOfToday && d <= endOfToday
  })

  // Agendamentos da semana
  const weekBookings = agendamentos.filter((a) => {
    const d = new Date(a.data_hora_inicio)
    return d >= startOfWeek && d <= endOfWeek
  })

  // Formatar todos os agendamentos de hoje
  const todayBookingsList = todayRawBookings.map((b) => {
    const dateObj = new Date(b.data_hora_inicio)
    const timeStr = dateObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clienteObj = b.clientes as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const servicoObj = b.servicos as any

    const precoFinal =
      b.valor_cobrado !== null && b.valor_cobrado !== undefined
        ? Number(b.valor_cobrado)
        : servicoObj?.preco !== undefined
        ? Number(servicoObj.preco)
        : null

    return {
      id: b.id,
      dataHoraInicio: b.data_hora_inicio,
      horaInicioStr: timeStr,
      clienteNome: clienteObj?.nome || 'Cliente sem nome',
      clienteTelefone: clienteObj?.telefone || null,
      servicoNome: servicoObj?.nome || 'Serviço',
      servicoDuracaoMinutos: servicoObj?.duracao_minutos ?? null,
      servicoPreco: precoFinal,
    }
  })

  // Próximo agendamento pendente a partir do momento atual (ou o primeiro de hoje se nenhum for futuro)
  const nextPendingBooking =
    todayBookingsList.find((b) => new Date(b.dataHoraInicio) >= now) || todayBookingsList[0] || null

  return (
    <>
      <StudioPendingInvitesBanner initialInvites={convitesPendentes} />
      <GeralViewClient
        profissionalNome={profissionalNome}
        todayBookingsCount={todayBookingsList.length}
        nextBooking={nextPendingBooking}
        todayBookings={todayBookingsList}
        totalAtendimentosSemana={weekBookings.length}
        initialShowTour={!onboardingConcluido}
      />
    </>
  )
}

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

  // Limites do dia de hoje e semana atual no fuso horário de Brasília (America/Sao_Paulo)
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const startOfToday = new Date(`${todayStr}T00:00:00-03:00`)
  const endOfToday = new Date(`${todayStr}T23:59:59.999-03:00`)

  // Limites da semana atual baseados no dia da semana em Brasília
  const todayDayOfWeek = new Date(`${todayStr}T12:00:00-03:00`).getDay()
  const startOfWeek = new Date(`${todayStr}T00:00:00-03:00`)
  startOfWeek.setDate(startOfWeek.getDate() - todayDayOfWeek)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // Buscar agendamentos do dia e semana com detalhes de cliente e serviço
  const { data: agendamentosData } = await adminSupabase
    .from('agendamentos')
    .select('id, profissional_id, cliente_id, servico_id, data_hora_inicio, data_hora_fim, valor_cobrado, pago, forma_pagamento, forma_pagamento_preferida, observacao_pagamento, status, google_event_id, clientes(nome, telefone), servicos(nome, duracao_minutos, preco, ativo), agendamento_servicos(id, preco_no_momento, duracao_no_momento_minutos, servicos(id, nome, preco, duracao_minutos, ativo))')
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

  // Formatar todos os agendamentos de hoje com fuso explícito de Brasília
  const todayBookingsList = todayRawBookings.map((b) => {
    const dateObj = new Date(b.data_hora_inicio)
    const timeStr = dateObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clienteObj = b.clientes as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const servicoObj = b.servicos as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agServicos = (b as any).agendamento_servicos as any[] | undefined
    const hasMultiple = agServicos && agServicos.length > 0

    const resolvedServicoNome = hasMultiple
      ? agServicos.map((as) => as.servicos?.nome).filter(Boolean).join(' + ')
      : (servicoObj?.nome || 'Serviço')

    const totalDuracao = hasMultiple
      ? agServicos.reduce((acc, as) => acc + (as.duracao_no_momento_minutos || as.servicos?.duracao_minutos || 0), 0)
      : (servicoObj?.duracao_minutos ?? null)

    const precoFinal =
      b.valor_cobrado !== null && b.valor_cobrado !== undefined && Number(b.valor_cobrado) > 0
        ? Number(b.valor_cobrado)
        : hasMultiple
        ? agServicos.reduce((acc, as) => acc + Number(as.preco_no_momento || as.servicos?.preco || 0), 0)
        : servicoObj?.preco !== undefined
        ? Number(servicoObj.preco)
        : null

    const hasDesativado = hasMultiple
      ? agServicos.some((as) => as.servicos?.ativo === false)
      : servicoObj?.ativo === false

    return {
      id: b.id,
      dataHoraInicio: b.data_hora_inicio,
      horaInicioStr: timeStr,
      clienteNome: clienteObj?.nome || 'Cliente sem nome',
      clienteTelefone: clienteObj?.telefone || null,
      servicoNome: resolvedServicoNome,
      servicoDuracaoMinutos: totalDuracao,
      servicoPreco: precoFinal,
      temServicoDesativado: Boolean(hasDesativado),
      rawBooking: b as any,
    }
  })

  // Próximo agendamento pendente a partir do momento atual (ou o primeiro de hoje se nenhum for futuro)
  const nowMs = Date.now()
  const nextPendingBooking =
    todayBookingsList.find((b) => new Date(b.dataHoraInicio).getTime() >= nowMs) || todayBookingsList[0] || null

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

export interface DashboardBookingCandidate {
  dataHoraInicio: string
  rawBooking?: { status?: string | null } | null
}

export function findNextConfirmedBooking<T extends DashboardBookingCandidate>(
  bookings: readonly T[],
  nowMs: number
): T | null {
  return bookings
    .filter((booking) => booking.rawBooking?.status === 'confirmado')
    .filter((booking) => new Date(booking.dataHoraInicio).getTime() >= nowMs)
    .sort((a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime())[0] || null
}

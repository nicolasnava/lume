export type BookingStatus = 'confirmado' | 'concluido' | 'cancelado' | 'no_show'

export function normalizeBookingStatus(status: string | null | undefined): BookingStatus {
  if (status === 'concluido' || status === 'cancelado' || status === 'no_show') return status
  return 'confirmado'
}

export function canEditBookingItems(status: string | null | undefined): boolean {
  return status === 'confirmado' || status === 'concluido'
}

export function bookingStatusLabel(status: string | null | undefined): string {
  switch (normalizeBookingStatus(status)) {
    case 'concluido': return 'Concluído'
    case 'cancelado': return 'Cancelado'
    case 'no_show': return 'Faltou (No-Show)'
    default: return 'Confirmado'
  }
}

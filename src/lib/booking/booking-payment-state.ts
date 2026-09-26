export function getCompletedBookingPaymentStatus(pago: boolean): 'pago' | 'pendente' {
  return pago ? 'pago' : 'pendente'
}

export function isStudioRevenueEligible(booking: {
  status: string
  pago: boolean
  status_pagamento?: string | null
}): boolean {
  return booking.status === 'concluido' || (
    booking.status === 'confirmado' &&
    (booking.pago || booking.status_pagamento === 'pago' || booking.status_pagamento === 'pago_no_local')
  )
}

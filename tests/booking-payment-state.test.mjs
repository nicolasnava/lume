import assert from 'node:assert/strict'
import { getCompletedBookingPaymentStatus, isStudioRevenueEligible } from '../src/lib/booking/booking-payment-state.ts'

assert.equal(getCompletedBookingPaymentStatus(true), 'pago')
assert.equal(getCompletedBookingPaymentStatus(false), 'pendente')
assert.equal(isStudioRevenueEligible({ status: 'concluido', pago: false, status_pagamento: 'pendente' }), true)
assert.equal(isStudioRevenueEligible({ status: 'confirmado', pago: false, status_pagamento: 'pago' }), true)
assert.equal(isStudioRevenueEligible({ status: 'confirmado', pago: false, status_pagamento: 'pago_no_local' }), true)
assert.equal(isStudioRevenueEligible({ status: 'confirmado', pago: true, status_pagamento: 'pendente' }), true)
assert.equal(isStudioRevenueEligible({ status: 'confirmado', pago: false, status_pagamento: 'pendente' }), false)
assert.equal(isStudioRevenueEligible({ status: 'cancelado', pago: true, status_pagamento: 'pago' }), false)
console.log('Booking payment state checks passed.')

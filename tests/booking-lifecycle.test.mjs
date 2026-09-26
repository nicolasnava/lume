import assert from 'node:assert/strict'
import { canCustomerMutateBooking } from '../src/lib/booking/booking-lifecycle.ts'

assert.equal(canCustomerMutateBooking('confirmado'), true)
assert.equal(canCustomerMutateBooking('cancelado'), false)
assert.equal(canCustomerMutateBooking('concluido'), false)
assert.equal(canCustomerMutateBooking('no_show'), false)
console.log('Booking lifecycle checks passed.')

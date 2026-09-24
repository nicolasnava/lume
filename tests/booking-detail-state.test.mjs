import assert from 'node:assert/strict'
import { bookingStatusLabel, canEditBookingItems, normalizeBookingStatus } from '../src/lib/booking-detail-state.ts'

assert.equal(normalizeBookingStatus('concluido'), 'concluido')
assert.equal(normalizeBookingStatus('confirmado'), 'confirmado')
assert.equal(canEditBookingItems('confirmado'), true)
assert.equal(canEditBookingItems('concluido'), true)
assert.equal(canEditBookingItems('cancelado'), false)
assert.equal(canEditBookingItems('no_show'), false)
assert.equal(bookingStatusLabel('concluido'), 'Concluído')
console.log('Booking detail state checks passed.')

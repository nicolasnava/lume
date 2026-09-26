import assert from 'node:assert/strict'
import {
  isBookingOwner,
  haveRequestedServicesWithOwner,
  isRequestedSlotAvailable,
} from '../src/lib/booking/security-policies.ts'

assert.equal(isBookingOwner('professional-1', 'professional-1'), true)
assert.equal(isBookingOwner('professional-1', 'professional-2'), false)
assert.equal(isBookingOwner(null, 'professional-1'), false)
assert.equal(isBookingOwner('professional-1', null), false)

assert.equal(
  haveRequestedServicesWithOwner('professional-1', ['service-1', 'service-2'], [
    { id: 'service-1', profissional_id: 'professional-1' },
    { id: 'service-2', profissional_id: 'professional-1' },
  ]),
  true
)
assert.equal(
  haveRequestedServicesWithOwner('professional-1', ['service-1', 'service-2'], [
    { id: 'service-1', profissional_id: 'professional-1' },
    { id: 'service-2', profissional_id: 'professional-2' },
  ]),
  false,
  'a service owned by another professional must not pass validation'
)
assert.equal(
  haveRequestedServicesWithOwner('professional-1', ['service-1', 'missing'], [
    { id: 'service-1', profissional_id: 'professional-1' },
  ]),
  false,
  'missing services must not pass validation'
)

const availableSlots = [
  { dataHoraInicio: '2026-09-25T12:00:00.000Z' },
  { dataHoraInicio: '2026-09-25T13:00:00.000Z' },
]
assert.equal(isRequestedSlotAvailable('2026-09-25T13:00:00.000Z', availableSlots), true)
assert.equal(isRequestedSlotAvailable('2026-09-25T13:01:00.000Z', availableSlots), false)
assert.equal(isRequestedSlotAvailable('not-a-date', availableSlots), false)

console.log('Booking security policy checks passed.')

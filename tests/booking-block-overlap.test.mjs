import assert from 'node:assert/strict'
import { isAvailabilityBlockOverlap } from '../src/lib/booking/availability-utils.ts'

const partialBlock = {
  data: '2026-09-28',
  data_fim: '2026-09-29',
  hora_inicio: '10:00:00',
  hora_fim: '11:00:00',
}

assert.equal(
  isAvailabilityBlockOverlap(partialBlock, '2026-09-28T13:30:00.000Z', '2026-09-28T14:00:00.000Z'),
  true,
  'a booking that overlaps a partial block on a later blocked day must be rejected',
)
assert.equal(
  isAvailabilityBlockOverlap(partialBlock, '2026-09-28T12:00:00.000Z', '2026-09-28T13:00:00.000Z'),
  false,
  'a booking ending before a partial block must remain available',
)
assert.equal(
  isAvailabilityBlockOverlap(
    { data: '2026-09-28', data_fim: '2026-09-29', hora_inicio: null, hora_fim: null },
    '2026-09-29T14:00:00.000Z',
    '2026-09-29T15:00:00.000Z',
  ),
  true,
  'an all-day block must reject bookings for every date in its inclusive range',
)
console.log('Booking block overlap checks passed.')

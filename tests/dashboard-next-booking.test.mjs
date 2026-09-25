import assert from 'node:assert/strict'
import { findNextConfirmedBooking } from '../src/lib/dashboard-next-booking.ts'

const now = Date.parse('2026-09-24T12:00:00-03:00')
const bookings = [
  { id: 'done', dataHoraInicio: '2026-09-24T15:00:00-03:00', rawBooking: { status: 'concluido' } },
  { id: 'cancelled', dataHoraInicio: '2026-09-24T13:00:00-03:00', rawBooking: { status: 'cancelado' } },
  { id: 'past', dataHoraInicio: '2026-09-24T11:00:00-03:00', rawBooking: { status: 'confirmado' } },
  { id: 'later', dataHoraInicio: '2026-09-24T14:00:00-03:00', rawBooking: { status: 'confirmado' } },
  { id: 'soon', dataHoraInicio: '2026-09-24T12:30:00-03:00', rawBooking: { status: 'confirmado' } },
]

assert.equal(findNextConfirmedBooking(bookings, now)?.id, 'soon')
assert.equal(findNextConfirmedBooking(bookings.slice(0, 3), now), null)
console.log('Dashboard next booking selection checks passed.')

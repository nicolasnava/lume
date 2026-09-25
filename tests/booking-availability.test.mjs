import assert from 'node:assert/strict'
import { hasAvailableSlotsForDate, isCurrentSlotResponse } from '../src/lib/booking/availability-utils.ts'

const base = {
  dateStr: '2026-09-28', // Monday
  durationMinutes: 60,
  nowMs: Date.parse('2026-09-24T12:00:00-03:00'),
  disponibilidades: [{ dia_semana: 1, hora_inicio: '09:00', hora_fim: '11:00', pausas: [] }],
  bloqueios: [],
  agendamentos: [],
}

assert.equal(hasAvailableSlotsForDate(base), true)
assert.equal(hasAvailableSlotsForDate({
  ...base,
  agendamentos: [
    { data_hora_inicio: '2026-09-28T09:00:00-03:00', data_hora_fim: '2026-09-28T11:00:00-03:00' },
  ],
}), false)
assert.equal(hasAvailableSlotsForDate({
  ...base,
  bloqueios: [{ data: '2026-09-28', data_fim: null, hora_inicio: null, hora_fim: null }],
}), false)
assert.equal(hasAvailableSlotsForDate({
  ...base,
  bloqueios: [{ data: '2026-09-28', data_fim: null, hora_inicio: '09:00', hora_fim: '11:00' }],
}), false)
const currentSlotRequest = {
  requestId: 4,
  latestRequestId: 4,
  requestedDate: '2026-09-28',
  selectedDate: '2026-09-28',
  requestedDurationMinutes: 60,
  currentDurationMinutes: 60,
  requestedContext: 'professional:booking:60',
  currentContext: 'professional:booking:60',
}
assert.equal(isCurrentSlotResponse(currentSlotRequest), true)
assert.equal(isCurrentSlotResponse({ ...currentSlotRequest, requestedDate: '2026-09-27' }), false)
assert.equal(isCurrentSlotResponse({ ...currentSlotRequest, latestRequestId: 5 }), false)
assert.equal(isCurrentSlotResponse({ ...currentSlotRequest, currentDurationMinutes: 90 }), false)
assert.equal(isCurrentSlotResponse({ ...currentSlotRequest, currentContext: 'other-booking' }), false)
console.log('Date slot availability checks passed.')

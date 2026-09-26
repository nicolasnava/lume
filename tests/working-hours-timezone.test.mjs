import assert from 'node:assert/strict'
import { isScheduleOpenAt } from '../src/lib/utils/local-time.ts'

const fridaySchedule = [
  { dia_semana: 5, hora_inicio: '08:00:00', hora_fim: '10:00:00' },
]

assert.equal(
  isScheduleOpenAt(fridaySchedule, new Date('2026-09-25T12:00:00.000Z'), 'America/Sao_Paulo'),
  true,
  'Friday at 09:00 in São Paulo is within the displayed hours even when the runtime timezone differs'
)
assert.equal(
  isScheduleOpenAt(fridaySchedule, new Date('2026-09-25T13:01:00.000Z'), 'America/Sao_Paulo'),
  false,
  'the state turns closed after the schedule ends in the configured timezone'
)
assert.equal(isScheduleOpenAt([], new Date('2026-09-25T12:00:00.000Z')), false)

console.log('Working-hours timezone checks passed.')

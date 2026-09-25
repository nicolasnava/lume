import assert from 'node:assert/strict'
import {
  canSelectBookingService,
  canSelectPackageServices,
  getLegacySingleServiceSnapshot,
  getHistoricalPackageSnapshot,
  mergeEditableServices,
  parseCouponDiscount,
  preserveServiceSnapshot,
} from '../src/lib/booking-editable-services.ts'

const active = [{ id: 'active', nome: 'Ativo', ativo: true }]
const historical = [
  { id: 'inactive-booked', nome: 'Histórico', ativo: false },
  { id: 'active', nome: 'Ativo antigo', ativo: false },
]

assert.deepEqual(mergeEditableServices(active, historical), [
  { id: 'active', nome: 'Ativo', ativo: true },
  { id: 'inactive-booked', nome: 'Histórico', ativo: false },
])
assert.equal(canSelectBookingService('active', false, new Set(['active'])), true)
assert.equal(canSelectBookingService('new-inactive', false, new Set(['active'])), false)
assert.equal(canSelectBookingService('new-active', true, new Set()), true)
assert.equal(canSelectPackageServices([{ id: 'active-included', ativo: true }], new Set(), false), true)
assert.equal(canSelectPackageServices([{ id: 'inactive-new', ativo: false }], new Set(), false), false)
assert.equal(canSelectPackageServices([{ id: 'inactive-historical', ativo: false }], new Set(['inactive-historical']), true), true)

const serviceSnapshot = preserveServiceSnapshot(
  { id: 'active', preco: 300, duracao_minutos: 90 },
  [{ servico_id: 'active', preco_no_momento: 120, duracao_no_momento_minutos: 45 }]
)
assert.deepEqual(serviceSnapshot, { id: 'active', preco: 120, duracao_minutos: 45 })

assert.equal(parseCouponDiscount('Desconto Cupom: -R$ 25.50'), 25.5)
assert.equal(parseCouponDiscount('Desconto Cupom: -R$ 1.250,00'), 1250)
assert.deepEqual(getHistoricalPackageSnapshot({
  chargedTotal: 260,
  couponDiscount: 20,
  originalExtraServices: [{ preco_no_momento: 40, duracao_no_momento_minutos: 30 }],
  originalProducts: [{ preco_no_momento: 10 }],
  bookingDurationMinutes: 100,
}), { price: 230, durationMinutes: 70 })
assert.deepEqual(getLegacySingleServiceSnapshot({
  serviceId: 'legacy-service',
  bookingServiceId: 'legacy-service',
  hasServiceSnapshots: false,
  originalProductTotal: 0,
  hasCombo: false,
  chargedTotal: 90,
  couponDiscount: 10,
  bookingDurationMinutes: 45,
}), { price: 100, durationMinutes: 45 })
assert.deepEqual(getLegacySingleServiceSnapshot({
  serviceId: 'legacy-service',
  bookingServiceId: 'legacy-service',
  hasServiceSnapshots: false,
  originalProductTotal: 50,
  hasCombo: false,
  chargedTotal: 150,
  couponDiscount: 10,
  bookingDurationMinutes: 45,
}), { price: 110, durationMinutes: 45 })
assert.deepEqual(getLegacySingleServiceSnapshot({
  serviceId: 'legacy-service',
  bookingServiceId: 'legacy-service',
  hasServiceSnapshots: false,
  originalProductTotal: 50,
  hasCombo: false,
  chargedTotal: 90,
  couponDiscount: 0,
  bookingDurationMinutes: 45,
}), { price: 40, durationMinutes: 45 })
console.log('Historical booking service edit checks passed.')

import assert from 'node:assert/strict'
import { buildBookingReview } from '../src/lib/booking-review.ts'

const summary = buildBookingReview({
  clientName: 'Ana Silva',
  clientPhone: '(11) 99999-0000',
  date: '2026-09-23',
  time: '14:30',
  paymentMethod: 'pix',
  package: { id: 'p1', name: 'Combo Glow', price: 150, durationMinutes: 90, services: ['Limpeza', 'Máscara'] },
  services: [{ id: 's1', name: 'Design de sobrancelha', price: 45, durationMinutes: 30 }],
  products: [{ id: 'i1', name: 'Sérum', price: 25 }],
})

assert.deepEqual(summary.items.map(({ type, name, price }) => ({ type, name, price })), [
  { type: 'package', name: 'Combo Glow', price: 150 },
  { type: 'service', name: 'Design de sobrancelha', price: 45 },
  { type: 'product', name: 'Sérum', price: 25 },
])
assert.equal(summary.totalPrice, 220)
assert.equal(summary.totalDurationMinutes, 120)
assert.deepEqual(summary.packageServices, ['Limpeza', 'Máscara'])
console.log('Booking review summary checks passed.')

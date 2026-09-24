import assert from 'node:assert/strict'
import { toggleBookingEditSection } from '../src/lib/booking-detail-ui.ts'

assert.equal(toggleBookingEditSection(null, 'services'), 'services')
assert.equal(toggleBookingEditSection('services', 'services'), null)
assert.equal(toggleBookingEditSection('services', 'packages'), 'packages')
assert.equal(toggleBookingEditSection('products', 'services'), 'services')
console.log('Booking detail dropdown interaction checks passed.')

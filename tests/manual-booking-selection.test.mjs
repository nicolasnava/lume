import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { toggleSelectionPanel } from '../src/lib/manual-booking-selection.ts'

const source = readFileSync(new URL('../src/lib/manual-booking-selection.ts', import.meta.url), 'utf8')
assert.match(source, /ManualBookingSelectionPanel = 'services' \| 'packages' \| 'products'/)
assert.equal(toggleSelectionPanel(null, 'services'), 'services')
assert.equal(toggleSelectionPanel('services', 'packages'), 'packages')
assert.equal(toggleSelectionPanel('packages', 'products'), 'products')
assert.equal(toggleSelectionPanel('products', 'products'), null)
console.log('Manual booking integrated selection checks passed.')

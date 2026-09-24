import assert from 'node:assert/strict'
import { getStudioDashboardView } from '../src/lib/studio-dashboard-access.ts'
import { toggleSelectionPanel } from '../src/lib/manual-booking-selection.ts'

assert.equal(getStudioDashboardView('dona', 'mensal'), 'owner')
assert.equal(getStudioDashboardView('nenhum', 'mensal'), 'upgrade')
assert.equal(getStudioDashboardView('nenhum', 'studio'), 'create')
assert.equal(getStudioDashboardView('membro', 'mensal'), 'member')
assert.equal(toggleSelectionPanel(null, 'packages'), 'packages')
assert.equal(toggleSelectionPanel('packages', 'products'), 'products')
assert.equal(toggleSelectionPanel('products', 'products'), null)
console.log('Studio dashboard access checks passed.')

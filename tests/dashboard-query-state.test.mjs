import assert from 'node:assert/strict'
import { getDashboardQueryState } from '../src/lib/dashboard-query-state.ts'

assert.equal(getDashboardQueryState(null), 'ready')
assert.equal(getDashboardQueryState(undefined), 'ready')
assert.equal(getDashboardQueryState({ message: 'column does not exist' }), 'error')
console.log('Dashboard query state checks passed.')

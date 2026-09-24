import test from 'node:test'
import assert from 'node:assert/strict'
import { getServiceCounts, getClientVisibleItems, shouldConfirmItemChange, serviceChangePreferenceKey } from '../src/lib/service-management.ts'

test('service counts include every service and split active from inactive', () => {
  assert.deepEqual(getServiceCounts([
    { id: 'a', ativo: true },
    { id: 'b', ativo: false },
    { id: 'c', ativo: null },
  ]), { total: 3, active: 2, inactive: 1 })
})

test('client preview excludes inactive services, packages, and counter items', () => {
  assert.deepEqual(getClientVisibleItems([
    { id: 'active', ativo: true },
    { id: 'default-active', ativo: null },
    { id: 'inactive', ativo: false },
  ]).map((item) => item.id), ['active', 'default-active'])
})

test('item confirmation is skipped only when the professional opted out in this session', () => {
  assert.equal(shouldConfirmItemChange(false), true)
  assert.equal(shouldConfirmItemChange(true), false)
})

test('confirmation preference is scoped to a professional', () => {
  assert.equal(serviceChangePreferenceKey('pro-123'), 'lume:booking-item-confirmation:pro-123')
})

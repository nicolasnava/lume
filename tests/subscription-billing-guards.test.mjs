import assert from 'node:assert/strict'
import { hasFinancialCouponDiscount, getStoredPixCode } from '../src/lib/subscription/billing-guards.ts'

assert.equal(hasFinancialCouponDiscount({ desconto_pct: 0, desconto_valor: 0 }), false)
assert.equal(hasFinancialCouponDiscount({ desconto_pct: 10 }), true)
assert.equal(hasFinancialCouponDiscount({ desconto_valor: 5 }), true)
assert.equal(getStoredPixCode(null), null)
assert.equal(getStoredPixCode('   '), null)
assert.equal(getStoredPixCode('  codigo-pix-real  '), 'codigo-pix-real')

console.log('Subscription billing guard checks passed.')

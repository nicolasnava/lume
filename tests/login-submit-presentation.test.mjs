import assert from 'node:assert/strict'
import { getLoginSubmitPresentation } from '../src/lib/login-submit-presentation.ts'

assert.deepEqual(getLoginSubmitPresentation('idle'), {
  label: 'Entrar na conta',
  disabled: false,
  busy: false,
})
assert.deepEqual(getLoginSubmitPresentation('checking'), {
  label: 'Verificando acesso',
  disabled: true,
  busy: true,
})
assert.deepEqual(getLoginSubmitPresentation('success'), {
  label: 'Acesso confirmado',
  disabled: true,
  busy: false,
})

console.log('Login submit state checks passed.')

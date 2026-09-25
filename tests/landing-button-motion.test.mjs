import assert from 'node:assert/strict'
import { LANDING_BUTTON_TRANSITION_MS, LANDING_BUTTON_TRANSITION_SECONDS } from '../src/lib/landing-button-motion.ts'

assert.equal(LANDING_BUTTON_TRANSITION_MS, 1400)
assert.equal(LANDING_BUTTON_TRANSITION_SECONDS, 1.4)
console.log('Landing CTA motion duration checks passed.')

import assert from 'node:assert/strict'
import { transitionBookingConfirmation } from '../src/lib/manual-booking-confirmation.ts'
import { LANDING_BUTTON_TRANSITION_MS } from '../src/lib/landing-button-motion.ts'

assert.equal(transitionBookingConfirmation('editing', 'submit'), 'reviewing')
assert.equal(transitionBookingConfirmation('reviewing', 'back'), 'editing')
assert.equal(transitionBookingConfirmation('reviewing', 'confirm'), 'saving')
assert.equal(transitionBookingConfirmation('saving', 'success'), 'editing')
assert.equal(transitionBookingConfirmation('saving', 'failure'), 'reviewing')
assert.equal(LANDING_BUTTON_TRANSITION_MS, 1000)
console.log('Booking confirmation and landing animation checks passed.')

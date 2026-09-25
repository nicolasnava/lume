import assert from 'node:assert/strict'
import { isStandalonePwa } from '../src/lib/pwa-launch.ts'

assert.equal(isStandalonePwa(true, false), true, 'Chromium standalone mode launches the reveal')
assert.equal(isStandalonePwa(false, true), true, 'iOS home-screen mode launches the reveal')
assert.equal(isStandalonePwa(false, false), false, 'a regular browser tab skips the reveal')
assert.equal(isStandalonePwa(true, true), true, 'both standalone signals remain supported')

console.log('PWA launch mode checks passed.')

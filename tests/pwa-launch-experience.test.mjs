import assert from 'node:assert/strict'
import { getPwaLaunchExperienceMode } from '../src/lib/pwa-launch-experience.ts'

assert.equal(
  getPwaLaunchExperienceMode({ standalone: true, prefersReducedMotion: false, webglAvailable: true }),
  'immersive',
  'an installed app with WebGL gets the full three-dimensional reveal'
)
assert.equal(
  getPwaLaunchExperienceMode({ standalone: false, prefersReducedMotion: false, webglAvailable: true }),
  'skip',
  'regular browser visits do not load the launch scene'
)
assert.equal(
  getPwaLaunchExperienceMode({ standalone: true, prefersReducedMotion: true, webglAvailable: true }),
  'skip',
  'reduced-motion preferences bypass the cinematic reveal'
)
assert.equal(
  getPwaLaunchExperienceMode({ standalone: true, prefersReducedMotion: false, webglAvailable: false }),
  'cinematic-fallback',
  'installed apps without WebGL retain the branded motion fallback'
)

console.log('PWA launch experience checks passed.')

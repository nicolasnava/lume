import assert from 'node:assert/strict'
import { platformAnnouncementDismissalKey, shouldShowPlatformAnnouncement } from '../src/lib/platform-announcement-frequency.ts'

const now = new Date('2026-09-23T12:00:00.000Z')

assert.equal(shouldShowPlatformAnnouncement('cada_acesso', false), true)
assert.equal(shouldShowPlatformAnnouncement('cada_acesso', true), false)
assert.equal(shouldShowPlatformAnnouncement('uma_vez_por_dia', false), true)
assert.equal(shouldShowPlatformAnnouncement('uma_vez_por_dia', true), false)
assert.equal(shouldShowPlatformAnnouncement('somente_sino', false), false)
assert.equal(platformAnnouncementDismissalKey('aviso-1', 'cada_acesso', now), 'lume_dismissed_aviso_session_aviso-1')
assert.equal(platformAnnouncementDismissalKey('aviso-1', 'uma_vez_por_dia', now), 'lume_dismissed_aviso_day_aviso-1_2026-09-23')
assert.equal(platformAnnouncementDismissalKey('aviso-1', 'somente_sino', now), null)
console.log('Platform announcement frequency checks passed.')

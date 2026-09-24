export type PlatformAnnouncementFrequency = 'cada_acesso' | 'uma_vez_por_dia' | 'somente_sino'

export function shouldShowPlatformAnnouncement(
  frequency: PlatformAnnouncementFrequency | null | undefined,
  dismissed: boolean
): boolean {
  const configuredFrequency = frequency || 'uma_vez_por_dia'
  if (configuredFrequency === 'somente_sino' || dismissed) return false
  return true
}

export function platformAnnouncementDismissalKey(
  id: string,
  frequency: PlatformAnnouncementFrequency | null | undefined,
  now: Date = new Date()
): string | null {
  const configuredFrequency = frequency || 'uma_vez_por_dia'
  if (configuredFrequency === 'somente_sino') return null
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return configuredFrequency === 'cada_acesso'
    ? `lume_dismissed_aviso_session_${id}`
    : `lume_dismissed_aviso_day_${id}_${date}`
}

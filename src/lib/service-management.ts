export interface ServiceStatusItem {
  id: string
  ativo?: boolean | null
}

export function getServiceCounts<T extends ServiceStatusItem>(items: T[]) {
  const active = items.filter((item) => item.ativo !== false).length
  return { total: items.length, active, inactive: items.length - active }
}

export function getClientVisibleItems<T extends ServiceStatusItem>(items: T[]) {
  return items.filter((item) => item.ativo !== false)
}

export function shouldConfirmItemChange(skipConfirmationForSession: boolean) {
  return !skipConfirmationForSession
}

export function serviceChangePreferenceKey(professionalId: string) {
  return `lume:booking-item-confirmation:${professionalId}`
}

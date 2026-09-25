export interface EditableServiceReference {
  id: string
  ativo?: boolean | null
}

export function mergeEditableServices<T extends EditableServiceReference>(
  activeServices: readonly T[],
  servicesOnBooking: readonly T[]
): T[] {
  const merged = new Map<string, T>()
  activeServices.forEach((service) => merged.set(service.id, service))
  servicesOnBooking.forEach((service) => {
    if (!merged.has(service.id)) merged.set(service.id, service)
  })
  return [...merged.values()]
}

export function canSelectBookingService(
  serviceId: string,
  isActive: boolean,
  originalBookingServiceIds: ReadonlySet<string>
): boolean {
  return isActive || originalBookingServiceIds.has(serviceId)
}

export function canSelectPackageServices(
  packageServices: readonly EditableServiceReference[],
  originalBookingServiceIds: ReadonlySet<string>,
  isCurrentPackage: boolean
): boolean {
  return packageServices.every((service) =>
    service.ativo !== false || (isCurrentPackage && originalBookingServiceIds.has(service.id))
  )
}

export interface BookingServiceSnapshot {
  servico_id: string | null
  preco_no_momento: number | null
  duracao_no_momento_minutos: number | null
}

export function preserveServiceSnapshot<T extends { id: string; preco: number; duracao_minutos: number }>(
  service: T,
  snapshots: readonly BookingServiceSnapshot[]
): T {
  const snapshot = snapshots.find((item) => item.servico_id === service.id)
  if (!snapshot) return service
  return {
    ...service,
    preco: Number(snapshot.preco_no_momento ?? service.preco),
    duracao_minutos: Number(snapshot.duracao_no_momento_minutos ?? service.duracao_minutos),
  }
}

export function getLegacySingleServiceSnapshot(input: {
  serviceId: string
  bookingServiceId: string | null
  hasServiceSnapshots: boolean
  originalProductTotal: number
  hasCombo: boolean
  chargedTotal: number | null
  couponDiscount: number
  bookingDurationMinutes: number
}) {
  if (
    input.hasServiceSnapshots ||
    input.hasCombo ||
    !input.bookingServiceId ||
    input.serviceId !== input.bookingServiceId ||
    input.chargedTotal === null ||
    input.bookingDurationMinutes <= 0
  ) return null

  return {
    price: Math.max(0, input.chargedTotal + input.couponDiscount - input.originalProductTotal),
    durationMinutes: input.bookingDurationMinutes,
  }
}

export interface BookingPackageSnapshotInput {
  chargedTotal: number
  couponDiscount: number
  originalExtraServices: readonly { preco_no_momento: number | null; duracao_no_momento_minutos: number | null }[]
  originalProducts: readonly { preco_no_momento: number }[]
  bookingDurationMinutes: number
}

export function getHistoricalPackageSnapshot(input: BookingPackageSnapshotInput) {
  const extrasTotal = input.originalExtraServices.reduce((sum, item) => sum + Number(item.preco_no_momento || 0), 0)
  const extrasDuration = input.originalExtraServices.reduce((sum, item) => sum + Number(item.duracao_no_momento_minutos || 0), 0)
  const productsTotal = input.originalProducts.reduce((sum, item) => sum + Number(item.preco_no_momento || 0), 0)
  return {
    price: Math.max(0, input.chargedTotal + input.couponDiscount - extrasTotal - productsTotal),
    durationMinutes: Math.max(0, input.bookingDurationMinutes - extrasDuration),
  }
}

export function parseCouponDiscount(observation: string | null | undefined): number {
  const match = observation?.match(/Desconto Cupom:\s*-?R\$\s*([\d.,]+)/i)
  if (!match) return 0
  const raw = match[1]
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

export function isBookingOwner(
  authenticatedProfessionalId: string | null | undefined,
  bookingProfessionalId: string | null | undefined
): boolean {
  return Boolean(
    authenticatedProfessionalId &&
    bookingProfessionalId &&
    authenticatedProfessionalId === bookingProfessionalId
  )
}

export function haveRequestedServicesWithOwner(
  professionalId: string,
  requestedServiceIds: readonly string[],
  services: readonly { id: string; profissional_id: string }[]
): boolean {
  const requested = new Set(requestedServiceIds)
  return requested.size === requestedServiceIds.length &&
    services.length === requested.size &&
    services.every((service) => service.profissional_id === professionalId && requested.has(service.id))
}

export function isRequestedSlotAvailable(
  requestedStart: string,
  availableSlots: readonly { dataHoraInicio: string }[]
): boolean {
  const requestedTime = new Date(requestedStart).getTime()
  return Number.isFinite(requestedTime) && availableSlots.some((slot) => {
    return new Date(slot.dataHoraInicio).getTime() === requestedTime
  })
}

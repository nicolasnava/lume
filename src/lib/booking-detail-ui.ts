export type BookingEditSection = 'services' | 'packages' | 'products'

export function toggleBookingEditSection(
  currentSection: BookingEditSection | null,
  nextSection: BookingEditSection,
): BookingEditSection | null {
  return currentSection === nextSection ? null : nextSection
}

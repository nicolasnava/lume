export type ManualBookingSelectionPanel = 'services' | 'packages' | 'products'

export function toggleSelectionPanel(
  current: ManualBookingSelectionPanel | null,
  requested: ManualBookingSelectionPanel,
): ManualBookingSelectionPanel | null {
  return current === requested ? null : requested
}

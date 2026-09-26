/** Customer-facing cancel and reschedule operations are only valid while confirmed. */
export function canCustomerMutateBooking(status: string): boolean {
  return status === 'confirmado'
}

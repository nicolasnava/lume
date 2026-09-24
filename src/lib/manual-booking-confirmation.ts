export type BookingConfirmationStage = 'editing' | 'reviewing' | 'saving'
export type BookingConfirmationEvent = 'submit' | 'back' | 'confirm' | 'success' | 'failure'

export function transitionBookingConfirmation(
  stage: BookingConfirmationStage,
  event: BookingConfirmationEvent,
): BookingConfirmationStage {
  if (stage === 'editing' && event === 'submit') return 'reviewing'
  if (stage === 'reviewing' && event === 'back') return 'editing'
  if (stage === 'reviewing' && event === 'confirm') return 'saving'
  if (stage === 'saving' && event === 'success') return 'editing'
  if (stage === 'saving' && event === 'failure') return 'reviewing'
  return stage
}

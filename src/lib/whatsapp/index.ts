export interface WhatsAppMessageInput {
  phone: string
  message: string
}

export async function sendWhatsAppMessage(input: WhatsAppMessageInput): Promise<{ success: boolean }> {
  if (!input) return { success: false }
  return { success: true }
}

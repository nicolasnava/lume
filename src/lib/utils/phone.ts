/**
 * Utilitário para formatação consistente de números de telefone e WhatsApp em todo o Lumê.
 * Formata números brasileiros nos padrões:
 * - 11 dígitos: (XX) XXXXX-XXXX (celular)
 * - 10 dígitos: (XX) XXXX-XXXX (fixo)
 * - Com DDI 55: remove ou formata adequadamente
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''

  // Extrai apenas os números
  let digits = phone.replace(/\D/g, '')

  if (!digits) return ''

  // Se tiver DDI 55 no início (ex: 5511965758454), remove o 55 se o restante tiver 10 ou 11 dígitos
  if (digits.length === 13 && digits.startsWith('55')) {
    digits = digits.slice(2)
  } else if (digits.length === 12 && digits.startsWith('55')) {
    digits = digits.slice(2)
  }

  // 11 dígitos: celular com 9 (ex: 11 96575-8454)
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  // 10 dígitos: fixo ou celular antigo (ex: 11 4545-4546)
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  // Formatações intermediárias enquanto digita ou números incompletos
  if (digits.length > 2 && digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length > 6 && digits.length < 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return phone
}

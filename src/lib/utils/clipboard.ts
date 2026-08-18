/**
 * Utilitário seguro e universal para cópia de texto para a área de transferência.
 * Funciona em ambientes HTTPS, HTTP, navegadores mobile e desktop com fallback para execCommand.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // 1. Tentar API nativa moderna se disponível e em contexto seguro
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback para o método legado abaixo
    }
  }

  // 2. Fallback universal usando elemento textarea temporário
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.setAttribute('readonly', '')
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    textArea.remove()
    return successful
  } catch (err) {
    console.error('[copyToClipboard] Falha ao copiar texto:', err)
    return false
  }
}

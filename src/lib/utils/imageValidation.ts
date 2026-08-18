/**
 * Validação de Assinatura Binária (Magic Bytes) para Imagens.
 * Garante que o arquivo enviado seja genuinamente uma imagem válida (JPEG, PNG, WebP ou GIF)
 * antes de transmiti-lo para o Supabase Storage.
 */

export interface ImageValidationResult {
  valid: boolean
  detectedType?: 'jpeg' | 'png' | 'webp' | 'gif'
  error?: string
}

export async function validateImageMagicBytes(file: File): Promise<ImageValidationResult> {
  // Limite de 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'O arquivo excede o limite máximo permitido de 5 MB.',
    }
  }

  if (file.size < 12) {
    return {
      valid: false,
      error: 'Arquivo inválido ou corrompido.',
    }
  }

  try {
    const slice = file.slice(0, 16)
    const arrayBuffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // 1. JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { valid: true, detectedType: 'jpeg' }
    }

    // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { valid: true, detectedType: 'png' }
    }

    // 3. GIF: 47 49 46 38 ('GIF8')
    if (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38
    ) {
      return { valid: true, detectedType: 'gif' }
    }

    // 4. WebP: 52 49 46 46 (RIFF) + 57 45 42 50 (WEBP) nos bytes 8..11
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { valid: true, detectedType: 'webp' }
    }

    return {
      valid: false,
      error: 'Formato de arquivo incompatível. Apenas imagens JPEG, PNG, WebP e GIF são permitidas.',
    }
  } catch (err) {
    console.error('[validateImageMagicBytes] Falha ao inspecionar bytes:', err)
    return {
      valid: false,
      error: 'Não foi possível validar o arquivo de imagem selecionado.',
    }
  }
}

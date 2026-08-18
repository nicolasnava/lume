/**
 * Retorna a cor de texto ideal ('#FFFFFF' ou '#4A3F5C') com base na luminância relativa (WCAG).
 * Garante que elementos com fundo personalizado (como botões e badges) mantenham texto legível.
 */
export function getContrastingTextColor(hexColor: string, defaultDarkColor = '#4A3F5C'): string {
  if (!hexColor) return defaultDarkColor

  // Remover '#' inicial se presente
  const hex = hexColor.replace(/^#/, '')

  let r = 0
  let g = 0
  let b = 0

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    return defaultDarkColor
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return defaultDarkColor
  }

  // Normalização sRGB -> Linear (WCAG 2.0)
  const sRGB = [r, g, b].map((v) => {
    const val = v / 255
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  // Cálculo da luminância relativa L
  const luminance = 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]

  // Se luminância for alta (fundo claro), usar texto escuro; se for baixa (fundo escuro), usar texto branco (#FFFFFF)
  return luminance > 0.45 ? defaultDarkColor : '#FFFFFF'
}

/**
 * Converte uma cor HEX em uma versão clara e sutil (tint) com opacidade controlada ou mix pastel.
 * Usada para fundos sutis de cards e badges sem poluir nem escurecer a página inteira.
 */
export function getLightTint(hexColor: string, opacityPercent = 14): string {
  if (!hexColor) return '#FAF7F5'
  const hex = hexColor.replace(/^#/, '')
  let r = 184
  let g = 169
  let b = 217

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) || 184
    g = parseInt(hex[1] + hex[1], 16) || 169
    b = parseInt(hex[2] + hex[2], 16) || 217
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) || 184
    g = parseInt(hex.substring(2, 4), 16) || 169
    b = parseInt(hex.substring(4, 6), 16) || 217
  }

  return `rgba(${r}, ${g}, ${b}, ${opacityPercent / 100})`
}

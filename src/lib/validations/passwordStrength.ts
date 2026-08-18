export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3
  label: string
  colorClass: string
  bgClass: string
}

/**
 * Calcula a força da senha de acordo com os critérios do produto:
 * - Fraca (1/3, vermelho): < 8 caracteres ou apenas letras minúsculas.
 * - Média (2/3, amarelo): >= 8 caracteres e combinação de (maiúsculas e minúsculas) OU (letras e números).
 * - Forte (3/3, verde): >= 8 caracteres com maiúsculas, minúsculas, números e caractere especial.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: '', colorClass: '', bgClass: '' }
  }

  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  // 1. Forte: min 8 chars + maiúsculas + minúsculas + números + especial
  if (hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial) {
    return {
      score: 3,
      label: 'Senha forte',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-500',
    }
  }

  // 2. Média: min 8 chars + (maiúsculas e minúsculas) OU (letras e números)
  const hasUpperAndLower = hasUpper && hasLower
  const hasLetterAndNumber = (hasUpper || hasLower) && hasNumber

  if (hasMinLength && (hasUpperAndLower || hasLetterAndNumber)) {
    return {
      score: 2,
      label: 'Senha média',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-500',
    }
  }

  // 3. Fraca: < 8 chars ou apenas letras minúsculas
  return {
    score: 1,
    label: 'Senha fraca',
    colorClass: 'text-red-600',
    bgClass: 'bg-red-500',
  }
}

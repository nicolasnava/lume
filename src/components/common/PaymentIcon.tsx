'use client'

import { CreditCard, Banknote } from 'lucide-react'

interface PaymentIconProps {
  method?: string | null
  className?: string
}

export function PixIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M112.5 107.8L211.7 207c24.6 24.6 64.4 24.6 89 0l98.8-98.8c12.2-12.2 32.1-12.2 44.3 0l38.2 38.2c12.2 12.2 12.2 32.1 0 44.3L383.2 290c-24.6 24.6-24.6 64.4 0 89l98.8 98.8c12.2 12.2 12.2 32.1 0 44.3l-38.2 38.2c-12.2 12.2-32.1 12.2-44.3 0L300.7 361.5c-24.6-24.6-64.4-24.6-89 0l-98.8 98.8c-12.2 12.2-32.1 12.2-44.3 0l-38.2-38.2c-12.2-12.2-12.2-32.1 0-44.3L129.2 279c24.6-24.6 24.6-64.4 0-89L30.4 91.2c-12.2-12.2-12.2-32.1 0-44.3l38.2-38.2c12.2-12.2 32.1-12.2 43.9.1z" />
    </svg>
  )
}

export default function PaymentIcon({ method, className = 'h-4 w-4' }: PaymentIconProps) {
  if (!method) return null

  const norm = method.toLowerCase()

  if (norm === 'pix') {
    return <PixIcon className={className} />
  }

  if (norm === 'cartao' || norm === 'cartao_credito' || norm === 'cartao_debito') {
    return <CreditCard className={className} />
  }

  if (norm === 'dinheiro') {
    return <Banknote className={className} />
  }

  return <Banknote className={className} />
}

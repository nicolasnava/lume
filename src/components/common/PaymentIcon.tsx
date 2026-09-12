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
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="86"
        y="86"
        width="340"
        height="340"
        rx="72"
        transform="rotate(45 256 256)"
        fill="#32BCAD"
      />
      <path
        d="M 130 148 C 196 204, 226 240, 256 242 C 286 240, 316 204, 382 148"
        stroke="white"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 130 364 C 196 308, 226 272, 256 270 C 286 272, 316 308, 382 364"
        stroke="white"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 148 130 C 204 196, 240 226, 242 256 C 240 286, 204 316, 148 382"
        stroke="white"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 364 130 C 308 196, 272 226, 270 256 C 272 286, 308 316, 364 382"
        stroke="white"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
      />
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

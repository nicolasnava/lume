'use client'

import { motion, useReducedMotion } from 'motion/react'

interface BillingCycleToggleProps {
  value: 'monthly' | 'annual'
  onChange: (value: 'monthly' | 'annual') => void
}

export default function BillingCycleToggle({ value, onChange }: BillingCycleToggleProps) {
  const shouldReduceMotion = useReducedMotion()
  const indicatorTransition = shouldReduceMotion
    ? { layout: { duration: 0 } }
    : { layout: { type: 'spring' as const, duration: 0.28, bounce: 0.22 } }

  return (
    <div
      className="lume-billing-toggle relative inline-flex w-full max-w-[360px] items-center rounded-full border border-[#E8DFD8] bg-white p-1.5 shadow-sm shadow-[#3D2E4D]/5"
      data-active={value}
      role="group"
      aria-label="Ciclo de cobrança"
    >
      <button
        type="button"
        aria-pressed={value === 'monthly'}
        onClick={() => onChange('monthly')}
        className={`lume-billing-option relative z-10 flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-xs font-bold transition-colors duration-200 sm:text-sm ${value === 'monthly' ? 'text-white' : 'text-[#6B5E7A] hover:text-[#3D2E4D]'}`}
      >
        {value === 'monthly' && <motion.span layoutId="lume-billing-cycle-active" aria-hidden="true" className="absolute inset-0 z-0 rounded-full bg-[#3D2E4D] shadow-md shadow-[#3D2E4D]/20" transition={indicatorTransition} />}
        <span className="relative z-10">Mensal</span>
      </button>
      <button
        type="button"
        aria-pressed={value === 'annual'}
        onClick={() => onChange('annual')}
        className={`lume-billing-option relative z-10 flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold transition-colors duration-200 sm:gap-2 sm:text-sm ${value === 'annual' ? 'text-white' : 'text-[#6B5E7A] hover:text-[#3D2E4D]'}`}
      >
        {value === 'annual' && <motion.span layoutId="lume-billing-cycle-active" aria-hidden="true" className="absolute inset-0 z-0 rounded-full bg-[#3D2E4D] shadow-md shadow-[#3D2E4D]/20" transition={indicatorTransition} />}
        <span className="relative z-10">Anual</span>
        <span className={`relative z-10 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200 sm:text-[10px] ${value === 'annual' ? 'text-white/80' : 'text-[#8C5383]'}`}>
          2 meses grátis
        </span>
      </button>
    </div>
  )
}

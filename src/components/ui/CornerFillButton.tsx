import React, { type CSSProperties } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LANDING_BUTTON_TRANSITION_MS } from '@/lib/landing-button-motion'

export type CornerFillVariant = 'dark' | 'light' | 'pill'

export interface CornerFillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string
  target?: React.HTMLAttributeAnchorTarget
  rel?: string
  variant?: CornerFillVariant
  fillClassName?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export const CornerFillButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  CornerFillButtonProps
>(
  (
    {
      href,
      target,
      rel,
      variant = 'dark',
      className,
      fillClassName,
      icon,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const variantClasses: Record<CornerFillVariant, string> = {
      dark: 'lume-corner-fill-btn-dark bg-[#3D2E4D] text-white border-white/10 shadow-xl shadow-[#3D2E4D]/20',
      light: 'lume-corner-fill-btn-light bg-white/90 text-[#3D2E4D] border-[#D8C7BC] shadow-sm backdrop-blur-xs',
      pill: 'lume-corner-fill-btn-pill bg-[#FAF0F5] text-[#8C5383] border-[#E8DFD8] shadow-2xs',
    }

    const defaultFillColors: Record<CornerFillVariant, string> = {
      dark: 'bg-white',
      light: 'bg-[#3D2E4D]',
      pill: 'bg-[#3D2E4D]',
    }

    const baseClasses = cn(
      'lume-corner-fill-btn group inline-flex items-center justify-center rounded-full border px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold cursor-pointer whitespace-nowrap select-none transition-[box-shadow,border-color] duration-200 ease-out',
      variantClasses[variant],
      className
    )
    const motionStyle = {
      ...style,
      '--lume-button-duration': `${LANDING_BUTTON_TRANSITION_MS}ms`,
    } as CSSProperties

    const content = (
      <>
        {/* Círculo expansivo com timing puramente em CSS */}
        <span
          aria-hidden="true"
          className={cn(
            'corner-fill-circle',
            fillClassName || defaultFillColors[variant]
          )}
        />

        {/* Conteúdo com interpolação de cor 100% contínua e suave */}
        <span className="corner-fill-content">
          <span className="corner-fill-text">
            {children}
          </span>

          {icon && (
            <span aria-hidden="true" className="corner-fill-arrow shrink-0">
              {icon}
            </span>
          )}
        </span>
      </>
    )

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          className={baseClasses}
          style={motionStyle}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        type="button"
        className={baseClasses}
        style={motionStyle}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      >
        {content}
      </button>
    )
  }
)

CornerFillButton.displayName = 'CornerFillButton'

export default CornerFillButton

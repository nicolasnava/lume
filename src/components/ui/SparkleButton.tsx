'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface SparkleButtonProps {
  href: string
  children: ReactNode
  className?: string
  compact?: boolean
}

export default function SparkleButton({ href, children, className = '', compact = false }: SparkleButtonProps) {
  return (
    <Link
      href={href}
      className={`group/sparkle relative isolate inline-flex items-center justify-center overflow-hidden rounded-full font-bold transition-[transform,box-shadow,background-color,color] duration-200 ease-out active:scale-[0.97] ${
        compact ? 'px-2.5 py-1 text-[10px] sm:text-[11px]' : 'px-5 py-2.5 text-xs'
      } ${className}`}
    >
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,.5)_48%,transparent_76%)] opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover/sparkle:translate-x-2 group-hover/sparkle:opacity-100" />
      <span>{children}</span>
      <span className="absolute left-[14%] top-[18%] h-1 w-1 rounded-full bg-current opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover/sparkle:-translate-y-1 group-hover/sparkle:opacity-60" />
      <span className="absolute bottom-[18%] right-[12%] h-1.5 w-1.5 rotate-45 border border-current opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover/sparkle:translate-y-0.5 group-hover/sparkle:rotate-90 group-hover/sparkle:opacity-50" />
    </Link>
  )
}

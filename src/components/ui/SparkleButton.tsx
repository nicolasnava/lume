'use client'

import Link from 'next/link'
import { useRef, type PointerEvent, type ReactNode } from 'react'
import styles from './SparkleButton.module.css'

interface SparkleButtonProps {
  href: string
  children: ReactNode
  className?: string
  compact?: boolean
}

export default function SparkleButton({ href, children, className = '', compact = false }: SparkleButtonProps) {
  const light = useRef<HTMLSpanElement>(null)
  const moveLight = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (light.current) light.current.style.transform = `translate3d(${event.clientX - bounds.left - bounds.width / 2}px, ${event.clientY - bounds.top - bounds.height / 2}px, 0)`
  }
  return (
    <Link
      href={href}
      onPointerMove={moveLight}
      className={`${styles.button} ${compact ? styles.compact : ''} ${className}`}
    >
      <span aria-hidden="true" ref={light} className={styles.light} />
      <span aria-hidden="true" className={styles.sheen} />
      <span className={styles.label}>{children}</span>
      <span aria-hidden="true" className={styles.rim} />
    </Link>
  )
}

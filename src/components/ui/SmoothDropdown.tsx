'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown, MoreHorizontal } from 'lucide-react'

export interface SmoothDropdownItem {
  id?: string
  label: string
  icon?: ReactNode
  badge?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  onClick?: () => void
  href?: string
  divider?: boolean
}

export interface SmoothDropdownProps {
  items: SmoothDropdownItem[]
  trigger?: ReactNode
  label?: string
  icon?: ReactNode
  align?: 'left' | 'right' | 'center'
  variant?: 'light' | 'dark'
  className?: string
  menuClassName?: string
  width?: string
  onSelect?: (item: SmoothDropdownItem) => void
}

export default function SmoothDropdown({
  items,
  trigger,
  label,
  icon,
  align = 'left',
  variant = 'light',
  className = '',
  menuClassName = '',
  width = 'w-56',
  onSelect,
}: SmoothDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Fechar com tecla Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }[align]

  const originClasses = {
    left: 'origin-top-left',
    right: 'origin-top-right',
    center: 'origin-top-center',
  }[align]

  const isDark = variant === 'dark'

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Gatilho (Trigger) */}
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={`inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-2xl border transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-[#2E223B] border-white/10 text-white hover:bg-[#382B46] active:scale-[0.98]'
              : 'bg-white border-[#E8DFD8] text-[#3D2E4D] hover:bg-[#FAF8F5] active:scale-[0.98] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            {icon && <span className="shrink-0">{icon}</span>}
            {label ? <span>{label}</span> : <MoreHorizontal className="h-4 w-4" />}
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 opacity-60 ${
              isOpen ? 'rotate-180 opacity-100' : ''
            }`}
          />
        </button>
      )}

      {/* Menu com Animação Fluida (Smooth Dropdown) */}
      {isOpen && (
        <div className={`absolute top-full mt-2 z-[100] ${positionClasses}`}>
          <div
            role="menu"
            data-dropdown-content="true"
            className={`lume-smooth-dropdown ${width} ${originClasses} rounded-2xl border p-1.5 backdrop-blur-md ${
              isDark
                ? 'bg-[#1E1728]/95 border-white/10 text-white shadow-2xl shadow-black/40'
                : 'bg-white/98 border-[#E8DFD8] text-[#3D2E4D] shadow-2xl shadow-[#3D2E4D]/10'
            } ${menuClassName}`}
          >
          <ul className="flex flex-col gap-0.5 m-0 p-0 list-none">
            {items.map((item, index) => {
              const itemId = item.id || `item-${index}`

              if (item.divider) {
                return (
                  <li
                    key={`divider-${index}`}
                    className={`my-1 border-t ${isDark ? 'border-white/10' : 'border-[#E8DFD8]'}`}
                    role="separator"
                  />
                )
              }

              const isHovered = hoveredId === itemId
              const isDanger = item.danger

              const content = (
                <div
                  className={`relative flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed pointer-events-none'
                      : isDanger
                      ? isHovered
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'text-rose-600 dark:text-rose-400'
                      : isHovered
                      ? isDark
                        ? 'bg-white/10 text-white'
                        : 'bg-[#FAF0F5] text-[#3D2E4D]'
                      : isDark
                      ? 'text-[#D5CBDD]'
                      : 'text-[#5A4F6A]'
                  }`}
                >
                  {/* Left accent bar on hover */}
                  {isHovered && !item.disabled && (
                    <span
                      className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full transition-all duration-150 ${
                        isDanger ? 'bg-rose-500' : isDark ? 'bg-[#B8A9D9]' : 'bg-[#8C5383]'
                      }`}
                    />
                  )}

                  <div className="flex items-center gap-2.5 truncate">
                    {item.icon && <span className="shrink-0 text-base">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDark
                            ? 'bg-white/15 text-white'
                            : 'bg-[#FAF0F5] text-[#8C5383] border border-[#8C5383]/15'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.shortcut && (
                      <span
                        className={`text-[10px] font-mono opacity-50 uppercase tracking-widest`}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              )

              return (
                <li
                  key={itemId}
                  role="menuitem"
                  className="lume-smooth-dropdown-item cursor-pointer"
                  onMouseEnter={() => setHoveredId(itemId)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.()
                      onSelect?.(item)
                      setIsOpen(false)
                    }
                  }}
                >
                  {item.href ? (
                    <Link href={item.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              )
            })}
          </ul>
          </div>
        </div>
      )}
    </div>
  )
}

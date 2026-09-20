'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface AdminCustomDropdownProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  className?: string
  dropdownWidth?: string
}

export default function AdminCustomDropdown({
  label,
  value,
  onChange,
  options,
  className = '',
  dropdownWidth = 'w-full',
}: AdminCustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-semibold text-[#A9A1B5] block mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#15111F] border border-white/[0.08] hover:border-[#B8A9D9]/40 text-xs text-[#F8F5FA] transition active:scale-[0.98] cursor-pointer text-left focus:outline-hidden focus:border-[#B8A9D9]"
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="h-3.5 w-3.5 shrink-0 text-[#B8A9D9]" />
          )}
          <span className="truncate">{selectedOption?.label || value}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#A9A1B5] transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#B8A9D9]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 ${dropdownWidth} min-w-[160px] z-50 bg-[#18141F] border border-white/10 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#B8A9D9]/15 text-[#B8A9D9] font-bold'
                    : 'text-[#A9A1B5] hover:text-[#F8F5FA] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3 w-3 shrink-0 text-[#B8A9D9]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

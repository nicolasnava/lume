'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'

export interface CustomSelectOption {
  value: string
  label: string
  icon?: ReactNode
  badge?: ReactNode
  disabled?: boolean
}

export interface CustomSelectProps {
  options: (CustomSelectOption | string)[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  dropdownClassName?: string
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  searchable?: boolean
  searchPlaceholder?: string
  id?: string
  name?: string
  ariaLabel?: string
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  disabled = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  variant = 'light',
  size = 'md',
  searchable = false,
  searchPlaceholder = 'Buscar...',
  id,
  name,
  ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    } else if (listboxRef.current) {
      listboxRef.current.scrollTop = 0
    }
  }, [isOpen])

  // Normalizar opções para o formato CustomSelectOption
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })

  // Encontrar opção selecionada atual
  const selectedOption = normalizedOptions.find((opt) => opt.value === value)

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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSelect = (optValue: string, optDisabled?: boolean) => {
    if (optDisabled) return
    onChange(optValue)
    setIsOpen(false)
  }

  // Estilos conforme tamanho
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[36px]',
    md: 'px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl min-h-[44px]',
    lg: 'px-4 py-3 text-sm sm:text-base rounded-2xl min-h-[48px]',
  }

  // Estilos conforme variante (light vs dark para painel admin)
  const isDark = variant === 'dark'

  const buttonVariantClasses = isDark
    ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700 focus:border-purple-500'
    : 'bg-[#FAF8F5] border-gray-200 text-[#4A3F5C] hover:border-[#B8A9D9] focus:border-[#8C5383] focus:bg-white'

  const dropdownVariantClasses = isDark
    ? 'bg-zinc-900 border-zinc-800 text-zinc-200 shadow-2xl shadow-black/80'
    : 'bg-white border-gray-100 text-[#4A3F5C] shadow-xl shadow-purple-900/10'

  const itemHoverClasses = isDark
    ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
    : 'hover:bg-[#FAF8F5] text-[#4A3F5C] hover:text-[#3D2E4D]'

  const itemSelectedClasses = isDark
    ? 'bg-purple-950/40 text-purple-300 font-bold'
    : 'bg-[#FAF1EE] text-[#C86D51] font-bold'

  // Rolar automaticamente para a opção selecionada ao abrir apenas quando não for pesquisável
  useEffect(() => {
    if (isOpen && listboxRef.current && !searchable) {
      const selectedEl = listboxRef.current.querySelector('[aria-selected="true"]') as HTMLElement
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen, searchable])

  // Filtragem de opções quando searchable estiver ativo
  const firstOption = normalizedOptions[0]
  const remainingOptions = normalizedOptions.slice(1)
  const filteredRemainingOptions = searchable && searchQuery.trim()
    ? remainingOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : remainingOptions

  const renderOption = (opt: CustomSelectOption) => {
    const isSelected = opt.value === value
    return (
      <button
        key={opt.value}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={opt.disabled}
        onClick={() => handleSelect(opt.value, opt.disabled)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-left transition duration-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          isSelected ? itemSelectedClasses : itemHoverClasses
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1">
          {opt.icon && (
            <span className="shrink-0" aria-hidden="true">
              {opt.icon}
            </span>
          )}
          <span className="truncate">{opt.label}</span>
          {opt.badge && <span className="shrink-0 ml-auto mr-1">{opt.badge}</span>}
        </div>

        {isSelected && (
          <Check
            className={`h-4 w-4 shrink-0 ${
              isDark ? 'text-purple-400' : 'text-[#C86D51]'
            }`}
            aria-hidden="true"
          />
        )}
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left select-none font-sans ${
        isOpen ? 'z-[60]' : 'z-auto'
      } ${className}`}
    >
      {/* Input oculto para formulários padrão */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Botão de Disparo do Dropdown */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 border font-medium transition duration-150 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sizeClasses[size]} ${buttonVariantClasses} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate text-left flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0" aria-hidden="true">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate ${!selectedOption ? 'text-gray-400 font-normal' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0 ml-auto mr-1">{selectedOption.badge}</span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 opacity-60 ${
            isOpen ? 'rotate-180 opacity-100' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Menu Flutuante de Opções */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          className={`absolute left-0 min-w-full w-max max-w-[280px] top-full mt-1.5 z-[100] max-h-60 overflow-y-auto rounded-2xl border p-1.5 transition-all duration-150 animate-in fade-in slide-in-from-top-1 shadow-2xl ${dropdownVariantClasses} ${dropdownClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="py-3 px-3 text-xs text-gray-400 text-center">
              Nenhuma opção disponível
            </div>
          ) : searchable ? (
            <>
              {/* Primeiro item (Ex: Todas as Clientes) */}
              {firstOption && renderOption(firstOption)}

              {/* Barra de pesquisa posicionada entre o primeiro item e a lista */}
              <div className="px-1 py-1 my-0.5">
                <div className="relative flex items-center">
                  <Search className="absolute left-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={`w-full pl-7 pr-6 py-1.5 text-xs rounded-xl border focus:outline-hidden font-medium ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:border-purple-500'
                        : 'bg-[#FAF8F5] border-gray-200 text-[#4A3F5C] placeholder-gray-400 focus:border-[#B8A9D9] focus:bg-white'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSearchQuery('')
                        searchInputRef.current?.focus()
                      }}
                      className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista dos demais clientes/itens filtrados */}
              {filteredRemainingOptions.length === 0 ? (
                <div className="py-2.5 px-3 text-xs text-gray-400 text-center font-medium">
                  Nenhum cliente encontrado
                </div>
              ) : (
                filteredRemainingOptions.map((opt) => renderOption(opt))
              )}
            </>
          ) : (
            normalizedOptions.map((opt) => renderOption(opt))
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { X, Check, Pipette } from 'lucide-react'

interface CustomColorPickerModalProps {
  isOpen: boolean
  onClose: () => void
  currentColor: string
  title?: string
  description?: string
  onSelectColor: (hex: string) => void
}

const PALETTE_OPTIONS = [
  { hex: '#B8A9D9', name: 'Lavanda Lumê' },
  { hex: '#8675A9', name: 'Roxo Ametista' },
  { hex: '#4A3F5C', name: 'Roxo Profundo' },
  { hex: '#E8C5C8', name: 'Rosé Suave' },
  { hex: '#C86D51', name: 'Terracota Chic' },
  { hex: '#D4B89B', name: 'Nude Dourado' },
  { hex: '#E2BDAB', name: 'Pêssego Warm' },
  { hex: '#A8D5C5', name: 'Menta Fresca' },
  { hex: '#7C9D96', name: 'Verde Sálvia' },
  { hex: '#047857', name: 'Verde Esmeralda' },
  { hex: '#2C3E50', name: 'Azul Petróleo' },
  { hex: '#FAF7F5', name: 'Off-White Lumê' },
  { hex: '#FFFFFF', name: 'Branco Puro' },
  { hex: '#1E1B24', name: 'Preto Grafite' },
]

export default function CustomColorPickerModal({
  isOpen,
  onClose,
  currentColor,
  title = 'Personalizar Cor da Vitrine',
  description = 'Selecione uma tonalidade da paleta ou digite o código hexadecimal.',
  onSelectColor,
}: CustomColorPickerModalProps) {
  const [selectedHex, setSelectedHex] = useState(currentColor || '#B8A9D9')
  const [inputHex, setInputHex] = useState(currentColor || '#B8A9D9')

  useEffect(() => {
    if (isOpen) {
      setSelectedHex(currentColor || '#B8A9D9')
      setInputHex(currentColor || '#B8A9D9')
    }
  }, [isOpen, currentColor])

  if (!isOpen) return null

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim()
    if (!val.startsWith('#') && val.length > 0) {
      val = `#${val}`
    }
    setInputHex(val)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
      setSelectedHex(val)
    }
  }

  const handleApply = () => {
    onSelectColor(selectedHex)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#4A3F5C]">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 font-medium mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Prévia Circular e Input Hex */}
        <div className="flex items-center gap-3 bg-[#FAF7F5] p-3.5 rounded-2xl border border-gray-200/70">
          <div
            className="h-12 w-12 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 shrink-0 transition-transform duration-200"
            style={{ backgroundColor: selectedHex }}
          />
          <div className="flex-1 space-y-1">
            <span className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">
              Código Hexadecimal
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputHex}
                onChange={handleHexChange}
                placeholder="#B8A9D9"
                maxLength={7}
                className="w-full uppercase font-mono text-sm font-extrabold text-[#4A3F5C] bg-white px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#B8A9D9]"
              />
            </div>
          </div>
        </div>

        {/* Paleta de Cores em Formato Circular (Estritamente Círculos) */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#4A3F5C] block">
            Paleta de Cores:
          </span>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-3 py-1">
            {PALETTE_OPTIONS.map((item) => {
              const isSelected = selectedHex.toLowerCase() === item.hex.toLowerCase()
              return (
                <button
                  key={item.hex}
                  type="button"
                  onClick={() => {
                    setSelectedHex(item.hex)
                    setInputHex(item.hex)
                  }}
                  className={`group relative h-11 w-11 rounded-full border border-black/10 shadow-xs flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95 ${
                    isSelected
                      ? 'ring-3 ring-[#4A3F5C] ring-offset-2 scale-105'
                      : 'hover:shadow-md'
                  }`}
                  style={{ backgroundColor: item.hex }}
                  title={item.name}
                >
                  {isSelected && (
                    <Check
                      className={`h-5 w-5 drop-shadow-md ${
                        ['#faf7f5', '#ffffff', '#e8c5c8', '#d4b89b', '#e2bdab'].includes(
                          item.hex.toLowerCase()
                        )
                          ? 'text-[#4A3F5C]'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer shadow-xs"
          >
            Confirmar Cor
          </button>
        </div>
      </div>
    </div>
  )
}

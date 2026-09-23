'use client'

import React, { useEffect, useState, useRef } from 'react'

interface CasinoReelDigitProps {
  char: string
  columnIndex: number
}

function CasinoReelDigit({ char, columnIndex }: CasinoReelDigitProps) {
  const isDigit = /\d/.test(char)
  const [current, setCurrent] = useState(char)
  const [reel, setReel] = useState<string[]>([char])
  const [isSpinning, setIsSpinning] = useState(false)
  const isMountedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const frame2Ref = useRef<number | null>(null)

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      setCurrent(char)
      setReel([char])
      return
    }

    if (!isDigit || char === current) {
      setCurrent(char)
      return
    }

    const prevNum = parseInt(current, 10)
    // Gera a sequência do carretel de cassino (reel de 6 a 8 números para criar o giro autêntico de caça-níqueis)
    const sequence: string[] = [current]
    const steps = 6 + (columnIndex % 3) // Variação sutil de giros entre colunas para realismo
    let cur = prevNum
    for (let s = 1; s < steps; s++) {
      cur = (cur + 1) % 10
      sequence.push(cur.toString())
    }
    sequence.push(char)

    setReel(sequence)
    setIsSpinning(false)

    // Frame duplo para garantir que o navegador registre a fita na posição inicial antes de deslizar
    const frame1 = requestAnimationFrame(() => {
      frame2Ref.current = requestAnimationFrame(() => {
        setIsSpinning(true)
      })
    })

    // Duração lenta e graciosa (~1000ms a 1200ms) + delay escalonado por coluna
    const spinDuration = 1000 + columnIndex * 60
    const delay = columnIndex * 60

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCurrent(char)
      setReel([char])
      setIsSpinning(false)
    }, spinDuration + delay + 40)

    return () => {
      cancelAnimationFrame(frame1)
      if (frame2Ref.current !== null) cancelAnimationFrame(frame2Ref.current)
      frame2Ref.current = null
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [char, current, columnIndex, isDigit])

  if (!isDigit) {
    return <span className="inline-block px-[1px] select-none">{char}</span>
  }

  const delayMs = columnIndex * 60
  const spinDurationMs = 1000 + columnIndex * 60
  const totalOffset = (reel.length - 1) * 1.15

  return (
    <span className="relative inline-block overflow-hidden h-[1.15em] leading-[1.15em] align-baseline select-none">
      <span
        className="flex flex-col items-center will-change-transform"
        style={{
          transform: isSpinning
            ? `translateY(-${totalOffset}em)`
            : 'translateY(0em)',
          transition: isSpinning
            ? `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.95, 0.25, 1) ${delayMs}ms`
            : 'none',
        }}
      >
        {reel.map((digitChar, idx) => (
          <span
            key={`reel-${idx}`}
            className="flex items-center justify-center h-[1.15em] leading-[1.15em]"
          >
            {digitChar}
          </span>
        ))}
      </span>
    </span>
  )
}

export interface CasinoPriceTickerProps {
  price: string
  prefix?: string
  suffix?: string
  className?: string
  prefixClassName?: string
  suffixClassName?: string
}

export function CasinoPriceTicker({
  price,
  prefix = 'R$ ',
  suffix = '/mês',
  className = '',
  prefixClassName = 'text-2xl sm:text-3xl mr-1 font-bold',
  suffixClassName = 'text-sm font-semibold ml-1.5 opacity-80',
}: CasinoPriceTickerProps) {
  const chars = price.split('')

  return (
    <span className={`inline-flex items-baseline font-black tracking-tight ${className}`}>
      {prefix && <span className={prefixClassName}>{prefix}</span>}
      <span className="inline-flex items-baseline overflow-hidden">
        {chars.map((char, i) => (
          <CasinoReelDigit
            key={`digit-col-${i}`}
            char={char}
            columnIndex={i}
          />
        ))}
      </span>
      {suffix && <span className={suffixClassName}>{suffix}</span>}
    </span>
  )
}

export default CasinoPriceTicker

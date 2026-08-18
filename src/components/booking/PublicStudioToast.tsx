'use client'

import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'

interface PublicStudioToastProps {
  studioNome: string
}

export default function PublicStudioToast({ studioNome }: PublicStudioToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Exibe o toast por 4 segundos ao carregar a página
    const timer = setTimeout(() => {
      setShow(true)
    }, 400)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Toast
      show={show}
      message={`Você está agendando com ${studioNome}`}
      type="info"
      onClose={() => setShow(false)}
    />
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Loader2, ArrowRight } from 'lucide-react'
import { selecionarQualquerProfissional } from '@/app/actions/estudio'
import { getContrastingTextColor } from '@/lib/utils/contrast'

interface StudioAnyMemberButtonProps {
  studioSlug: string
  corPrimaria?: string
}

export default function StudioAnyMemberButton({
  studioSlug,
  corPrimaria = '#B8A9D9',
}: StudioAnyMemberButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const textColor = getContrastingTextColor(corPrimaria)

  const handleClick = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await selecionarQualquerProfissional(studioSlug)
      if (res?.redirectUrl) {
        router.push(res.redirectUrl)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao selecionar profissional.'
      setErrorMessage(msg)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <button
        type="button"
        disabled={isLoading}
        onClick={handleClick}
        className="w-full py-4 px-6 rounded-2xl font-black text-sm shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 hover:shadow-xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 group"
        style={{
          backgroundColor: corPrimaria,
          color: textColor,
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Encontrando profissional disponível...</span>
          </>
        ) : (
          <>
            <Users className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Qualquer profissional disponível</span>
            <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      {errorMessage && (
        <p className="text-center text-xs text-rose-600 font-semibold animate-in fade-in">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

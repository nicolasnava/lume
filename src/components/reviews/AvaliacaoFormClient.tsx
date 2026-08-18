'use client'

import { useState } from 'react'
import { submitAvaliacaoAction } from '@/app/actions/reviews'
import { Star, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface AvaliacaoRow {
  id: string
  nota: number
  comentario: string | null
  created_at: string
}

interface AvaliacaoFormClientProps {
  agendamentoId: string
  avaliacaoExistente?: AvaliacaoRow | null
  corPrimaria: string
}

export default function AvaliacaoFormClient({
  agendamentoId,
  avaliacaoExistente,
  corPrimaria,
}: AvaliacaoFormClientProps) {
  const [nota, setNota] = useState<number>(avaliacaoExistente?.nota || 5)
  const [hoverNota, setHoverNota] = useState<number | null>(null)
  const [comentario, setComentario] = useState<string>(avaliacaoExistente?.comentario || '')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!avaliacaoExistente)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const res = await submitAvaliacaoAction({
      agendamentoId,
      nota,
      comentario: comentario.trim() || null,
    })

    setSubmitting(false)

    if (!res.success) {
      setErrorMsg(res.message)
    } else {
      setSubmitted(true)
    }
  }

  const currentNotaToDisplay = hoverNota !== null ? hoverNota : nota

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-6 border border-emerald-100 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[#4A3F5C]">Obrigado pela sua avaliação!</h3>
          <p className="text-xs text-gray-500">
            Sua opinião já foi registrada com sucesso e ajuda muito a profissional.
          </p>
        </div>

        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 ${
                star <= (avaliacaoExistente?.nota || nota)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>

        {(avaliacaoExistente?.comentario || comentario) && (
          <div className="rounded-xl bg-[#FAF7F5] p-3 text-xs text-[#4A3F5C] italic border border-gray-100">
            &ldquo;{avaliacaoExistente?.comentario || comentario}&rdquo;
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm space-y-5">
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Seleção de Estrelas (1 a 5) */}
      <div className="space-y-2 text-center">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C]">
          Sua Nota para o Atendimento
        </label>
        <div className="flex justify-center items-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverNota(star)}
              onMouseLeave={() => setHoverNota(null)}
              onClick={() => setNota(star)}
              className="p-1 transition transform hover:scale-125 focus:outline-none cursor-pointer"
            >
              <Star
                className={`h-9 w-9 transition-colors ${
                  star <= currentNotaToDisplay
                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                    : 'text-gray-300 hover:text-amber-200'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-amber-700">
          {currentNotaToDisplay === 5 && 'Excelente'}
          {currentNotaToDisplay === 4 && 'Muito Bom'}
          {currentNotaToDisplay === 3 && 'Razoável'}
          {currentNotaToDisplay === 2 && 'Insatisfeito'}
          {currentNotaToDisplay === 1 && 'Muito Ruim'}
        </p>
      </div>

      {/* Comentário Opcional */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3F5C]">
            Deixe um Comentário (Opcional)
          </label>
          <span className="text-[10px] text-gray-400">{comentario.length}/500</span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Escreva como foi sua experiência, atendimento, ambiente..."
          className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
        />
      </div>

      {/* Botão de Envio */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
        style={{ backgroundColor: corPrimaria }}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Enviando avaliação...</span>
          </>
        ) : (
          <span>Enviar Avaliação</span>
        )}
      </button>
    </form>
  )
}

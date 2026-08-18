'use client'

import { useState, useEffect } from 'react'
import { submitNpsResposta } from '@/app/actions/adminPrompt34'
import { Star, X, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

export default function NpsSurveyModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [nota, setNota] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const lastNpsTimestamp = localStorage.getItem('lume_last_nps_survey_timestamp')
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

    if (!lastNpsTimestamp || now - Number(lastNpsTimestamp) > thirtyDaysMs) {
      // Exibir o convite após 3 segundos de navegação inicial
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!isOpen) return null

  const handleDismiss = () => {
    localStorage.setItem('lume_last_nps_survey_timestamp', String(Date.now()))
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nota === null) return

    setLoading(true)
    setErrorMessage(null)
    try {
      await submitNpsResposta(nota, comentario)
      localStorage.setItem('lume_last_nps_survey_timestamp', String(Date.now()))
      setSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 2000)
    } catch (err: unknown) {
      console.error('[NpsSurveyModal] Erro:', err)
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj?.message || 'Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm w-auto bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-purple-100 animate-in slide-in-from-bottom duration-300 font-sans z-50">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2 text-[#4A3F5C]">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold">Sua opinião é importante!</span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-2 font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {submitted ? (
        <div className="py-4 text-center space-y-1 text-emerald-700">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <p className="text-xs font-bold">Muito obrigado pelo seu feedback!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs font-semibold text-gray-700 leading-snug">
            De 0 a 10, o quanto você recomendaria o Lumê para uma colega?
          </p>

          {/* Seleção de Notas 0 a 10 */}
          <div className="grid grid-cols-11 gap-0.5 sm:gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNota(n)}
                className={`h-7 w-full rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  nota === n
                    ? 'bg-[#4A3F5C] text-white shadow-xs scale-105'
                    : 'bg-[#FAF7F5] text-gray-700 hover:bg-purple-100'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {nota !== null && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <textarea
                rows={2}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Quer deixar um comentário opcional? (Ex: o que mais gosta ou o que falta)"
                className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] p-2.5 text-xs text-gray-800 focus:outline-hidden"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#4A3F5C] hover:bg-[#4A3F5C]/90 text-white py-2 text-xs font-bold transition cursor-pointer"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Enviar Avaliação</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}

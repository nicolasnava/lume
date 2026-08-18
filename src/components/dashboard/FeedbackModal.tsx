'use client'

import { useState } from 'react'
import { submitFeedback } from '@/app/actions/adminPrompt34'
import { MessageSquare, X, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

const TIPO_OPTIONS: CustomSelectOption[] = [
  { value: 'sugestao', label: 'Sugestão de Novo Recurso' },
  { value: 'bug', label: 'Relato de Erro / Bug' },
  { value: 'elogio', label: 'Elogio' },
  { value: 'outro', label: 'Outro' },
]

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [tipo, setTipo] = useState<'sugestao' | 'bug' | 'elogio' | 'outro'>('sugestao')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensagem.trim()) return

    setLoading(true)
    setErrorMessage(null)
    try {
      await submitFeedback(tipo, mensagem)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setMensagem('')
        onClose()
      }, 2000)
    } catch (err: unknown) {
      console.error('[FeedbackModal] Erro:', err)
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj?.message || 'Erro ao enviar feedback. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-[#4A3F5C]">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <h3 className="text-base font-bold">Enviar Feedback</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 text-center space-y-2 text-emerald-700">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm">Feedback Enviado com Sucesso!</h4>
            <p className="text-xs text-gray-500">Obrigado por nos ajudar a melhorar o Lumê!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#4A3F5C] block mb-1">Qual o tipo do feedback?</label>
              <CustomSelect
                options={TIPO_OPTIONS}
                value={tipo}
                onChange={(val) => setTipo(val as 'sugestao' | 'bug' | 'elogio' | 'outro')}
                size="sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#4A3F5C] block mb-1">Mensagem</label>
              <textarea
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Conte com detalhes o que você gostaria de sugerir ou relatar..."
                className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] p-3 text-xs text-gray-800 focus:outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4A3F5C] hover:bg-[#4A3F5C]/90 text-white p-3 text-xs font-bold transition shadow-md cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Enviar Feedback</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  X,
  Send,
  Loader2,
  Crown,
  User,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Star,
  Users,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import { sendAdminAiChatMessageAction } from '@/app/actions/adminAi'
import { ChatMessageItem } from '@/lib/admin/geminiClient'
import FormattedAiContent from './FormattedAiContent'

interface AdminAiChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialInsight?: string
  adminNome?: string
}

const QUICK_QUESTIONS = [
  {
    icon: TrendingUp,
    text: 'Como está o faturamento e crescimento recente?',
  },
  {
    icon: Star,
    text: 'Quais profissionais têm maior volume de agendamentos?',
  },
  {
    icon: Users,
    text: 'Temos profissionais em risco de inatividade (>14 dias)?',
  },
  {
    icon: MessageSquare,
    text: 'Como está a satisfação das clientes e a nota de NPS?',
  },
]

export default function AdminAiChatDrawer({
  isOpen,
  onClose,
  initialInsight,
  adminNome = 'Chefe',
}: AdminAiChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      if (messages.length > 0) {
        scrollToBottom()
      }
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen, messages])

  const handleSend = async (textToSend?: string) => {
    const message = textToSend || input
    if (!message.trim() || loading) return

    const userMsg: ChatMessageItem = { role: 'user', content: message.trim() }
    const updatedHistory = [...messages, userMsg]
    setMessages(updatedHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await sendAdminAiChatMessageAction(messages, message.trim())
      setMessages([
        ...updatedHistory,
        { role: 'model', content: res.reply || 'Sem resposta.' },
      ])
    } catch (err) {
      console.error('Erro ao enviar mensagem para IA:', err)
      setMessages([
        ...updatedHistory,
        {
          role: 'model',
          content: 'Desculpe, ocorreu uma falha na conexão com o assistente. Tente novamente.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    setMessages([])
  }

  if (!isOpen) return null

  const isConversationActive = messages.length > 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop com blur suave */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Painel Lateral (Drawer) com Estética Premium */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-[#120F1D] border-l border-zinc-800/80 text-zinc-100 flex flex-col h-full shadow-2xl z-10 font-sans animate-in slide-in-from-right duration-200">
        
        {/* Cabeçalho do Chat */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-[#161224]/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D8B4E2]" />
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
              Assistente do Chefe
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#8C5383]/20 text-[#D8B4E2] border border-[#8C5383]/30 tracking-wider">
              BETA
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isConversationActive && (
              <button
                type="button"
                onClick={handleClearHistory}
                title="Voltar ao início"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Fechar painel"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO DO PAINEL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TELA DE BOAS-VINDAS (QUANDO AINDA NÃO HÁ MENSAGENS) */}
          {!isConversationActive ? (
            <div className="space-y-6">
              
              {/* Esfera Luminosa Central com Glow */}
              <div className="relative flex flex-col items-center justify-center pt-2 pb-2">
                <div className="absolute w-44 h-44 bg-[#8C5383]/25 rounded-full blur-3xl pointer-events-none" />
                <div className="relative w-28 h-28 flex items-center justify-center animate-pulse">
                  <Image
                    src="/assets/ai.webp"
                    alt="Assistente do Chefe"
                    width={112}
                    height={112}
                    priority
                    className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(140,83,131,0.5)]"
                  />
                </div>
              </div>

              {/* Saudação Personalizada */}
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {getGreeting()},{' '}
                  <span className="text-[#D8B4E2]">{adminNome || 'Chefe'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                  Estou aqui para ajudar você a tomar as melhores decisões hoje.
                </p>
              </div>

              {/* Sugestão de hoje (Apenas o texto limpo, sem card pesado) */}
              <div className="space-y-2 pt-1 px-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-[#D8B4E2]" />
                  <span>Sugestão de hoje</span>
                </div>

                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  <FormattedAiContent
                    content={
                      initialInsight ||
                      'Consolidamos os indicadores recentes da plataforma. Acompanhe a taxa de conversão e a frequência de logins dos estúdios cadastrados.'
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      'Faça uma análise executiva completa dos pontos de oportunidade e retenção da plataforma agora.'
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#D8B4E2] hover:text-white transition cursor-pointer pt-0.5"
                >
                  <span>Ver análise completa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seção "Pergunte sobre sua plataforma" */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-zinc-400 px-1">
                  Pergunte sobre sua plataforma
                </p>

                <div className="space-y-2">
                  {QUICK_QUESTIONS.map((q, idx) => {
                    const Icon = q.icon
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(q.text)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#191428] hover:bg-[#231C38] border border-zinc-800/80 hover:border-[#8C5383]/40 text-zinc-300 hover:text-white transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-[#D8B4E2] shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-medium leading-snug">{q.text}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 shrink-0 group-hover:translate-x-0.5 transition" />
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* FLUXO DA CONVERSA / MENSAGENS */
            <div className="space-y-4 text-xs sm:text-sm">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'model' && (
                    <div className="w-8 h-8 rounded-xl bg-[#1D172E] border border-[#8C5383]/40 flex items-center justify-center shrink-0 mt-0.5 p-1">
                      <Image
                        src="/assets/ai.webp"
                        alt="IA"
                        width={26}
                        height={26}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-[#8C5383] to-[#5C3656] text-white rounded-br-xs shadow-sm font-medium whitespace-pre-wrap'
                        : 'bg-[#1D172E] border border-zinc-800/90 text-zinc-200 rounded-bl-xs shadow-sm'
                    }`}
                  >
                    {m.role === 'model' ? (
                      <FormattedAiContent content={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-zinc-300">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-[#1D172E] border border-[#8C5383]/40 flex items-center justify-center shrink-0 mt-0.5 p-1">
                    <Image
                      src="/assets/ai.webp"
                      alt="IA"
                      width={26}
                      height={26}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="bg-[#1D172E] border border-zinc-800/90 rounded-2xl px-4 py-3 rounded-bl-xs text-zinc-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#B8A9D9]" />
                    <span>Analisando métricas da operação...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* BARRA DE ENTRADA (INPUT PILL DESIGN DA REFERÊNCIA) */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#161224]/90 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <div className="relative flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#D8B4E2]">
                <Sparkles className="w-4 h-4" />
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte qualquer coisa..."
                rows={1}
                disabled={loading}
                className="w-full bg-[#1A1429] text-zinc-100 text-xs sm:text-sm rounded-full border border-zinc-700/60 pl-10 pr-12 py-3 focus:outline-none focus:border-[#8C5383] focus:ring-1 focus:ring-[#8C5383] resize-none placeholder:text-zinc-500 shadow-inner"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#8C5383] hover:bg-[#9D5D93] disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition cursor-pointer shadow-md"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>

          {/* Rodapé Powered by Lumê AI */}
          <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 font-medium pt-1">
            <Sparkles className="w-3 h-3 text-[#8C5383]" />
            <span>Powered by Lumê AI</span>
          </div>
        </div>

      </div>
    </div>
  )
}

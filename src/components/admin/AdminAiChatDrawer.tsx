'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  X,
  Send,
  Loader2,
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

      {/* Painel Lateral (Drawer) com Estética Lumê Luxo */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-[#121019] border-l border-gray-200 dark:border-white/[0.07] text-[#4A3F5C] dark:text-white flex flex-col h-full shadow-2xl z-10 font-sans animate-in slide-in-from-right duration-200">
        
        {/* Cabeçalho do Chat */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#121019] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8675A9] dark:text-[#bfa4f4]" />
            <h3 className="font-bold text-sm sm:text-base text-[#4A3F5C] dark:text-white tracking-tight">
              Assistente do Chefe
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B8A9D9]/20 dark:bg-[#906cd9]/10 text-[#4A3F5C] dark:text-[#bfa4f4] border border-[#B8A9D9]/30 dark:border-[#906cd9]/20 tracking-wider">
              INTELIGÊNCIA
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isConversationActive && (
              <button
                type="button"
                onClick={handleClearHistory}
                title="Voltar ao início"
                className="p-2 rounded-xl text-gray-400 dark:text-[#94a3b8] hover:text-[#4A3F5C] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1c1926] transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Fechar painel"
              className="p-2 rounded-xl text-gray-400 dark:text-[#94a3b8] hover:text-[#4A3F5C] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1c1926] transition cursor-pointer"
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
                <div className="absolute w-44 h-44 bg-[#906cd9]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <Image
                    src="/assets/ai.webp"
                    alt="Assistente do Chefe"
                    width={96}
                    height={96}
                    priority
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>

              {/* Saudação Personalizada */}
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#4A3F5C] dark:text-white tracking-tight">
                  {getGreeting()},{' '}
                  <span className="text-[#8675A9] dark:text-[#bfa4f4]">{adminNome || 'Chefe'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94a3b8] font-medium">
                  Pronto para fornecer análises e diagnósticos em tempo real da operação.
                </p>
              </div>

              {/* Sugestão de hoje */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-[#94a3b8]">
                  <Sparkles className="w-3.5 h-3.5 text-[#8675A9] dark:text-[#bfa4f4]" />
                  <span>Sugestão de hoje</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#171520] border border-gray-200/80 dark:border-white/[0.07] text-xs sm:text-sm text-[#4A3F5C] dark:text-slate-200 leading-relaxed shadow-xs">
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
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#8675A9] dark:text-[#bfa4f4] hover:text-[#4A3F5C] dark:hover:text-white transition cursor-pointer pt-0.5"
                >
                  <span>Ver análise completa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seção "Pergunte sobre sua plataforma" */}
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-[#94a3b8] px-1">
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
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F5] dark:bg-[#171520] hover:bg-purple-50/40 dark:hover:bg-[#1c1926] border border-gray-200 dark:border-white/[0.07] hover:border-[#906cd9]/50 text-[#4A3F5C] dark:text-slate-200 transition text-left cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#121019] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center text-[#8675A9] dark:text-[#bfa4f4] shrink-0 group-hover:border-[#906cd9]/50">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold leading-snug">{q.text}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#94a3b8] group-hover:text-[#4A3F5C] dark:group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition" />
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
                  className={`flex gap-2.5 ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'model' && (
                    <div className="w-8 h-8 rounded-xl bg-[#B8A9D9]/20 dark:bg-[#906cd9]/10 border border-[#B8A9D9]/40 dark:border-[#906cd9]/20 flex items-center justify-center shrink-0 mt-0.5 p-1">
                      <Image
                        src="/assets/ai.webp"
                        alt="IA"
                        width={24}
                        height={24}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-[#906cd9] to-[#7C3AED] text-white rounded-br-xs font-medium whitespace-pre-wrap'
                        : 'bg-[#FAF7F5] dark:bg-[#171520] border border-gray-200/80 dark:border-white/[0.07] text-[#4A3F5C] dark:text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {m.role === 'model' ? (
                      <FormattedAiContent content={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-[#B8A9D9]/20 dark:bg-[#906cd9]/10 border border-[#B8A9D9]/40 dark:border-[#906cd9]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#4A3F5C] dark:text-[#bfa4f4]">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-[#B8A9D9]/20 dark:bg-[#906cd9]/10 border border-[#B8A9D9]/40 dark:border-[#906cd9]/20 flex items-center justify-center shrink-0 mt-0.5 p-1">
                    <Image
                      src="/assets/ai.webp"
                      alt="IA"
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="bg-[#FAF7F5] dark:bg-[#171520] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl px-4 py-3 rounded-bl-xs text-gray-500 dark:text-[#94a3b8] flex items-center gap-2 text-xs font-medium shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-[#906cd9] dark:text-[#bfa4f4]" />
                    <span>Analisando métricas da operação...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* BARRA DE ENTRADA */}
        <div className="p-4 border-t border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#121019] space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <div className="relative flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8675A9] dark:text-[#bfa4f4]">
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
                className="w-full bg-[#FAF7F5] dark:bg-[#171520] text-[#4A3F5C] dark:text-white text-xs sm:text-sm rounded-full border border-gray-200 dark:border-white/[0.07] pl-10 pr-12 py-3 focus:outline-hidden focus:border-[#906cd9] resize-none placeholder:text-gray-400 dark:placeholder:text-[#94a3b8] shadow-inner transition"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gradient-to-r from-[#906cd9] to-[#7C3AED] hover:from-[#9d7be0] hover:to-[#8b5cf6] disabled:bg-none disabled:bg-gray-100 dark:disabled:bg-[#1c1926] disabled:text-gray-400 dark:disabled:text-[#94a3b8] text-white transition cursor-pointer shadow-xs"
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
          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 dark:text-[#94a3b8] font-medium pt-1">
            <Sparkles className="w-3 h-3 text-[#8675A9] dark:text-[#bfa4f4]" />
            <span>Powered by Lumê AI</span>
          </div>
        </div>

      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MessageSquare, RotateCw } from 'lucide-react'
import { getAdminAiInsightAction } from '@/app/actions/adminAi'
import FormattedAiContent from './FormattedAiContent'

interface AdminAiInsightCardProps {
  initialInsight: string
  onOpenChat: () => void
}

export default function AdminAiInsightCard({
  initialInsight,
  onOpenChat,
}: AdminAiInsightCardProps) {
  const [insight, setInsight] = useState(initialInsight)
  const [loading, setLoading] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string>('agora')

  const handleRefresh = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getAdminAiInsightAction()
      if (res.insight) {
        setInsight(res.insight)
        setUpdatedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (err) {
      console.error('Erro ao atualizar insight com IA:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#18141F] border border-gray-200/80 dark:border-white/[0.08] p-6 shadow-xs transition-all duration-300 space-y-4">
      {/* Luz ambiente de fundo elegante */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#B8A9D9]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#B8A9D9]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Topo dentro do card: Título e Botões de Ação */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Image
            src="/assets/ai.webp"
            alt="Assistente Lumê"
            width={26}
            height={26}
            className="w-6.5 h-6.5 object-contain rounded-full shadow-xs shrink-0"
          />
          <h2 className="text-base sm:text-lg font-bold text-[#4A3F5C] dark:text-[#F8F5FA] tracking-tight">
            Assistente Lumê
          </h2>
          <span className="text-[11px] text-gray-400 dark:text-[#A9A1B5] font-medium tracking-wide">
            · Atualizado {updatedAt}
          </span>
        </div>

        {/* Botões: Atualizar e Fazer Perguntas dentro do card */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            title="Gerar nova análise dos dados atuais"
            className="p-2 rounded-xl bg-[#FAF7F5] dark:bg-[#15111F] hover:bg-gray-100 dark:hover:bg-[#1f1a2b] text-gray-500 dark:text-[#A9A1B5] hover:text-[#4A3F5C] dark:hover:text-[#F8F5FA] border border-gray-200 dark:border-white/[0.08] transition cursor-pointer disabled:opacity-50 shadow-2xs flex items-center justify-center"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8675A9] dark:text-[#B8A9D9]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#9B5DE5] hover:bg-[#884ed6] text-[#F8F5FA] text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Fazer perguntas</span>
          </button>
        </div>
      </div>

      {/* Conteúdo do Insight */}
      <div className="relative text-xs sm:text-sm text-[#4A3F5C] dark:text-slate-200 leading-relaxed tracking-tight">
        {loading ? (
          <span className="inline-flex items-center gap-2 text-gray-400 dark:text-[#94a3b8] italic py-2">
            <RotateCw className="w-4 h-4 animate-spin text-[#906cd9] dark:text-[#bfa4f4]" />
            Analisando dados consolidados da plataforma...
          </span>
        ) : (
          <FormattedAiContent content={insight} />
        )}
      </div>
    </div>
  )
}

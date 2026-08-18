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
    <div className="relative overflow-hidden rounded-[22px] bg-[#161618]/70 backdrop-blur-[20px] border border-[#8C5383]/40 p-6 shadow-[0_0_25px_rgba(184,169,217,0.12)] transition-all duration-300 space-y-4">
      {/* Luz ambiente de fundo elegante */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#8C5383]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#B8A9D9]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Topo dentro do card: Título e Botões de Ação */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Image
            src="/assets/ai.webp"
            alt="Assistente do Chefe"
            width={26}
            height={26}
            className="w-6.5 h-6.5 object-contain rounded-full drop-shadow-[0_0_8px_rgba(140,83,131,0.5)] shrink-0"
          />
          <h2 className="text-lg sm:text-xl font-bold text-[#F5F5F4] tracking-tight">
            Assistente do Chefe
          </h2>
          <span className="text-[11px] text-[#9C9C9F] font-medium tracking-wide">
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
            className="p-2 rounded-xl bg-[#1A1A1C] hover:bg-[#232326] text-[#9C9C9F] hover:text-[#F5F5F4] border border-white/[0.08] transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#B8A9D9]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8C5383] to-[#5C3656] hover:from-[#9D5D93] hover:to-[#6E4067] text-[#F5F5F4] text-xs font-semibold shadow-[0_2px_12px_rgba(140,83,131,0.3)] hover:shadow-[0_4px_20px_rgba(140,83,131,0.45)] transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Fazer perguntas</span>
          </button>
        </div>
      </div>

      {/* Conteúdo do Insight */}
      <div className="relative text-sm sm:text-base font-normal text-[#F5F5F4] leading-relaxed tracking-wide">
        {loading ? (
          <span className="inline-flex items-center gap-2 text-[#9C9C9F] italic">
            <RotateCw className="w-4 h-4 animate-spin text-[#B8A9D9]" />
            Analisando dados consolidados da plataforma...
          </span>
        ) : (
          <FormattedAiContent content={insight} />
        )}
      </div>
    </div>
  )
}

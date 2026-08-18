'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useTransition } from 'react'
import { getAdminNpsSummary } from '@/app/actions/adminPrompt34'
import { Star, Loader2 } from 'lucide-react'

interface NpsItem {
  id: string
  profissional_nome: string
  profissional_slug: string
  nota: number
  comentario: string | null
  created_at: string
}

export default function AdminNpsPage() {
  const [data, setData] = useState<{ media: number; total: number; respostas: NpsItem[] }>({
    media: 0,
    total: 0,
    respostas: [],
  })
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await getAdminNpsSummary()
        setData(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const getNpsCategory = (score: number) => {
    if (score >= 9) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Promotora (9-10)
        </span>
      )
    }
    if (score >= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Neutra (7-8)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Detratora (0-6)
      </span>
    )
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Star className="h-5 w-5 text-[#D4AF37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">Satisfação de Clientes (NPS)</h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Avaliação contínua: &ldquo;De 0 a 10, o quanto você recomendaria o Lumê?&rdquo;
          </p>
        </div>

        {/* Card da Média Geral */}
        <div className="bg-[#141416] px-6 py-3 rounded-2xl border border-white/[0.08] flex items-center gap-4 shrink-0 shadow-inner">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-[#9C9C9F] block tracking-wider">NPS Médio Geral</span>
            <span className="text-2xl font-extrabold text-[#F5F5F4] font-mono">{data.media} / 10</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#B8942F]/15 text-[#D4AF37] flex items-center justify-center border border-[#B8942F]/30 font-bold">
            <Star className="h-5 w-5 fill-[#D4AF37]" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#9C9C9F] text-xs flex justify-center items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#8C5383]" /> Carregando respostas de NPS...
        </div>
      ) : data.respostas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.respostas.map((r) => (
            <div key={r.id} className="bg-[#1A1A1C] p-6 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4 hover:border-white/[0.1] transition duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F5F5F4] text-sm">{r.profissional_nome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold font-mono text-[#F5F5F4] bg-[#141416] px-3 py-0.5 rounded-xl border border-white/[0.08]">
                    {r.nota}
                  </span>
                  {getNpsCategory(r.nota)}
                </div>
              </div>

              {r.comentario ? (
                <p className="text-xs text-[#E5E5E7] font-normal leading-relaxed bg-[#141416] p-4 rounded-xl border border-white/[0.04] shadow-inner">
                  &ldquo;{r.comentario}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-[#9C9C9F] italic">Sem comentário escrito</p>
              )}

              <div className="text-[10px] text-[#9C9C9F] font-mono text-right pt-2 border-t border-white/[0.04]">
                Respondido em {new Date(r.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1A1A1C] p-16 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] text-center text-xs text-[#9C9C9F]">
          Nenhuma resposta de NPS recebida ainda.
        </div>
      )}
    </div>
  )
}

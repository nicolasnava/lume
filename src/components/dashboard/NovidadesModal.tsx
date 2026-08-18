'use client'

import { useState, useEffect } from 'react'
import { getNovidades } from '@/app/actions/adminPrompt34'
import { Sparkles, X, Loader2 } from 'lucide-react'

interface NovidadeItem {
  id: string
  titulo: string
  descricao: string
  created_at: string
}

interface NovidadesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NovidadesModal({ isOpen, onClose }: NovidadesModalProps) {
  const [novidades, setNovidades] = useState<NovidadeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      getNovidades()
        .then((list) => {
          setNovidades(list)
          if (list.length > 0) {
            localStorage.setItem('lume_last_seen_novidade', list[0].id)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center gap-2 text-[#4A3F5C]">
            <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
            <h3 className="text-base font-bold">Novidades & Atualizações Lumê</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400 flex justify-center items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando novidades...
            </div>
          ) : novidades.length > 0 ? (
            novidades.map((item) => (
              <div key={item.id} className="bg-[#FAF7F5] p-4 rounded-2xl border border-gray-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#4A3F5C]">{item.titulo}</h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.descricao}</p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">
              Nenhuma novidade recente cadastrada.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

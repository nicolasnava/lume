'use client'

import { useState } from 'react'
import { Calendar, Eye, EyeOff, Loader2, Star } from 'lucide-react'
import { setAvaliacaoOcultaAction } from '@/app/actions/reviews'

interface AvaliacaoItem {
  id: string
  nota: number
  comentario: string | null
  oculta: boolean
  created_at: string
  agendamentos?: {
    id: string
    data_hora_inicio: string
    clientes?: { nome: string; telefone: string } | null
    servicos?: { nome: string } | null
  } | null
}

export default function AvaliacoesListClient({ initialAvaliacoes }: { initialAvaliacoes: AvaliacaoItem[] }) {
  const [avaliacoes, setAvaliacoes] = useState(initialAvaliacoes)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const toggleVisibility = async (item: AvaliacaoItem) => {
    if (item.nota > 3 || savingId) return
    setSavingId(item.id)
    setMessage(null)
    const result = await setAvaliacaoOcultaAction(item.id, !item.oculta)
    setSavingId(null)
    if (!result.success) {
      setMessage(result.message)
      return
    }
    setAvaliacoes((current) => current.map((review) => review.id === item.id ? { ...review, oculta: !item.oculta } : review))
    setMessage(result.message)
  }

  if (avaliacoes.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-xs">
        <Star className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <h3 className="text-base font-bold text-[#4A3F5C]">Nenhuma avaliação ainda</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">Depois de concluir um atendimento, envie o link de avaliação para receber depoimentos das clientes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {message && <p role="status" className="text-xs font-semibold text-[#4A3F5C]">{message}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {avaliacoes.map((item) => {
          const clienteNome = item.agendamentos?.clientes?.nome || 'Cliente'
          const servicoNome = item.agendamentos?.servicos?.nome || 'Atendimento'
          const dataAtendimento = item.agendamentos?.data_hora_inicio
            ? new Date(item.agendamentos.data_hora_inicio).toLocaleDateString('pt-BR')
            : new Date(item.created_at).toLocaleDateString('pt-BR')

          return (
            <article key={item.id} className={`flex flex-col justify-between space-y-3 rounded-2xl border bg-white p-5 shadow-xs ${item.oculta ? 'border-[#B8A9D9]/45' : 'border-gray-100'}`}>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#4A3F5C]">{clienteNome}</h3>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">{servicoNome}</p>
                  </div>
                  <div aria-label={`${item.nota} de 5 estrelas`} className="flex shrink-0 items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-3.5 w-3.5 ${star <= Number(item.nota) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />)}
                  </div>
                </div>
                {item.comentario ? <p className="rounded-xl border border-gray-100 bg-[#FAF7F5] p-3 text-xs leading-relaxed text-[#4A3F5C]/85 italic">“{item.comentario}”</p> : <p className="text-[11px] text-gray-400 italic">Sem comentário por escrito.</p>}
                {item.oculta && <p className="text-[11px] font-medium text-[#6B5E7A]">Oculta para as clientes e fora do ranking. Você ainda pode vê-la.</p>}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3 text-[#B8A9D9]" />{dataAtendimento}</span>
                {item.nota <= 3 && <button type="button" onClick={() => void toggleVisibility(item)} disabled={savingId !== null} aria-label={item.oculta ? 'Mostrar avaliação para clientes' : 'Ocultar avaliação para clientes'} title={item.oculta ? 'Mostrar avaliação' : 'Ocultar avaliação'} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#4A3F5C] transition-[transform,background-color] duration-150 ease-out hover:bg-[#FAF7F5] active:scale-[0.97] disabled:opacity-50">
                  {savingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : item.oculta ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

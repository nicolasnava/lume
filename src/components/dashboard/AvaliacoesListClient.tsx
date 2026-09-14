'use client'

import { useState } from 'react'
import {
  Star,
  Calendar,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  updateAvaliacaoAction,
  deleteAvaliacaoAction,
} from '@/app/actions/reviews'

interface AvaliacaoItem {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  agendamentos?: {
    id: string
    data_hora_inicio: string
    clientes?: {
      nome: string
      telefone: string
    } | null
    servicos?: {
      nome: string
    } | null
  } | null
}

interface AvaliacoesListClientProps {
  initialAvaliacoes: AvaliacaoItem[]
}

export default function AvaliacoesListClient({ initialAvaliacoes }: AvaliacoesListClientProps) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoItem[]>(initialAvaliacoes)
  const [editingAvaliacao, setEditingAvaliacao] = useState<AvaliacaoItem | null>(null)
  const [notaEdit, setNotaEdit] = useState<number>(5)
  const [comentarioEdit, setComentarioEdit] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleOpenEdit = (av: AvaliacaoItem) => {
    setEditingAvaliacao(av)
    setNotaEdit(Number(av.nota) || 5)
    setComentarioEdit(av.comentario || '')
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAvaliacao) return

    setLoading(true)
    setErrorMsg(null)

    const res = await updateAvaliacaoAction(editingAvaliacao.id, notaEdit, comentarioEdit)
    setLoading(false)

    if (res.success) {
      setAvaliacoes((prev) =>
        prev.map((item) =>
          item.id === editingAvaliacao.id
            ? { ...item, nota: notaEdit, comentario: comentarioEdit.trim() || null }
            : item
        )
      )
      setSuccessMsg('Avaliação atualizada com sucesso!')
      setTimeout(() => {
        setEditingAvaliacao(null)
        setSuccessMsg(null)
      }, 1200)
    } else {
      setErrorMsg(res.message || 'Erro ao atualizar avaliação.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) {
      return
    }

    const res = await deleteAvaliacaoAction(id)
    if (res.success) {
      setAvaliacoes((prev) => prev.filter((item) => item.id !== id))
    } else {
      alert(res.message || 'Erro ao excluir avaliação.')
    }
  }

  if (avaliacoes.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center border border-gray-100 shadow-xs">
        <Star className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-base font-bold text-[#4A3F5C]">Nenhuma avaliação ainda</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Ao concluir um atendimento, compartilhe o link de avaliação com a cliente no WhatsApp
          para coletar seus primeiros depoimentos!
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {avaliacoes.map((av) => {
          const clienteNome = av.agendamentos?.clientes?.nome || 'Cliente'
          const servicoNome = av.agendamentos?.servicos?.nome || 'Atendimento'
          const dataAtendimento = av.agendamentos?.data_hora_inicio
            ? new Date(av.agendamentos.data_hora_inicio).toLocaleDateString('pt-BR')
            : new Date(av.created_at).toLocaleDateString('pt-BR')

          return (
            <div
              key={av.id}
              className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#4A3F5C]">{clienteNome}</h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{servicoNome}</p>
                  </div>

                  <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= Number(av.nota)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {av.comentario ? (
                  <p className="text-xs text-[#4A3F5C]/85 bg-[#FAF7F5] p-3 rounded-xl border border-gray-100 leading-relaxed italic">
                    &ldquo;{av.comentario}&rdquo;
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">Sem comentário por escrito.</p>
                )}
              </div>

              {/* Rodapé do Card com Data e Ações de Editar / Apagar */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#B8A9D9]" />
                  {dataAtendimento}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(av)}
                    className="p-1.5 text-gray-400 hover:text-[#4A3F5C] rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    title="Editar avaliação"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(av.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Excluir avaliação"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Edição de Avaliação */}
      {editingAvaliacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Editar Avaliação</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAvaliacao(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <span className="block text-xs font-bold text-gray-500 mb-0.5">Cliente:</span>
                <p className="text-xs font-semibold text-[#4A3F5C]">
                  {editingAvaliacao.agendamentos?.clientes?.nome || 'Cliente'} &bull;{' '}
                  {editingAvaliacao.agendamentos?.servicos?.nome || 'Atendimento'}
                </p>
              </div>

              {/* Seletor de Nota 1 a 5 Estrelas */}
              <div>
                <label className="block text-xs font-bold text-[#4A3F5C] mb-1.5">
                  Nota (Estrelas)
                </label>
                <div className="flex items-center gap-2 bg-[#FAF7F5] p-2.5 rounded-2xl border border-gray-200/80">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNotaEdit(star)}
                      className="p-1 transition hover:scale-110 cursor-pointer"
                      title={`${star} estrela${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= notaEdit
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-gray-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#4A3F5C] ml-2">
                    {notaEdit} de 5 estrelas
                  </span>
                </div>
              </div>

              {/* Comentário */}
              <div>
                <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                  Depoimento / Comentário
                </label>
                <textarea
                  rows={3}
                  value={comentarioEdit}
                  onChange={(e) => setComentarioEdit(e.target.value)}
                  placeholder="Comentário da cliente..."
                  className="w-full rounded-2xl border border-gray-200 p-3 text-xs text-[#4A3F5C] font-medium focus:border-[#B8A9D9] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAvaliacao(null)}
                  className="px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

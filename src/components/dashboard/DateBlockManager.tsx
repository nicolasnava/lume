'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarX,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react'
import {
  BloqueioDisponibilidadeRow,
  addBlockDateAction,
  removeBlockDateAction,
} from '@/app/actions/blockedDates'
import Toast from '@/components/ui/Toast'
import CustomSelect from '@/components/ui/CustomSelect'
import { TIME_OPTIONS_15MIN } from '@/lib/utils/timeOptions'

interface DateBlockManagerProps {
  initialBlocks: BloqueioDisponibilidadeRow[]
}

export default function DateBlockManager({ initialBlocks }: DateBlockManagerProps) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<BloqueioDisponibilidadeRow[]>(initialBlocks)

  // Item 12: Campos para bloqueio de período + horário parcial
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [useHorarioParcial, setUseHorarioParcial] = useState(false)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [motivo, setMotivo] = useState('')

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataInicio) return

    setSaving(true)
    const res = await addBlockDateAction(
      dataInicio,
      dataFim || null,
      useHorarioParcial ? horaInicio || null : null,
      useHorarioParcial ? horaFim || null : null,
      motivo
    )
    setSaving(false)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao salvar bloqueio.', type: 'error' })
    } else {
      setToast({ show: true, message: 'Bloqueio registrado com sucesso!', type: 'success' })
      router.refresh()
      if (res.block) {
        setBlocks((prev) => [...prev, res.block!].sort((a, b) => a.data.localeCompare(b.data)))
      }
      setDataInicio('')
      setDataFim('')
      setUseHorarioParcial(false)
      setHoraInicio('')
      setHoraFim('')
      setMotivo('')
    }
  }

  const handleRemoveBlock = async (blockId: string) => {
    setDeletingId(blockId)
    const res = await removeBlockDateAction(blockId)
    setDeletingId(null)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao remover bloqueio.', type: 'error' })
    } else {
      setToast({ show: true, message: 'Bloqueio removido com sucesso!', type: 'success' })
      router.refresh()
      setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    }
  }

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xs border border-gray-200/80 space-y-5">
      {/* Item 13: Título Renomeado */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-rose-500" />
            <span>Bloqueio de Datas Específicas</span>
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Bloqueie dias completos, períodos ou horários parciais (ex: feriados, viagens ou compromissos médicos)
          </p>
        </div>
      </div>

      {/* Item 12: Formulário de Bloqueio por Período e Horário Parcial */}
      <form onSubmit={handleAddBlock} className="bg-[#FAF7F5] p-4 rounded-2xl border border-gray-200/80 space-y-4">
        <span className="text-xs font-bold text-[#4A3F5C] block">Cadastrar novo bloqueio:</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Data Início */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Data Início *
            </label>
            <input
              type="date"
              required
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:outline-none"
            />
          </div>

          {/* Data Fim (Opcional - Período) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Data Fim (Opcional)
            </label>
            <input
              type="date"
              value={dataFim}
              min={dataInicio || undefined}
              onChange={(e) => setDataFim(e.target.value)}
              placeholder="Mesma data se em branco"
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:outline-none"
            />
          </div>

          {/* Motivo Opcional */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Motivo (Opcional - para controle próprio)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Feriado, Viagem, Consulta médica..."
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Checkbox para Horário Parcial */}
        <div className="pt-2 border-t border-gray-200/60 space-y-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#4A3F5C] cursor-pointer">
            <input
              type="checkbox"
              checked={useHorarioParcial}
              onChange={(e) => setUseHorarioParcial(e.target.checked)}
              className="rounded text-[#4A3F5C] focus:ring-[#B8A9D9] h-4 w-4"
            />
            <span>Bloquear apenas um horário específico (bloqueio parcial do dia)</span>
          </label>

          {useHorarioParcial && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-gray-200/80">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">
                  Hora Início *
                </label>
                <CustomSelect
                  options={TIME_OPTIONS_15MIN}
                  value={horaInicio || '09:00'}
                  onChange={setHoraInicio}
                  size="sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">
                  Hora Fim *
                </label>
                <CustomSelect
                  options={TIME_OPTIONS_15MIN}
                  value={horaFim || '18:00'}
                  onChange={setHoraFim}
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 text-right">
          <button
            type="submit"
            disabled={saving || !dataInicio}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-purple-900 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvar Bloqueio...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Salvar Bloqueio</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Lista de Datas Bloqueadas */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-[#B8A9D9]" />
          <span>Bloqueios Cadastrados ({blocks.length})</span>
        </h4>

        {blocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400 font-medium">
            Nenhum bloqueio de data cadastrado. Preencha o formulário acima para criar um bloqueio.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {blocks.map((b) => {
              const startObj = new Date(b.data + 'T00:00:00')
              const startFormatted = startObj.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })

              let dateDisplay = startFormatted
              if (b.data_fim && b.data_fim !== b.data) {
                const endObj = new Date(b.data_fim + 'T00:00:00')
                const endFormatted = endObj.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })
                dateDisplay = `${startFormatted} até ${endFormatted}`
              }

              const isPartial = !!(b.hora_inicio && b.hora_fim)

              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <span className="text-xs font-bold text-rose-900 block capitalize truncate">
                      {dateDisplay}
                    </span>

                    {isPartial ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                        <Clock className="h-3 w-3" />
                        <span>
                          {b.hora_inicio} às {b.hora_fim}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                        Dia Inteiro
                      </span>
                    )}

                    {b.motivo && (
                      <p className="text-[11px] text-rose-700/80 italic truncate font-medium">
                        &ldquo;{b.motivo}&rdquo;
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveBlock(b.id)}
                    disabled={deletingId === b.id}
                    className="p-1.5 text-rose-600 hover:bg-rose-100/80 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50 ml-2"
                    title="Remover este bloqueio"
                  >
                    {deletingId === b.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

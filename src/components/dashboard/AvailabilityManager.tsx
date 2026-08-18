'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { saveAvailabilityAction, DisponibilidadeBloco } from '@/app/actions/availability'
import Toast from '@/components/ui/Toast'
import CustomSelect from '@/components/ui/CustomSelect'
import { TIME_OPTIONS_15MIN } from '@/lib/utils/timeOptions'
import {
  Clock,
  Calendar,
  Coffee,
  Check,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export interface DisponibilidadeRow {
  id?: string
  profissional_id?: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

interface AvailabilityManagerProps {
  initialDisponibilidades: DisponibilidadeRow[]
}

export interface BreakTime {
  id: string
  pausa_inicio: string
  pausa_fim: string
}

export interface DaySchedule {
  dia_semana: number
  ativo: boolean
  hora_inicio: string
  hora_fim: string
  pausas: BreakTime[]
}

const DIAS_SEMANA = [
  { dia: 0, nome: 'Domingo' },
  { dia: 1, nome: 'Segunda-feira' },
  { dia: 2, nome: 'Terça-feira' },
  { dia: 3, nome: 'Quarta-feira' },
  { dia: 4, nome: 'Quinta-feira' },
  { dia: 5, nome: 'Sexta-feira' },
  { dia: 6, nome: 'Sábado' },
]

function parseInitialSchedules(rows: DisponibilidadeRow[]): DaySchedule[] {
  return DIAS_SEMANA.map((dia) => {
    const blocosDoDia = rows
      .filter((r) => r.dia_semana === dia.dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

    if (blocosDoDia.length === 0) {
      return {
        dia_semana: dia.dia,
        ativo: false,
        hora_inicio: '09:00',
        hora_fim: '18:00',
        pausas: [],
      }
    }

    if (blocosDoDia.length === 1) {
      return {
        dia_semana: dia.dia,
        ativo: true,
        hora_inicio: blocosDoDia[0].hora_inicio.substring(0, 5),
        hora_fim: blocosDoDia[0].hora_fim.substring(0, 5),
        pausas: [],
      }
    }

    // 2 ou mais blocos salvos (os intervalos entre os blocos viram pausas)
    const primeiro = blocosDoDia[0]
    const ultimo = blocosDoDia[blocosDoDia.length - 1]
    const pausasList: BreakTime[] = []

    for (let i = 0; i < blocosDoDia.length - 1; i++) {
      const fimBlocoAtual = blocosDoDia[i].hora_fim.substring(0, 5)
      const inicioProximoBloco = blocosDoDia[i + 1].hora_inicio.substring(0, 5)
      if (fimBlocoAtual < inicioProximoBloco) {
        pausasList.push({
          id: `pausa-init-${dia.dia}-${i}-${Date.now()}`,
          pausa_inicio: fimBlocoAtual,
          pausa_fim: inicioProximoBloco,
        })
      }
    }

    return {
      dia_semana: dia.dia,
      ativo: true,
      hora_inicio: primeiro.hora_inicio.substring(0, 5),
      hora_fim: ultimo.hora_fim.substring(0, 5),
      pausas: pausasList,
    }
  })
}

export default function AvailabilityManager({
  initialDisponibilidades,
}: AvailabilityManagerProps) {
  const router = useRouter()
  const [schedules, setSchedules] = useState<DaySchedule[]>(() =>
    parseInitialSchedules(initialDisponibilidades)
  )

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)

  const isMountedRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Execução do salvamento no banco com validação completa de janelas e sobreposição de pausas
  const executeSave = useCallback(async (currentSchedules: DaySchedule[]) => {
    setSaveStatus('saving')
    setErrorMsg(null)

    const blocosToSave: DisponibilidadeBloco[] = []

    for (const s of currentSchedules) {
      if (!s.ativo) continue

      const diaNome = DIAS_SEMANA.find((d) => d.dia === s.dia_semana)?.nome

      // 1. Validação da Janela Principal de Atendimento
      if (s.hora_inicio >= s.hora_fim) {
        const msg = `No dia ${diaNome}, a hora de abertura (${s.hora_inicio}) deve ser menor que a hora de fechamento (${s.hora_fim}).`
        setSaveStatus('idle')
        setErrorMsg(msg)
        setToast({ show: true, message: msg, type: 'error' })
        return
      }

      if (s.pausas.length > 0) {
        // Ordenar pausas por horário de início para validação sequencial
        const sortedPausas = [...s.pausas].sort((a, b) => a.pausa_inicio.localeCompare(b.pausa_inicio))

        for (let i = 0; i < sortedPausas.length; i++) {
          const p = sortedPausas[i]

          if (p.pausa_inicio <= s.hora_inicio) {
            const msg = `No dia ${diaNome}, a pausa (${p.pausa_inicio}) deve iniciar após o horário de abertura (${s.hora_inicio}).`
            setSaveStatus('idle')
            setErrorMsg(msg)
            setToast({ show: true, message: msg, type: 'error' })
            return
          }

          if (p.pausa_fim >= s.hora_fim) {
            const msg = `No dia ${diaNome}, a pausa (${p.pausa_fim}) deve terminar antes do horário de fechamento (${s.hora_fim}).`
            setSaveStatus('idle')
            setErrorMsg(msg)
            setToast({ show: true, message: msg, type: 'error' })
            return
          }

          if (p.pausa_inicio >= p.pausa_fim) {
            const msg = `No dia ${diaNome}, o início da pausa (${p.pausa_inicio}) deve ser menor que o fim (${p.pausa_fim}).`
            setSaveStatus('idle')
            setErrorMsg(msg)
            setToast({ show: true, message: msg, type: 'error' })
            return
          }

          // Checagem de sobreposição com a pausa seguinte no mesmo dia
          if (i < sortedPausas.length - 1) {
            const prox = sortedPausas[i + 1]
            if (p.pausa_fim > prox.pausa_inicio) {
              const msg = `No dia ${diaNome}, as pausas (${p.pausa_inicio}-${p.pausa_fim}) e (${prox.pausa_inicio}-${prox.pausa_fim}) não podem se sobrepor.`
              setSaveStatus('idle')
              setErrorMsg(msg)
              setToast({ show: true, message: msg, type: 'error' })
              return
            }
          }
        }

        // Gerar os blocos ativos fragmentando o dia entre as pausas
        let currentStart = s.hora_inicio
        for (const p of sortedPausas) {
          if (currentStart < p.pausa_inicio) {
            blocosToSave.push({
              dia_semana: s.dia_semana,
              hora_inicio: currentStart,
              hora_fim: p.pausa_inicio,
            })
          }
          currentStart = p.pausa_fim
        }
        if (currentStart < s.hora_fim) {
          blocosToSave.push({
            dia_semana: s.dia_semana,
            hora_inicio: currentStart,
            hora_fim: s.hora_fim,
          })
        }
      } else {
        // Sem pausas: bloco único contínuo
        blocosToSave.push({
          dia_semana: s.dia_semana,
          hora_inicio: s.hora_inicio,
          hora_fim: s.hora_fim,
        })
      }
    }

    const res = await saveAvailabilityAction(blocosToSave)

    if (!res.success) {
      setSaveStatus('idle')
      setErrorMsg(res.message || 'Erro ao salvar horários de disponibilidade.')
      setToast({ show: true, message: res.message || 'Erro ao salvar horários.', type: 'error' })
    } else {
      setSaveStatus('saved')
      router.refresh()
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    }
  }, [router])

  // Autosave com Debounce de 1.5s para edição de horários
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave(schedules)
    }, 1500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [schedules, executeSave])

  // Ações Discretas com Salvamento Imediato
  const handleToggleDiaAtivo = (diaSemana: number) => {
    const updated = schedules.map((s) => (s.dia_semana === diaSemana ? { ...s, ativo: !s.ativo } : s))
    setSchedules(updated)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    executeSave(updated)
  }

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const handleAddPausa = (diaSemana: number) => {
    const targetSchedule = schedules.find((s) => s.dia_semana === diaSemana)
    if (!targetSchedule) return

    const windowStartMins = timeToMinutes(targetSchedule.hora_inicio)
    const windowEndMins = timeToMinutes(targetSchedule.hora_fim)

    let proposedStartMins: number
    let proposedEndMins: number

    if (targetSchedule.pausas.length > 0) {
      const sorted = [...targetSchedule.pausas].sort(
        (a, b) => timeToMinutes(a.pausa_fim) - timeToMinutes(b.pausa_fim)
      )
      const lastPausaEndMins = timeToMinutes(sorted[sorted.length - 1].pausa_fim)
      proposedStartMins = lastPausaEndMins
      proposedEndMins = lastPausaEndMins + 30
    } else {
      proposedStartMins = Math.min(windowStartMins + 180, windowEndMins - 30)
      proposedEndMins = proposedStartMins + 30
    }

    if (proposedEndMins > windowEndMins || proposedStartMins < windowStartMins) {
      setToast({
        show: true,
        message: 'Não há espaço na janela de atendimento deste dia para adicionar uma nova pausa sem conflito.',
        type: 'error',
      })
      return
    }

    const hasOverlap = targetSchedule.pausas.some((p) => {
      const pStart = timeToMinutes(p.pausa_inicio)
      const pEnd = timeToMinutes(p.pausa_fim)
      return proposedStartMins < pEnd && proposedEndMins > pStart
    })

    if (hasOverlap) {
      setToast({
        show: true,
        message: 'Não há espaço na janela de atendimento deste dia para adicionar uma nova pausa sem conflito.',
        type: 'error',
      })
      return
    }

    const novaPausa: BreakTime = {
      id: `pausa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pausa_inicio: minutesToTime(proposedStartMins),
      pausa_fim: minutesToTime(proposedEndMins),
    }

    const updated = schedules.map((s) => {
      if (s.dia_semana !== diaSemana) return s
      return { ...s, pausas: [...s.pausas, novaPausa] }
    })

    setSchedules(updated)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    executeSave(updated)
  }

  const handleRemovePausa = (diaSemana: number, pausaId: string) => {
    const updated = schedules.map((s) => {
      if (s.dia_semana !== diaSemana) return s
      return { ...s, pausas: s.pausas.filter((p) => p.id !== pausaId) }
    })
    setSchedules(updated)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    executeSave(updated)
  }

  const updatePausaTime = (
    diaSemana: number,
    pausaId: string,
    field: 'pausa_inicio' | 'pausa_fim',
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.dia_semana !== diaSemana) return s
        return {
          ...s,
          pausas: s.pausas.map((p) => (p.id === pausaId ? { ...p, [field]: value } : p)),
        }
      })
    )
  }

  const updateJanelaTime = (
    diaSemana: number,
    field: 'hora_inicio' | 'hora_fim',
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dia_semana === diaSemana ? { ...s, [field]: value } : s))
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Indicador Discreto de Autosave */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-[#4A3F5C] border border-[#B8A9D9]/50 animate-pulse shadow-2xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4A3F5C]" />
              <span>Salvando horários...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 transition-all duration-300 shadow-2xs">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Salvo automaticamente</span>
            </div>
          )}
          {saveStatus === 'idle' && (
            <span className="text-[11px] text-gray-400 font-medium">
              As alterações nos horários de atendimento são salvas automaticamente
            </span>
          )}
        </div>
      </div>

      {/* Alerta de Erro de Validação se Houver */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grade de Atendimento por Dia da Semana */}
      <div className="space-y-4">
        {DIAS_SEMANA.map((dia) => {
          const schedule = schedules.find((s) => s.dia_semana === dia.dia)!

          return (
            <div
              key={dia.dia}
              className={`rounded-2xl bg-white p-4 sm:p-5 border shadow-xs transition w-full max-w-full ${
                schedule.ativo ? 'border-gray-200 shadow-sm' : 'border-gray-100 bg-gray-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                      schedule.ativo
                        ? 'bg-[#B8A9D9]/30 text-[#4A3F5C]'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#4A3F5C]">{dia.nome}</h3>
                    {/* Copy de atendimento */}
                    {schedule.ativo ? (
                      <div className="space-y-0.5 mt-0.5">
                        <span className="text-[11px] text-gray-500 block leading-tight">
                          Atendimento contínuo das {schedule.hora_inicio} às {schedule.hora_fim}
                        </span>
                        {schedule.pausas.length > 0 && (
                          <span className="text-[11px] text-purple-800 font-semibold block leading-tight">
                            Com {schedule.pausas.length} {schedule.pausas.length === 1 ? 'pausa' : 'pausas'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 block mt-0.5">Sem atendimento neste dia</span>
                    )}
                  </div>
                </div>

                {/* Item 9: Interruptor na extremidade direita máxima do botão */}
                <button
                  type="button"
                  onClick={() => handleToggleDiaAtivo(dia.dia)}
                  className={`inline-flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 sm:min-w-[180px] ${
                    schedule.ativo
                      ? 'bg-[#4A3F5C] text-white border-[#4A3F5C]'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="shrink-0">{schedule.ativo ? 'Atendimento Ativo' : 'Ativar Atendimento'}</span>
                  <div
                    className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ml-auto ${
                      schedule.ativo ? 'bg-[#B8A9D9]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        schedule.ativo ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Configurações do Dia Ativo */}
              {schedule.ativo && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 w-full max-w-full">
                  {/* Item 2 (Prompt 30): Janela Principal de Atendimento sempre em 1 linha sem quebrar */}
                  <div className="flex items-center justify-between gap-2 bg-[#FAF7F5] p-2.5 sm:p-3 rounded-xl border border-gray-100 w-full max-w-full flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A3F5C] shrink-0">
                      <Clock className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                      <span>Janela de Atendimento:</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-[#4A3F5C] flex-wrap sm:flex-nowrap">
                      <span>Das</span>
                      <div className="w-28 shrink-0">
                        <CustomSelect
                          options={TIME_OPTIONS_15MIN}
                          value={schedule.hora_inicio}
                          onChange={(val) => updateJanelaTime(dia.dia, 'hora_inicio', val)}
                          size="sm"
                          buttonClassName="py-1 px-2 text-xs font-bold"
                        />
                      </div>
                      <span>até</span>
                      <div className="w-28 shrink-0">
                        <CustomSelect
                          options={TIME_OPTIONS_15MIN}
                          value={schedule.hora_fim}
                          onChange={(val) => updateJanelaTime(dia.dia, 'hora_fim', val)}
                          size="sm"
                          buttonClassName="py-1 px-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lista de Pausas */}
                  <div className="space-y-3 w-full max-w-full">
                    <div className="flex items-center justify-between gap-2">
                      {schedule.pausas.length > 0 ? (
                        <span className="text-xs font-semibold text-[#4A3F5C] flex items-center gap-1.5 leading-tight">
                          <Coffee className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Horários de Pausa ({schedule.pausas.length})</span>
                        </span>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddPausa(dia.dia)}
                        className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-[#4A3F5C] bg-[#B8A9D9]/20 border border-[#B8A9D9]/40 hover:bg-[#B8A9D9]/30 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap ml-auto"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Adicionar Pausa</span>
                      </button>
                    </div>

                    {schedule.pausas.length > 0 && (
                      <div className="space-y-2">
                        {schedule.pausas.map((pausa, pIdx) => (
                          <div
                            key={pausa.id}
                            className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 space-y-2 w-full max-w-full"
                          >
                            {/* Linha 1: Ícone + Horário de pausa à esquerda, Lixeira alinhada à direita */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                <Coffee className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>Horário de pausa {schedule.pausas.length > 1 ? `#${pIdx + 1}` : ''}:</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePausa(dia.dia, pausa.id)}
                                className="p-1 text-red-600 hover:bg-red-100/70 rounded-lg transition cursor-pointer shrink-0"
                                title="Remover esta pausa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Linha 2: Das [09:00] até [13:00] */}
                            <div className="flex items-center gap-2 text-xs font-medium text-amber-900 flex-wrap sm:flex-nowrap">
                              <span>Das</span>
                              <div className="w-28 shrink-0">
                                <CustomSelect
                                  options={TIME_OPTIONS_15MIN}
                                  value={pausa.pausa_inicio}
                                  onChange={(val) =>
                                    updatePausaTime(dia.dia, pausa.id, 'pausa_inicio', val)
                                  }
                                  size="sm"
                                  buttonClassName="py-1 px-2 text-xs font-bold bg-white"
                                />
                              </div>
                              <span>até</span>
                              <div className="w-28 shrink-0">
                                <CustomSelect
                                  options={TIME_OPTIONS_15MIN}
                                  value={pausa.pausa_fim}
                                  onChange={(val) =>
                                    updatePausaTime(dia.dia, pausa.id, 'pausa_fim', val)
                                  }
                                  size="sm"
                                  buttonClassName="py-1 px-2 text-xs font-bold bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
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

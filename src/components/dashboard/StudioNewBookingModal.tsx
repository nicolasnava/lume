'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  Loader2,
  AlertTriangle,
  Check,
  Users,
  CreditCard,
} from 'lucide-react'
import {
  obterProfissionaisDisponiveisParaAgendamentoAction,
  criarAgendamentoPelaDonaAction,
} from '@/app/actions/estudio'
import CustomDatePicker from '@/components/ui/CustomDatePicker'

interface StudioNewBookingModalProps {
  isOpen: boolean
  onClose: () => void
  estudioId: string
  onSuccess?: () => void
}

interface ProfissionalDisponivel {
  id: string
  nome: string
  foto_url: string | null
  slug: string
  servicos: Array<{
    id: string
    nome: string
    preco: number
    duracao_minutos: number
  }>
}

const TIME_OPTIONS = (() => {
  const list: string[] = []
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      list.push(`${hh}:${mm}`)
    }
  }
  return list
})()

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export default function StudioNewBookingModal({
  isOpen,
  onClose,
  estudioId,
  onSuccess,
}: StudioNewBookingModalProps) {
  const [profissionais, setProfissionais] = useState<ProfissionalDisponivel[]>([])
  const [isLoadingProfs, setIsLoadingProfs] = useState(false)

  const [selectedProfId, setSelectedProfId] = useState<string>('')
  const [selectedServicoId, setSelectedServicoId] = useState<string>('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [dataStr, setDataStr] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [horaStr, setHoraStr] = useState('10:00')
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [observacoes, setObservacoes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setIsLoadingProfs(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    obterProfissionaisDisponiveisParaAgendamentoAction(estudioId)
      .then((data) => {
        if (!isMounted) return
        setProfissionais(data)
        if (data.length > 0) {
          setSelectedProfId(data[0].id)
          if (data[0].servicos.length > 0) {
            setSelectedServicoId(data[0].servicos[0].id)
          }
        }
      })
      .catch((err) => {
        console.error(err)
        if (isMounted) setErrorMessage('Erro ao carregar profissionais disponíveis.')
      })
      .finally(() => {
        if (isMounted) setIsLoadingProfs(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, estudioId])

  const selectedProf = profissionais.find((p) => p.id === selectedProfId)
  const availableServices = selectedProf?.servicos || []

  // Ao trocar de profissional, seleciona o primeiro serviço dela
  const handleSelectProf = (profId: string) => {
    setSelectedProfId(profId)
    const prof = profissionais.find((p) => p.id === profId)
    if (prof && prof.servicos.length > 0) {
      setSelectedServicoId(prof.servicos[0].id)
    } else {
      setSelectedServicoId('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProfId || !selectedServicoId || !clienteNome.trim() || !clienteTelefone.trim()) {
      setErrorMessage('Preencha os campos obrigatórios (Profissional, Serviço, Nome e WhatsApp da Cliente).')
      return
    }

    const telLimpo = clienteTelefone.replace(/\D/g, '')
    if (telLimpo.length < 10) {
      setErrorMessage('Informe um WhatsApp válido com DDD (pelo menos 10 dígitos).')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const dataHoraInicioIso = `${dataStr}T${horaStr}:00`
      await criarAgendamentoPelaDonaAction({
        estudioId,
        profissionalId: selectedProfId,
        clienteNome: clienteNome.trim(),
        clienteTelefone: telLimpo,
        servicoId: selectedServicoId,
        dataHoraInicio: new Date(dataHoraInicioIso).toISOString(),
        formaPagamentoPreferida: formaPagamento,
        observacoes: observacoes.trim() || undefined,
      })

      setSuccessMessage('Agendamento criado com sucesso!')
      setTimeout(() => {
        setSuccessMessage(null)
        onClose()
        if (onSuccess) onSuccess()
      }, 1200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar agendamento.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-200 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#FAF7F5]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#B8A9D9]/20 text-[#4A3F5C] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#4A3F5C]">
                Novo Agendamento no Studio
              </h3>
              <p className="text-[11px] text-gray-500">
                Agende diretamente na agenda de qualquer profissional da equipe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-left">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isLoadingProfs ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#B8A9D9]" />
              <p className="text-xs">Carregando profissionais da equipe...</p>
            </div>
          ) : profissionais.length === 0 ? (
            <div className="py-8 text-center bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2">
              <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto" />
              <h4 className="text-xs font-bold text-gray-800">Nenhuma profissional disponível</h4>
              <p className="text-[11px] text-gray-500">
                Nenhum membro da equipe autorizou agendamento assistido ou está com atendimento ativo no momento.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Selecionar Profissional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4A3F5C] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span>Profissional da Equipe *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profissionais.map((p) => {
                    const isSelected = p.id === selectedProfId
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleSelectProf(p.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'border-[#4A3F5C] bg-[#FAF7F5] shadow-2xs ring-1 ring-[#4A3F5C]'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="relative h-9 w-9 rounded-xl bg-purple-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-purple-900">
                          {p.foto_url ? (
                            <Image src={p.foto_url} alt={p.nome} fill className="object-cover" />
                          ) : (
                            p.nome.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{p.nome}</p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {p.servicos.length} {p.servicos.length === 1 ? 'serviço' : 'serviços'}
                          </p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-[#4A3F5C] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Selecionar Serviço */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4A3F5C] flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-gray-400" />
                  <span>Serviço *</span>
                </label>
                {availableServices.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    Esta profissional não possui serviços ativos cadastrados.
                  </p>
                ) : (
                  <select
                    value={selectedServicoId}
                    onChange={(e) => setSelectedServicoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C]"
                  >
                    {availableServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} — R$ {s.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({s.duracao_minutos} min)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3. Data e Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A3F5C] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>Data *</span>
                  </label>
                  <CustomDatePicker
                    value={dataStr}
                    onChange={setDataStr}
                    dateFormat="short"
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A3F5C] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>Horário de Início *</span>
                  </label>
                  <select
                    value={horaStr}
                    onChange={(e) => setHoraStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C]"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Dados da Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A3F5C] flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span>Nome da Cliente *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Silva"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A3F5C] flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>WhatsApp da Cliente *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(formatPhone(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C]"
                  />
                </div>
              </div>

              {/* 5. Forma de Pagamento e Observações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A3F5C] flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                    <span>Forma de Pagamento</span>
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C]"
                  >
                    <option value="pix">Pix</option>
                    <option value="cartao">Cartão</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A3F5C]">
                    Observações (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Primeira vez no studio"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-[#4A3F5C] focus:ring-1 focus:ring-[#4A3F5C]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingProfs || profissionais.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Confirmar Agendamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

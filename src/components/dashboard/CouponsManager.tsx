'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Pause,
  Play,
  Calendar,
  Users,
  Percent,
  DollarSign,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react'
import {
  CupomProfissionalItem,
  getCuponsProfissionalAction,
  createCupomAction,
  updateCupomAction,
  toggleCupomStatusAction,
  deleteCupomAction,
} from '@/app/actions/coupons'

interface CouponsManagerProps {
  onCouponsLoaded?: (cupons: CupomProfissionalItem[]) => void
}

export default function CouponsManager({ onCouponsLoaded }: CouponsManagerProps) {
  const [cupons, setCupons] = useState<CupomProfissionalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCupom, setEditingCupom] = useState<CupomProfissionalItem | null>(null)

  // Form State
  const [codigo, setCodigo] = useState('')
  const [tipoDesconto, setTipoDesconto] = useState<'percentual' | 'valor_fixo'>('percentual')
  const [valor, setValor] = useState<string>('15')
  const [segmentoAlvo, setSegmentoAlvo] = useState<'todos' | 'nunca_agendou' | 'inativa'>('todos')
  const [limiteUsoTotal, setLimiteUsoTotal] = useState<string>('')
  const [limiteUsoPorCliente, setLimiteUsoPorCliente] = useState<string>('1')
  const [validoAte, setValidoAte] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch Cupons
  const loadCupons = async () => {
    setLoading(true)
    const res = await getCuponsProfissionalAction()
    if (res.success && res.cupons) {
      setCupons(res.cupons)
      onCouponsLoaded?.(res.cupons)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCupons()
  }, [])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleOpenCreateModal = () => {
    setEditingCupom(null)
    setCodigo('')
    setTipoDesconto('percentual')
    setValor('15')
    setSegmentoAlvo('todos')
    setLimiteUsoTotal('')
    setLimiteUsoPorCliente('1')
    setValidoAte('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (cupom: CupomProfissionalItem) => {
    setEditingCupom(cupom)
    setCodigo(cupom.codigo)
    setTipoDesconto(cupom.tipo_desconto)
    setValor(String(cupom.valor))
    setSegmentoAlvo(cupom.segmento_alvo)
    setLimiteUsoTotal(cupom.limite_uso_total ? String(cupom.limite_uso_total) : '')
    setLimiteUsoPorCliente(String(cupom.limite_uso_por_cliente || 1))
    setValidoAte(cupom.valido_ate ? cupom.valido_ate.split('T')[0] : '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (cupom: CupomProfissionalItem) => {
    const novoStatus = !cupom.ativo
    const res = await toggleCupomStatusAction(cupom.id, novoStatus)
    if (res.success) {
      setCupons((prev) =>
        prev.map((c) => (c.id === cupom.id ? { ...c, ativo: novoStatus } : c))
      )
    } else {
      alert(res.message || 'Erro ao alterar status do cupom.')
    }
  }

  const handleDeleteCupom = async (cupom: CupomProfissionalItem) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom "${cupom.codigo}"?`)) return

    const res = await deleteCupomAction(cupom.id)
    if (res.success) {
      setCupons((prev) => prev.filter((c) => c.id !== cupom.id))
    } else {
      alert(res.message || 'Erro ao excluir cupom.')
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const numValor = parseFloat(valor.replace(',', '.'))
    if (isNaN(numValor) || numValor <= 0) {
      setFormError('Informe um valor de desconto válido maior que zero.')
      return
    }

    if (tipoDesconto === 'percentual' && numValor > 90) {
      setFormError('O desconto percentual máximo permitido é de 90%.')
      return
    }

    setIsSubmitting(true)

    const payload = {
      codigo: codigo.trim().toUpperCase(),
      tipo_desconto: tipoDesconto,
      valor: numValor,
      segmento_alvo: segmentoAlvo,
      limite_uso_total: limiteUsoTotal ? parseInt(limiteUsoTotal, 10) : null,
      limite_uso_por_cliente: limiteUsoPorCliente ? parseInt(limiteUsoPorCliente, 10) : 1,
      valido_ate: validoAte ? new Date(`${validoAte}T23:59:59`).toISOString() : null,
    }

    let res
    if (editingCupom) {
      res = await updateCupomAction(editingCupom.id, payload)
    } else {
      res = await createCupomAction(payload)
    }

    setIsSubmitting(false)

    if (res.success) {
      setIsModalOpen(false)
      loadCupons()
    } else {
      setFormError(res.message || 'Erro ao salvar cupom.')
    }
  }

  const getSegmentoLabel = (seg: CupomProfissionalItem['segmento_alvo']) => {
    switch (seg) {
      case 'nunca_agendou':
        return 'Novas Clientes (Primeira Visita)'
      case 'inativa':
        return 'Clientes Inativas (+60 dias sem agendamento)'
      case 'todos':
      default:
        return 'Qualquer Cliente'
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo: Botão Criar Cupom */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-[#4A3F5C] flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#8675A9]" />
            <span>Seus Cupons de Desconto</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Crie códigos promocionais para fidelizar clientes, recuperar inativas ou atrair novos atendimentos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold shadow-xs hover:bg-[#3d334d] transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Cupom</span>
        </button>
      </div>

      {/* Listagem de Cupons */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-[#8675A9]" />
        </div>
      ) : cupons.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-2xs space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-[#8675A9] flex items-center justify-center mx-auto">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#4A3F5C]">Nenhum cupom criado ainda</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Crie seu primeiro cupom promocional para enviar pelo WhatsApp ou divulgar no Instagram das suas clientes.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100/70 text-[#4A3F5C] hover:bg-purple-200/70 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Primeiro Cupom</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cupons.map((cupom) => {
            const isExpired = cupom.valido_ate && new Date() > new Date(cupom.valido_ate)
            const isLimitReached =
              cupom.limite_uso_total !== null && cupom.usos_atuais >= cupom.limite_uso_total

            return (
              <div
                key={cupom.id}
                className={`bg-white rounded-3xl p-5 border transition flex flex-col justify-between space-y-4 relative shadow-2xs ${
                  !cupom.ativo || isExpired || isLimitReached
                    ? 'border-gray-200/70 opacity-75 bg-gray-50/40'
                    : 'border-purple-100/80 hover:border-[#B8A9D9] hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Cabeçalho do Card: Código + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-extrabold tracking-wider text-[#4A3F5C] bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200/80">
                          {cupom.codigo}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(cupom.codigo)}
                          className="p-1 text-gray-400 hover:text-[#4A3F5C] transition cursor-pointer"
                          title="Copiar código do cupom"
                        >
                          {copiedCode === cupom.codigo ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="text-xl font-extrabold text-emerald-700">
                        {cupom.tipo_desconto === 'percentual'
                          ? `${cupom.valor}% OFF`
                          : `R$ ${Number(cupom.valor).toFixed(2)} OFF`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Expirado
                        </span>
                      ) : isLimitReached ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Esgotado
                        </span>
                      ) : cupom.ativo ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          Pausado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalhes do Segmento e Métricas */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-3.5 w-3.5 text-[#8675A9] shrink-0" />
                      <span className="font-semibold text-gray-700 truncate">
                        {getSegmentoLabel(cupom.segmento_alvo)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 pt-1">
                      <span className="text-[11px] font-medium text-gray-500">Utilizações:</span>
                      <strong className="text-xs font-bold text-[#4A3F5C]">
                        {cupom.usos_atuais} {cupom.limite_uso_total ? `/ ${cupom.limite_uso_total}` : 'usos'}
                      </strong>
                    </div>

                    {cupom.valido_ate && (
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-[11px] font-medium text-gray-500">Validade:</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {new Date(cupom.valido_ate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(cupom)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer hover:bg-gray-50 text-gray-700 border-gray-200"
                  >
                    {cupom.ativo ? (
                      <>
                        <Pause className="h-3.5 w-3.5 text-amber-600" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Ativar</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cupom)}
                      className="p-1.5 text-gray-400 hover:text-[#4A3F5C] rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      title="Editar cupom"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCupom(cupom)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Excluir cupom"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar Cupom */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#8675A9]" />
                <span>{editingCupom ? 'Editar Cupom' : 'Criar Novo Cupom'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Código do Cupom */}
              <div>
                <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="EX: PROMO15, VOLTA20, NOVALUME"
                  className="w-full uppercase font-mono tracking-wider rounded-2xl border border-gray-200 p-3 text-sm text-[#4A3F5C] font-bold focus:border-[#B8A9D9] focus:outline-hidden"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Apenas letras maiúsculas, números e hífens.
                </p>
              </div>

              {/* Tipo de Desconto e Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                    Tipo de Desconto
                  </label>
                  <select
                    value={tipoDesconto}
                    onChange={(e) => setTipoDesconto(e.target.value as any)}
                    className="w-full rounded-2xl border border-gray-200 p-3 text-xs text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:outline-hidden bg-white"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="valor_fixo">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                    {tipoDesconto === 'percentual' ? 'Porcentagem (%)' : 'Valor (R$)'} *
                  </label>
                  <input
                    type="number"
                    step={tipoDesconto === 'percentual' ? '1' : '0.5'}
                    min="1"
                    max={tipoDesconto === 'percentual' ? '90' : '9999'}
                    required
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder={tipoDesconto === 'percentual' ? '15' : '20.00'}
                    className="w-full rounded-2xl border border-gray-200 p-3 text-sm text-[#4A3F5C] font-bold focus:border-[#B8A9D9] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Segmento Alvo */}
              <div>
                <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                  Quem pode usar este cupom?
                </label>
                <select
                  value={segmentoAlvo}
                  onChange={(e) => setSegmentoAlvo(e.target.value as any)}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-xs text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:outline-hidden bg-white"
                >
                  <option value="todos">Qualquer cliente</option>
                  <option value="nunca_agendou">Apenas quem nunca agendou (Novas clientes)</option>
                  <option value="inativa">Apenas clientes inativas (+60 dias sem agendamento)</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Ao criar cupons segmentados, o sistema sugere o código na tela da cliente.
                </p>
              </div>

              {/* Limite Total e Validade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                    Limite Total de Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={limiteUsoTotal}
                    onChange={(e) => setLimiteUsoTotal(e.target.value)}
                    placeholder="Ex: 50 (opcional)"
                    className="w-full rounded-2xl border border-gray-200 p-3 text-xs text-[#4A3F5C] font-medium focus:border-[#B8A9D9] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3F5C] mb-1">
                    Válido Até (Opcional)
                  </label>
                  <input
                    type="date"
                    value={validoAte}
                    onChange={(e) => setValidoAte(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 p-2.5 text-xs text-[#4A3F5C] font-medium focus:border-[#B8A9D9] focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingCupom ? 'Salvar Alterações' : 'Criar Cupom'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

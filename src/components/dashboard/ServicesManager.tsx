'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
  toggleServiceStatusAction,
  ServiceFormData,
} from '@/app/actions/services'
import { validateImageMagicBytes } from '@/lib/utils/imageValidation'
import Toast from '@/components/ui/Toast'
import {
  Scissors,
  Plus,
  Clock,
  Calendar,
  Pencil,
  Trash2,
  X,
  Loader2,
  Power,
  UploadCloud,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Tag,
  Check,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react'
import {
  ComboItem,
  createComboAction,
  updateComboAction,
  deleteComboAction,
  toggleComboStatusAction,
  getCombosProfissionalAction,
} from '@/app/actions/combos'

export interface ServiceRow {
  id: string
  profissional_id: string
  nome: string
  descricao?: string | null
  duracao_minutos: number
  preco: number
  foto_url: string | null
  intervalo_manutencao_dias: number | null
  ativo?: boolean | null
  pending_bookings_count?: number
  created_at: string
}

interface ServicesManagerProps {
  initialServices: ServiceRow[]
  initialCombos?: ComboItem[]
  profissionalId?: string
}

function getStoragePathFromPublicUrl(url: string, bucketName: string): string | null {
  if (!url) return null
  const bucketSegment = `/${bucketName}/`
  const index = url.indexOf(bucketSegment)
  if (index !== -1) {
    return url.substring(index + bucketSegment.length)
  }
  return null
}

export default function ServicesManager({ initialServices, initialCombos, profissionalId }: ServicesManagerProps) {
  const [activeTab, setActiveTab] = useState<'servicos' | 'combos'>('servicos')
  const [services, setServices] = useState<ServiceRow[]>(initialServices)
  const [combos, setCombos] = useState<ComboItem[]>(initialCombos || [])
  const [expandedComboId, setExpandedComboId] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<ServiceRow | null>(null)

  // Form State
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [duracaoMinutos, setDuracaoMinutos] = useState('60')
  const [preco, setPreco] = useState('100')
  const [fotoUrl, setFotoUrl] = useState('')
  const [previousFotoUrl, setPreviousFotoUrl] = useState<string | null>(null)
  const [intervaloManutencao, setIntervaloManutencao] = useState('')

  // Upload & Drag-and-Drop state
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Combos State & Handlers
  const [showComboModal, setShowComboModal] = useState(false)
  const [editingCombo, setEditingCombo] = useState<ComboItem | null>(null)
  const [comboNome, setComboNome] = useState('')
  const [comboDescricao, setComboDescricao] = useState('')
  const [comboPreco, setComboPreco] = useState('')
  const [comboFotoUrl, setComboFotoUrl] = useState('')
  const [comboServicoIds, setComboServicoIds] = useState<string[]>([])
  const [comboSaving, setComboSaving] = useState(false)
  const [comboUploading, setComboUploading] = useState(false)
  const [isComboDragging, setIsComboDragging] = useState(false)
  const [deletingComboId, setDeletingComboId] = useState<string | null>(null)

  // Seleção de serviços do combo (Simples ou Múltipla com Dropdown Rico idêntico ao agendamento)
  const [isComboMultiSelect, setIsComboMultiSelect] = useState(false)
  const [isComboServiceDropdownOpen, setIsComboServiceDropdownOpen] = useState(false)
  const comboServiceDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        comboServiceDropdownRef.current &&
        !comboServiceDropdownRef.current.contains(e.target as Node)
      ) {
        setIsComboServiceDropdownOpen(false)
      }
    }
    if (isComboServiceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isComboServiceDropdownOpen])

  const handleComboDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsComboDragging(true)
  }

  const handleComboDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsComboDragging(false)
  }

  const handleComboDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsComboDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleComboPhotoUpload(files[0])
    }
  }

  const handleRemoveComboPhoto = () => {
    setComboFotoUrl('')
  }

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const openCreateComboModal = () => {
    setEditingCombo(null)
    setComboNome('')
    setComboDescricao('')
    setComboPreco('')
    setComboFotoUrl('')
    setComboServicoIds(services.length > 0 ? [services[0].id] : [])
    setIsComboMultiSelect(false)
    setIsComboServiceDropdownOpen(false)
    setShowComboModal(true)
  }

  const openEditComboModal = (c: ComboItem) => {
    setEditingCombo(c)
    setComboNome(c.nome)
    setComboDescricao(c.descricao || '')
    setComboPreco(String(c.preco_combo))
    setComboFotoUrl(c.foto_url || '')
    setComboServicoIds(c.servicos.map((s) => s.id))
    setIsComboMultiSelect(c.servicos.length > 1)
    setIsComboServiceDropdownOpen(false)
    setShowComboModal(true)
  }

  const toggleComboServico = (id: string) => {
    setComboServicoIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    )
  }

  const selectedServicosForCombo = services.filter((s) => comboServicoIds.includes(s.id))
  const comboDuracaoCalculada = selectedServicosForCombo.reduce((acc, s) => acc + s.duracao_minutos, 0)
  const comboPrecoOriginalSoma = selectedServicosForCombo.reduce((acc, s) => acc + Number(s.preco), 0)
  const comboPrecoNum = Number(comboPreco) || 0
  const comboEconomiaCalculada = Math.max(0, comboPrecoOriginalSoma - comboPrecoNum)

  const handleComboPhotoUpload = async (file: File) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setToast({
        show: true,
        message: 'Formato inválido. Selecione uma imagem JPG, PNG, WEBP ou GIF.',
        type: 'error',
      })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setToast({
        show: true,
        message: 'A imagem excede o tamanho máximo de 5MB.',
        type: 'error',
      })
      return
    }

    setComboUploading(true)

    try {
      const validation = await validateImageMagicBytes(file)
      if (!validation.valid) {
        setToast({
          show: true,
          message: validation.error || 'Arquivo de imagem inválido.',
          type: 'error',
        })
        return
      }

      const supabase = createClient()
      let profId = profissionalId
      if (!profId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        profId = user?.id
      }

      if (!profId) throw new Error('Usuário não autenticado.')

      const fileExt = validation.detectedType || file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${profId}/combo-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('servicos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('servicos')
        .getPublicUrl(filePath)

      setComboFotoUrl(publicUrlData.publicUrl)
      setToast({
        show: true,
        message: 'Foto do pacote carregada!',
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar foto'
      setToast({ show: true, message: msg, type: 'error' })
    } finally {
      setComboUploading(false)
    }
  }

  const handleComboSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (comboServicoIds.length < 1) {
      setToast({
        show: true,
        message: 'Selecione ao menos 1 serviço para compor o pacote.',
        type: 'error',
      })
      return
    }

    const precoNumVal = Number(comboPreco)
    if (!precoNumVal || precoNumVal <= 0) {
      setToast({
        show: true,
        message: 'Informe um preço válido para o pacote.',
        type: 'error',
      })
      return
    }

    setComboSaving(true)

    try {
      if (editingCombo) {
        const res = await updateComboAction(editingCombo.id, {
          nome: comboNome,
          descricao: comboDescricao || null,
          preco_combo: precoNumVal,
          foto_url: comboFotoUrl || null,
          servico_ids: comboServicoIds,
        })

        if (!res.success) {
          setToast({ show: true, message: res.message || 'Erro ao atualizar pacote.', type: 'error' })
          return
        }

        const selectedServicos = services.filter((s) => comboServicoIds.includes(s.id))
        const duracaoTotalMinutos = selectedServicos.reduce((acc, s) => acc + s.duracao_minutos, 0)
        const precoOriginalTotal = selectedServicos.reduce((acc, s) => acc + Number(s.preco), 0)

        setCombos((prev) =>
          prev.map((c) =>
            c.id === editingCombo.id
              ? {
                  ...c,
                  nome: comboNome,
                  descricao: comboDescricao || null,
                  preco_combo: precoNumVal,
                  foto_url: comboFotoUrl || null,
                  servicos: selectedServicos.map((s) => ({
                    id: s.id,
                    nome: s.nome,
                    duracao_minutos: s.duracao_minutos,
                    preco: s.preco,
                    foto_url: s.foto_url,
                  })),
                  duracaoTotalMinutos,
                  precoOriginalTotal,
                  descontoEconomia: Math.max(0, precoOriginalTotal - precoNumVal),
                }
              : c
          )
        )
        setToast({ show: true, message: 'Pacote atualizado com sucesso!', type: 'success' })
      } else {
        const res = await createComboAction({
          nome: comboNome,
          descricao: comboDescricao || null,
          preco_combo: precoNumVal,
          foto_url: comboFotoUrl || null,
          servico_ids: comboServicoIds,
        })

        if (!res.success) {
          setToast({ show: true, message: res.message || 'Erro ao cadastrar pacote.', type: 'error' })
          return
        }

        const reloaded = await getCombosProfissionalAction(profissionalId)
        setCombos(reloaded)
        setToast({ show: true, message: 'Pacote cadastrado com sucesso!', type: 'success' })
      }

      setShowComboModal(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar pacote.'
      setToast({ show: true, message: msg, type: 'error' })
    } finally {
      setComboSaving(false)
    }
  }

  const handleToggleComboStatus = async (comboId: string, currentAtivo: boolean) => {
    const newAtivo = !currentAtivo
    setCombos((prev) => prev.map((c) => (c.id === comboId ? { ...c, ativo: newAtivo } : c)))
    const res = await toggleComboStatusAction(comboId, newAtivo)
    if (!res.success) {
      setCombos((prev) => prev.map((c) => (c.id === comboId ? { ...c, ativo: currentAtivo } : c)))
      setToast({ show: true, message: res.message || 'Erro ao alterar status.', type: 'error' })
    } else {
      setToast({
        show: true,
        message: newAtivo ? 'Pacote ativado!' : 'Pacote pausado.',
        type: 'info',
      })
    }
  }

  const handleDeleteCombo = async (comboId: string) => {
    if (!confirm('Deseja realmente excluir este pacote? As clientes não poderão mais agendá-lo.')) {
      return
    }
    setDeletingComboId(comboId)
    const res = await deleteComboAction(comboId)
    setDeletingComboId(null)
    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao excluir pacote.', type: 'error' })
    } else {
      setCombos((prev) => prev.filter((c) => c.id !== comboId))
      setToast({ show: true, message: 'Pacote excluído com sucesso!', type: 'success' })
    }
  }

  const openCreateModal = () => {
    setEditingService(null)
    setNome('')
    setDescricao('')
    setDuracaoMinutos('60')
    setPreco('100')
    setFotoUrl('')
    setPreviousFotoUrl(null)
    setIntervaloManutencao('')
    setShowModal(true)
  }

  const openEditModal = (s: ServiceRow) => {
    setEditingService(s)
    setNome(s.nome)
    setDescricao(s.descricao || '')
    setDuracaoMinutos(String(s.duracao_minutos))
    setPreco(String(s.preco))
    setFotoUrl(s.foto_url || '')
    setPreviousFotoUrl(s.foto_url || null)
    setIntervaloManutencao(s.intervalo_manutencao_dias ? String(s.intervalo_manutencao_dias) : '')
    setShowModal(true)
  }

  const handlePhotoUpload = async (file: File) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setToast({
        show: true,
        message: 'Formato inválido. Selecione uma imagem JPG, PNG, WEBP ou GIF.',
        type: 'error',
      })
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setToast({
        show: true,
        message: 'A imagem excede o tamanho máximo de 5MB.',
        type: 'error',
      })
      return
    }

    setUploading(true)

    try {
      // Validação de Assinatura Binária (Magic Bytes)
      const validation = await validateImageMagicBytes(file)
      if (!validation.valid) {
        setToast({
          show: true,
          message: validation.error || 'Arquivo de imagem inválido.',
          type: 'error',
        })
        return
      }

      const supabase = createClient()

      let profId = profissionalId
      if (!profId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        profId = user?.id
      }

      if (!profId) {
        throw new Error('Usuário não autenticado.')
      }

      const fileExt = validation.detectedType || file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${profId}/servico-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('servicos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from('servicos')
        .getPublicUrl(filePath)

      // Se havia uma foto antiga armazenada no storage, apagar para evitar resíduos
      if (previousFotoUrl) {
        const oldStoragePath = getStoragePathFromPublicUrl(previousFotoUrl, 'servicos')
        if (oldStoragePath) {
          await supabase.storage.from('servicos').remove([oldStoragePath])
        }
      }

      const newUrl = publicUrlData.publicUrl
      setFotoUrl(newUrl)
      setPreviousFotoUrl(newUrl)
      setToast({
        show: true,
        message: 'Foto do serviço enviada com sucesso!',
        type: 'success',
      })
    } catch (err: unknown) {
      console.error('Erro no upload da foto do serviço:', err)
      const errorObj = err as { message?: string }
      setToast({
        show: true,
        message: errorObj?.message
          ? `Falha no upload: ${errorObj.message}`
          : 'Erro ao enviar a foto do serviço. Verifique o bucket e permissões RLS.',
        type: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (previousFotoUrl) {
      const oldStoragePath = getStoragePathFromPublicUrl(previousFotoUrl, 'servicos')
      if (oldStoragePath) {
        try {
          const supabase = createClient()
          await supabase.storage.from('servicos').remove([oldStoragePath])
        } catch (err) {
          console.error('Erro ao remover foto antiga:', err)
        }
      }
    }
    setFotoUrl('')
    setPreviousFotoUrl(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handlePhotoUpload(files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    const payload: ServiceFormData = {
      nome,
      descricao: descricao || null,
      duracao_minutos: Number(duracaoMinutos),
      preco: Number(preco),
      foto_url: fotoUrl || null,
      intervalo_manutencao_dias: intervaloManutencao ? Number(intervaloManutencao) : null,
    }

    if (editingService) {
      const res = await updateServiceAction(editingService.id, payload)
      if (!res.success) {
        setToast({ show: true, message: res.message || 'Erro ao atualizar serviço.', type: 'error' })
      } else {
        setShowModal(false)
        setToast({ show: true, message: 'Serviço atualizado com sucesso!', type: 'success' })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } else {
      const res = await createServiceAction(payload)
      if (!res.success) {
        setToast({ show: true, message: res.message || 'Erro ao criar serviço.', type: 'error' })
      } else {
        setShowModal(false)
        setToast({ show: true, message: 'Serviço cadastrado com sucesso!', type: 'success' })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    setSaving(false)
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return

    setDeletingId(serviceId)
    setToast(null)

    const res = await deleteServiceAction(serviceId)
    setDeletingId(null)

    if (!res.success) {
      setToast({ show: true, message: res.message || 'Erro ao excluir serviço.', type: 'error' })
    } else {
      if (res.isSoftDeleted) {
        setToast({
          show: true,
          message: res.message || 'O serviço possuía históricos e foi desativado.',
          type: 'info',
        })
      } else {
        setToast({ show: true, message: 'Serviço excluído com sucesso!', type: 'success' })
      }
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, ativo: false } : s)).filter((s) => !res.isSoftDeleted || s.id === serviceId)
      )
      setTimeout(() => {
        window.location.reload()
      }, 1200)
    }
  }

  const handleToggleStatus = async (serviceId: string, currentAtivo: boolean) => {
    const nextAtivo = !currentAtivo
    const res = await toggleServiceStatusAction(serviceId, nextAtivo)
    if (res.success) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, ativo: nextAtivo, pending_bookings_count: res.pendingCount ?? s.pending_bookings_count }
            : s
        )
      )
      setToast({
        show: true,
        message: res.message || `Serviço ${nextAtivo ? 'ativado' : 'desativado'} com sucesso!`,
        type: 'success',
      })
    } else {
      setToast({ show: true, message: res.message || 'Erro ao alterar status.', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Abas com Animação Suave: Serviços vs Pacotes (Itens 6, 7, 8 e 9) */}
      <div className="relative flex items-center p-1 rounded-2xl bg-gray-100/90 border border-gray-200/80 max-w-md">
        <div
          className="absolute top-1 bottom-1 rounded-xl bg-white shadow-xs transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: activeTab === 'servicos' ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)',
          }}
        />
        <button
          type="button"
          onClick={() => setActiveTab('servicos')}
          className={`relative z-10 flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'servicos'
              ? 'text-[#4A3F5C]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Scissors className="h-4 w-4 text-[#8675A9]" />
          <span>Serviços ({services.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('combos')}
          className={`relative z-10 flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'combos'
              ? 'text-[#4A3F5C]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="h-4 w-4 text-[#8675A9]" />
          <span>Pacotes ({combos.length})</span>
        </button>
      </div>

      {activeTab === 'servicos' ? (
        <>
          {/* Card de Destaque + Botão Cadastrar Novo Serviço Esticado (Item 6) */}
          <div className="space-y-3">
            <div className="rounded-3xl bg-white p-5 border border-gray-200/80 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#4A3F5C] border border-[#B8A9D9]/30">
                  <Scissors className="h-5 w-5 text-[#B8A9D9]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total de Serviços Cadastrados</span>
                  <strong className="text-xl font-bold text-[#4A3F5C]">
                    {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="w-full py-3.5 rounded-2xl bg-[#4A3F5C] text-xs font-semibold text-white shadow-xs hover:bg-[#393047] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 text-[#B8A9D9]" />
              <span>Cadastrar Novo Serviço</span>
            </button>
          </div>

          {services.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-12 text-center bg-white shadow-2xs">
              <Scissors className="mx-auto h-12 w-12 text-[#B8A9D9] mb-4" />
              <h3 className="text-base font-bold text-[#4A3F5C]">Nenhum serviço cadastrado</h3>
              <p className="mt-1 text-xs text-gray-500 font-medium max-w-sm mx-auto">
                Cadastre seus procedimentos para começar a receber agendamentos online de suas clientes.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#4A3F5C] px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-[#393047] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#B8A9D9]" />
                <span>Adicionar Primeiro Serviço</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => {
                const isAtivo = s.ativo !== false
                return (
                  <div
                    key={s.id}
                    className={`rounded-3xl bg-white p-4 shadow-xs border transition flex flex-col justify-between h-full space-y-4 ${
                      isAtivo ? 'border-gray-200/80 hover:border-[#B8A9D9]' : 'border-gray-200 opacity-60 bg-gray-50/50'
                    }`}
                  >
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Foto Banner Ampliada (Item 15) */}
                    <div className="relative h-40 w-full shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-purple-50/60 mb-3 shadow-2xs">
                      {s.foto_url ? (
                        <Image src={s.foto_url} alt={s.nome} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#B8A9D9]">
                          <Scissors className="h-10 w-10 opacity-70" />
                        </div>
                      )}

                      {!isAtivo && (
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-900/80 text-white backdrop-blur-xs">
                          Desativado
                        </div>
                      )}
                    </div>

                    {/* Nome do Serviço */}
                    <h3 className="font-bold text-base text-[#4A3F5C] leading-snug line-clamp-1">
                      {s.nome}
                    </h3>

                    {/* Descrição */}
                    <div className="min-h-[2.25rem] flex items-center mt-1">
                      {s.descricao ? (
                        <p className="text-xs text-[#4A3F5C]/75 leading-relaxed line-clamp-2">
                          {s.descricao}
                        </p>
                      ) : (
                        <p className="text-xs text-transparent select-none">—</p>
                      )}
                    </div>

                    {/* Duração e Preço */}
                    <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-gray-100 mt-2">
                      <div className="flex items-center gap-1.5 text-[#4A3F5C]/80 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200/60">
                        <Clock className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span>{s.duracao_minutos} min</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                        <span>R$ {Number(s.preco).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Intervalo de Manutenção (Item 7) */}
                  <div className="min-h-[1.75rem] flex flex-col justify-center mt-2 space-y-2">
                    {s.intervalo_manutencao_dias ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#4A3F5C] bg-[#FAF7F5] px-2.5 py-1.5 rounded-xl border border-[#B8A9D9]/30 font-semibold w-full">
                        <Calendar className="h-3.5 w-3.5 text-[#B8A9D9]" />
                        <span>Manutenção a cada {s.intervalo_manutencao_dias} dias</span>
                      </div>
                    ) : null}

                    {/* Alerta de Serviço Desativado com Atendimentos Pendentes */}
                    {!isAtivo && (
                      <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-semibold">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>
                          {s.pending_bookings_count && s.pending_bookings_count > 0
                            ? `Desativado para novas clientes · Possui ${s.pending_bookings_count} ${
                                s.pending_bookings_count === 1
                                  ? 'atendimento agendado'
                                  : 'atendimentos agendados'
                              }`
                            : 'Desativado para novas clientes'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Serviço */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(s.id, isAtivo)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isAtivo
                        ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                    title={isAtivo ? 'Desativar serviço' : 'Ativar serviço'}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{isAtivo ? 'Desativar' : 'Ativar'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-[#4A3F5C] transition cursor-pointer"
                      title="Editar serviço"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                      title="Excluir serviço"
                    >
                      {deletingId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
        </>
      ) : (
        <>
          {/* Aba de Pacotes: Header e Botão */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 border border-gray-200/80 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#4A3F5C] border border-[#B8A9D9]/30">
                  <Package className="h-5 w-5 text-[#B8A9D9]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total de Pacotes Cadastrados</span>
                  <strong className="text-xl font-bold text-[#4A3F5C]">
                    {combos.length} {combos.length === 1 ? 'pacote' : 'pacotes'}
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateComboModal}
              className="w-full py-3.5 rounded-2xl bg-[#4A3F5C] text-xs font-semibold text-white shadow-xs hover:bg-[#393047] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 text-[#B8A9D9]" />
              <span>Criar Novo Pacote</span>
            </button>
          </div>

          {/* Lista de Pacotes (Inspirada no modelo de assinatura / barbearia) */}
          {combos.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center border border-gray-100 shadow-xs space-y-3">
              <Package className="mx-auto h-8 w-8 text-[#B8A9D9]" />
              <h3 className="text-sm font-bold text-[#4A3F5C]">Nenhum pacote cadastrado</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Agrupe serviços ou crie pacotes de assinatura (ex: Cílios + Manutenção) com valor especial para fidelizar suas clientes.
              </p>
              <button
                type="button"
                onClick={openCreateComboModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-100 text-[#4A3F5C] text-xs font-bold hover:bg-purple-200 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Criar Primeiro Pacote</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {combos.map((combo) => {
                const isAtivo = combo.ativo !== false

                return (
                  <div
                    key={combo.id}
                    className={`rounded-3xl bg-white p-4 shadow-xs border transition flex flex-col justify-between h-full space-y-4 ${
                      isAtivo
                        ? 'border-gray-200/80 hover:border-[#B8A9D9]'
                        : 'border-gray-200 opacity-60 bg-gray-50/50'
                    }`}
                  >
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Foto Banner Ampliada do Pacote (Igual ao Serviço) */}
                        <div className="relative h-40 w-full shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-purple-50/60 mb-3 shadow-2xs">
                          {combo.foto_url ? (
                            <Image
                              src={combo.foto_url}
                              alt={combo.nome}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#B8A9D9]">
                              <Package className="h-10 w-10 opacity-70" />
                            </div>
                          )}

                          {!isAtivo && (
                            <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-900/80 text-white backdrop-blur-xs">
                              Desativado
                            </div>
                          )}
                        </div>

                        {/* Nome do Pacote */}
                        <h3 className="font-bold text-base text-[#4A3F5C] leading-snug line-clamp-1">
                          {combo.nome}
                        </h3>

                        {/* Descrição */}
                        <div className="min-h-[2.25rem] flex items-center mt-1">
                          {combo.descricao ? (
                            <p className="text-xs text-[#4A3F5C]/75 leading-relaxed line-clamp-2">
                              {combo.descricao}
                            </p>
                          ) : (
                            <p className="text-xs text-transparent select-none">—</p>
                          )}
                        </div>

                        {/* Duração e Preço (Padronizado como no card de serviços) */}
                        <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-gray-100 mt-2">
                          <div className="flex items-center gap-1.5 text-[#4A3F5C]/80 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200/60">
                            <Clock className="h-3.5 w-3.5 text-[#B8A9D9]" />
                            <span>{combo.duracaoTotalMinutos} min total</span>
                          </div>
                          <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                            {combo.precoOriginalTotal > combo.preco_combo && (
                              <span className="text-[10px] text-gray-400 line-through mr-1 font-normal">
                                R$ {combo.precoOriginalTotal.toFixed(2)}
                              </span>
                            )}
                            <span>R$ {combo.preco_combo.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Botão Acordeon de Serviços Inclusos */}
                        <div className="pt-2 border-t border-gray-100 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedComboId(expandedComboId === combo.id ? null : combo.id)
                            }
                            className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FAF7F5] border border-purple-100/70 text-xs font-bold text-[#4A3F5C] hover:bg-purple-50/60 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5 text-[#8675A9]" />
                              <span>{combo.servicos.length} serviços inclusos</span>
                            </span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                                expandedComboId === combo.id ? 'rotate-180 text-[#8675A9]' : ''
                              }`}
                            />
                          </button>

                          {/* Lista aberta dos serviços com foto na esquerda */}
                          {expandedComboId === combo.id && (
                            <div className="space-y-1.5 pt-2 animate-in fade-in duration-200">
                              {combo.servicos.map((s) => (
                                <div
                                  key={s.id}
                                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-100 shadow-2xs"
                                >
                                  <div className="relative h-9 w-9 rounded-lg bg-gray-50 border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                                    {s.foto_url ? (
                                      <Image
                                        src={s.foto_url}
                                        alt={s.nome}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    ) : (
                                      <Scissors className="h-3.5 w-3.5 text-[#8675A9]" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[#4A3F5C] truncate">{s.nome}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                      <span className="text-emerald-700 font-bold">
                                        R$ {Number(s.preco).toFixed(2)}
                                      </span>
                                      <span className="mx-1">•</span>
                                      <span>{s.duracao_minutos} min</span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações do Pacote (Idênticas às de serviços) */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleToggleComboStatus(combo.id, isAtivo)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            isAtivo
                              ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={isAtivo ? 'Desativar pacote' : 'Ativar pacote'}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{isAtivo ? 'Desativar' : 'Ativar'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditComboModal(combo)}
                            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-[#4A3F5C] transition cursor-pointer"
                            title="Editar pacote"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingComboId === combo.id}
                            onClick={() => handleDeleteCombo(combo.id)}
                            className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                            title="Excluir pacote"
                          >
                            {deletingComboId === combo.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
            )}
          </>
        )}

      {/* Modal de Criação / Edição de Serviço (Item 10a: Responsivo para mobile) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-4 sm:p-6 shadow-2xl space-y-5 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg sm:text-xl font-bold text-[#4A3F5C]">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Extensão de Cílios Volume Russo"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                />
              </div>

              {/* Descrição Breve (Item 27: Limite de 60 caracteres) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80">
                    Descrição Breve (Opcional)
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      descricao.length >= 60 ? 'text-amber-600' : 'text-gray-400'
                    }`}
                  >
                    {descricao.length}/60
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={60}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value.slice(0, 60))}
                  placeholder="Ex: Fios de alta qualidade com técnica volume russo para olhar marcante."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#4A3F5C] focus:border-[#B8A9D9] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Upload de Foto do Serviço */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-2">
                  Foto do Serviço
                </label>

                {uploading ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#B8A9D9] bg-purple-50/40 text-center space-y-2">
                    <Loader2 className="h-7 w-7 animate-spin text-[#4A3F5C]" />
                    <p className="text-xs font-semibold text-[#4A3F5C]">Enviando foto para o Storage...</p>
                    <p className="text-[11px] text-gray-500">Aguarde a conclusão do upload antes de salvar.</p>
                  </div>
                ) : fotoUrl ? (
                  <div className="relative rounded-2xl border border-gray-200 p-3 bg-gray-50/50 flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-2xs">
                      <Image
                        src={fotoUrl}
                        alt={nome || 'Preview do serviço'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Imagem enviada com sucesso</span>
                      </p>
                      {/* Item 8: Botões Padronizados */}
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-[#4A3F5C] hover:bg-gray-100 transition shadow-2xs">
                          <Camera className="h-3.5 w-3.5 text-[#B8A9D9]" />
                          <span>Trocar</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handlePhotoUpload(file)
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                      isDragging
                        ? 'border-[#4A3F5C] bg-[#B8A9D9]/20 scale-[0.99]'
                        : 'border-gray-200 bg-gray-50/50 hover:border-[#B8A9D9] hover:bg-purple-50/30'
                    }`}
                  >
                    <label className="cursor-pointer block space-y-2">
                      <UploadCloud className="mx-auto h-8 w-8 text-[#B8A9D9]" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#4A3F5C]">
                          Arraste e solte uma imagem aqui, ou{' '}
                          <span className="text-purple-600 underline">clique para selecionar</span>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Formatos aceitos: JPG, PNG, WebP ou GIF (máx. 5MB). Dimensão recomendada: 600x600px (quadrada).
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePhotoUpload(file)
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                    Duração (Minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={duracaoMinutos}
                    onChange={(e) => setDuracaoMinutos(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                  Intervalo de Manutenção (Dias)
                </label>
                <input
                  type="number"
                  min="1"
                  value={intervaloManutencao}
                  onChange={(e) => setIntervaloManutencao(e.target.value)}
                  placeholder="Ex: 21 (deixe em branco se não houver)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-xl bg-[#4A3F5C] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#393047] transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Combo */}
      {showComboModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-4 sm:p-6 shadow-2xl space-y-5 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg sm:text-xl font-bold text-[#4A3F5C]">
                {editingCombo ? 'Editar Pacote' : 'Novo Pacote'}
              </h3>
              <button
                type="button"
                onClick={() => setShowComboModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleComboSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                  Nome do Pacote *
                </label>
                <input
                  type="text"
                  required
                  value={comboNome}
                  onChange={(e) => setComboNome(e.target.value)}
                  placeholder="Ex: Pacote Cílios + Manutenção"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80">
                    Descrição Breve (Opcional)
                  </label>
                  <span className={`text-[11px] font-bold ${comboDescricao.length >= 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {comboDescricao.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={comboDescricao}
                  onChange={(e) => setComboDescricao(e.target.value)}
                  placeholder="Ex: Alongamento de cílios + 1 manutenção no mês"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                />
              </div>

              {/* Upload de Foto do Pacote (Inspirado no Criar Serviço) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-2">
                  Foto do Pacote (Opcional)
                </label>

                {comboUploading ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#B8A9D9] bg-purple-50/40 text-center space-y-2">
                    <Loader2 className="h-7 w-7 animate-spin text-[#4A3F5C]" />
                    <p className="text-xs font-semibold text-[#4A3F5C]">Enviando foto para o Storage...</p>
                    <p className="text-[11px] text-gray-500">Aguarde a conclusão do upload antes de salvar.</p>
                  </div>
                ) : comboFotoUrl ? (
                  <div className="relative rounded-2xl border border-gray-200 p-3 bg-gray-50/50 flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-2xs">
                      <Image
                        src={comboFotoUrl}
                        alt={comboNome || 'Preview do pacote'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Imagem enviada com sucesso</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-[#4A3F5C] hover:bg-gray-100 transition shadow-2xs">
                          <Camera className="h-3.5 w-3.5 text-[#B8A9D9]" />
                          <span>Trocar</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleComboPhotoUpload(file)
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveComboPhoto}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleComboDragOver}
                    onDragLeave={handleComboDragLeave}
                    onDrop={handleComboDrop}
                    className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                      isComboDragging
                        ? 'border-[#4A3F5C] bg-[#B8A9D9]/20 scale-[0.99]'
                        : 'border-gray-200 bg-gray-50/50 hover:border-[#B8A9D9] hover:bg-purple-50/30'
                    }`}
                  >
                    <label className="cursor-pointer block space-y-2">
                      <UploadCloud className="mx-auto h-8 w-8 text-[#B8A9D9]" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#4A3F5C]">
                          Arraste e solte uma imagem aqui, ou{' '}
                          <span className="text-purple-600 underline">clique para selecionar</span>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Formatos aceitos: JPG, PNG, WebP ou GIF (máx. 5MB). Dimensão recomendada: 600x600px.
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleComboPhotoUpload(file)
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Seção de Serviço com Botão 'Selecionar vários' no mesmo horizonte e Dropdown Rico com Fotos */}
              <div className="space-y-1.5" ref={comboServiceDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#4A3F5C]/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5 text-[#B8A9D9]" />
                    <span>{isComboMultiSelect ? 'Serviços Inclusos' : 'Serviço Incluso'} *</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !isComboMultiSelect
                      setIsComboMultiSelect(next)
                      if (next) {
                        if (comboServicoIds.length === 0 && services.length > 0) {
                          setComboServicoIds([services[0].id])
                        }
                      } else {
                        if (comboServicoIds.length > 0) {
                          setComboServicoIds([comboServicoIds[0]])
                        }
                      }
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                      isComboMultiSelect
                        ? 'bg-[#B8A9D9]/25 border-[#B8A9D9] text-[#4A3F5C]'
                        : 'bg-[#FAF7F5] border-gray-200/80 text-gray-600 hover:bg-gray-100 hover:text-[#4A3F5C]'
                    }`}
                  >
                    <span>Selecionar vários</span>
                    {isComboMultiSelect && comboServicoIds.length > 1 && (
                      <span className="h-4 w-4 rounded-full bg-[#4A3F5C] text-white text-[10px] flex items-center justify-center font-bold">
                        {comboServicoIds.length}
                      </span>
                    )}
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-semibold">
                    Nenhum serviço ativo cadastrado. Cadastre um serviço para compor o pacote.
                  </div>
                ) : (
                  <div className="relative">
                    {/* Botão Trigger do Dropdown */}
                    <button
                      type="button"
                      onClick={() => setIsComboServiceDropdownOpen(!isComboServiceDropdownOpen)}
                      className={`w-full rounded-2xl border bg-[#FAF7F5] p-2.5 sm:p-3 text-left transition flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
                        isComboServiceDropdownOpen
                          ? 'border-[#B8A9D9] ring-2 ring-[#B8A9D9]/20'
                          : 'border-gray-200/80 hover:border-[#B8A9D9] hover:bg-white'
                      }`}
                    >
                      {isComboMultiSelect ? (
                        comboServicoIds.length === 0 ? (
                          <span className="text-xs text-gray-400 font-medium">Selecione um ou mais serviços...</span>
                        ) : (
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex -space-x-2 overflow-hidden shrink-0">
                              {selectedServicosForCombo.slice(0, 3).map((s) => (
                                <div
                                  key={s.id}
                                  className="relative h-9 w-9 rounded-xl border-2 border-white bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs"
                                >
                                  {s.foto_url ? (
                                    <Image src={s.foto_url} alt={s.nome} fill className="object-cover" unoptimized />
                                  ) : (
                                    <Scissors className="h-4 w-4 text-[#8675A9]" />
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#4A3F5C] truncate">
                                {comboServicoIds.length === 1
                                  ? selectedServicosForCombo[0]?.nome
                                  : `${comboServicoIds.length} serviços selecionados`}
                              </p>
                              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                Total individual: <strong className="text-emerald-700 font-bold">R$ {comboPrecoOriginalSoma.toFixed(2)}</strong> • {comboDuracaoCalculada} min
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        (() => {
                          const current = selectedServicosForCombo[0]
                          if (!current) return <span className="text-xs text-gray-400 font-medium">Selecione um serviço...</span>
                          return (
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative h-10 w-10 rounded-xl bg-white border border-[#B8A9D9]/30 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                {current.foto_url ? (
                                  <Image src={current.foto_url} alt={current.nome} fill className="object-cover" unoptimized />
                                ) : (
                                  <Scissors className="h-5 w-5 text-[#8675A9]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#4A3F5C] truncate">{current.nome}</p>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                  <span className="text-emerald-700 font-bold">R$ {Number(current.preco).toFixed(2)}</span>
                                  <span className="mx-1.5">•</span>
                                  <span>{current.duracao_minutos} min</span>
                                </p>
                              </div>
                            </div>
                          )
                        })()
                      )}

                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                          isComboServiceDropdownOpen ? 'rotate-180 text-[#8675A9]' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown com Foto na Esquerda, Nome à Direita, Valor e Tempo */}
                    {isComboServiceDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-40 max-h-72 overflow-y-auto rounded-3xl bg-white border border-gray-200 shadow-2xl p-2 space-y-1.5 animate-in fade-in duration-150">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span>{isComboMultiSelect ? 'Marque os serviços desejados' : 'Selecione o serviço'}</span>
                          {isComboMultiSelect && (
                            <span className="text-[#8675A9] font-bold">
                              {comboServicoIds.length} selecionado(s)
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 pt-1">
                          {services.map((s) => {
                            const isSelected = comboServicoIds.includes(s.id)

                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  if (isComboMultiSelect) {
                                    if (comboServicoIds.includes(s.id)) {
                                      if (comboServicoIds.length > 1) {
                                        setComboServicoIds(comboServicoIds.filter((id) => id !== s.id))
                                      }
                                    } else {
                                      setComboServicoIds([...comboServicoIds, s.id])
                                    }
                                  } else {
                                    setComboServicoIds([s.id])
                                    setIsComboServiceDropdownOpen(false)
                                  }
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer border ${
                                  isSelected
                                    ? 'bg-purple-50/80 border-[#B8A9D9] shadow-2xs'
                                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200/70'
                                }`}
                              >
                                {/* Foto na Esquerda */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="relative h-12 w-12 rounded-xl bg-gray-100 border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                                    {s.foto_url ? (
                                      <Image src={s.foto_url} alt={s.nome} fill className="object-cover" unoptimized />
                                    ) : (
                                      <Scissors className="h-5 w-5 text-[#8675A9]" />
                                    )}
                                  </div>

                                  {/* Nome à Direita, Valor e Tempo */}
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#4A3F5C]' : 'text-gray-800'}`}>
                                      {s.nome}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-semibold">
                                      <span className="text-emerald-700 font-bold">R$ {Number(s.preco).toFixed(2)}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {s.duracao_minutos} min
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Indicador de Seleção à Direita */}
                                <div className="shrink-0 pl-2">
                                  {isComboMultiSelect ? (
                                    <div
                                      className={`h-5 w-5 rounded-lg border flex items-center justify-center transition ${
                                        isSelected
                                          ? 'bg-[#4A3F5C] border-[#4A3F5C] text-white'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                    </div>
                                  ) : (
                                    isSelected && (
                                      <div className="h-6 w-6 rounded-full bg-[#4A3F5C] text-white flex items-center justify-center">
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {isComboMultiSelect && (
                          <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between px-1">
                            <div className="text-[11px] font-semibold text-gray-600">
                              Total individual: <strong className="text-emerald-700 font-bold">R$ {comboPrecoOriginalSoma.toFixed(2)}</strong> ({comboDuracaoCalculada} min)
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsComboServiceDropdownOpen(false)}
                              className="px-4 py-1.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer"
                            >
                              Concluir
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Duração e Preço em 2 Colunas (Inspirado no Criar Serviço) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                    Duração Total
                  </label>
                  <div className="w-full rounded-xl border border-gray-200 bg-gray-100/70 py-3 px-4 text-sm font-bold text-[#4A3F5C] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#B8A9D9]" />
                    <span>{comboDuracaoCalculada} min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3F5C]/80 mb-1">
                    Preço do Pacote (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={comboPreco}
                    onChange={(e) => setComboPreco(e.target.value)}
                    placeholder={comboPrecoOriginalSoma > 0 ? String(Math.round(comboPrecoOriginalSoma * 0.8)) : '150.00'}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm font-bold text-[#4A3F5C] focus:border-[#B8A9D9] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={comboSaving || comboUploading || comboServicoIds.length < 1}
                  className="rounded-xl bg-[#4A3F5C] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#393047] transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {comboSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Pacote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast
        show={!!toast?.show}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

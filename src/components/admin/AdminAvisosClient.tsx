'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Bell,
  Radio,
  Send,
  CheckCircle2,
  Sparkles,
  Plus,
  Loader2,
  FileText,
  Megaphone,
} from 'lucide-react'
import {
  createAvisoPlataforma,
  toggleAvisoPlataforma,
  updateAvisoFrequencia,
  createNovidade,
} from '@/app/actions/adminPrompt34'

interface AvisoItem {
  id: string
  mensagem: string
  ativo: boolean
  tipo: 'info' | 'alerta' | 'manutencao'
  frequencia: 'cada_acesso' | 'uma_vez_por_dia' | 'somente_sino'
  created_at: string
}

interface NovidadeItem {
  id: string
  titulo: string
  descricao: string
  created_at: string
}

interface AdminAvisosClientProps {
  initialAvisos?: AvisoItem[]
  initialNovidades?: NovidadeItem[]
}

export default function AdminAvisosClient({
  initialAvisos = [],
  initialNovidades = [],
}: AdminAvisosClientProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'banners' | 'novidades'>('banners')

  // Sincronizar aba ativa com o parâmetro de rota
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'novidades') {
      setActiveTab('novidades')
    } else if (tab === 'banners') {
      setActiveTab('banners')
    }
  }, [searchParams])

  const [avisos, setAvisos] = useState<AvisoItem[]>(initialAvisos)
  const [novidades, setNovidades] = useState<NovidadeItem[]>(initialNovidades)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form de Banner
  const [bannerMensagem, setBannerMensagem] = useState('')
  const [bannerTipo, setBannerTipo] = useState<'info' | 'alerta' | 'manutencao'>('info')
  const [bannerFrequencia, setBannerFrequencia] = useState<'cada_acesso' | 'uma_vez_por_dia' | 'somente_sino'>('uma_vez_por_dia')
  const [bannerAtivo, setBannerAtivo] = useState(true)
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false)

  // Form de Novidade
  const [novidadeTitulo, setNovidadeTitulo] = useState('')
  const [novidadeDescricao, setNovidadeDescricao] = useState('')
  const [isSubmittingNovidade, setIsSubmittingNovidade] = useState(false)

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bannerMensagem.trim()) return
    setIsSubmittingBanner(true)
    try {
      const result = await createAvisoPlataforma(bannerMensagem, bannerTipo, bannerAtivo, bannerFrequencia)
      const novoAviso: AvisoItem = result.aviso
      setAvisos((prev) => {
        const list = bannerAtivo ? prev.map((a) => ({ ...a, ativo: false })) : prev
        return [novoAviso, ...list]
      })
      setBannerMensagem('')
      setSuccessMessage('Banner de aviso publicado com sucesso.')
      setTimeout(() => setSuccessMessage(null), 3500)
    } catch (err) {
      console.error('Erro ao publicar banner:', err)
      setSuccessMessage('Erro ao publicar banner.')
      setTimeout(() => setSuccessMessage(null), 3500)
    } finally {
      setIsSubmittingBanner(false)
    }
  }

  const handleToggleBanner = (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    startTransition(async () => {
      try {
        await toggleAvisoPlataforma(id, nextStatus)
        setAvisos((prev) =>
          prev.map((a) => {
            if (a.id === id) return { ...a, ativo: nextStatus }
            if (nextStatus) return { ...a, ativo: false }
            return a
          })
        )
        setSuccessMessage(`Banner ${nextStatus ? 'ativado' : 'desativado'} com sucesso.`)
        setTimeout(() => setSuccessMessage(null), 3500)
      } catch (err) {
        console.error('Erro ao alterar status do banner:', err)
      }
    })
  }

  const handleUpdateBannerFrequency = (id: string, frequencia: AvisoItem['frequencia']) => {
    startTransition(async () => {
      try {
        await updateAvisoFrequencia(id, frequencia)
        setAvisos((prev) => prev.map((aviso) => aviso.id === id ? { ...aviso, frequencia } : aviso))
        setSuccessMessage('Frequência do aviso atualizada.')
        setTimeout(() => setSuccessMessage(null), 3500)
      } catch (err) {
        console.error('Erro ao alterar frequência do aviso:', err)
        setSuccessMessage('Erro ao atualizar a frequência do aviso.')
        setTimeout(() => setSuccessMessage(null), 3500)
      }
    })
  }

  const handleCreateNovidade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novidadeTitulo.trim() || !novidadeDescricao.trim()) return
    setIsSubmittingNovidade(true)
    try {
      await createNovidade(novidadeTitulo, novidadeDescricao)
      const nova: NovidadeItem = {
        id: `nov_${Date.now()}`,
        titulo: novidadeTitulo.trim(),
        descricao: novidadeDescricao.trim(),
        created_at: new Date().toISOString(),
      }
      setNovidades((prev) => [nova, ...prev])
      setNovidadeTitulo('')
      setNovidadeDescricao('')
      setSuccessMessage('Novidade publicada com sucesso no changelog.')
      setTimeout(() => setSuccessMessage(null), 3500)
    } catch (err) {
      console.error('Erro ao publicar novidade:', err)
      setSuccessMessage('Erro ao publicar novidade.')
      setTimeout(() => setSuccessMessage(null), 3500)
    } finally {
      setIsSubmittingNovidade(false)
    }
  }

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Avisos
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Criação e histórico de comunicados globais do sistema.
          </p>
        </div>

        <span className="text-xs text-[#A9A1B5]">
          {avisos.length + novidades.length} comunicados registrados
        </span>
      </div>

      {/* FEEDBACK DE SUCESSO */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. KPIS DE COMUNICAÇÃO (PADRÃO VISÃO GERAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total de Comunicados */}
        <div className="bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Total de comunicados
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {avisos.length + novidades.length}
              </span>
              <span className="text-xs text-[#34D399] font-bold">100% entregues</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Histórico de transmissões
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] mt-3 flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>Canal oficial de transmissão</span>
            <span className="text-[#34D399] font-medium">Ativo</span>
          </div>
        </div>

        {/* Card 2: Alcance Médio */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Alcance médio na base
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                98,4%
              </span>
              <span className="text-xs text-[#34D399] font-bold">Alta cobertura</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Disparos integrados aos dashboards
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Assinantes conectadas: <strong className="text-[#34D399] font-semibold">100%</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 18 C 14 16, 24 13, 34 9 C 44 8, 54 5, 64 3"
                stroke="#B8A9D9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Taxa de Leitura */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Taxa de visualização
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#B8A9D9] tracking-tight">
                86,2%
              </span>
              <span className="text-xs text-[#B8A9D9] font-semibold">em 24h</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Abertura rápida e engajamento
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Feedback em tempo real: <strong className="text-[#34D399] font-semibold">Saudável</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 C 12 18, 22 14, 32 12 C 42 10, 52 7, 64 2"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. SELETOR DE MÓDULO — tabs full-width */}
      <div className="flex items-center gap-1 bg-[#15111F] p-1 rounded-xl border border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`flex-1 px-4 py-2 text-xs font-bold transition rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'banners'
              ? 'bg-[#B8A9D9] text-[#15111F] shadow-xs'
              : 'text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span>Banners Globais de Transmissão ({avisos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('novidades')}
          className={`flex-1 px-4 py-2 text-xs font-bold transition rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'novidades'
              ? 'bg-[#B8A9D9] text-[#15111F] shadow-xs'
              : 'text-[#A9A1B5] hover:text-[#F8F5FA]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Central de Novidades & Changelog ({novidades.length})</span>
        </button>
      </div>

      {/* 3. ABA 1: BANNERS GLOBAIS */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {/* Formulário Novo Banner */}
          <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
              <Radio className="h-4 w-4 text-[#B8A9D9]" />
              <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                Novo banner no topo do painel das usuárias
              </h2>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                    Mensagem do aviso
                  </label>
                  <input
                    type="text"
                    value={bannerMensagem}
                    onChange={(e) => setBannerMensagem(e.target.value)}
                    placeholder="Ex: Manutenção programada para domingo às 02h da manhã..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] placeholder-[#746C80] focus:outline-hidden focus:border-[#B8A9D9]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                    Tipo do aviso
                  </label>
                  <select
                    value={bannerTipo}
                    onChange={(e) => setBannerTipo(e.target.value as typeof bannerTipo)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] focus:outline-hidden focus:border-[#B8A9D9]"
                  >
                    <option value="info">Informativo (Lilás)</option>
                    <option value="alerta">Alerta importante (Âmbar)</option>
                    <option value="manutencao">Manutenção do sistema (Vermelho)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                    Frequência de exibição
                  </label>
                  <select
                    value={bannerFrequencia}
                    onChange={(e) => setBannerFrequencia(e.target.value as typeof bannerFrequencia)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] focus:outline-hidden focus:border-[#B8A9D9]"
                  >
                    <option value="cada_acesso">A cada acesso ao painel</option>
                    <option value="uma_vez_por_dia">Uma vez por dia</option>
                    <option value="somente_sino">Somente na central do sino</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#A9A1B5]">
                  <input
                    type="checkbox"
                    checked={bannerAtivo}
                    onChange={(e) => setBannerAtivo(e.target.checked)}
                    className="rounded-md border-white/20 bg-[#15111F] text-[#B8A9D9] focus:ring-0"
                  />
                  <span>Ativar imediatamente como banner principal no topo de todas as contas</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmittingBanner}
                  className="px-4 py-2 rounded-xl bg-[#B8A9D9] hover:bg-[#a695cf] text-[#18141F] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.97]"
                >
                  {isSubmittingBanner ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Publicar banner</span>
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Banners Cadastrados */}
          <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#B8A9D9]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                  Banners de aviso registrados
                </h2>
              </div>
              <span className="text-[11px] text-[#A9A1B5]">
                {avisos.filter((a) => a.ativo).length > 0 ? '1 banner ativo agora' : 'Nenhum banner ativo'}
              </span>
            </div>

            <div className="space-y-3">
              {avisos.length > 0 ? (
                avisos.map((aviso) => (
                  <div
                    key={aviso.id}
                    className="p-3.5 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          aviso.tipo === 'manutencao'
                            ? 'bg-rose-500/10 text-[#F87171] border-rose-500/20'
                            : aviso.tipo === 'alerta'
                            ? 'bg-amber-500/10 text-[#F5B84B] border-amber-500/20'
                            : 'bg-[#B8A9D9]/15 text-[#B8A9D9] border-[#B8A9D9]/25'
                        }`}
                      >
                        <Megaphone className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                            {aviso.mensagem}
                          </span>
                          <span className="text-xs text-[#A9A1B5]">·</span>
                          <span
                            className={`text-xs font-medium ${
                              aviso.tipo === 'manutencao'
                                ? 'text-[#F87171]'
                                : aviso.tipo === 'alerta'
                                ? 'text-[#F5B84B]'
                                : 'text-[#B8A9D9]'
                            }`}
                          >
                            {aviso.tipo === 'manutencao'
                              ? 'Manutenção'
                              : aviso.tipo === 'alerta'
                              ? 'Alerta'
                              : 'Informativo'}
                          </span>
                        </div>
                        <p className="text-xs text-[#A9A1B5] mt-0.5">
                          Criado em {new Date(aviso.created_at).toLocaleDateString('pt-BR')} · {aviso.frequencia === 'cada_acesso' ? 'A cada acesso' : aviso.frequencia === 'somente_sino' ? 'Somente no sino' : 'Uma vez por dia'}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
                      <select
                        value={aviso.frequencia}
                        disabled={isPending}
                        onChange={(event) => handleUpdateBannerFrequency(aviso.id, event.target.value as AvisoItem['frequencia'])}
                        aria-label={`Frequência de exibição de ${aviso.mensagem}`}
                        className="max-w-36 flex-1 sm:flex-none rounded-xl border border-white/[0.08] bg-[#15111F] px-2.5 py-1.5 text-[11px] font-semibold text-[#A9A1B5] focus:outline-hidden focus:border-[#B8A9D9] disabled:opacity-50"
                      >
                        <option value="cada_acesso">A cada acesso</option>
                        <option value="uma_vez_por_dia">Uma vez por dia</option>
                        <option value="somente_sino">Somente no sino</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleToggleBanner(aviso.id, aviso.ativo)}
                        disabled={isPending}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          aviso.ativo
                            ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 hover:bg-[#34D399]/25'
                            : 'bg-white/[0.04] text-[#A9A1B5] border border-white/[0.08] hover:bg-white/[0.08]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            aviso.ativo ? 'bg-[#34D399]' : 'bg-gray-500'
                          }`}
                        />
                        <span>{aviso.ativo ? 'Ativo no topo' : 'Desativado'}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#A9A1B5]">
                  Nenhum banner cadastrado no sistema.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA 2: CENTRAL DE NOVIDADES & CHANGELOG */}
      {activeTab === 'novidades' && (
        <div className="space-y-6">
          {/* Formulário Nova Novidade */}
          <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
              <Sparkles className="h-4 w-4 text-[#B8A9D9]" />
              <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                Publicar nova atualização no changelog
              </h2>
            </div>

            <form onSubmit={handleCreateNovidade} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                  Título da melhoria ou recurso
                </label>
                <input
                  type="text"
                  value={novidadeTitulo}
                  onChange={(e) => setNovidadeTitulo(e.target.value)}
                  placeholder="Ex: Emissão automática de relatórios em PDF lançada!"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] placeholder-[#746C80] focus:outline-hidden focus:border-[#B8A9D9]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                  Descrição detalhada
                </label>
                <textarea
                  rows={3}
                  value={novidadeDescricao}
                  onChange={(e) => setNovidadeDescricao(e.target.value)}
                  placeholder="Explique o que mudou, os benefícios e como a profissional pode utilizar o recurso..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] placeholder-[#746C80] focus:outline-hidden focus:border-[#B8A9D9] resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingNovidade}
                  className="px-4 py-2 rounded-xl bg-[#B8A9D9] hover:bg-[#a695cf] text-[#18141F] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.97]"
                >
                  {isSubmittingNovidade ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>Publicar novidade</span>
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Novidades */}
          <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#B8A9D9]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
                  Atualizações publicadas
                </h2>
              </div>
              <span className="text-[11px] text-[#A9A1B5]">
                {novidades.length} notas no histórico
              </span>
            </div>

            <div className="space-y-3">
              {novidades.length > 0 ? (
                novidades.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl bg-[#15111F] border border-white/[0.05] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <h3 className="font-bold text-[#F8F5FA]">{n.titulo}</h3>
                      <span className="text-[11px] text-[#A9A1B5] font-mono">
                        {new Date(n.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-[#A9A1B5] leading-relaxed">{n.descricao}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#A9A1B5]">
                  Nenhuma novidade publicada ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

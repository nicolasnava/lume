'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useTransition } from 'react'
import { getAdminAvisos, createAvisoPlataforma, toggleAvisoPlataforma } from '@/app/actions/adminPrompt34'
import { Megaphone, Plus, Loader2 } from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'

interface AvisoItem {
  id: string
  mensagem: string
  ativo: boolean
  tipo: 'info' | 'alerta' | 'manutencao'
  created_at: string
}

export default function AdminAvisosPage() {
  const [avisos, setAvisos] = useState<AvisoItem[]>([])
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo] = useState<'info' | 'alerta' | 'manutencao'>('info')
  const [ativo, setAtivo] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  const loadAvisos = () => {
    startTransition(async () => {
      try {
        const data = await getAdminAvisos()
        setAvisos(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })
  }

  useEffect(() => {
    loadAvisos()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensagem.trim()) return

    try {
      await createAvisoPlataforma(mensagem, tipo, ativo)
      setMensagem('')
      setAtivo(false)
      loadAvisos()
    } catch (err) {
      console.error(err)
      alert('Erro ao criar aviso.')
    }
  }

  const handleToggle = async (id: string, currentAtivo: boolean) => {
    try {
      await toggleAvisoPlataforma(id, !currentAtivo)
      loadAvisos()
    } catch (err) {
      console.error(err)
      alert('Erro ao alterar aviso.')
    }
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Megaphone className="h-5 w-5 text-[#D4AF37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">Avisos Globais da Plataforma</h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Exiba alertas e comunicados importantes no topo do painel de todas as usuárias logadas.
          </p>
        </div>
      </div>

      {/* Formulário de Novo Aviso */}
      <form onSubmit={handleCreate} className="bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-5">
        <h3 className="text-sm font-bold text-[#F5F5F4] border-b border-white/[0.06] pb-3">Criar Novo Comunicado / Aviso</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#9C9C9F] block mb-1.5">Mensagem do Banner</label>
            <input
              type="text"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Ex: Teremos uma manutenção programada hoje às 22h..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-4 py-2.5 text-xs text-[#F5F5F4] placeholder-[#9C9C9F] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
              required
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div className="w-60">
              <label className="text-xs font-semibold text-[#9C9C9F] block mb-1.5">Tipo de Aviso</label>
              <CustomSelect
                options={[
                  { value: 'info', label: 'Info (Lilás)' },
                  { value: 'alerta', label: 'Alerta (Dourado)' },
                  { value: 'manutencao', label: 'Manutenção (Rose)' },
                ]}
                value={tipo}
                onChange={(val) => setTipo(val as 'info' | 'alerta' | 'manutencao')}
                variant="dark"
                size="sm"
              />
            </div>

            <label className="inline-flex items-center gap-2.5 text-xs text-[#F5F5F4] font-semibold cursor-pointer pt-5 select-none">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="rounded border-white/20 bg-[#141416] text-[#8C5383] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span>Ativar imediatamente (Desativa o aviso anterior)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8C5383] to-[#5C3656] hover:from-[#9D5D93] hover:to-[#6E4067] text-white border border-[#B8A9D9]/30 px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>Publicar Aviso</span>
        </button>
      </form>

      {/* Lista de Avisos Existentes */}
      <div className="bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
        <h3 className="text-sm font-bold text-[#F5F5F4] border-b border-white/[0.06] pb-3">Histórico de Avisos</h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#9C9C9F]">Carregando avisos...</div>
        ) : avisos.length > 0 ? (
          <div className="space-y-3">
            {avisos.map((a) => (
              <div key={a.id} className="bg-[#141416] p-4 sm:p-5 rounded-xl border border-white/[0.04] flex items-center justify-between gap-4 hover:border-white/[0.08] transition">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border uppercase tracking-wider ${
                      a.tipo === 'manutencao'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : a.tipo === 'alerta'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-[#8C5383]/15 text-[#E9C3F0] border-[#8C5383]/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        a.tipo === 'manutencao' ? 'bg-rose-400' : a.tipo === 'alerta' ? 'bg-amber-400' : 'bg-[#E9C3F0]'
                      }`} />
                      {a.tipo}
                    </span>
                    {a.ativo && (
                      <span className="text-[10px] font-mono text-[#2EB886] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                        ATIVO AGORA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#F5F5F4] font-medium leading-relaxed">{a.mensagem}</p>
                </div>

                <button
                  onClick={() => handleToggle(a.id, a.ativo)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
                    a.ativo
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                >
                  {a.ativo ? 'Desativar' : 'Ativar Este'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-[#9C9C9F] py-8">Nenhum aviso publicado até o momento.</div>
        )}
      </div>
    </div>
  )
}

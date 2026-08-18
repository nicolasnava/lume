'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useTransition } from 'react'
import { getNovidades, createNovidade } from '@/app/actions/adminPrompt34'
import { Sparkles, Plus, Loader2 } from 'lucide-react'

interface NovidadeItem {
  id: string
  titulo: string
  descricao: string
  created_at: string
}

export default function AdminNovidadesPage() {
  const [novidades, setNovidades] = useState<NovidadeItem[]>([])
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  const loadList = () => {
    startTransition(async () => {
      try {
        const data = await getNovidades()
        setNovidades(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })
  }

  useEffect(() => {
    loadList()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !descricao.trim()) return

    try {
      await createNovidade(titulo, descricao)
      setTitulo('')
      setDescricao('')
      loadList()
    } catch (err) {
      console.error(err)
      alert('Erro ao publicar novidade.')
    }
  }

  return (
    <div className="space-y-7 text-[#F5F5F4] font-sans antialiased tracking-tight">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-[#D8B4E2]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">Central de Novidades (Changelog)</h1>
          </div>
          <p className="text-xs text-[#9C9C9F] font-normal mt-1 tracking-wide">
            Cadastre atualizações e recursos novos para notificar as profissionais parceiras no painel.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleCreate} className="bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-5">
        <h3 className="text-sm font-bold text-[#F5F5F4] border-b border-white/[0.06] pb-3">Cadastrar Nova Atualização</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#9C9C9F] block mb-1.5">Título da Novidade</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Lançamento do novo relatório financeiro em PDF!"
              className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-4 py-2.5 text-xs text-[#F5F5F4] placeholder-[#9C9C9F] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#9C9C9F] block mb-1.5">Descrição Curta</label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a melhoria ou novo recurso em poucas frases..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-4 py-2.5 text-xs text-[#F5F5F4] placeholder-[#9C9C9F] focus:border-[#8C5383] focus:outline-hidden transition shadow-inner"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8C5383] to-[#5C3656] hover:from-[#9D5D93] hover:to-[#6E4067] text-white border border-[#B8A9D9]/30 px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>Publicar Novidade</span>
        </button>
      </form>

      {/* Lista */}
      <div className="bg-[#1A1A1C] p-6 sm:p-7 rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] space-y-4">
        <h3 className="text-sm font-bold text-[#F5F5F4] border-b border-white/[0.06] pb-3">Novidades Publicadas</h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#9C9C9F]">Carregando novidades...</div>
        ) : novidades.length > 0 ? (
          <div className="space-y-3">
            {novidades.map((n) => (
              <div key={n.id} className="bg-[#141416] p-4 sm:p-5 rounded-xl border border-white/[0.04] space-y-1.5 hover:border-white/[0.08] transition">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#F5F5F4]">{n.titulo}</h4>
                  <span className="text-[10px] font-mono text-[#9C9C9F]">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-xs text-[#E5E5E7] font-normal leading-relaxed">{n.descricao}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-[#9C9C9F] py-8">Nenhuma novidade publicada ainda.</div>
        )}
      </div>
    </div>
  )
}

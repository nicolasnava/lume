'use client'

import { useState } from 'react'
import { Star, X, ChevronDown } from 'lucide-react'

export interface PublicReviewItem {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  agendamentos?: {
    clientes?: {
      nome: string
    } | null
    servicos?: {
      nome: string
    } | null
  } | null
}

interface PublicReviewsSectionProps {
  avaliacoes: PublicReviewItem[]
  corPrimaria?: string
}

export default function PublicReviewsSection({
  avaliacoes,
}: PublicReviewsSectionProps) {
  const [showAllModal, setShowAllModal] = useState(false)

  // Se não houver avaliações, não exibe a seção (evita parecer quebrado para contas novas)
  if (!avaliacoes || avaliacoes.length === 0) {
    return null
  }

  const total = avaliacoes.length
  const soma = avaliacoes.reduce((acc, curr) => acc + Number(curr.nota), 0)
  const mediaStr = (soma / total).toFixed(1).replace('.', ',')

  // Distribuição por estrelas (5 a 1)
  const distribution = [5, 4, 3, 2, 1].map((n) => {
    const count = avaliacoes.filter((a) => Number(a.nota) === n).length
    const percentage = total > 0 ? (count / total) * 100 : 0
    return { nota: n, count, percentage }
  })

  // 2-3 avaliações mais recentes
  const recentReviews = avaliacoes.slice(0, 3)

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 border border-gray-200/80 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span>Avaliações dos Clientes</span>
        </h3>
        <span className="text-xs font-semibold text-gray-500">
          {total} {total === 1 ? 'avaliação' : 'avaliações'}
        </span>
      </div>

      {/* Resumo da Média e Barras de Distribuição */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        {/* Média em Destaque */}
        <div className="text-center sm:text-left space-y-1">
          <div className="text-4xl font-black text-[#4A3F5C]">{mediaStr}</div>
          <div className="flex items-center justify-center sm:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(soma / total)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Nota média dos atendimentos</p>
        </div>

        {/* Barras Horizontais por Nota (5 a 1) */}
        <div className="sm:col-span-2 space-y-1.5">
          {distribution.map((item) => (
            <div key={item.nota} className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 w-10 font-bold text-[#4A3F5C]">
                <span>{item.nota}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="w-6 text-right text-[11px] font-medium text-gray-400">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista das Avaliações Mais Recentes */}
      <div className="space-y-3 pt-2">
        {recentReviews.map((av) => {
          const clienteNome = av.agendamentos?.clientes?.nome || 'Cliente'
          const servicoNome = av.agendamentos?.servicos?.nome
          const dataStr = new Date(av.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })

          return (
            <div
              key={av.id}
              className="rounded-xl bg-[#FAF7F5] p-3.5 border border-gray-100 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#4A3F5C]">{clienteNome}</span>
                  {servicoNome && (
                    <span className="text-[11px] text-gray-400 font-normal ml-2">
                      • {servicoNome}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Number(av.nota)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {av.comentario && (
                <p className="text-[#4A3F5C]/80 italic leading-relaxed">
                  &ldquo;{av.comentario}&rdquo;
                </p>
              )}

              <span className="text-[10px] text-gray-400 block text-right">{dataStr}</span>
            </div>
          )})}
      </div>

      {/* Botão Ver Todas as Avaliações */}
      {total > 3 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#4A3F5C] hover:bg-gray-50 transition cursor-pointer"
          >
            <span>Ver todas as {total} avaliações</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Modal com Lista Completa de Avaliações */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-base font-bold text-[#4A3F5C] flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span>Todas as Avaliações ({total})</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {avaliacoes.map((av) => {
                const clienteNome = av.agendamentos?.clientes?.nome || 'Cliente'
                const servicoNome = av.agendamentos?.servicos?.nome
                const dataStr = new Date(av.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })

                return (
                  <div
                    key={av.id}
                    className="rounded-xl bg-[#FAF7F5] p-3.5 border border-gray-100 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#4A3F5C]">{clienteNome}</span>
                        {servicoNome && (
                          <span className="text-[11px] text-gray-400 font-normal ml-2">
                            • {servicoNome}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Number(av.nota)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {av.comentario && (
                      <p className="text-[#4A3F5C]/80 italic leading-relaxed">
                        &ldquo;{av.comentario}&rdquo;
                      </p>
                    )}

                    <span className="text-[10px] text-gray-400 block text-right">{dataStr}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

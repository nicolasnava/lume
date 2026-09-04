'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { Database } from '@/lib/supabase/database.types'
import { getContrastingTextColor } from '@/lib/utils/contrast'
import { Clock, ChevronLeft, ChevronRight, CalendarCheck, Scissors, History } from 'lucide-react'

type ServicoRow = Database['public']['Tables']['servicos']['Row']

interface ServiceCarouselProps {
  servicos: ServicoRow[]
  corPrimaria: string
  profissionalSlug: string
  basePath?: string
  onOpenClientBookings?: () => void
}

export default function ServiceCarousel({
  servicos,
  corPrimaria,
  profissionalSlug,
  basePath,
  onOpenClientBookings,
}: ServiceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const bookingBaseUrl = basePath || `/p/${profissionalSlug}`
  const textColorOnPrimary = getContrastingTextColor(corPrimaria)

  // Atualizar índice ativo ao rolar o carrossel
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    const index = Math.round(scrollLeft / clientWidth)
    setActiveIndex(index)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', handleScroll)
      return () => el.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const clientWidth = scrollRef.current.clientWidth
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8,
      behavior: 'smooth',
    })
  }

  if (!servicos || servicos.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 p-8 text-center shadow-xs border border-black/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#4A3F5C]/40">
          <Scissors className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#4A3F5C]">Nenhum serviço cadastrado</h3>
        <p className="mt-1 text-xs text-[#4A3F5C]/70">
          Esta profissional ainda não adicionou a lista de serviços ao catálogo público.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 relative group/carousel">
      {/* Botões de Navegação Lateral Desktop (< e >) */}
      {servicos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/3 -translate-y-1/2 z-20 hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md text-gray-700 hover:bg-white transition opacity-80 group-hover/carousel:opacity-100 cursor-pointer"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/3 -translate-y-1/2 z-20 hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md text-gray-700 hover:bg-white transition opacity-80 group-hover/carousel:opacity-100 cursor-pointer"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Carrossel Horizontal com Snap e Cards com Foto em Destaque no Topo */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 pt-1 px-1 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {servicos.map((servico) => {
          const hasFoto = !!servico.foto_url

          return (
            <a
              key={servico.id}
              href={`${bookingBaseUrl}/agendar?servico=${servico.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="snap-center shrink-0 w-[85%] sm:w-[260px] min-h-[290px] flex flex-col rounded-2xl overflow-hidden shadow-sm group cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg border border-gray-200/80 bg-white text-left block"
            >
              {/* Parte Superior: Foto Principal com Badge de Duração Discreto */}
              <div className="relative w-full h-36 sm:h-40 shrink-0 overflow-hidden bg-gray-100">
                {hasFoto ? (
                  <Image
                    src={servico.foto_url!}
                    alt={servico.nome}
                    fill
                    className="object-cover transition transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${corPrimaria} 0%, #4A3F5C 100%)`,
                    }}
                  >
                    <Scissors className="h-8 w-8 text-white/50" />
                  </div>
                )}

                {/* Badge de Duração Discreto no Canto Superior */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20 shadow-xs">
                    <Clock className="h-3 w-3" />
                    {servico.duracao_minutos} min
                  </span>
                </div>
              </div>

              {/* Parte Inferior: Painel de Informações Limpo em Fundo Claro */}
              <div className="p-4 flex flex-col justify-between flex-1 bg-white space-y-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#4A3F5C] leading-snug line-clamp-1">
                    {servico.nome}
                  </h3>

                  {servico.descricao ? (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-normal">
                      {servico.descricao}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sem descrição adicional.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-700">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(servico.preco)}
                  </span>

                  <span
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition group-hover:scale-105"
                    style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    <span>Agendar</span>
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Indicadores Visuais de Posição (Dots) */}
      {servicos.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {servicos.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'w-5 bg-[#4A3F5C]'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Botões do Rodapé do Carrossel: "Agendar Agora" (Principal) e "Ver meus agendamentos" (Secundário) */}
      <div className="pt-2 space-y-2">
        <a
          href={`${bookingBaseUrl}/agendar`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-lg transition hover:opacity-90 active:scale-98 cursor-pointer flex items-center justify-center gap-2 block text-center"
          style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
        >
          <CalendarCheck className="h-5 w-5 inline" />
          <span>Agendar Agora</span>
        </a>

        {onOpenClientBookings && (
          <button
            type="button"
            onClick={onOpenClientBookings}
            className="w-full py-3 rounded-2xl font-bold text-xs text-[#4A3F5C] bg-white border border-[#4A3F5C]/20 hover:bg-purple-50/50 transition shadow-2xs cursor-pointer flex items-center justify-center gap-2"
          >
            <History className="h-4 w-4 text-[#B8A9D9]" />
            <span>Ver meus agendamentos</span>
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus, ShoppingBag } from 'lucide-react'
import type { ComandaProduto } from '@/app/actions/comanda'

interface ComandaProductCardProps {
  produto: Pick<ComandaProduto, 'id' | 'nome' | 'preco' | 'foto_url'>
  onOpenDetails: () => void
  addHref?: string
  onAdd?: () => void
}

const addButtonClassName = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#B8A9D9]/30 bg-purple-50 text-[#4A3F5C] transition-[transform,background-color,color] duration-150 ease-out hover:bg-[#4A3F5C] hover:text-white active:scale-[0.97]'

export default function ComandaProductCard({ produto, onOpenDetails, addHref, onAdd }: ComandaProductCardProps) {
  return (
    <article className="group flex w-[76%] shrink-0 snap-center flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-3 shadow-2xs transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-[#B8A9D9] hover:shadow-md active:scale-[0.98] sm:w-[250px] sm:p-3.5">
      <button type="button" onClick={onOpenDetails} className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8675A9]">
        <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-2xl border border-gray-100/80 bg-[#FAF7F5]">
          {produto.foto_url ? (
            <Image src={produto.foto_url} alt={produto.nome} fill className="object-cover transition-transform duration-200 ease-out group-hover:scale-106" unoptimized />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-50/80 to-pink-50/50">
              <ShoppingBag className="h-10 w-10 text-[#B8A9D9]/70 transition-transform duration-200 ease-out group-hover:scale-110" />
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#4A3F5C]/40">Lumê Care</span>
            </div>
          )}
        </div>
        <div className="space-y-1 pt-3 pb-1">
          <h3 className="line-clamp-1 text-xs font-extrabold uppercase tracking-wide text-[#4A3F5C] transition-colors group-hover:text-[#8675A9] sm:text-sm">
            {produto.nome}
          </h3>
        </div>
      </button>

      <div className="flex items-center justify-between">
        <button type="button" onClick={onOpenDetails} className="min-w-0 flex-1 whitespace-nowrap text-left text-sm font-black text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8675A9] sm:text-base">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
        </button>
        {addHref ? (
          <Link href={addHref} onClick={(event) => event.stopPropagation()} className={addButtonClassName} aria-label={`Adicionar ${produto.nome} ao atendimento`}>
            <Plus className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <button type="button" onClick={onAdd} className={addButtonClassName} aria-label={`Adicionar ${produto.nome} ao atendimento`}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </article>
  )
}

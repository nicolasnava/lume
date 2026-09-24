'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Package, Scissors, ShoppingBag } from 'lucide-react'
import ServiceCarousel from '@/components/booking/ServiceCarousel'
import type { ServiceRow } from '@/components/dashboard/ServicesManager'
import type { ComboItem } from '@/app/actions/combos'
import type { ComandaProduto } from '@/app/actions/comanda'
import { getClientVisibleItems } from '@/lib/service-management'
import { getContrastingTextColor } from '@/lib/utils/contrast'

type CatalogTab = 'servicos' | 'combos' | 'comanda'

export default function CustomerCatalogPreview({
  tab,
  services,
  packages,
  products,
  primaryColor,
  professionalSlug,
}: {
  tab: CatalogTab
  services: ServiceRow[]
  packages: ComboItem[]
  products: ComandaProduto[]
  primaryColor: string
  professionalSlug: string
}) {
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null)
  const visibleServices = getClientVisibleItems(services)
  const visiblePackages = getClientVisibleItems(packages)
  const visibleProducts = getClientVisibleItems(products)
  const textColor = getContrastingTextColor(primaryColor)
  const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  if (tab === 'servicos') {
    return <section aria-label="Prévia pública dos serviços" className="rounded-3xl bg-[#FAF7F5] p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#4A3F5C]"><Scissors className="h-5 w-5 text-[#B8A9D9]" /> Serviços da vitrine</h2>
      <ServiceCarousel servicos={visibleServices as never} corPrimaria={primaryColor} profissionalSlug={professionalSlug || 'profissional'} />
    </section>
  }

  if (tab === 'combos') {
    return <section aria-label="Prévia pública dos pacotes" className="rounded-3xl bg-[#FAF7F5] p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#4A3F5C]"><Package className="h-5 w-5 text-[#B8A9D9]" /> Pacotes da vitrine</h2>
      {visiblePackages.length === 0 ? <EmptyPreview text="Nenhum pacote ativo para exibir." /> : <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
        {visiblePackages.map((item) => <article key={item.id} className="w-[86%] shrink-0 snap-center space-y-3 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-2xs sm:w-[280px] sm:p-5">
          {item.foto_url && <div className="relative h-40 overflow-hidden rounded-2xl bg-[#FAF7F5]"><Image src={item.foto_url} alt={item.nome} fill className="object-cover" unoptimized /></div>}
          <div><h3 className="text-sm font-extrabold text-[#4A3F5C]">{item.nome}</h3>{item.descricao && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{item.descricao}</p>}</div>
          {item.servicos.length > 0 && <div className="border-y border-gray-100 py-2">
            <button type="button" onClick={() => setExpandedPackageId(expandedPackageId === item.id ? null : item.id)} aria-expanded={expandedPackageId === item.id} className="flex w-full items-center justify-between text-left text-[11px] font-bold text-[#4A3F5C]"><span>{item.servicos.length} {item.servicos.length === 1 ? 'serviço incluso' : 'serviços inclusos'}</span><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedPackageId === item.id ? 'rotate-180' : ''}`} /></button>
            {expandedPackageId === item.id && <div className="mt-3 space-y-2.5">{item.servicos.map((service) => <div key={service.id} className="flex items-center gap-2.5"><div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">{service.foto_url ? <Image src={service.foto_url} alt={service.nome} fill className="object-cover" unoptimized /> : <Scissors className="m-2 h-5 w-5 text-[#B8A9D9]" />}</div><div className="min-w-0"><p className="truncate text-[11px] font-bold text-[#4A3F5C]">{service.nome}</p><p className="text-[10px] text-gray-500">{service.duracao_minutos} min</p></div></div>)}</div>}
          </div>}
          <div className="flex items-end justify-between gap-2 border-t border-gray-100 pt-2"><div className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Valor do Pacote</span><strong className="block whitespace-nowrap text-base font-black text-emerald-700">{money(item.preco_combo)}</strong><span className="mt-0.5 block whitespace-nowrap text-[11px] font-semibold text-gray-500">{item.duracaoTotalMinutos} min</span></div><Link href={`/p/${professionalSlug}/agendar?combo=${item.id}`} className="shrink-0 rounded-xl px-4 py-2 text-xs font-bold shadow-2xs" style={{ backgroundColor: primaryColor, color: textColor }}>Agendar</Link></div>
        </article>)}
      </div>}
    </section>
  }

  return <section aria-label="Prévia pública da comanda" className="rounded-3xl bg-[#FAF7F5] p-4 sm:p-6">
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#4A3F5C]"><ShoppingBag className="h-5 w-5 text-[#B8A9D9]" /> Comanda digital</h2>
    {visibleProducts.length === 0 ? <EmptyPreview text="Nenhum item ativo para exibir." /> : <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
      {visibleProducts.map((product) => <article key={product.id} className="group flex w-[76%] shrink-0 snap-center cursor-default flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-3 shadow-2xs sm:w-[250px] sm:p-3.5">
        <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-2xl border border-gray-100/80 bg-[#FAF7F5]">{product.foto_url ? <Image src={product.foto_url} alt={product.nome} fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-10 w-10 text-[#B8A9D9]" /></div>}</div>
        <div className="space-y-1 pb-1 pt-3"><h3 className="line-clamp-1 text-xs font-extrabold uppercase tracking-wide text-[#4A3F5C] sm:text-sm">{product.nome}</h3><div className="flex items-center justify-between"><span className="text-sm font-black text-emerald-700 sm:text-base">{money(product.preco)}</span><span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#B8A9D9]/30 bg-purple-50 text-[#4A3F5C]" aria-label="Adicionar ao atendimento">+</span></div></div>
      </article>)}
    </div>}
  </section>
}

function EmptyPreview({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#B8A9D9]/50 bg-white p-8 text-center text-sm text-[#6D6478]">{text}</div>
}

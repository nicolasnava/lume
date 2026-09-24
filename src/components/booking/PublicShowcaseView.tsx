'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Database } from '@/lib/supabase/database.types'
import ServiceCarousel from './ServiceCarousel'
import ClientBookingsModal from './ClientBookingsModal'
import WorkingHoursModal from './WorkingHoursModal'
import PublicReviewsSection, { PublicReviewItem } from '@/components/reviews/PublicReviewsSection'
import PublicStudioToast from './PublicStudioToast'
import { getContrastingTextColor } from '@/lib/utils/contrast'
import { parseCategorias, getCategoryLabel, parseModalidades, MODALIDADE_MAP } from '@/lib/utils/categories'
import { isStudioOpenNow } from '@/lib/utils/workingHours'
import { ComboItem } from '@/app/actions/combos'
import { ComandaProduto } from '@/app/actions/comanda'
import {
  Instagram,
  MapPin,
  User,
  Clock,
  Info,
  Scissors,
  ChevronLeft,
  Package,
  ShoppingBag,
  Plus,
  X,
  ChevronDown,
  Images,
} from 'lucide-react'

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']
type DisponibilidadeRow = Database['public']['Tables']['disponibilidade']['Row']

interface PublicShowcaseViewProps {
  profissional: ProfissionalRow
  servicos: ServicoRow[]
  disponibilidades: DisponibilidadeRow[]
  avaliacoes: PublicReviewItem[]
  studioContext?: {
    nome: string
    slug: string
  }
  combos?: ComboItem[]
  comandaProdutos?: ComandaProduto[]
}

export default function PublicShowcaseView({
  profissional,
  servicos,
  disponibilidades,
  avaliacoes,
  studioContext,
  combos = [],
  comandaProdutos = [],
}: PublicShowcaseViewProps) {
  const [isClientBookingsOpen, setIsClientBookingsOpen] = useState(false)
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false)
  const [selectedComandaItem, setSelectedComandaItem] = useState<ComandaProduto | null>(null)
  const [expandedComboId, setExpandedComboId] = useState<string | null>(null)

  const corPrimaria = profissional.cor_primaria || '#B8A9D9'
  const textColorOnPrimary = getContrastingTextColor(corPrimaria)

  const categoriasList = parseCategorias(profissional.categoria)
  const modalidadesList = parseModalidades(profissional.modalidade_atendimento)

  // Links de Contato
  const cleanWhatsapp = (profissional.whatsapp || '').replace(/\D/g, '')
  const whatsappUrl = cleanWhatsapp.length >= 10 ? `https://wa.me/55${cleanWhatsapp}` : null

  const cleanInstagram = (profissional.instagram || '').replace(/^@/, '').trim()
  const instagramUrl = cleanInstagram ? `https://instagram.com/${cleanInstagram}` : null

  const mapsUrl = profissional.localizacao
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profissional.localizacao)}`
    : null

  const isOpenNow = isStudioOpenNow(disponibilidades)
  const hasCapa = !!profissional.foto_capa_url

  const isDemo = (profissional as ProfissionalRow & { is_demo?: boolean }).is_demo

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#4A3F5C] transition-colors duration-300 pb-16">
      {/* Barra de Retorno ao Studio quando acessado dentro de um studio */}
      {studioContext && (
        <nav
          aria-label="Navegação do Studio"
          className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs"
        >
          <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <Link
              href={`/studio/${studioContext.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#4A3F5C] transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-[#8675A9]" />
              <span>Voltar para {studioContext.nome}</span>
            </Link>
            <span className="text-[11px] font-semibold text-gray-400">
              Equipe do Studio
            </span>
          </div>
        </nav>
      )}

      {/* Toast de Boas-Vindas */}
      <PublicStudioToast studioNome={profissional.nome} />

      {/* Banner de Vitrine Demo (Prompt 62 Parte 3) */}
      {isDemo && (
        <div className="border-b border-[#B8A9D9]/35 bg-white px-4 py-2 text-center text-xs font-semibold text-[#4A3F5C] flex items-center justify-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-[#8675A9] shrink-0" />
          <span>Esta é uma vitrine de demonstração oficial do Lumê</span>
        </div>
      )}

      {/* CABEÇALHO VITRINE: Tela Cheia Flush (Item 4), Capa Padronizada (Item 11), Ícones Circulares de Marca (Item 12) */}
      <header className="w-full bg-white border-b border-gray-200/80">
        <div className="relative w-full">
          {hasCapa && (
            <div className="relative aspect-[3/1] w-full overflow-hidden bg-[#FAF7F5]">
              <Image
                src={profissional.foto_capa_url!}
                alt={`Capa de ${profissional.nome}`}
                fill
                className="object-contain"
                priority
                unoptimized
              />
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
            </div>
          )}

          <div className={`max-w-xl mx-auto px-4 text-center sm:px-6 ${hasCapa ? 'pb-6 pt-0' : 'py-6'}`}>
            {/* Foto de Perfil */}
            <div
              className={`relative mx-auto h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-4 shadow-xl transition transform hover:scale-105 bg-white ${
                hasCapa ? '-mt-12 sm:-mt-14 z-20 ring-4 ring-white/90 shadow-2xl' : ''
              }`}
              style={{ borderColor: corPrimaria }}
            >
              {profissional.foto_url ? (
                <Image
                  src={profissional.foto_url}
                  alt={profissional.nome}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-bold"
                  style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                >
                  <User className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Nome do Studio */}
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#4A3F5C] sm:text-3xl">
              {profissional.nome}
            </h1>

            {/* Tagline / Frase de efeito */}
            {profissional.tagline && (
              <p className="mt-1 text-xs text-[#4A3F5C]/75 italic font-medium max-w-sm mx-auto">
                {profissional.tagline}
              </p>
            )}

            {/* Status Aberto/Fechado (Item 9: textos curtos "Aberto" / "Fechado") */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${isOpenNow ? 'border-emerald-600/35 text-emerald-700' : 'border-rose-600/30 text-rose-700'}`}>
                <span className={`h-2 w-2 rounded-full ${isOpenNow ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                {isOpenNow ? 'Aberto' : 'Fechado'}
              </span>

              <button
                type="button"
                onClick={() => setIsWorkingHoursOpen(true)}
                className="inline-flex items-center justify-center p-1.5 rounded-full bg-white text-gray-600 hover:text-[#4A3F5C] hover:bg-gray-100 border border-gray-200 transition cursor-pointer shadow-2xs"
                title="Ver tabela de horários de funcionamento"
              >
                <Clock className="h-4 w-4 text-[#B8A9D9]" />
              </button>
            </div>

            {/* Ícones Rápidos Circulares com Cores de Marca (Item 12) */}
            <div className="mt-3.5 flex items-center justify-center gap-2.5 pt-2 border-t border-gray-100">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs hover:opacity-90 transition"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs hover:opacity-90 transition"
                  title="WhatsApp"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </a>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-[#4A3F5C] hover:bg-purple-200 shadow-xs transition"
                  title="Localização"
                >
                  <MapPin className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL VITRINE */}
      <main className="mx-auto max-w-xl px-4 pt-6 space-y-8">
        {/* CARROSSEL DE SERVIÇOS */}
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight text-[#4A3F5C] flex items-center gap-2">
            <Scissors className="h-5 w-5 text-[#B8A9D9]" />
            <span>Nossos Serviços</span>
          </h2>

          <ServiceCarousel
            servicos={servicos}
            corPrimaria={corPrimaria}
            profissionalSlug={profissional.slug}
            basePath={studioContext ? `/studio/${studioContext.slug}/${profissional.slug}` : undefined}
            onOpenClientBookings={() => setIsClientBookingsOpen(true)}
          />
        </section>

        {/* SEÇÃO DE PACOTES & COMBOS */}
        {combos && combos.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-[#4A3F5C] flex items-center gap-2">
                <Package className="h-5 w-5 text-[#B8A9D9]" />
                <span>Pacotes</span>
              </h2>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {combos.length} {combos.length === 1 ? 'pacote' : 'pacotes'}
              </span>
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  className="w-[86%] shrink-0 snap-center rounded-3xl bg-white p-4 sm:w-[280px] sm:p-5 border border-gray-200/80 shadow-2xs space-y-3"
                >
                  {combo.foto_url && <div className="relative h-40 overflow-hidden rounded-2xl bg-[#FAF7F5]"><Image src={combo.foto_url} alt={combo.nome} fill className="object-cover" unoptimized /></div>}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#4A3F5C]">
                        {combo.nome}
                      </h3>
                      {combo.descricao && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {combo.descricao}
                        </p>
                      )}
                    </div>
                  </div>

                  {combo.servicos.length > 0 && <div className="border-y border-gray-100 py-2">
                    <button type="button" onClick={() => setExpandedComboId(expandedComboId === combo.id ? null : combo.id)} className="flex w-full items-center justify-between text-[11px] font-bold text-[#4A3F5C] transition-transform duration-150 ease-out active:scale-[0.98]">
                      <span>{combo.servicos.length} {combo.servicos.length === 1 ? 'serviço incluso' : 'serviços inclusos'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ease-out ${expandedComboId === combo.id ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedComboId === combo.id && <div className="mt-3 space-y-2.5 animate-in fade-in duration-150">{combo.servicos.map((s) => <div key={s.id} className="flex items-center gap-2.5"><div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">{s.foto_url ? <Image src={s.foto_url} alt={s.nome} fill className="object-cover" unoptimized /> : <Scissors className="m-2 h-5 w-5 text-[#B8A9D9]" />}</div><div className="min-w-0"><p className="truncate text-[11px] font-bold text-[#4A3F5C]">{s.nome}</p><p className="text-[10px] text-gray-500">{s.duracao_minutos} min</p></div></div>)}</div>}
                  </div>}

                  <div className="flex items-end justify-between gap-2 border-t border-gray-100 pt-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                        Valor do Pacote
                      </span>
                      <strong className="block whitespace-nowrap text-base font-black text-emerald-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(combo.preco_combo)}
                      </strong>
                      <span className="mt-0.5 block whitespace-nowrap text-[11px] font-semibold text-gray-500">{combo.duracaoTotalMinutos} min</span>
                    </div>

                    <Link
                      href={`${studioContext ? `/studio/${studioContext.slug}/${profissional.slug}` : `/p/${profissional.slug}`}/agendar?combo=${combo.id}`}
                      className="shrink-0 rounded-xl px-4 py-2 text-xs font-bold shadow-2xs transition-transform duration-150 ease-out active:scale-[0.97] cursor-pointer"
                      style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                    >
                      <span>Agendar</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO COMANDA DIGITAL / PRODUTOS (Foco na Foto + NOME E VALOR) */}
        {comandaProdutos && comandaProdutos.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-[#4A3F5C] flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#B8A9D9]" />
                <span>Comanda Digital</span>
              </h2>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {comandaProdutos.length} {comandaProdutos.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <p className="text-xs text-[#4A3F5C]/75 font-medium">
              Produtos e cuidados disponíveis no espaço para complementar seu atendimento.
            </p>

            {/* Grid com Formato Diferenciado: Foco Principal na Foto + NOME E VALOR */}
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
              {comandaProdutos.map((produto) => (
                <div
                  key={produto.id}
                  onClick={() => setSelectedComandaItem(produto)}
                  className="group w-[76%] shrink-0 snap-center rounded-3xl bg-white p-3 sm:w-[250px] sm:p-3.5 border border-gray-200/80 shadow-2xs hover:border-[#B8A9D9] hover:shadow-md transition-[transform,box-shadow,border-color] duration-200 ease-out active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  {/* FOCO NA FOTO: Grande, nítida, com aspect-square arredondado */}
                  <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-[#FAF7F5] border border-gray-100/80 shrink-0">
                    {produto.foto_url ? (
                      <Image
                        src={produto.foto_url}
                        alt={produto.nome}
                        fill
                        className="object-cover transition-transform duration-200 ease-out group-hover:scale-106"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50/80 to-pink-50/50">
                        <ShoppingBag className="h-10 w-10 text-[#B8A9D9]/70 group-hover:scale-110 transition-transform duration-200 ease-out" />
                        <span className="text-[10px] font-bold text-[#4A3F5C]/40 uppercase tracking-wider mt-1">
                          Lumê Care
                        </span>
                      </div>
                    )}
                  </div>

                  {/* NOME E VALOR EM DESTAQUE */}
                  <div className="pt-3 pb-1 space-y-1">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[#4A3F5C] line-clamp-1 group-hover:text-[#8675A9] transition-colors">
                      {produto.nome}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-emerald-700">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(produto.preco)}
                      </span>
                      <Link onClick={(event) => event.stopPropagation()} href={`${studioContext ? `/studio/${studioContext.slug}/${profissional.slug}` : `/p/${profissional.slug}`}/agendar?produto=${produto.id}`} className="h-8 w-8 rounded-xl bg-purple-50 group-hover:bg-[#4A3F5C] group-hover:text-white text-[#4A3F5C] border border-[#B8A9D9]/30 flex items-center justify-center transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97]" aria-label={`Adicionar ${produto.nome} ao atendimento`}>
                        <Plus className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PORTFÓLIO */}
        {profissional.portfolio_urls && profissional.portfolio_urls.length > 0 && (
          <section className="space-y-3.5">
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[#4A3F5C]"><Images className="h-5 w-5 text-[#B8A9D9]" /> Portfólio</h2>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
              {profissional.portfolio_urls.slice(0, 6).map((url, index) => <div key={url} className="relative h-64 w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl bg-white shadow-2xs sm:w-[260px]"><Image src={url} alt={`Trabalho de ${profissional.nome} ${index + 1}`} fill className="object-cover" unoptimized /></div>)}
            </div>
          </section>
        )}

        {/* SEÇÃO SOBRE O STUDIO (Item 26: Hierarquia Bio -> Horários -> Especialidades) */}
        <section className="rounded-3xl bg-white p-6 shadow-2xs border border-gray-200/80 space-y-4">
          <h3 className="text-base font-bold text-[#4A3F5C] border-b border-gray-100 pb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-[#B8A9D9]" />
            <span>Sobre {profissional.nome}</span>
          </h3>

          {/* 1. Biografia da Profissional */}
          {profissional.bio && (
            <p className="text-xs text-[#4A3F5C]/85 leading-relaxed font-medium">
              {profissional.bio}
            </p>
          )}

          {/* 2. Subseção Horários (Item 14: apenas título e link 'Ver horários completos', sem preview) */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#B8A9D9]" />
              <span>Horários</span>
            </h4>

            <button
              type="button"
              onClick={() => setIsWorkingHoursOpen(true)}
              className="text-xs font-bold text-[#8675A9] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Ver horários completos</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* 3. Tags de Especialidade ao final (empilhadas verticalmente, uma por linha) */}
          {categoriasList.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-gray-100">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Especialidades
              </h4>
              <div className="space-y-1 pl-0.5">
                {categoriasList.map((catKey) => (
                  <p key={catKey} className="text-xs text-[#4A3F5C] font-semibold">
                    {getCategoryLabel(catKey, true)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 4. Tipo de Atendimento (embaixo de Especialidades no mesmo padrão) */}
          {modalidadesList.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-gray-100">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Tipo de Atendimento
              </h4>
              <div className="space-y-1 pl-0.5">
                {modalidadesList.map((modKey) => {
                  const modInfo = MODALIDADE_MAP[modKey]
                  return (
                    <p key={modKey} className="text-xs text-[#4A3F5C] font-semibold">
                      {modInfo ? modInfo.label : modKey.charAt(0).toUpperCase() + modKey.slice(1)}
                    </p>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* SEÇÃO DE AVALIAÇÕES */}
        <PublicReviewsSection
          avaliacoes={avaliacoes}
          corPrimaria={corPrimaria}
        />
      </main>

      {/* FOOTER BRANDING LUMÊ */}
      <footer className="mt-12 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
        <span>Desenvolvido por</span>
        <Image
          src="/assets/lume_logo.webp"
          alt="Lumê"
          width={64}
          height={22}
          className="h-4 w-auto object-contain opacity-75 grayscale hover:grayscale-0 transition"
        />
      </footer>

      {/* MODAL DE MEUS AGENDAMENTOS */}
      <ClientBookingsModal
        isOpen={isClientBookingsOpen}
        onClose={() => setIsClientBookingsOpen(false)}
        profissionalSlug={profissional.slug}
        corPrimaria={corPrimaria}
      />

      {/* MODAL DE HORÁRIOS COMPACTO (Item 8, 9, 10) */}
      <WorkingHoursModal
        isOpen={isWorkingHoursOpen}
        onClose={() => setIsWorkingHoursOpen(false)}
        disponibilidades={disponibilidades}
        studioNome={profissional.nome}
      />

      {/* MODAL DE DETALHES DO PRODUTO DA COMANDA DIGITAL */}
      {selectedComandaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Foto em Destaque */}
            <div className="relative w-full h-64 sm:h-72 bg-[#FAF7F5]">
              {selectedComandaItem.foto_url ? (
                <Image
                  src={selectedComandaItem.foto_url}
                  alt={selectedComandaItem.nome}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100/50 to-pink-50">
                  <ShoppingBag className="h-16 w-16 text-[#B8A9D9]" />
                  <span className="text-xs font-bold text-[#4A3F5C]/40 uppercase tracking-wider mt-2">
                    Lumê Care
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedComandaItem(null)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer backdrop-blur-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo: NOME, VALOR e Descrição */}
            <div className="p-5 space-y-3.5 bg-white">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Comanda Digital
                </span>
                <h3 className="text-base font-extrabold text-[#4A3F5C] leading-snug">
                  {selectedComandaItem.nome}
                </h3>
              </div>

              {selectedComandaItem.descricao && (
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {selectedComandaItem.descricao}
                </p>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Valor
                  </span>
                  <span className="text-xl font-black text-emerald-700">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(selectedComandaItem.preco)}
                  </span>
                </div>

                {whatsappUrl ? (
                  <a
                    href={`${whatsappUrl}?text=${encodeURIComponent(
                      `Olá ${profissional.nome}! Vi o produto "${selectedComandaItem.nome}" na sua comanda digital da vitrine e gostaria de incluí-lo no meu atendimento.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition shadow-xs cursor-pointer"
                  >
                    <span>Pedir no WhatsApp</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedComandaItem(null)}
                    className="px-4 py-2 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#393047] transition cursor-pointer"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

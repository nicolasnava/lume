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
import {
  Instagram,
  MapPin,
  User,
  Clock,
  Info,
  Star,
  Scissors,
  ChevronLeft,
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
}

export default function PublicShowcaseView({
  profissional,
  servicos,
  disponibilidades,
  avaliacoes,
  studioContext,
}: PublicShowcaseViewProps) {
  const [isClientBookingsOpen, setIsClientBookingsOpen] = useState(false)
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false)

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

  // Média de avaliações para o badge do topo
  const totalAvaliacoes = avaliacoes.length
  const somaNotas = avaliacoes.reduce((acc, curr) => acc + Number(curr.nota), 0)
  const mediaNotas = totalAvaliacoes > 0 ? (somaNotas / totalAvaliacoes).toFixed(1) : null

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

      {/* CABEÇALHO VITRINE: Tela Cheia Flush (Item 4), Capa Padronizada (Item 11), Ícones Circulares de Marca (Item 12) */}
      <header className="w-full bg-white border-b border-gray-200/80">
        <div className="relative w-full">
          {hasCapa && (
            <div className="relative h-44 sm:h-64 w-full bg-gray-900 overflow-hidden">
              <Image
                src={profissional.foto_capa_url!}
                alt={`Capa de ${profissional.nome}`}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />
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
                &ldquo;{profissional.tagline}&rdquo;
              </p>
            )}

            {/* Status Aberto/Fechado (Item 9: textos curtos "Aberto" / "Fechado") */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {isOpenNow ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aberto
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Fechado
                </span>
              )}

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
                      {modInfo ? modInfo.label : modKey}
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
    </div>
  )
}

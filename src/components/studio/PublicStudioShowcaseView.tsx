'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Users, Scissors, ArrowRight, Instagram, MapPin } from 'lucide-react'
import { parseCategorias, getCategoryLabel } from '@/lib/utils/categories'
import StudioAnyMemberButton from './StudioAnyMemberButton'
import PublicReviewsSection, { PublicReviewItem } from '@/components/reviews/PublicReviewsSection'

// Exibir apenas o primeiro e segundo nome da profissional nos cards
function formatNomeProfissional(nomeCompleto: string): string {
  if (!nomeCompleto) return ''
  const partes = nomeCompleto.trim().split(/\s+/)
  return partes.slice(0, 2).join(' ')
}

export interface PublicStudioMember {
  id: string
  nome: string
  foto_url: string | null
  slug: string
  categoria: string[] | string | null
  bio: string | null
  ativo_no_estudio?: boolean
}

export interface PublicStudioData {
  id: string
  nome: string
  slug: string
  bio: string | null
  foto_capa_url: string | null
  foto_perfil_url?: string | null
  instagram?: string | null
  whatsapp?: string | null
  endereco?: string | null
  cor_primaria: string
  cor_secundaria: string
  fotos_espaco?: string[] | null
}

interface PublicStudioShowcaseViewProps {
  studio: PublicStudioData
  membros: PublicStudioMember[]
  avaliacoes?: PublicReviewItem[]
}

export default function PublicStudioShowcaseView({
  studio,
  membros,
  avaliacoes = [],
}: PublicStudioShowcaseViewProps) {
  const corPrimaria = studio.cor_primaria || '#B8A9D9'
  const corSecundaria = studio.cor_secundaria || '#FAF7F5'
  const hasCapa = !!studio.foto_capa_url

  // Ordenação dos membros: quem está atendendo aparece no topo (normal), quem não está fica abaixo (Item 20)
  const sortedMembros = useMemo(() => {
    return [...membros].sort((a, b) => {
      const aAtivo = a.ativo_no_estudio !== false ? 1 : 0
      const bAtivo = b.ativo_no_estudio !== false ? 1 : 0
      if (aAtivo !== bAtivo) return bAtivo - aAtivo
      return a.nome.localeCompare(b.nome)
    })
  }, [membros])

  const instagramUrl = studio.instagram
    ? studio.instagram.startsWith('http')
      ? studio.instagram
      : `https://instagram.com/${studio.instagram.replace(/^@/, '')}`
    : null

  const whatsappClean = studio.whatsapp ? studio.whatsapp.replace(/\D/g, '') : ''
  const whatsappUrl = whatsappClean
    ? `https://wa.me/${whatsappClean.startsWith('55') ? whatsappClean : `55${whatsappClean}`}`
    : null

  const mapsUrl = studio.endereco
    ? `https://maps.google.com/?q=${encodeURIComponent(studio.endereco)}`
    : null

  return (
    <div
      className="min-h-screen text-[#4A3F5C] transition-colors duration-300 pb-20 selection:bg-purple-200"
      style={{ backgroundColor: corSecundaria }}
    >
      {/* 1. CABEÇALHO DO STUDIO */}
      <header className="w-full bg-white border-b border-gray-200/80 shadow-2xs">
        <div className="relative w-full">
          {hasCapa ? (
            <div className="relative h-48 sm:h-72 w-full bg-gray-900 overflow-hidden">
              <Image
                src={studio.foto_capa_url!}
                alt={`Capa do studio ${studio.nome}`}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />
            </div>
          ) : (
            <div
              className="relative h-36 sm:h-48 w-full flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${corPrimaria}25 0%, #4A3F5C30 100%)`,
              }}
            >
              <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-white/20 blur-xl pointer-events-none" />
              <Building2 className="h-16 w-16 opacity-20 text-[#4A3F5C]" />
            </div>
          )}

          <div
            className={`max-w-3xl mx-auto px-4 text-center sm:px-6 ${
              hasCapa ? 'pb-8 pt-0' : 'py-8'
            }`}
          >
            {/* Foto de Perfil / Logo do Studio (quadrada com cantos arredondados) */}
            <div
              className={`relative mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-4 shadow-xl flex items-center justify-center transition transform hover:scale-105 bg-white overflow-hidden ${
                hasCapa ? '-mt-12 sm:-mt-14 z-20 ring-4 ring-white/90 shadow-2xl' : ''
              }`}
              style={{ borderColor: corPrimaria }}
            >
              {studio.foto_perfil_url ? (
                <Image
                  src={studio.foto_perfil_url}
                  alt={studio.nome}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-[#4A3F5C]"
                  style={{ backgroundColor: `${corPrimaria}20` }}
                >
                  <Building2 className="h-12 w-12 text-[#4A3F5C]" />
                </div>
              )}
            </div>

            {/* Badge de Studio */}
            <div className="mt-3.5 inline-flex items-center px-3 py-1 rounded-full bg-[#B8A9D9]/20 text-[#4A3F5C] border border-[#B8A9D9]/30 text-xs font-bold uppercase tracking-wider">
              <span>Studio</span>
            </div>

            {/* Nome do Studio */}
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#4A3F5C]">
              {studio.nome}
            </h1>

            {/* Bio do Studio */}
            {studio.bio && (
              <p className="mt-3 text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
                {studio.bio}
              </p>
            )}

            {/* Botões Rápidos Circulares (Instagram, WhatsApp, Localização) - Item 18 */}
            {(instagramUrl || whatsappUrl || mapsUrl) && (
              <div className="mt-4 flex items-center justify-center gap-2.5 pt-3 border-t border-gray-100">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs hover:opacity-90 transition"
                    title="Instagram do Studio"
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
                    title="WhatsApp do Studio"
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
                    title={studio.endereco || 'Localização'}
                  >
                    <MapPin className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* SEÇÃO DA EQUIPE */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-purple-100/70 text-[#4A3F5C]">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#4A3F5C]">Nossa Equipe</h2>
            </div>

            <span className="text-xs font-bold text-gray-500">
              {membros.length} {membros.length === 1 ? 'profissional' : 'profissionais'} no espaço
            </span>
          </div>

          {/* Estado Vazio Amigável */}
          {sortedMembros.length === 0 ? (
            <div className="rounded-3xl bg-white border border-gray-200/80 p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-md mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#4A3F5C]">
                <Scissors className="h-7 w-7 text-[#B8A9D9]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#4A3F5C]">
                  Nenhuma profissional cadastrada no momento
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  A equipe deste studio está em processo de atualização. Por favor, volte em breve para agendar!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Lista de Profissionais (Mobile: Card estruturado clássico / Desktop: Linha horizontal estilizada) */}
              <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
                {sortedMembros.map((membro) => {
                  const isAtivo = membro.ativo_no_estudio !== false
                  const categorias = parseCategorias(membro.categoria)
                  const nomeExibicao = formatNomeProfissional(membro.nome)

                  return (
                    <Link
                      key={membro.id}
                      href={`/studio/${studio.slug}/${membro.slug}`}
                      className={`group relative block rounded-3xl sm:rounded-[32px] bg-white sm:bg-gradient-to-r sm:from-white sm:via-white sm:to-purple-50/25 border border-gray-200/80 sm:border-[#B8A9D9]/35 hover:border-[#B8A9D9] p-5 sm:p-6 md:p-7 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden ${
                        !isAtivo ? 'filter grayscale opacity-60 hover:opacity-80' : ''
                      }`}
                    >
                      {/* Efeito sutil de barra lateral na cor do studio */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: corPrimaria }}
                      />

                      {/* ESTRUTURA MOBILE: Idêntica à estrutura anterior (Avatar + Nome, Badges, Bio, Ver serviços & horários com divisor) */}
                      <div className="sm:hidden space-y-3.5">
                        {/* Topo: Avatar e Nome */}
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-gray-100 border border-purple-100 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                            {membro.foto_url ? (
                              <Image
                                src={membro.foto_url}
                                alt={membro.nome}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-lg text-[#4A3F5C] bg-purple-100">
                                {membro.nome.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-[#4A3F5C] transition-colors truncate">
                              {nomeExibicao}
                            </h3>
                            {!isAtivo && (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                Indisponível no momento
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badges de Especialidades */}
                        {categorias.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {categorias.slice(0, 3).map((catKey) => (
                              <span
                                key={catKey}
                                className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-semibold text-gray-700"
                              >
                                {getCategoryLabel(catKey, true)}
                              </span>
                            ))}
                            {categorias.length > 3 && (
                              <span className="inline-block px-1.5 py-1 text-[10px] font-semibold text-gray-400">
                                +{categorias.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bio (se houver) */}
                        {membro.bio && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {membro.bio}
                          </p>
                        )}

                        {/* Rodapé do card: divisor e Ver serviços & horários */}
                        <div className="pt-3.5 mt-3.5 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#4A3F5C]">
                          <span>Ver serviços & horários</span>
                          <ArrowRight className="h-4 w-4 text-[#B8A9D9] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* ESTRUTURA DESKTOP: Linha horizontal ampla, estilizada e harmônica */}
                      <div className="hidden sm:flex items-center justify-between gap-6">
                        {/* Foto no canto ampliada com moldura refinada */}
                        <div className="relative shrink-0">
                          <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-purple-50 ring-4 ring-[#B8A9D9]/30 group-hover:ring-[#B8A9D9]/80 shadow-sm group-hover:scale-105 transition-all duration-300">
                            {membro.foto_url ? (
                              <Image
                                src={membro.foto_url}
                                alt={membro.nome}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-xl sm:text-2xl text-[#4A3F5C] bg-[#B8A9D9]/20">
                                {membro.nome.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Ponto indicador de status */}
                          {isAtivo ? (
                            <span
                              className="absolute bottom-1 right-1 h-4.5 w-4.5 rounded-full bg-emerald-500 ring-3 ring-white shadow-xs"
                              title="Disponível para agendamento"
                            />
                          ) : (
                            <span
                              className="absolute bottom-1 right-1 h-4.5 w-4.5 rounded-full bg-gray-400 ring-3 ring-white"
                              title="Indisponível no momento"
                            />
                          )}
                        </div>

                        {/* Nome, Especialidades e Bio sem fundo */}
                        <div className="min-w-0 flex-1 pr-2">
                          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 group-hover:text-[#4A3F5C] tracking-tight transition-colors truncate">
                            {nomeExibicao}
                          </h3>

                          {/* Especialidades em texto fluido sem fundo com separador suave */}
                          {categorias.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {categorias.map((catKey, index) => (
                                <span key={catKey} className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600">
                                  {index > 0 && <span className="h-1 w-1 rounded-full bg-[#B8A9D9]" />}
                                  <span>{getCategoryLabel(catKey, true)}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs md:text-sm text-gray-400 font-medium mt-1">
                              Profissional de Beleza
                            </p>
                          )}

                          {/* Bio curta integrada */}
                          {membro.bio && (
                            <p className="text-xs md:text-sm text-gray-500 line-clamp-1 mt-1.5 font-normal leading-relaxed">
                              {membro.bio}
                            </p>
                          )}

                          {!isAtivo && (
                            <span className="text-xs font-semibold text-gray-400 block mt-1">
                              Indisponível no momento
                            </span>
                          )}
                        </div>

                        {/* CTA destacado à direita ampliado */}
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-2xl bg-[#B8A9D9] group-hover:bg-[#a695ca] text-[#4A3F5C] font-extrabold text-xs md:text-sm shadow-xs group-hover:shadow-md transition-all duration-300">
                            <span>Agendar</span>
                            <ArrowRight className="h-4 w-4 text-[#4A3F5C] group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* BOTÃO: Qualquer profissional disponível */}
              <div className="pt-8 text-center space-y-3">
                <div className="relative flex py-2 items-center max-w-md mx-auto">
                  <div className="grow border-t border-gray-200/80"></div>
                  <span className="shrink mx-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Ou se preferir
                  </span>
                  <div className="grow border-t border-gray-200/80"></div>
                </div>

                <StudioAnyMemberButton studioSlug={studio.slug} corPrimaria={corPrimaria} />
                <p className="text-[11px] text-gray-500 font-medium">
                  Não tem preferência? Nós indicamos uma profissional disponível da equipe para você.
                </p>
              </div>
            </>
          )}
        </section>

        {/* SEÇÃO: NOSSO ESPAÇO (Exibida APENAS se houver fotos cadastradas) */}
        {studio.fotos_espaco && studio.fotos_espaco.length > 0 && (
          <section className="space-y-5 pt-4">
            <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3">
              <div className="p-1.5 rounded-xl bg-purple-100/70 text-[#4A3F5C]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#4A3F5C]">Nosso Espaço</h2>
                <p className="text-xs text-gray-500">Conheça a estrutura e ambiente preparado para seu atendimento</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {studio.fotos_espaco.map((fotoUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-xs border border-gray-200/80 bg-white group"
                >
                  <Image
                    src={fotoUrl}
                    alt={`Espaço ${studio.nome} ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO: AVALIAÇÕES DOS CLIENTES (Item 25) */}
        {avaliacoes && avaliacoes.length > 0 && (
          <div className="pt-2">
            <PublicReviewsSection avaliacoes={avaliacoes} corPrimaria={corPrimaria} />
          </div>
        )}
      </main>

      {/* FOOTER BRANDING LUMÊ */}
      <footer className="mt-16 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
        <span>Desenvolvido por</span>
        <Image
          src="/assets/lume_logo.webp"
          alt="Lumê"
          width={64}
          height={22}
          className="h-4 w-auto object-contain opacity-75 grayscale hover:grayscale-0 transition"
        />
      </footer>
    </div>
  )
}

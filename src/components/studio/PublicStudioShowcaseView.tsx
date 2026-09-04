'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building2, Users, Scissors, ArrowRight } from 'lucide-react'
import { parseCategorias, getCategoryLabel } from '@/lib/utils/categories'
import StudioAnyMemberButton from './StudioAnyMemberButton'

export interface PublicStudioMember {
  id: string
  nome: string
  foto_url: string | null
  slug: string
  categoria: string[] | string | null
  bio: string | null
}

export interface PublicStudioData {
  id: string
  nome: string
  slug: string
  bio: string | null
  foto_capa_url: string | null
  cor_primaria: string
  cor_secundaria: string
  fotos_espaco?: string[] | null
}

interface PublicStudioShowcaseViewProps {
  studio: PublicStudioData
  membros: PublicStudioMember[]
}

export default function PublicStudioShowcaseView({
  studio,
  membros,
}: PublicStudioShowcaseViewProps) {
  const corPrimaria = studio.cor_primaria || '#B8A9D9'
  const corSecundaria = studio.cor_secundaria || '#FAF7F5'
  const hasCapa = !!studio.foto_capa_url

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
            {/* Ícone ou Avatar do Studio */}
            <div
              className={`relative mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-4 shadow-xl flex items-center justify-center transition transform hover:scale-105 bg-white overflow-hidden ${
                hasCapa ? '-mt-12 sm:-mt-14 z-20 ring-4 ring-white/90 shadow-2xl' : ''
              }`}
              style={{ borderColor: corPrimaria }}
            >
              <div
                className="h-full w-full flex items-center justify-center text-[#4A3F5C]"
                style={{ backgroundColor: `${corPrimaria}20` }}
              >
                <Building2 className="h-12 w-12 text-[#4A3F5C]" />
              </div>
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
              {membros.length} {membros.length === 1 ? 'profissional disponível' : 'profissionais disponíveis'}
            </span>
          </div>

          {/* Estado Vazio Amigável */}
          {membros.length === 0 ? (
            <div className="rounded-3xl bg-white border border-gray-200/80 p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-md mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#4A3F5C]">
                <Scissors className="h-7 w-7 text-[#B8A9D9]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#4A3F5C]">
                  Nenhuma profissional atendendo no momento
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  A equipe deste studio está temporariamente com os atendimentos pausados. Por favor, volte em breve para agendar!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Grid de Profissionais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {membros.map((membro) => {
                  const categorias = parseCategorias(membro.categoria)

                  return (
                    <Link
                      key={membro.id}
                      href={`/studio/${studio.slug}/${membro.slug}`}
                      className="group relative flex flex-col justify-between rounded-3xl bg-white border border-gray-200/80 p-6 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                      {/* Indicador sutil de hover no topo */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: corPrimaria }}
                      />

                      <div className="space-y-4">
                        {/* Avatar e Nome */}
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
                              <div className="flex h-full w-full items-center justify-center font-bold text-lg text-purple-800 bg-purple-100">
                                {membro.nome.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-[#4A3F5C] transition-colors truncate">
                              {membro.nome}
                            </h3>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                              Atendendo
                            </span>
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

                        {/* Bio truncada */}
                        {membro.bio && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {membro.bio}
                          </p>
                        )}
                      </div>

                      {/* Botão de rodapé do card */}
                      <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#4A3F5C]">
                        <span>Ver serviços & horários</span>
                        <ArrowRight className="h-4 w-4 text-[#B8A9D9] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* BOTÃO: Qualquer profissional disponível (abaixo de todas as profissionais disponíveis) */}
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

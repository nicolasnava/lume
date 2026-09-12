'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Info, Check, AlertTriangle, Loader2, ArrowRight } from 'lucide-react'
import { aceitarConviteLink } from '@/app/actions/estudio'

interface AcceptStudioInviteClientProps {
  codigo: string
  data: {
    status: 'valid'
    conviteId: string
    estudio: {
      id: string
      nome: string
      slug: string
      bio: string | null
      foto_capa_url: string | null
      cor_primaria: string
      cor_secundaria: string
    }
    dona: {
      nome: string
      foto_url: string | null
    }
    usuarioLogado: boolean
    jaNoMesmoEstudio: boolean
    estudioAtualNome: string | null
    isOwnerOfAnotherStudio: boolean
  }
}

export default function AcceptStudioInviteClient({
  codigo,
  data,
}: AcceptStudioInviteClientProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { estudio, dona, usuarioLogado, jaNoMesmoEstudio, estudioAtualNome, isOwnerOfAnotherStudio } =
    data

  const handleAccept = async () => {
    setIsAccepting(true)
    setErrorMessage(null)

    try {
      await aceitarConviteLink(codigo)
      router.push('/dashboard/studio')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao aceitar convite.'
      setErrorMessage(msg)
      setIsAccepting(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-xl space-y-6">
      {/* Capa ou Topo Decorativo */}
      {estudio.foto_capa_url ? (
        <div className="relative h-44 w-full">
          <Image src={estudio.foto_capa_url} alt={estudio.nome} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-6 z-10 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-90">
              Convite para Equipe
            </span>
            <h2 className="text-2xl font-black">{estudio.nome}</h2>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gradient-to-br from-[#4A3F5C] to-[#2D2638] text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#B8A9D9] mb-2">
            <Building2 className="h-4 w-4" />
            <span>Convite de Studio</span>
          </div>
          <h2 className="text-2xl font-black">{estudio.nome}</h2>
        </div>
      )}

      <div className="p-6 sm:p-8 pt-0 space-y-6">
        {/* Identificação da Dona */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="relative h-10 w-10 shrink-0 rounded-full bg-purple-100 overflow-hidden border border-purple-200 flex items-center justify-center font-bold text-purple-800 text-sm">
            {dona.foto_url ? (
              <Image src={dona.foto_url} alt={dona.nome} fill className="object-cover" />
            ) : (
              dona.nome.charAt(0)
            )}
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Convidada por:</span>
            <strong className="text-xs text-gray-900">{dona.nome}</strong>
          </div>
        </div>

        {estudio.bio && <p className="text-xs text-gray-600 leading-relaxed">{estudio.bio}</p>}

        {/* Erro */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CASO 1: Usuária não está logada */}
        {!usuarioLogado && (
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-center space-y-1">
              <Info className="h-5 w-5 text-purple-700 mx-auto mb-1" />
              <strong className="text-xs text-purple-900 block font-bold">
                Você precisa ter uma conta no Lumê
              </strong>
              <p className="text-[11px] text-purple-800/80">
                Faça login ou crie sua conta profissional para aceitar este convite.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/login?redirectTo=/convite-estudio/${codigo}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Fazer Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href={`/cadastro?redirectTo=/convite-estudio/${codigo}`}
                className="w-full inline-flex items-center justify-center py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer"
              >
                Criar Nova Conta no Lumê
              </Link>
            </div>
          </div>
        )}

        {/* CASO 2: Já é membro deste mesmo studio */}
        {usuarioLogado && jaNoMesmoEstudio && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-1">
              <Check className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
              <strong className="text-sm font-bold block">Você já faz parte deste studio!</strong>
              <p className="text-xs text-emerald-800">
                Seu perfil já está integrado à equipe do {estudio.nome}.
              </p>
            </div>

            <Link
              href="/dashboard/studio"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer"
            >
              <span>Ir para o Painel do Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* CASO 3: É dona de outro studio */}
        {usuarioLogado && isOwnerOfAnotherStudio && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
              <strong className="font-bold block text-amber-950">
                Você administra outro studio
              </strong>
              <p>
                Você atualmente é a dona e administradora de outro studio. Uma profissional não pode
                ser membro de um studio parceiro enquanto administrar seu próprio studio.
              </p>
            </div>

            <Link
              href="/dashboard/studio"
              className="w-full inline-flex items-center justify-center py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer"
            >
              Voltar ao Meu Studio
            </Link>
          </div>
        )}

        {/* CASO 4: Convidada apta a aceitar */}
        {usuarioLogado && !jaNoMesmoEstudio && !isOwnerOfAnotherStudio && (
          <div className="space-y-4 pt-2">
            {estudioAtualNome && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-amber-950">Atenção ao trocar de Studio</strong>
                  <p className="mt-0.5">
                    Você atualmente faz parte da equipe do{' '}
                    <strong className="text-gray-900">{estudioAtualNome}</strong>. Ao aceitar este
                    convite, você será desvinculada do studio anterior e passará a fazer parte do{' '}
                    <strong className="text-gray-900">{estudio.nome}</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isAccepting}
                onClick={handleAccept}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#4A3F5C] hover:bg-[#3d334d] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isAccepting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Aceitar e Entrar no Studio</span>
              </button>

              <Link
                href="/dashboard/geral"
                className="w-full inline-flex items-center justify-center py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 transition cursor-pointer"
              >
                Agora não / Voltar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

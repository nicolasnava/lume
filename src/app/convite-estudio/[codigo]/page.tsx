import Link from 'next/link'
import Image from 'next/image'
import { obterDadosConviteLink } from '@/app/actions/estudio'
import AcceptStudioInviteClient from './AcceptStudioInviteClient'
import { Building2, AlertCircle, Sparkles } from 'lucide-react'

interface InvitePageProps {
  params: Promise<{
    codigo: string
  }>
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ConviteEstudioPage({ params }: InvitePageProps) {
  const { codigo } = await params
  const res = await obterDadosConviteLink(codigo)

  if (res.status === 'not_found') {
    return (
      <InviteErrorLayout
        title="Convite não encontrado"
        description="O link que você acessou pode estar incorreto ou o convite foi removido pela administradora do studio."
      />
    )
  }

  if (res.status === 'invalid') {
    return (
      <InviteErrorLayout
        title="Convite indisponível"
        description="Este link de convite já foi utilizado ou cancelado pela administradora do studio."
      />
    )
  }

  if (res.status === 'expired') {
    return (
      <InviteErrorLayout
        title="Convite expirado"
        description="Os links de convite têm validade de 7 dias e este link expirou. Peça à dona do studio para gerar um novo link para você."
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#B8A9D9]/30">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={120}
              height={36}
              priority
              className="h-auto w-auto max-h-9 object-contain"
            />
          </Link>
        </div>

        {/* Card de Aceite */}
        <AcceptStudioInviteClient codigo={codigo} data={res} />
      </div>
    </div>
  )
}

function InviteErrorLayout({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-center items-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200/80 shadow-lg space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        <div className="pt-2">
          <Link
            href="/dashboard/geral"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Ir para o Início</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

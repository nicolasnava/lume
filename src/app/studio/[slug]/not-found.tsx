import Link from 'next/link'
import { ArrowLeft, Home, Building2 } from 'lucide-react'

export default function StudioNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center px-4 py-12 text-center selection:bg-[#B8A9D9]/30">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-[#B8A9D9]/30">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#B8A9D9]/20 text-[#4A3F5C] ring-4 ring-[#B8A9D9]/10">
          <Building2 className="h-8 w-8 text-[#4A3F5C]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#4A3F5C]">
            Studio não encontrado
          </h1>

          <p className="text-sm text-gray-600 leading-relaxed">
            A vitrine pública do Studio que você tentou acessar não existe ou o link foi alterado pela equipe.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B8A9D9] hover:bg-[#a695ca] px-6 py-3 text-xs font-bold text-[#4A3F5C] shadow-xs hover:shadow-md transition"
          >
            <Home className="h-4 w-4" />
            <span>Voltar para a Página Inicial</span>
          </Link>

          <Link
            href="/dashboard/studio"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FAF7F5] hover:bg-gray-100 px-6 py-2.5 text-xs font-semibold text-[#4A3F5C] border border-[#B8A9D9]/30 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Acessar Painel do Studio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

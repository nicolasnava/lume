import Link from 'next/link'
import { Sparkles, HelpCircle } from 'lucide-react'

export default function ProfessionalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F5] px-4 py-12 text-center">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-sm border border-[#B8A9D9]/30">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]">
          <HelpCircle className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-bold text-[#4A3F5C]">
          Profissional não encontrada
        </h1>

        <p className="text-sm text-[#4A3F5C]/70">
          O link de agendamento que você acessou não existe ou foi alterado pela profissional.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#B8A9D9] px-6 py-3 text-xs font-semibold text-[#4A3F5C] shadow-sm hover:bg-[#a695ca] transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Conhecer o Lumê</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
